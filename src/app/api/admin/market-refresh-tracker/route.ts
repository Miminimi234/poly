import { verifyAdminUser } from '@/lib/admin-auth-server';
import { marketRefreshTracker } from '@/lib/market-refresh-tracker';
import { NextResponse } from 'next/server';

/**
 * Admin-protected market refresh tracker endpoint
 * Manages automatic market data refresh every 7 seconds
 */
export async function POST(request: Request) {
    try {
        // Verify admin access
        const { isAdmin, error } = await verifyAdminUser();

        if (!isAdmin) {
            return NextResponse.json(
                { error: error || 'Admin privileges required' },
                { status: 403 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const { action } = body;

        switch (action) {
            case 'start':
                marketRefreshTracker.startTracking();
                return NextResponse.json({
                    success: true,
                    message: 'Market refresh tracker started - updating markets every 7 seconds',
                    status: marketRefreshTracker.getStatus()
                });

            case 'stop':
                marketRefreshTracker.stopTracking();
                return NextResponse.json({
                    success: true,
                    message: 'Market refresh tracker stopped',
                    status: marketRefreshTracker.getStatus()
                });

            case 'status':
                return NextResponse.json({
                    success: true,
                    status: marketRefreshTracker.getStatus()
                });

            case 'force-refresh':
                const refreshResult = await marketRefreshTracker.forceRefresh();
                return NextResponse.json({
                    success: true,
                    message: `Manual refresh completed - ${refreshResult.count} markets processed`,
                    result: refreshResult,
                    status: marketRefreshTracker.getStatus()
                });

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Invalid action. Use: start, stop, status, or force-refresh'
                });
        }

    } catch (error: any) {
        console.error('[Market Refresh Tracker API] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        // Verify admin access
        const { isAdmin, error } = await verifyAdminUser();

        if (!isAdmin) {
            return NextResponse.json(
                { error: error || 'Admin privileges required' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            status: marketRefreshTracker.getStatus()
        });

    } catch (error: any) {
        console.error('[Market Refresh Tracker API] Status check error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}