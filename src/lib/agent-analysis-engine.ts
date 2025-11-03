import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/utils/supabase/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

let cachedSupabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Database not configured. Set SUPABASE environment variables.');
  }

  if (!cachedSupabase) {
    cachedSupabase = createServiceClient();
  }

  return cachedSupabase;
}

interface Market {
  id: string;
  question: string;
  description: string;
  market_slug: string;
  yes_price: number;
  no_price: number;
  volume: number;
  end_date: string;
}

interface Agent {
  id: string;
  name: string;
  strategy_type: string;
  balance: number;
  spent: number;
  total_predictions: number;
  is_celebrity: boolean;
  celebrity_model: string;
  traits: {
    systemPrompt: string;
    avatar: string;
    color: string;
  };
}

interface AnalysisResult {
  prediction: 'YES' | 'NO';
  confidence: number;
  reasoning: string;
}

export async function runAgentAnalysisCycle() {
  console.log('🤖 Starting agent analysis cycle...');
  
  try {
    const supabase = getSupabase();

    // 1. Get active celebrity agents with balance > $0
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('is_celebrity', true)
      .eq('is_active', true)
      .eq('is_bankrupt', false)
      .gt('balance', 0);
    
    if (agentsError) throw agentsError;
    
    if (!agents || agents.length === 0) {
      console.log('❌ No active celebrity agents found');
      return { success: false, message: 'No active agents' };
    }
    
    console.log(`✅ Found ${agents.length} active agents`);
    
    // 2. Get trending unresolved markets
    const markets = await getTrendingMarkets(supabase);
    
    if (markets.length === 0) {
      console.log('❌ No markets available for analysis');
      return { success: false, message: 'No markets available' };
    }
    
    console.log(`✅ Found ${markets.length} markets to analyze`);
    
    // 3. Each agent analyzes 1-2 random markets
    let totalPredictions = 0;
    let totalErrors = 0;
    
    for (const agent of agents) {
      try {
        // Skip if agent already predicted on recent markets
        const recentPredictions = await getRecentPredictionCount(supabase, agent.id);
        if (recentPredictions >= 3) {
          console.log(`⏭️  ${agent.name} already made 3+ predictions recently, skipping`);
          continue;
        }
        
        // Pick 1-2 random markets
        const marketsToAnalyze = selectMarketsForAgent(markets, agent, 2);
        
        for (const market of marketsToAnalyze) {
          // Check if agent already predicted on this market
          const alreadyPredicted = await hasAlreadyPredicted(supabase, agent.id, market.id);
          if (alreadyPredicted) {
            console.log(`⏭️  ${agent.name} already predicted on "${market.question.slice(0, 40)}..."`);
            continue;
          }
          
          // Analyze market
          console.log(`🧠 ${agent.name} analyzing: "${market.question.slice(0, 50)}..."`);
          const result = await analyzeMarketWithAgent(supabase, agent, market);
          
          if (result) {
            totalPredictions++;
            console.log(`✅ ${agent.name}: ${result.prediction} (${(result.confidence * 100).toFixed(0)}%)`);
          }
        }
        
        // Small delay between agents to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error: any) {
        console.error(`❌ Error with agent ${agent.name}:`, error.message);
        totalErrors++;
      }
    }
    
    console.log(`\n🎉 Analysis cycle complete!`);
    console.log(`   Predictions made: ${totalPredictions}`);
    console.log(`   Errors: ${totalErrors}`);
    
    return {
      success: true,
      predictions: totalPredictions,
      errors: totalErrors
    };
    
  } catch (error: any) {
    console.error('❌ Fatal error in analysis cycle:', error);
    return { success: false, error: error.message };
  }
}

