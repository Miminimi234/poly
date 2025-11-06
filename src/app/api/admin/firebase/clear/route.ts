import { verifyAdminUser } from '@/lib/admin-auth-server';
import firebaseMarketCache from '@/lib/firebase-market-cache';
import { NextResponse } from 'next/server';

/**
 * Admin-protected Firebase cache clearing endpoint
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

        console.log('[Firebase Admin] Clearing entire Firebase cache...');

        // Get stats before clearing
        const statsBefore = await firebaseMarketCache.getStats();

        // Clear the Firebase cache
        await firebaseMarketCache.clearCache();

        // Get stats after clearing
        const statsAfter = await firebaseMarketCache.getStats();

        return NextResponse.json({
            success: true,
            message: `Firebase cache cleared successfully`,
            stats: {
                beforeClear: statsBefore,
                afterClear: statsAfter,
                cleared: statsBefore.totalMarkets
            }
        });

    } catch (error: any) {
        console.error('[Firebase Admin] Cache clear error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}