import { firebaseAgentPredictions } from '@/lib/firebase-agent-predictions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { marketIds } = body;

        if (!marketIds || !Array.isArray(marketIds)) {
            return NextResponse.json(
                { success: false, error: 'marketIds array is required' },
                { status: 400 }
            );
        }

        console.log(`📊 Fetching prediction counts for ${marketIds.length} markets`);

        const predictionCounts: { [marketId: string]: number } = {};

        // Get prediction counts for each market
        for (const marketId of marketIds) {
            try {
                const predictions = await firebaseAgentPredictions.getPredictionsByMarket(marketId);
                predictionCounts[marketId] = predictions.length;
            } catch (error) {
                console.error(`Failed to get predictions for market ${marketId}:`, error);
                predictionCounts[marketId] = 0;
            }
        }

        return NextResponse.json({
            success: true,
            predictionCounts
        });

    } catch (error: any) {
        console.error('❌ Failed to get prediction counts:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}