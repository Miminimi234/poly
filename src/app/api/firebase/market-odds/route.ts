/**
 * Market Odds Tracking API - Control and monitor market odds updates
 */

import { marketOddsTracker } from '@/lib/market-odds-tracker';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'status') {
            const status = marketOddsTracker.getTrackingStatus();
            
            return NextResponse.json({
                success: true,
                status
            });
        }

        if (action === 'update') {
            const marketId = searchParams.get('marketId');
            
            if (marketId) {
                // Update specific market
                const success = await marketOddsTracker.forceUpdateMarket(marketId);
                
                return NextResponse.json({
                    success,
                    message: success 
                        ? `Market ${marketId} odds updated successfully`
                        : `Failed to update market ${marketId} odds`
                });
            } else {
                // Update all markets
                await marketOddsTracker.updateAllMarketOdds();
                
                return NextResponse.json({
                    success: true,
                    message: 'All market odds update triggered'
                });
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Invalid action. Supported actions: status, update'
            },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('❌ Failed to process market odds request:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { action } = await request.json();

        console.log(`🎯 Market odds tracker action: ${action}`);

        if (action === 'start') {
            marketOddsTracker.startTracking();
            
            return NextResponse.json({
                success: true,
                message: 'Market odds tracking started'
            });
        }

        if (action === 'stop') {
            marketOddsTracker.stopTracking();
            
            return NextResponse.json({
                success: true,
                message: 'Market odds tracking stopped'
            });
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Invalid action. Supported actions: start, stop'
            },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('❌ Failed to control market odds tracker:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}