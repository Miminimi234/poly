interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  outcomePrices: number[];
  volume: string;
  endDate: string;
}

interface AgentStrategy {
  type: string;
  confidenceThreshold: number;
  maxResearchCost: number;
  preferredSources: string[];
}

interface AnalysisResult {
  prediction: 'YES' | 'NO';
  confidence: number;
  reasoning: string;
  researchCost: number;
  sources: string[];
}

export async function analyzeMarket(
  agentId: string,
  market: PolymarketMarket,
  strategy: AgentStrategy,
  agent?: any
): Promise<AnalysisResult | null> {
  try {
    // 1. Decide if agent is interested in this market
    if (!shouldAnalyzeMarket(market, strategy)) {
      return null;
    }
    
    // 2. Buy research data via x402
    const researchData = await buyResearch(agentId, market, strategy);
    
    // 3. Analyze using appropriate AI model (celebrity agents use their specific models)
    const analysis = await getAIAnalysis(market, researchData, strategy, agent);
    
    // 4. Only make prediction if confidence is high enough
    if (analysis.confidence < strategy.confidenceThreshold) {
      console.log(`Agent ${agentId} skipping market - confidence too low`);
      return null;
    }
    
    return analysis;
    
  } catch (error) {
    console.error('Error in analyzeMarket:', error);
    return null;
  }
}

function shouldAnalyzeMarket(
  market: PolymarketMarket,
  strategy: AgentStrategy
): boolean {
  // Check if market ends soon (within 30 days)
  const daysUntilEnd = (new Date(market.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntilEnd < 1 || daysUntilEnd > 30) return false;
  
  // Check if market has enough volume (at least $1000)
  const volume = parseFloat(market.volume);
  if (volume < 1000) return false;
  
  // Strategy-specific filtering
  if (strategy.type === 'speed_demon') {
    // Only analyze high-volume, liquid markets
    return volume > 10000;
  }
  
  if (strategy.type === 'academic') {
    // Only analyze markets with detailed descriptions
    return market.description.length > 100;
  }
  
  return true;
}

async function buyResearch(
  agentId: string,
  market: PolymarketMarket,
  strategy: AgentStrategy
): Promise<string> {
  const sources = strategy.preferredSources || ['valyu-web'];
  let combinedResearch = '';
  
  for (const source of sources.slice(0, 1)) { // Only use first source for now
    try {
      // For demo, just return mock research
      // In production, this would call your x402 research endpoints
      combinedResearch = `Research data for: ${market.question}\n\nBased on current trends and historical data, this market shows interesting patterns. Volume: $${market.volume}. Current probability: ${(market.outcomePrices[0] * 100).toFixed(1)}%.`;
    } catch (error) {
      console.error(`Failed to buy research from ${source}:`, error);
    }
  }
  
  return combinedResearch || 'Limited research data available.';
}

async function getAIAnalysis(
  market: PolymarketMarket,
  researchData: string,
  strategy: AgentStrategy,
  agent?: any
): Promise<AnalysisResult> {
  const yesPrice = market.outcomePrices[0] || 0.5;
  const noPrice = market.outcomePrices[1] || 0.5;
  
  // Check if this is a celebrity agent with a specific model
  if (agent?.is_celebrity && agent?.celebrity_model && agent?.traits) {
    try {
      const { aiProviderService } = await import('./ai-providers');
      const traits = agent.traits;
      
      const aiResponse = await aiProviderService.analyzeMarket(
        traits.apiProvider,
        agent.celebrity_model,
        traits.systemPrompt,
        {
          question: market.question,
          description: market.description,
          currentOdds: yesPrice,
          volume: parseFloat(market.volume)
        }
      );
      
      return {
        prediction: aiResponse.prediction,
        confidence: aiResponse.confidence,
        reasoning: aiResponse.reasoning,
        researchCost: 0.01 * strategy.preferredSources.length,
        sources: strategy.preferredSources
      };
    } catch (error) {
      console.error(`Error calling AI provider for ${agent.name}:`, error);
      // Fall through to default Anthropic or mock
    }
  }
  
  // Default: Use Claude for non-celebrity agents
  const prompt = `
You are an AI prediction market analyst with a ${strategy.type} strategy.

MARKET:
Question: ${market.question}
Description: ${market.description}
Current YES price: ${yesPrice} (${(yesPrice * 100).toFixed(1)}% probability)
Current NO price: ${noPrice} (${(noPrice * 100).toFixed(1)}% probability)
Volume: $${market.volume}

RESEARCH DATA:
${researchData}

STRATEGY: ${strategy.type}
${getStrategyGuidelines(strategy.type)}

TASK: Should I bet YES or NO on this market?

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "prediction": "YES" or "NO",
  "confidence": 0.0 to 1.0,
  "reasoning": "2-3 sentence explanation of your analysis"
}
`;

  try {
    // Check if ANTHROPIC_API_KEY is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not set, using mock analysis');
      return getMockAnalysis(market, strategy);
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!response.ok) {
      console.warn('Claude API failed, using mock analysis');
      return getMockAnalysis(market, strategy);
    }
    
    const aiResponse = await response.json();
    const resultText = aiResponse.content[0].text;
    
    // Parse JSON response
    const result = JSON.parse(resultText.replace(/```json\n?/g, '').replace(/```\n?/g, ''));
    
    return {
      prediction: result.prediction,
      confidence: result.confidence,
      reasoning: result.reasoning,
      researchCost: 0.01 * strategy.preferredSources.length,
      sources: strategy.preferredSources
    };
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return getMockAnalysis(market, strategy);
  }
}

