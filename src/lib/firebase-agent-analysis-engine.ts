/**
 * Firebase-based Agent Analysis Engine
 * Admin-triggered system for agent predictions using Firebase
 */

import OpenAI from 'openai';
import { CELEBRITY_AGENTS } from './celebrity-agents';
import {
    adjustBetForPsychology,
    calculateBetAmount,
    canAgentMakeBet,
    getAgentBalance,
    initializeAgentBalances,
    placeBet
} from './firebase-agent-balances';
import { firebaseAgentPredictions } from './firebase-agent-predictions';
import { firebaseMarketCache, type CachedMarket } from './firebase-market-cache';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface AnalysisResult {
    agentId: string;
    agentName: string;
    marketId: string;
    marketQuestion: string;
    prediction: 'YES' | 'NO';
    confidence: number;
    reasoning: string;
    researchCost: number;
    success: boolean;
    error?: string;
}

interface AgentAnalysisSession {
    sessionId: string;
    triggeredBy: string;
    startTime: string;
    endTime?: string;
    totalAgents: number;
    totalMarkets: number;
    totalPredictions: number;
    results: AnalysisResult[];
    errors: string[];
    status: 'running' | 'completed' | 'failed';
}

class FirebaseAgentAnalysisEngine {
    private readonly RESEARCH_COST = 0.05; // $0.05 per analysis
    private readonly MAX_MARKETS_PER_AGENT = 2;
    private readonly MIN_VOLUME_THRESHOLD = 1000; // Minimum volume for market selection

    /**
     * Trigger agent analysis for all active celebrity agents
     * New logic: Fetch 2-3 markets and distribute them among agents (not all agents on same markets)
     */
    async triggerAgentAnalysis(triggeredBy: string = 'admin'): Promise<AgentAnalysisSession> {
        const sessionId = `session_${Date.now()}`;
        const session: AgentAnalysisSession = {
            sessionId,
            triggeredBy,
            startTime: new Date().toISOString(),
            totalAgents: 0,
            totalMarkets: 0,
            totalPredictions: 0,
            results: [],
            errors: [],
            status: 'running'
        };

        try {
            console.log(`🚀 Starting agent analysis session: ${sessionId}`);

            // 0. Initialize agent balances if needed
            await initializeAgentBalances();

            // 1. Get all celebrity agents
            const agents = CELEBRITY_AGENTS;
            session.totalAgents = agents.length;

            console.log(`👥 Found ${agents.length} celebrity agents`);

            // 2. Get 2-3 unanalyzed markets only
            const unanalyzedMarkets = await firebaseMarketCache.getUnanalyzedMarkets(3);
            session.totalMarkets = unanalyzedMarkets.length;

            console.log(`📊 Found ${unanalyzedMarkets.length} unanalyzed markets for distribution`);

            if (unanalyzedMarkets.length === 0) {
                console.log('⚠️ No unanalyzed markets available. Consider resetting analyzed status.');
                session.status = 'completed';
                session.endTime = new Date().toISOString();
                return session;
            }

            // 3. Filter suitable markets
            const suitableMarkets = unanalyzedMarkets.filter(market => {
                // Basic filters
                if (!market.active || market.resolved || market.archived) {
                    return false;
                }

                // Volume filter
                if (market.volume < this.MIN_VOLUME_THRESHOLD) {
                    return false;
                }

                // End date filter - market should end in the future
                if (market.end_date) {
                    const endDate = new Date(market.end_date);
                    const now = new Date();
                    const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

                    // Skip markets ending within 1 day or already ended
                    if (daysUntilEnd < 1) {
                        return false;
                    }
                }

                return true;
            });

            if (suitableMarkets.length === 0) {
                console.log('⚠️ No suitable markets found for analysis.');
                session.status = 'completed';
                session.endTime = new Date().toISOString();
                return session;
            }

            console.log(`🎯 Selected ${suitableMarkets.length} suitable markets for agent distribution`);

            // 4. Distribute markets among agents (each agent gets 1 market, some markets may get multiple agents)
            const marketAssignments = this.distributeMarketsAmongAgents(suitableMarkets, agents);

            console.log(`📋 Market assignments:`, marketAssignments);

            // 5. Run analysis for each agent-market assignment
            for (const assignment of marketAssignments) {
                try {
                    const agentResult = await this.runSingleAgentMarketAnalysis(assignment.agent, assignment.market);
                    if (agentResult) {
                        session.results.push(agentResult);
                        if (agentResult.success) {
                            session.totalPredictions++;
                        }
                    }

                } catch (error) {
                    const errorMsg = `Agent ${assignment.agent.name} analysis of market ${assignment.market.polymarket_id} failed: ${error}`;
                    console.error(errorMsg);
                    session.errors.push(errorMsg);
                }
            }

            session.status = 'completed';
            session.endTime = new Date().toISOString();

            console.log(`✅ Analysis session completed:`);
            console.log(`   - Markets analyzed: ${suitableMarkets.length}`);
            console.log(`   - Agent assignments: ${marketAssignments.length}`);
            console.log(`   - Predictions made: ${session.totalPredictions}`);
            console.log(`   - Errors: ${session.errors.length}`);

            return session;

        } catch (error) {
            session.status = 'failed';
            session.endTime = new Date().toISOString();
            session.errors.push(`Session failed: ${error}`);
            console.error(`❌ Analysis session failed:`, error);
            return session;
        }
    }

