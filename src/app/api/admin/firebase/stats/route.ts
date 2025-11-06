import { verifyAdminUser } from '@/lib/admin-auth-server';
import firebaseMarketCache from '@/lib/firebase-market-cache';
import { NextResponse } from 'next/server';

/**
 * Admin-protected Firebase stats endpoint
 */
export async function GET() {
    try {
        // Verify admin access
        const { isAdmin, error } = await verifyAdminUser();

        if (!isAdmin) {
            return NextResponse.json(
                { error: error || 'Admin privileges required' },
                { status: 403 }
            );
        }

        console.log('[Firebase Admin] Getting Firebase stats...');

        // Get Firebase stats and metadata
        const stats = await firebaseMarketCache.getStats();
        const metadata = await firebaseMarketCache.getMetadata();

        return NextResponse.json({
            success: true,
            stats,
            metadata,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Firebase Admin] Stats error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}