import { verifyAdminUser } from '@/lib/admin-auth-server';
import { NextResponse } from 'next/server';

/**
 * Admin-protected market refresh endpoint
 */
export async function POST() {
    try {
        // Verify admin access
        const { isAdmin, error } = await verifyAdminUser();

        if (!isAdmin) {
            return NextResponse.json(
                { error: error || 'Admin privileges required' },
                { status: 403 }
            );
        }

        console.log('[Admin API] Refreshing markets...');

        // Call polymarket markets endpoint with refresh (no limit to get all markets)
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/polymarket/markets?refresh=true`);

        const data = await response.json();

        if (data.success) {
            return NextResponse.json({
                success: true,
                message: `Refreshed ${data.count} markets`,
                count: data.count,
                source: data.source
            });
        } else {
            return NextResponse.json({
                success: false,
                error: data.error || 'Failed to refresh markets'
            });
        }

    } catch (error: any) {
        console.error('[Admin API] Market refresh error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}