    /**
     * Run analysis for a single agent
     */
    private async runAgentAnalysis(agent: any, availableMarkets: CachedMarket[]): Promise<AnalysisResult[]> {
        const results: AnalysisResult[] = [];

        try {
            // Filter markets suitable for this agent
            const suitableMarkets = this.selectMarketsForAgent(agent, availableMarkets);

            if (suitableMarkets.length === 0) {
                console.log(`📭 No suitable markets for ${agent.name}`);
                return results;
            }

            // Select 1-2 markets randomly from suitable markets
            const selectedMarkets = this.randomlySelectMarkets(suitableMarkets, this.MAX_MARKETS_PER_AGENT);

            console.log(`🎯 ${agent.name} analyzing ${selectedMarkets.length} markets`);

            // Analyze each selected market
            for (const market of selectedMarkets) {
                try {
                    // Check if agent already predicted on this market
                    const alreadyPredicted = await firebaseAgentPredictions.hasAgentPredicted(agent.id, market.polymarket_id);

                    if (alreadyPredicted) {
                        console.log(`🔄 ${agent.name} already predicted on: ${market.question}`);
                        continue;
                    }

                    // Run AI analysis
                    const analysis = await this.analyzeMarketWithAI(agent, market);

                    if (analysis) {
                        // Get agent balance and calculate bet amount
                        const agentBalance = await getAgentBalance(agent.id);
                        if (!agentBalance) {
                            console.log(`❌ ${agent.name}: No balance found, skipping`);
                            continue;
                        }

                        // Calculate bet amount based on confidence and balance
                        let betAmount = calculateBetAmount(analysis.confidence, agentBalance.current_balance);

                        // Apply psychological adjustments
                        betAmount = adjustBetForPsychology(betAmount, agentBalance);

                        // Check if agent can make this bet
                        if (betAmount === 0 || !await canAgentMakeBet(agent.id, betAmount)) {
                            console.log(`💸 ${agent.name}: Insufficient balance ($${agentBalance.current_balance}) or low confidence for bet`);
                            continue;
                        }

                        // Calculate expected payout (simplified: assume fair odds for now)
                        const entryPrice = analysis.prediction === 'YES' ? market.yes_price : market.no_price;
                        const expectedPayout = entryPrice > 0 ? betAmount / entryPrice : betAmount * 2;

                        console.log(`💾 ${agent.name}: Attempting to save prediction to Firebase...`, {
                            market_id: market.polymarket_id,
                            prediction: analysis.prediction,
                            confidence: analysis.confidence,
                            betAmount,
                            expectedPayout
                        });

                        // Save prediction to Firebase with betting information
                        let predictionId: string;
                        try {
                            predictionId = await firebaseAgentPredictions.savePrediction({
                                agent_id: agent.id,
                                agent_name: agent.name,
                                market_id: market.polymarket_id,
                                market_question: market.question,
                                prediction: analysis.prediction,
                                confidence: analysis.confidence,
                                reasoning: analysis.reasoning,
                                research_cost: this.RESEARCH_COST,
                                research_sources: ['openai_analysis'],
                                price_at_prediction: market.yes_price,
                                bet_amount: betAmount,
                                entry_odds: {
                                    yes_price: market.yes_price,
                                    no_price: market.no_price
                                },
                                expected_payout: expectedPayout,
                                position_status: 'OPEN' as const,
                                resolved: false
                            });

                            console.log(`✅ ${agent.name}: Successfully saved prediction ${predictionId} to Firebase`);
                        } catch (saveError) {
                            console.error(`❌ ${agent.name}: Failed to save prediction to Firebase:`, saveError);
                            // Continue without saving prediction rather than failing completely
                            continue;
                        }

                        // Place the bet (deduct from balance)
                        const betPlaced = await placeBet(agent.id, betAmount, predictionId);

                        if (!betPlaced) {
                            console.log(`❌ ${agent.name}: Failed to place bet, balance may have changed`);
                            continue;
                        }

                        // Mark market as analyzed
                        await firebaseMarketCache.markMarketAsAnalyzed(market.polymarket_id);

                        results.push({
                            agentId: agent.id,
                            agentName: agent.name,
                            marketId: market.polymarket_id,
                            marketQuestion: market.question,
                            prediction: analysis.prediction,
                            confidence: analysis.confidence,
                            reasoning: analysis.reasoning,
                            researchCost: this.RESEARCH_COST,
                            success: true
                        });

                        console.log(`✅ ${agent.name}: ${analysis.prediction} (${(analysis.confidence * 100).toFixed(1)}%) $${betAmount} bet on "${market.question}"`);

                    } else {
                        results.push({
                            agentId: agent.id,
                            agentName: agent.name,
                            marketId: market.polymarket_id,
                            marketQuestion: market.question,
                            prediction: 'YES',
                            confidence: 0,
                            reasoning: 'Analysis failed',
                            researchCost: 0,
                            success: false,
                            error: 'AI analysis returned null'
                        });
                    }

                } catch (error) {
                    results.push({
                        agentId: agent.id,
                        agentName: agent.name,
                        marketId: market.polymarket_id,
                        marketQuestion: market.question,
                        prediction: 'YES',
                        confidence: 0,
                        reasoning: 'Analysis failed',
                        researchCost: 0,
                        success: false,
                        error: `Market analysis failed: ${error}`
                    });
                }
            }

        } catch (error) {
            console.error(`❌ ${agent.name} analysis failed:`, error);
            throw error;
        }

        return results;
    }

