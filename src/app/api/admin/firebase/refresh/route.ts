import { verifyAdminUser } from '@/lib/admin-auth-server';
import firebaseMarketCache from '@/lib/firebase-market-cache';
import { NextResponse } from 'next/server';

/**
 * Admin-protected Firebase refresh endpoint - refreshes from Polymarket API to Firebase
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

        console.log('[Firebase Admin] Refreshing markets to Firebase...');

        // Call the polymarket markets endpoint with refresh to populate Firebase
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/polymarket/markets?refresh=true`);

        const data = await response.json();

        if (data.success) {
            // Get Firebase stats after refresh
            const firebaseStats = await firebaseMarketCache.getStats();

            return NextResponse.json({
                success: true,
                message: `Firebase refreshed with ${data.count} markets`,
                count: data.count,
                totalAvailable: data.totalAvailable,
                source: data.source,
                firebaseStats: firebaseStats
            });
        } else {
            return NextResponse.json({
                success: false,
                error: data.error || 'Failed to refresh Firebase from Polymarket'
            });
        }

    } catch (error: any) {
        console.error('[Firebase Admin] Refresh error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}