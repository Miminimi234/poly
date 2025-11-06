import { integratedMarketTracker } from '@/lib/integrated-market-tracker';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { action, intervalMinutes } = body;

        switch (action) {
            case 'start':
                const interval = intervalMinutes || 5;
                await integratedMarketTracker.start(interval);
                return NextResponse.json({
                    success: true,
                    message: `Integrated Market Tracker started - tracking odds AND positions every ${interval} minutes`,
                    status: integratedMarketTracker.getStatus()
                });

            case 'stop':
                integratedMarketTracker.stop();
                return NextResponse.json({
                    success: true,
                    message: 'Integrated Market Tracker stopped',
                    status: integratedMarketTracker.getStatus()
                });

            case 'force-update':
                await integratedMarketTracker.forceUpdate();
                return NextResponse.json({
                    success: true,
                    message: 'Integrated update completed - odds updated and positions recalculated',
                    status: integratedMarketTracker.getStatus()
                });

            case 'test':
                const testResult = await integratedMarketTracker.testIntegration();
                return NextResponse.json({
                    success: true,
                    message: 'Integration test completed',
                    testResult,
                    status: integratedMarketTracker.getStatus()
                });

            case 'status':
                const status = integratedMarketTracker.getStatus();
                return NextResponse.json({
                    success: true,
                    status
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Invalid action. Use: start, stop, force-update, test, or status'
                }, { status: 400 });
        }

    } catch (error: any) {
        console.error('❌ Integrated Market Tracker API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            message: 'Integrated market tracking operation failed'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const status = integratedMarketTracker.getStatus();

        return NextResponse.json({
            success: true,
            message: 'Integrated Market Tracker Status - Odds + Position Management',
            status,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}