    /**
     * Select suitable markets for an agent based on strategy and preferences
     */
    private selectMarketsForAgent(agent: any, markets: CachedMarket[]): CachedMarket[] {
        return markets.filter(market => {
            // Basic filters
            if (!market.active || market.resolved || market.archived) {
                return false;
            }

            // Volume filter
            if (market.volume < this.MIN_VOLUME_THRESHOLD) {
                return false;
            }

            // End date filter - market should end in the future
            if (market.end_date) {
                const endDate = new Date(market.end_date);
                const now = new Date();
                const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

                // Skip markets ending within 1 day or already ended
                if (daysUntilEnd < 1) {
                    return false;
                }
            }

            // Agent-specific preferences (can be expanded based on agent traits)
            // For now, all agents can analyze all suitable markets
            return true;
        });
    }

    /**
     * Randomly select markets from suitable markets
     */
    private randomlySelectMarkets(markets: CachedMarket[], maxCount: number): CachedMarket[] {
        if (markets.length <= maxCount) {
            return markets;
        }

        // Shuffle and take maxCount
        const shuffled = markets.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, maxCount);
    }

    /**
     * Analyze a market using OpenAI based on agent personality
     */
    private async analyzeMarketWithAI(agent: any, market: CachedMarket): Promise<{
        prediction: 'YES' | 'NO';
        confidence: number;
        reasoning: string;
    } | null> {
        try {
            const prompt = this.buildAnalysisPrompt(agent, market);

            const response = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: agent.systemPrompt || 'You are an AI prediction agent analyzing prediction markets.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from OpenAI');
            }

            return this.parseAIResponse(content);

        } catch (error) {
            console.error(`❌ AI analysis failed for ${agent.name}:`, error);
            return null;
        }
    }

    /**
     * Build analysis prompt for the AI
     */
    private buildAnalysisPrompt(agent: any, market: CachedMarket): string {
        return `
Analyze this prediction market and make a prediction:

**Market Question:** ${market.question}
**Description:** ${market.description || 'No description available'}
**Category:** ${market.category}
**Current YES Price:** $${market.yes_price.toFixed(3)}
**Current NO Price:** $${market.no_price.toFixed(3)}
**24h Volume:** $${market.volume_24hr.toLocaleString()}
**End Date:** ${market.end_date || 'No end date specified'}

Respond with a JSON object in exactly this format:
{
  "prediction": "YES" or "NO",
  "confidence": 0.5 to 1.0,
  "reasoning": "Your detailed analysis explaining why you chose this prediction and confidence level"
}
        `.trim();
    }

    /**
     * Parse AI response into structured format
     */
    private parseAIResponse(content: string): {
        prediction: 'YES' | 'NO';
        confidence: number;
        reasoning: string;
    } | null {
        try {
            console.log('🔍 Parsing AI response:', content.substring(0, 200) + '...');

            // First, try to parse as JSON (preferred format)
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.prediction && parsed.confidence && parsed.reasoning) {
                        const prediction = parsed.prediction.toUpperCase();
                        const confidence = parseFloat(parsed.confidence);

                        if ((prediction === 'YES' || prediction === 'NO') &&
                            confidence >= 0.5 && confidence <= 1.0) {
                            console.log('✅ Parsed JSON format:', { prediction, confidence, reasoning: parsed.reasoning.substring(0, 100) + '...' });
                            return {
                                prediction: prediction as 'YES' | 'NO',
                                confidence,
                                reasoning: parsed.reasoning
                            };
                        }
                    }
                }
            } catch (jsonError) {
                console.log('🔄 Not JSON format, trying text parsing...');
            }

            // Fallback to text parsing
            const lines = content.split('\n');
            let prediction: 'YES' | 'NO' | null = null;
            let confidence: number | null = null;
            let reasoning = '';

            for (const line of lines) {
                if (line.startsWith('PREDICTION:')) {
                    const pred = line.replace('PREDICTION:', '').trim().toUpperCase();
                    if (pred === 'YES' || pred === 'NO') {
                        prediction = pred;
                    }
                } else if (line.startsWith('CONFIDENCE:')) {
                    const conf = parseFloat(line.replace('CONFIDENCE:', '').trim());
                    if (!isNaN(conf) && conf >= 0.5 && conf <= 1.0) {
                        confidence = conf;
                    }
                } else if (line.startsWith('REASONING:')) {
                    reasoning = line.replace('REASONING:', '').trim();
                }
            }

            // Try to extract from natural language if structured format failed
            if (!prediction || !confidence) {
                // Look for YES/NO anywhere in the response
                const upperContent = content.toUpperCase();
                if (upperContent.includes('"PREDICTION": "YES"') ||
                    (upperContent.includes('YES') && !upperContent.includes('NO'))) {
                    prediction = 'YES';
                } else if (upperContent.includes('"PREDICTION": "NO"') ||
                    (upperContent.includes('NO') && !upperContent.includes('YES'))) {
                    prediction = 'NO';
                }

                // Look for confidence in JSON or percentage
                const confMatch = content.match(/"confidence":\s*([0-9.]+)|(\d+(?:\.\d+)?)\s*%/);
                if (confMatch) {
                    confidence = parseFloat(confMatch[1] || confMatch[2]);
                    if (confMatch[2]) confidence = confidence / 100; // Convert percentage
                } else {
                    confidence = 0.7; // Default confidence
                }

                // Extract reasoning from JSON or use first sentences
                const reasoningMatch = content.match(/"reasoning":\s*"([^"]+)"/);
                if (reasoningMatch) {
                    reasoning = reasoningMatch[1];
                } else if (!reasoning) {
                    reasoning = content.split('.')[0] + '.';
                }
            }

            if (!prediction || !confidence || !reasoning) {
                console.error('❌ Could not extract prediction, confidence, or reasoning from:', content);
                throw new Error(`Invalid AI response format. Got prediction: ${prediction}, confidence: ${confidence}, reasoning: ${reasoning}`);
            }

            console.log('✅ Parsed text format:', { prediction, confidence, reasoning: reasoning.substring(0, 100) + '...' });
            return { prediction, confidence, reasoning };

        } catch (error) {
            console.error('❌ Failed to parse AI response:', error);
            console.error('❌ Raw content was:', content);
            return null;
        }
    }

    /**
     * Reset analyzed status for all markets and clear all predictions
     */
    async resetAnalyzedStatus(): Promise<void> {
        console.log('🔄 Resetting analyzed status for all markets and clearing predictions...');

        // Reset analyzed status for markets
        await firebaseMarketCache.resetAnalyzedStatus();

        // Clear all agent predictions
        await firebaseAgentPredictions.clearAllPredictions();

        console.log('✅ Analyzed status reset and predictions cleared complete');
    }

    /**
     * Trigger agent analysis for a specific market
     */
    async triggerSingleMarketAnalysis(marketId: string): Promise<{
        agentsTriggered: number;
        predictionsGenerated: number;
        errors: string[];
    }> {
        const result = {
            agentsTriggered: 0,
            predictionsGenerated: 0,
            errors: [] as string[]
        };

        try {
            console.log(`🎯 Starting single market analysis for: ${marketId}`);

            // 0. Initialize agent balances if needed
            await initializeAgentBalances();

            // 1. Get the specific market
            const market = await firebaseMarketCache.getMarket(marketId);
            if (!market) {
                throw new Error(`Market ${marketId} not found`);
            }

            // 2. Get all celebrity agents
            const agents = CELEBRITY_AGENTS;
            result.agentsTriggered = agents.length;

            console.log(`👥 Running analysis with ${agents.length} agents for market: ${market.question.slice(0, 50)}...`);

            // 3. Run analysis for each agent on this market
            for (const agent of agents) {
                try {
                    // Check if agent can afford research (deferred to bet placement stage)
                    // This ensures balance checks are consistent with the main analysis flow

                    // Check if agent already predicted on this market
                    const alreadyPredicted = await firebaseAgentPredictions.hasAgentPredicted(agent.id, marketId);

                    if (alreadyPredicted) {
                        console.log(`🔄 ${agent.name} already predicted on: ${market.question}`);
                        continue;
                    }

                    // Analyze the market
                    const analysis = await this.analyzeMarketWithAI(agent, market);

                    if (analysis) {
                        // Get agent balance and calculate bet amount
                        const agentBalance = await getAgentBalance(agent.id);
                        if (!agentBalance) {
                            console.log(`❌ ${agent.name}: No balance found, skipping`);
                            continue;
                        }

                        // Calculate bet amount based on confidence and balance
                        let betAmount = calculateBetAmount(analysis.confidence, agentBalance.current_balance);

                        // Apply psychological adjustments
                        betAmount = adjustBetForPsychology(betAmount, agentBalance);

                        // Check if agent can make this bet
                        if (betAmount === 0 || !await canAgentMakeBet(agent.id, betAmount)) {
                            console.log(`💸 ${agent.name}: Insufficient balance ($${agentBalance.current_balance}) or low confidence for bet`);
                            continue;
                        }

                        // Calculate expected payout (simplified: assume fair odds for now)
                        const entryPrice = analysis.prediction === 'YES' ? market.yes_price : market.no_price;
                        const expectedPayout = entryPrice > 0 ? betAmount / entryPrice : betAmount * 2;

                        console.log(`💾 ${agent.name}: Attempting to save prediction to Firebase...`, {
                            market_id: marketId,
                            prediction: analysis.prediction,
                            confidence: analysis.confidence,
                            betAmount,
                            expectedPayout
                        });

                        // Save prediction to Firebase with betting information
                        let predictionId: string;
                        try {
                            predictionId = await firebaseAgentPredictions.savePrediction({
                                agent_id: agent.id,
                                agent_name: agent.name,
                                market_id: marketId,
                                market_question: market.question,
                                prediction: analysis.prediction,
                                confidence: analysis.confidence,
                                reasoning: analysis.reasoning,
                                research_cost: this.RESEARCH_COST,
                                research_sources: ['openai_analysis'],
                                price_at_prediction: market.yes_price,
                                bet_amount: betAmount,
                                entry_odds: {
                                    yes_price: market.yes_price,
                                    no_price: market.no_price
                                },
                                expected_payout: expectedPayout,
                                position_status: 'OPEN' as const,
                                resolved: false
                            });

                            console.log(`✅ ${agent.name}: Successfully saved prediction ${predictionId} to Firebase`);
                        } catch (saveError) {
                            console.error(`❌ ${agent.name}: Failed to save prediction to Firebase:`, saveError);
                            result.errors.push(`Agent ${agent.name} failed to save prediction: ${saveError}`);
                            continue;
                        }

                        // Place the bet (deduct from balance)
                        const betPlaced = await placeBet(agent.id, betAmount, predictionId);

                        if (!betPlaced) {
                            console.log(`❌ ${agent.name}: Failed to place bet, balance may have changed`);
                            result.errors.push(`Agent ${agent.name} failed to place bet`);
                            continue;
                        }

                        result.predictionsGenerated++;
                        console.log(`✅ ${agent.name}: ${analysis.prediction} (${(analysis.confidence * 100).toFixed(1)}%) $${betAmount} bet on "${market.question}"`);

                    } else {
                        result.errors.push(`Agent ${agent.name} analysis failed: No valid analysis returned`);
                    }

                } catch (error: any) {
                    const errorMsg = `Agent ${agent.name} analysis failed: ${error.message}`;
                    console.error('❌', errorMsg);
                    result.errors.push(errorMsg);
                }
            }

            // 4. Mark market as analyzed only if at least one prediction was made
            if (result.predictionsGenerated > 0) {
                await firebaseMarketCache.markMarketAsAnalyzed(marketId);
            }

            console.log(`✅ Single market analysis complete: ${result.predictionsGenerated}/${result.agentsTriggered} agents made predictions`);

        } catch (error: any) {
            console.error('❌ Single market analysis failed:', error);
            result.errors.push(`Analysis failed: ${error.message}`);
        }

        return result;
    }

    /**
     * Distribute markets among agents - each agent gets assigned to 1 market
     * Markets may be assigned to multiple agents (2-3 agents per market max)
     */
    private distributeMarketsAmongAgents(markets: CachedMarket[], agents: any[]): Array<{ agent: any, market: CachedMarket }> {
        const assignments: Array<{ agent: any, market: CachedMarket }> = [];
        const maxAgentsPerMarket = Math.min(3, Math.ceil(agents.length / markets.length));

        console.log(`📊 Distributing ${markets.length} markets among ${agents.length} agents (max ${maxAgentsPerMarket} agents per market)`);

        // Shuffle agents to ensure random distribution
        const shuffledAgents = [...agents].sort(() => Math.random() - 0.5);

        // Assign agents to markets in round-robin fashion
        let agentIndex = 0;
        for (const market of markets) {
            const agentsForThisMarket = Math.min(maxAgentsPerMarket, agents.length);

            for (let i = 0; i < agentsForThisMarket; i++) {
                const agent = shuffledAgents[agentIndex % shuffledAgents.length];
                assignments.push({ agent, market });

                console.log(`🎯 Assigned ${agent.name} to analyze: ${market.question.slice(0, 60)}...`);

                agentIndex++;
            }
        }

        return assignments;
    }

    /**
     * Run analysis for a single agent on a single market
     */
    private async runSingleAgentMarketAnalysis(agent: any, market: CachedMarket): Promise<AnalysisResult | null> {
        try {
            // Check if agent already predicted on this market
            const alreadyPredicted = await firebaseAgentPredictions.hasAgentPredicted(agent.id, market.polymarket_id);

            if (alreadyPredicted) {
                console.log(`🔄 ${agent.name} already predicted on: ${market.question}`);
                return null;
            }

            // Run AI analysis
            const analysis = await this.analyzeMarketWithAI(agent, market);

            if (!analysis) {
                return {
                    agentId: agent.id,
                    agentName: agent.name,
                    marketId: market.polymarket_id,
                    marketQuestion: market.question,
                    prediction: 'YES',
                    confidence: 0,
                    reasoning: 'AI analysis returned null',
                    researchCost: 0,
                    success: false,
                    error: 'AI analysis failed'
                };
            }

            // Get agent balance and calculate bet amount
            const agentBalance = await getAgentBalance(agent.id);
            if (!agentBalance) {
                console.log(`❌ ${agent.name}: No balance found, skipping`);
                return {
                    agentId: agent.id,
                    agentName: agent.name,
                    marketId: market.polymarket_id,
                    marketQuestion: market.question,
                    prediction: analysis.prediction,
                    confidence: analysis.confidence,
                    reasoning: 'No agent balance found',
                    researchCost: 0,
                    success: false,
                    error: 'No agent balance'
                };
            }

            // Calculate bet amount based on confidence and balance
            let betAmount = calculateBetAmount(analysis.confidence, agentBalance.current_balance);

            // Apply psychological adjustments
            betAmount = adjustBetForPsychology(betAmount, agentBalance);

            // Check if agent can make this bet
            if (betAmount === 0 || !await canAgentMakeBet(agent.id, betAmount)) {
                console.log(`💸 ${agent.name}: Insufficient balance ($${agentBalance.current_balance}) or low confidence for bet`);
                return {
                    agentId: agent.id,
                    agentName: agent.name,
                    marketId: market.polymarket_id,
                    marketQuestion: market.question,
                    prediction: analysis.prediction,
                    confidence: analysis.confidence,
                    reasoning: 'Insufficient balance or low confidence',
                    researchCost: 0,
                    success: false,
                    error: 'Insufficient funds or low confidence'
                };
            }

            // Calculate expected payout
            const entryPrice = analysis.prediction === 'YES' ? market.yes_price : market.no_price;
            const expectedPayout = entryPrice > 0 ? betAmount / entryPrice : betAmount * 2;

            console.log(`💾 ${agent.name}: Attempting to save prediction to Firebase...`, {
                market_id: market.polymarket_id,
                prediction: analysis.prediction,
                confidence: analysis.confidence,
                betAmount,
                expectedPayout
            });

            // Save prediction to Firebase with betting information
            let predictionId: string;
            try {
                predictionId = await firebaseAgentPredictions.savePrediction({
                    agent_id: agent.id,
                    agent_name: agent.name,
                    market_id: market.polymarket_id,
                    market_question: market.question,
                    prediction: analysis.prediction,
                    confidence: analysis.confidence,
                    reasoning: analysis.reasoning,
                    research_cost: this.RESEARCH_COST,
                    research_sources: ['openai_analysis'],
                    price_at_prediction: market.yes_price,
                    bet_amount: betAmount,
                    entry_odds: {
                        yes_price: market.yes_price,
                        no_price: market.no_price
                    },
                    expected_payout: expectedPayout,
                    position_status: 'OPEN' as const,
                    resolved: false
                });

                console.log(`✅ ${agent.name}: Successfully saved prediction ${predictionId} to Firebase`);
            } catch (saveError) {
                console.error(`❌ ${agent.name}: Failed to save prediction to Firebase:`, saveError);
                return {
                    agentId: agent.id,
                    agentName: agent.name,
                    marketId: market.polymarket_id,
                    marketQuestion: market.question,
                    prediction: analysis.prediction,
                    confidence: analysis.confidence,
                    reasoning: analysis.reasoning,
                    researchCost: this.RESEARCH_COST,
                    success: false,
                    error: `Failed to save prediction: ${saveError}`
                };
            }

            // Place the bet (deduct from balance)
            const betPlaced = await placeBet(agent.id, betAmount, predictionId);

            if (!betPlaced) {
                console.log(`❌ ${agent.name}: Failed to place bet, balance may have changed`);
                return {
                    agentId: agent.id,
                    agentName: agent.name,
                    marketId: market.polymarket_id,
                    marketQuestion: market.question,
                    prediction: analysis.prediction,
                    confidence: analysis.confidence,
                    reasoning: analysis.reasoning,
                    researchCost: this.RESEARCH_COST,
                    success: false,
                    error: 'Failed to place bet'
                };
            }

            // Mark market as analyzed only after first successful prediction
            await firebaseMarketCache.markMarketAsAnalyzed(market.polymarket_id);

            console.log(`✅ ${agent.name}: ${analysis.prediction} (${(analysis.confidence * 100).toFixed(1)}%) $${betAmount} bet on "${market.question}"`);

            return {
                agentId: agent.id,
                agentName: agent.name,
                marketId: market.polymarket_id,
                marketQuestion: market.question,
                prediction: analysis.prediction,
                confidence: analysis.confidence,
                reasoning: analysis.reasoning,
                researchCost: this.RESEARCH_COST,
                success: true
            };

        } catch (error) {
            console.error(`❌ ${agent.name} analysis failed:`, error);
            return {
                agentId: agent.id,
                agentName: agent.name,
                marketId: market.polymarket_id,
                marketQuestion: market.question,
                prediction: 'YES',
                confidence: 0,
                reasoning: 'Analysis failed due to error',
                researchCost: 0,
                success: false,
                error: `Market analysis failed: ${error}`
            };
        }
    }

    /**
     * Get analysis statistics
     */
    async getAnalysisStats(): Promise<{
        totalMarkets: number;
        analyzedMarkets: number;
        unanalyzedMarkets: number;
        totalPredictions: number;
    }> {
        try {
            const allMarkets = await firebaseMarketCache.getMarkets();
            const unanalyzedMarkets = await firebaseMarketCache.getUnanalyzedMarkets(1000);
            const metadata = await firebaseAgentPredictions.getMetadata();

            return {
                totalMarkets: allMarkets.length,
                analyzedMarkets: allMarkets.length - unanalyzedMarkets.length,
                unanalyzedMarkets: unanalyzedMarkets.length,
                totalPredictions: metadata?.total_predictions || 0
            };

        } catch (error) {
            console.error('❌ Failed to get analysis stats:', error);
            return {
                totalMarkets: 0,
                analyzedMarkets: 0,
                unanalyzedMarkets: 0,
                totalPredictions: 0
            };
        }
    }
}

// Global Firebase agent analysis instance
const firebaseAgentAnalysisEngine = new FirebaseAgentAnalysisEngine();

export { firebaseAgentAnalysisEngine, type AgentAnalysisSession, type AnalysisResult };
export default firebaseAgentAnalysisEngine;