function getMockAnalysis(market: PolymarketMarket, strategy: AgentStrategy): AnalysisResult {
  // Simple mock analysis based on current prices
  const yesPrice = market.outcomePrices[0] || 0.5;
  const volume = parseFloat(market.volume);
  
  // Decide based on strategy
  let prediction: 'YES' | 'NO' = 'YES';
  let confidence = 0.65;
  
  if (strategy.type === 'conservative') {
    // Go with the consensus (higher price)
    prediction = yesPrice > 0.5 ? 'YES' : 'NO';
    confidence = Math.abs(yesPrice - 0.5) + 0.5;
  } else if (strategy.type === 'aggressive') {
    // Contrarian bet
    prediction = yesPrice < 0.5 ? 'YES' : 'NO';
    confidence = 0.7;
  } else {
    // Default: follow momentum if volume is high
    prediction = volume > 50000 && yesPrice > 0.5 ? 'YES' : 'NO';
    confidence = 0.65;
  }
  
  const reasoning = `Based on ${strategy.type} strategy, current market price of ${(yesPrice * 100).toFixed(1)}%, and volume of $${volume.toLocaleString()}, I predict ${prediction} with ${(confidence * 100).toFixed(0)}% confidence.`;
  
  return {
    prediction,
    confidence,
    reasoning,
    researchCost: 0.01,
    sources: ['mock-analysis']
  };
}

function getStrategyGuidelines(strategyType: string): string {
  const guidelines: Record<string, string> = {
    conservative: 'Only bet when confidence is very high (>80%). Prefer established patterns and historical data.',
    aggressive: 'Take risks on high-upside opportunities. Confidence threshold 60%.',
    speed_demon: 'Make fast decisions based on momentum. Use cheap data sources.',
    academic: 'Deep analysis required. Use scholarly sources and historical precedent.',
    data_driven: 'Focus on quantitative data. Look for statistical edges.',
    balanced: 'Analyze carefully and make informed predictions.',
    news_junkie: 'Follow trends. Bet on outcomes gaining momentum.',
    expert_network: 'Analyze social media and public opinion.'
  };
  
  return guidelines[strategyType] || 'Analyze carefully and make informed predictions.';
}

export async function runAgentAnalysis(agentId: string): Promise<void> {
  try {
    // 1. Get agent details and strategy
    const agentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/agents/${agentId}`);
    const agentData = await agentResponse.json();
    
    if (!agentData.success || !agentData.agent.is_active) {
      console.log(`Agent ${agentId} is not active`);
      return;
    }
    
    const agent = agentData.agent;
    
    const strategy: AgentStrategy = {
      type: agent.strategy_type,
      confidenceThreshold: getConfidenceThreshold(agent.strategy_type),
      maxResearchCost: agent.current_balance_usdt * 0.1, // Max 10% of balance
      preferredSources: getPreferredSources(agent.strategy_type)
    };
    
    // 2. Get active Polymarket markets
    const marketsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/polymarket/markets?limit=20`);
    const marketsData = await marketsResponse.json();
    
    if (!marketsData.success) {
      console.error('Failed to fetch markets');
      return;
    }
    
    const markets = marketsData.markets;
    
    // 3. Randomly pick 1-3 markets to analyze
    const marketsToAnalyze = markets
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 1);
    
    console.log(`Agent ${agentId} analyzing ${marketsToAnalyze.length} markets`);
    
    // 4. Analyze each market
    for (const market of marketsToAnalyze) {
      const analysis = await analyzeMarket(agentId, market, strategy, agent);
      
      if (analysis) {
        // Save prediction
        const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/predictions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: agent.id,
            marketId: market.id,
            prediction: analysis.prediction,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            priceAtPrediction: market.outcomePrices[0],
            researchCost: analysis.researchCost,
            researchSources: analysis.sources
          })
        });
        
        const saveData = await saveResponse.json();
        
        if (saveData.success) {
          const agentName = agent.is_celebrity ? `${agent.traits?.avatar || '🤖'} ${agent.name}` : `Agent ${agentId}`;
          console.log(`✓ ${agentName} predicted ${analysis.prediction} on "${market.question}"`);
        } else {
          console.error(`✗ Failed to save prediction:`, saveData.error);
        }
      }
    }
    
  } catch (error) {
    console.error(`Error running analysis for agent ${agentId}:`, error);
  }
}

function getConfidenceThreshold(strategyType: string): number {
  const thresholds: Record<string, number> = {
    conservative: 0.80,
    aggressive: 0.60,
    speed_demon: 0.55,
    academic: 0.75,
    data_driven: 0.70,
    balanced: 0.70,
    news_junkie: 0.65,
    expert_network: 0.65
  };
  return thresholds[strategyType] || 0.70;
}

function getPreferredSources(strategyType: string): string[] {
  const sources: Record<string, string[]> = {
    conservative: ['valyu-academic', 'news-feeds'],
    aggressive: ['valyu-web'],
    speed_demon: ['valyu-web'],
    academic: ['valyu-academic', 'expert-analysis'],
    data_driven: ['valyu-web', 'news-feeds'],
    balanced: ['valyu-web'],
    news_junkie: ['news-feeds', 'valyu-web'],
    expert_network: ['expert-analysis']
  };
  return sources[strategyType] || ['valyu-web'];
}

