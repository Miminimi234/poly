import { verifyAdminUser } from '@/lib/admin-auth-server';
import { adminDatabase } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

/**
 * Admin-protected Firebase complete database clearing endpoint
 * Clears ALL Firebase data including predictions, balances, markets, etc.
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

        console.log('🔥 [Firebase Admin] CLEARING ENTIRE FIREBASE DATABASE...');

        // Get stats before clearing
        const statsBefore = {
            agent_predictions: 0,
            agent_balances: 0,
            polymarket_markets: 0,
            cache_metadata: 0,
            predictions_metadata: 0,
            market_odds: 0
        };

        // Count existing data
        try {
            const [predictionsSnapshot, balancesSnapshot, marketsSnapshot, metadataSnapshot, predMetadataSnapshot, oddsSnapshot] = await Promise.all([
                adminDatabase.ref('agent_predictions').once('value'),
                adminDatabase.ref('agent_balances').once('value'),
                adminDatabase.ref('polymarket_markets').once('value'),
                adminDatabase.ref('cache_metadata').once('value'),
                adminDatabase.ref('predictions_metadata').once('value'),
                adminDatabase.ref('market_odds').once('value')
            ]);

            statsBefore.agent_predictions = predictionsSnapshot.exists() ? Object.keys(predictionsSnapshot.val()).length : 0;
            statsBefore.agent_balances = balancesSnapshot.exists() ? Object.keys(balancesSnapshot.val()).length : 0;
            statsBefore.polymarket_markets = marketsSnapshot.exists() ? Object.keys(marketsSnapshot.val()).length : 0;
            statsBefore.cache_metadata = metadataSnapshot.exists() ? 1 : 0;
            statsBefore.predictions_metadata = predMetadataSnapshot.exists() ? 1 : 0;
            statsBefore.market_odds = oddsSnapshot.exists() ? Object.keys(oddsSnapshot.val()).length : 0;
        } catch (error) {
            console.warn('Could not get stats before clearing:', error);
        }

        // Clear ALL Firebase data
        const clearPromises = [
            adminDatabase.ref('agent_predictions').remove(),
            adminDatabase.ref('agent_balances').remove(),
            adminDatabase.ref('polymarket_markets').remove(),
            adminDatabase.ref('cache_metadata').remove(),
            adminDatabase.ref('predictions_metadata').remove(),
            adminDatabase.ref('market_odds').remove()
        ];

        await Promise.all(clearPromises);

        console.log('✅ [Firebase Admin] Firebase database completely cleared');

        const totalCleared = Object.values(statsBefore).reduce((sum, count) => sum + count, 0);

        return NextResponse.json({
            success: true,
            message: `Firebase database completely cleared`,
            stats: {
                beforeClear: statsBefore,
                totalCleared,
                clearedPaths: [
                    'agent_predictions',
                    'agent_balances',
                    'polymarket_markets',
                    'cache_metadata',
                    'predictions_metadata',
                    'market_odds'
                ]
            }
        });

    } catch (error: any) {
        console.error('❌ [Firebase Admin] Complete database clear error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}