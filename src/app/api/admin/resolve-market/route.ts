import { firebaseMarketCache } from '@/lib/firebase-market-cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { marketId, outcome, confirmedBy } = body;

        if (!marketId || !outcome) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: marketId and outcome are required'
                },
                { status: 400 }
            );
        }

        if (outcome !== 'YES' && outcome !== 'NO') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid outcome. Must be "YES" or "NO"'
                },
                { status: 400 }
            );
        }

        console.log(`🔧 Admin manual market resolution by: ${confirmedBy || 'admin'}`);

        // Manually resolve the market
        await firebaseMarketCache.manuallyResolveMarket(marketId, outcome);

        return NextResponse.json({
            success: true,
            message: `Market ${marketId} manually resolved with outcome: ${outcome}`,
            marketId,
            outcome,
            resolvedBy: confirmedBy || 'admin',
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ Manual market resolution failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                message: 'Failed to manually resolve market'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        success: false,
        message: 'Use POST to manually resolve a market. Required: { marketId: string, outcome: "YES" | "NO" }'
    }, { status: 405 });
}