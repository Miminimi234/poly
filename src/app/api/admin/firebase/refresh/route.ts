import { verifyAdminUser } from '@/lib/admin-auth-server';
import firebaseMarketCache from '@/lib/firebase-market-cache';
import { fetchPolymarketMarkets, parsePolymarketMarket } from '@/lib/polymarket-client';
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

        console.log('[Firebase Admin] Refreshing markets to Firebase directly...');

        // Call Polymarket API directly instead of making HTTP call to avoid 502 errors
        console.log('[Firebase Admin] Fetching fresh markets from Polymarket API...');

        try {
            // Fetch ALL available markets directly from Polymarket
            const rawMarkets = await fetchPolymarketMarkets(0); // 0 means no limit

            if (!rawMarkets || rawMarkets.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'No markets found from Polymarket API'
                });
            }

            console.log('[Firebase Admin] Processing markets...');

            // Parse markets (no filtering)
            const parsedMarkets = rawMarkets
                .map(market => {
                    try {
                        return parsePolymarketMarket(market);
                    } catch (error) {
                        console.warn(`Failed to parse market ${market.id}:`, error);
                        return null;
                    }
                })
                .filter(market => market !== null)
                .sort((a, b) => b.volume - a.volume); // Sort by volume descending

            console.log('[Firebase Admin] Storing markets in Firebase...');

            // Store ALL parsed markets in Firebase using intelligent upsert
            const upsertResult = await firebaseMarketCache.upsertMarkets(parsedMarkets, 'polymarket_api');

            console.log(`[Firebase Admin] Successfully processed ${parsedMarkets.length} markets:`,
                `${upsertResult.added} added, ${upsertResult.updated} updated, ${upsertResult.skipped} unchanged`);

            // Get Firebase stats after refresh
            const firebaseStats = await firebaseMarketCache.getStats();

            return NextResponse.json({
                success: true,
                message: `Firebase refreshed with ${parsedMarkets.length} markets`,
                count: parsedMarkets.length,
                totalAvailable: parsedMarkets.length,
                source: 'polymarket_api_direct',
                firebaseStats: firebaseStats,
                upsertResult: upsertResult
            });

        } catch (apiError: any) {
            console.error('[Firebase Admin] Polymarket API error:', apiError);
            return NextResponse.json({
                success: false,
                error: `Failed to fetch from Polymarket API: ${apiError.message}`
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