async function getTrendingMarkets(supabase: SupabaseClient): Promise<Market[]> {
  try {
    const { data: markets, error } = await supabase
      .from('polymarket_markets')
      .select('*')
      .eq('resolved', false)
      .gte('end_date', new Date().toISOString())
      .order('volume', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return markets || [];
    
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}

async function getRecentPredictionCount(supabase: SupabaseClient, agentId: string): Promise<number> {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  
  const { count, error } = await supabase
    .from('agent_predictions')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .gte('created_at', sixHoursAgo);
  
  if (error) return 0;
  return count || 0;
}

function selectMarketsForAgent(markets: Market[], agent: Agent, count: number): Market[] {
  // Shuffle and pick random markets
  const shuffled = [...markets].sort(() => Math.random() - 0.5);
  
  // Filter based on agent strategy preferences
  let filtered = shuffled;
  
  // Conservative agents prefer high-volume markets
  if (agent.strategy_type === 'CONSERVATIVE') {
    filtered = shuffled.filter(m => m.volume > 10000);
  }
  
  // Speed demon prefers any market
  if (agent.strategy_type === 'SPEED_DEMON') {
    filtered = shuffled; // No filter
  }
  
  // Contrarian prefers markets with strong consensus (to bet against)
  if (agent.strategy_type === 'CONTRARIAN') {
    filtered = shuffled.filter(m => m.yes_price > 0.7 || m.yes_price < 0.3);
  }
  
  return filtered.slice(0, count);
}

async function hasAlreadyPredicted(supabase: SupabaseClient, agentId: string, marketId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('agent_predictions')
    .select('id')
    .eq('agent_id', agentId)
    .eq('market_id', marketId)
    .single();
  
  return !!data;
}

async function analyzeMarketWithAgent(
  supabase: SupabaseClient,
  agent: Agent,
  market: Market
): Promise<AnalysisResult | null> {
  try {
    // 1. Buy research (deduct from balance)
    const researchCost = 0.05; // $0.05 per analysis
    
    if (agent.balance < researchCost) {
      console.log(`💸 ${agent.name} insufficient balance ($${agent.balance.toFixed(2)})`);
      
      // Mark as bankrupt
      await supabase
        .from('agents')
        .update({
          is_bankrupt: true,
          is_active: false,
          bankruptcy_date: new Date().toISOString()
        })
        .eq('id', agent.id);
      
      return null;
    }
    
    // Deduct research cost
    const newBalance = agent.balance - researchCost;
    await supabase
      .from('agents')
      .update({
        balance: newBalance,
        spent: (agent.spent || 0) + researchCost
      })
      .eq('id', agent.id);
    
    // Log transaction
    await supabase
      .from('agent_transactions')
      .insert({
        agent_id: agent.id,
        type: 'RESEARCH_PURCHASE',
        amount: -researchCost,
        balance_after: newBalance,
        description: `Research for: "${market.question.slice(0, 50)}..."`
      });
    
    console.log(`💰 ${agent.name} spent $${researchCost.toFixed(2)} on research. New balance: $${newBalance.toFixed(2)}`);
    
    // 2. Get AI analysis using Claude
    const systemPrompt = agent.traits?.systemPrompt || 'You are an AI analyzing prediction markets.';
    
    const prompt = `Market Question: "${market.question}"

Market Details:
- Current YES price: ${(market.yes_price * 100).toFixed(1)}%
- Current NO price: ${(market.no_price * 100).toFixed(1)}%
- Trading volume: $${market.volume.toLocaleString()}
- Market closes: ${new Date(market.end_date).toLocaleDateString()}
- Description: ${market.description || 'No additional context'}

Based on your analysis approach, predict whether this market will resolve to YES or NO.

Respond in this EXACT JSON format:
{
  "prediction": "YES" or "NO",
  "confidence": 0.0 to 1.0,
  "reasoning": "2-3 sentence explanation of your decision"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Failed to parse AI response');
      return null;
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    // Validate response
    if (!analysis.prediction || !['YES', 'NO'].includes(analysis.prediction)) {
      console.error('❌ Invalid prediction value');
      return null;
    }
    
    if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 1) {
      console.error('❌ Invalid confidence value');
      return null;
    }
    
    // 3. Check confidence threshold (default 0.65)
    const confidenceThreshold = 0.65;
    
    if (analysis.confidence < confidenceThreshold) {
      console.log(`🤔 ${agent.name} confidence too low (${(analysis.confidence * 100).toFixed(0)}% < ${(confidenceThreshold * 100).toFixed(0)}%), skipping prediction`);
      return null;
    }
    
    // 4. Store prediction
    const { error: predError } = await supabase
      .from('agent_predictions')
      .insert({
        agent_id: agent.id,
        market_id: market.id,
        market_question: market.question,
        prediction: analysis.prediction,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        price_at_prediction: market.yes_price,
        research_cost: researchCost
      });
    
    if (predError) {
      console.error('❌ Failed to store prediction:', predError);
      return null;
    }
    
    // 5. Update agent stats
    await supabase
      .from('agents')
      .update({
        total_predictions: (agent.total_predictions || 0) + 1
      })
      .eq('id', agent.id);
    
    return analysis;
    
  } catch (error: any) {
    console.error(`❌ Error analyzing with ${agent.name}:`, error.message);
    return null;
  }
}
