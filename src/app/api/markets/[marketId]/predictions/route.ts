import { firebaseAgentPredictions } from '@/lib/firebase-agent-predictions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ marketId: string }> }
) {
  try {
    // Await params in Next.js 15
    const params = await context.params;
    const { marketId } = params;

    if (!marketId) {
      return NextResponse.json(
        { success: false, error: 'Market ID is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching predictions for market: ${marketId}`);

    // Get predictions for this specific market from Firebase
    const predictions = await firebaseAgentPredictions.getPredictionsByMarket(marketId);

    return NextResponse.json({
      success: true,
      predictions,
      count: predictions.length,
      marketId
    });

  } catch (error: any) {
    console.error('❌ Failed to get market predictions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
