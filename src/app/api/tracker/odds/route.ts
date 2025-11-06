/**
 * API endpoint to manage the integrated market odds tracker
 * Provides start/stop/status controls for the odds tracking system
 */

import integratedMarketOddsTracker from '@/lib/integrated-market-odds-tracker';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();

        switch (action) {
            case 'start':
                integratedMarketOddsTracker.startTracking();
                return NextResponse.json({
                    success: true,
                    message: 'Integrated market odds tracker started',
                    status: 'running'
                });

            case 'stop':
                integratedMarketOddsTracker.stopTracking();
                return NextResponse.json({
                    success: true,
                    message: 'Integrated market odds tracker stopped',
                    status: 'stopped'
                });

            case 'status':
                const stats = await integratedMarketOddsTracker.getTrackingStats();
                return NextResponse.json({
                    success: true,
                    stats
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Invalid action. Use: start, stop, or status'
                }, { status: 400 });
        }

    } catch (error) {
        console.error('❌ Tracker API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const stats = await integratedMarketOddsTracker.getTrackingStats();
        return NextResponse.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('❌ Tracker status error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to get tracker status'
        }, { status: 500 });
    }
}