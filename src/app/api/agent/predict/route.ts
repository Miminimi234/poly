import { aiProviderService } from '@/lib/ai-providers';
import { firebaseMarketCache } from '@/lib/firebase-market-cache';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { agentId, agentName, strategy_type, marketId, betAmount = 10 } = body;

        if (!marketId) {
            return NextResponse.json({ success: false, error: 'marketId required' }, { status: 400 });
        }

        // Fetch market info from Firebase cache
        const market = await firebaseMarketCache.getMarket(marketId);
        if (!market) {
            return NextResponse.json({ success: false, error: 'market not found' }, { status: 404 });
        }

        // Build system prompt based on strategy
        const systemPrompt = `You are a prediction-market analyst following the '${strategy_type || 'balanced'}' strategy. Give a concise prediction (YES or NO), a confidence between 0 and 1, and brief reasoning.`;

        // Determine provider & model defaults
        const provider = process.env.DEFAULT_AI_PROVIDER || 'openai';
        const model = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';

        // Call the multi-provider AI wrapper
        const aiResponse = await aiProviderService.analyzeMarket(provider, model, systemPrompt, {
            question: market.question,
            description: market.description || '',
            currentOdds: market.yes_price || 0.5,
            volume: market.volume || 0
        } as any);

        // Prepare a prediction payload for the client
        const prediction = {
            agent_id: agentId,
            agent_name: agentName || `Agent ${agentId}`,
            market_id: market.polymarket_id,
            market_question: market.question,
            prediction: aiResponse.prediction,
            confidence: aiResponse.confidence,
            reasoning: aiResponse.reasoning,
            bet_amount: betAmount,
            entry_odds: {
                yes_price: market.yes_price,
                no_price: market.no_price
            },
            // Simple expected payout estimate: bet_amount / price_of_chosen_outcome
            expected_payout: (() => {
                const price = aiResponse.prediction === 'YES' ? (market.yes_price || 0.5) : (market.no_price || 0.5);
                const payout = price > 0 ? +(betAmount / price).toFixed(2) : betAmount;
                return payout;
            })(),
            research_cost: 0
        };

        return NextResponse.json({ success: true, prediction }, { status: 200 });
    } catch (err: any) {
        console.error('Error in /api/agent/predict:', err);
        return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
    }
}
