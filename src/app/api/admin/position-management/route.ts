import { positionManagementEngine } from '@/lib/position-management-engine';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { action, intervalMinutes } = body;

        switch (action) {
            case 'start':
                const interval = intervalMinutes || 5;
                await positionManagementEngine.start(interval);
                return NextResponse.json({
                    success: true,
                    message: `Position Management Engine started with ${interval} minute intervals`,
                    status: positionManagementEngine.getStatus()
                });

            case 'stop':
                positionManagementEngine.stop();
                return NextResponse.json({
                    success: true,
                    message: 'Position Management Engine stopped',
                    status: positionManagementEngine.getStatus()
                });

            case 'force-update':
                await positionManagementEngine.forceUpdate();
                return NextResponse.json({
                    success: true,
                    message: 'Position management update completed',
                    status: positionManagementEngine.getStatus()
                });

            case 'status':
                const status = positionManagementEngine.getStatus();
                const report = await positionManagementEngine.getPositionReport();
                return NextResponse.json({
                    success: true,
                    status,
                    report
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Invalid action. Use: start, stop, force-update, or status'
                }, { status: 400 });
        }

    } catch (error: any) {
        console.error('❌ Position Management Engine API error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            message: 'Position management operation failed'
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const status = positionManagementEngine.getStatus();
        const report = await positionManagementEngine.getPositionReport();

        return NextResponse.json({
            success: true,
            message: 'Position Management Engine Status',
            status,
            report,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}