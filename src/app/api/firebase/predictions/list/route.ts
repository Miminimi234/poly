import { CELEBRITY_AGENTS } from '@/lib/celebrity-agents';
import { firebaseAgentPredictions } from '@/lib/firebase-agent-predictions';
import { firebaseMarketCache } from '@/lib/firebase-market-cache';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');
        const prediction = searchParams.get('prediction');
        const resolved = searchParams.get('resolved');
        const correct = searchParams.get('correct');
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const limit = parseInt(searchParams.get('limit') || '50');

        console.log('🔍 Fetching Firebase predictions with filters:', {
            agentId, prediction, resolved, correct, sortBy, sortOrder, limit
        });

        // Get predictions from Firebase
        let predictions;
        if (agentId) {
            predictions = await firebaseAgentPredictions.getPredictionsByAgent(agentId, limit * 2); // Get more to filter
        } else {
            predictions = await firebaseAgentPredictions.getRecentPredictions(limit * 2);
        }

        // Apply filters
        let filteredPredictions = predictions.filter(pred => {
            // Prediction filter (YES/NO)
            if (prediction && pred.prediction !== prediction) {
                return false;
            }

            // Resolved filter
            if (resolved !== null && resolved !== '') {
                const isResolved = pred.resolved;
                if (resolved === 'true' && !isResolved) return false;
                if (resolved === 'false' && isResolved) return false;
            }

            // Correct filter
            if (correct !== null && correct !== '') {
                if (correct === 'true' && pred.correct !== true) return false;
                if (correct === 'false' && pred.correct !== false) return false;
            }

            return true;
        });

        // Sort predictions
        filteredPredictions.sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'confidence':
                    aValue = a.confidence;
                    bValue = b.confidence;
                    break;
                case 'profit_loss':
                    aValue = a.profit_loss || 0;
                    bValue = b.profit_loss || 0;
                    break;
                case 'created_at':
                default:
                    aValue = new Date(a.created_at).getTime();
                    bValue = new Date(b.created_at).getTime();
                    break;
            }

            const modifier = sortOrder === 'desc' ? -1 : 1;
            return aValue > bValue ? modifier : aValue < bValue ? -modifier : 0;
        });

        // Limit results
        filteredPredictions = filteredPredictions.slice(0, limit);

        // Get additional data for each prediction
        const enrichedPredictions = await Promise.all(
            filteredPredictions.map(async (pred) => {
                // Find agent info
                const agent = CELEBRITY_AGENTS.find(a => a.id === pred.agent_id);

                // Get market info from Firebase cache
                const markets = await firebaseMarketCache.getMarkets();
                const market = markets.find(m => m.polymarket_id === pred.market_id);

                return {
                    id: pred.id,
                    prediction: pred.prediction,
                    confidence: pred.confidence,
                    reasoning: pred.reasoning,
                    price_at_prediction: pred.price_at_prediction,
                    research_cost: pred.research_cost,
                    // Betting fields
                    bet_amount: pred.bet_amount || 0,
                    entry_odds: pred.entry_odds || { yes_price: 0.5, no_price: 0.5 },
                    expected_payout: pred.expected_payout || 0,
                    actual_payout: pred.actual_payout || 0,
                    // Resolution fields
                    outcome: pred.outcome || null,
                    correct: pred.correct || null,
                    profit_loss: pred.profit_loss || null,
                    created_at: pred.created_at,
                    resolved_at: pred.resolved_at || null,
                    // Agent data
                    agents: agent ? {
                        id: agent.id,
                        name: agent.name,
                        strategy_type: agent.strategy_type,
                        generation: 0 // Firebase doesn't have generations yet
                    } : {
                        id: pred.agent_id,
                        name: pred.agent_name,
                        strategy_type: 'UNKNOWN',
                        generation: 0
                    },
                    // Market data
                    polymarket_markets: market ? {
                        id: market.polymarket_id,
                        question: market.question,
                        market_slug: market.market_slug,
                        end_date: market.end_date,
                        yes_price: market.yes_price,
                        no_price: market.no_price,
                        resolved: market.resolved,
                        outcome: market.resolved ? (market as any).outcome : null
                    } : {
                        id: pred.market_id,
                        question: pred.market_question,
                        market_slug: pred.market_id,
                        end_date: null,
                        yes_price: pred.price_at_prediction,
                        no_price: 1 - pred.price_at_prediction,
                        resolved: pred.resolved,
                        outcome: pred.outcome
                    }
                };
            })
        );

        console.log(`✅ Retrieved ${enrichedPredictions.length} Firebase predictions`);

        return NextResponse.json({
            success: true,
            predictions: enrichedPredictions,
            count: enrichedPredictions.length,
            source: 'firebase'
        });

    } catch (error: any) {
        console.error('❌ Failed to fetch Firebase predictions list:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                predictions: [],
                source: 'firebase'
            },
            { status: 500 }
        );
    }
}