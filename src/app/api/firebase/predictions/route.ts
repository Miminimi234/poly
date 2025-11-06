import { firebaseAgentPredictions } from '@/lib/firebase-agent-predictions';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');
        const marketId = searchParams.get('marketId');
        const limit = parseInt(searchParams.get('limit') || '20');

        let predictions;

        if (agentId) {
            // Get predictions for specific agent
            predictions = await firebaseAgentPredictions.getPredictionsByAgent(agentId, limit);
        } else if (marketId) {
            // Get predictions for specific market
            predictions = await firebaseAgentPredictions.getPredictionsByMarket(marketId);
        } else {
            // Get recent predictions across all agents
            predictions = await firebaseAgentPredictions.getRecentPredictions(limit);
        }

        return NextResponse.json({
            success: true,
            predictions,
            count: predictions.length
        });

    } catch (error: any) {
        console.error('❌ Failed to fetch Firebase predictions:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                predictions: []
            },
            { status: 500 }
        );
    }
}