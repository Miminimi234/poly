'use client';

import { useFirebaseMarkets } from '@/hooks/useFirebaseMarkets';
import { checkAdminStatus } from '@/lib/admin-auth';
import { useEffect, useState } from 'react';
import FirebaseAdminControls from './FirebaseAdminControls';

export default function FirebaseAdminPanel() {
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [showMarketEditor, setShowMarketEditor] = useState(false);
    const { markets, metadata, loading: marketsLoading, refreshFromServer, error: firebaseError } = useFirebaseMarkets();

    // Check admin status on component mount
    useEffect(() => {
        const verifyAdmin = async () => {
            try {
                const adminStatus = await checkAdminStatus();
                setIsAdmin(adminStatus);
            } catch (error) {
                console.error('[FirebaseAdminPanel] Failed to verify admin status:', error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        verifyAdmin();
    }, []);

    const handleMarketUpdate = (marketId: string, updates: any) => {
        // The real-time Firebase hook will automatically update the markets
        console.log(`Market ${marketId} updated:`, updates);
    };

    // Don't show anything if loading or not admin
    if (loading || !isAdmin) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Firebase Database Status */}
            <div className="border-1 border-gray p-4" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
                <div className="text-white font-bold mb-3 text-base flex items-center gap-2">
                    🔥 FIREBASE_DATABASE_STATUS
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="border-2 border-gray p-3">
                        <div className="font-bold text-xs text-white-600 mb-1">MARKETS IN DB:</div>
                        <div className="text-2xl font-bold">{marketsLoading ? '...' : markets.length}</div>
                    </div>

                    <div className="border-2 border-gray p-3">
                        <div className="font-bold text-xs text-white-600 mb-1">LAST UPDATE:</div>
                        <div className="text-xs font-bold">
                            {metadata?.lastUpdate ? new Date(metadata.lastUpdate).toLocaleString() : 'Never'}
                        </div>
                    </div>

                    <div className="border-2 border-gray p-3">
                        <div className="font-bold text-xs text-white-600 mb-1">DATA SOURCE:</div>
                        <div className="text-xs font-bold uppercase">
                            {metadata?.source || 'Unknown'}
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={refreshFromServer}
                        className="border-2 border-gray px-4 py-2 font-bold text-xs"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        🔄 REFRESH_FROM_POLYMARKET
                    </button>

                    <button
                        onClick={() => setShowMarketEditor(!showMarketEditor)}
                        className="border-2 border-gray px-4 py-2 font-bold text-xs"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        {showMarketEditor ? '📝 HIDE_EDITOR' : '📝 SHOW_MARKET_EDITOR'}
                    </button>
                </div>
            </div>

            {/* Market Editor */}
            {showMarketEditor && markets.length > 0 && (
                <FirebaseAdminControls
                    markets={markets}
                    onMarketUpdate={handleMarketUpdate}
                />
            )}

            {/* Real-time Connection Status */}
            <div className="border-2 border-gray p-3 text-xs">
                <div className="font-bold mb-1">🔗 REAL-TIME CONNECTION:</div>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${marketsLoading ? 'ring-2 ring-yellow-500' : 'ring-2 ring-green-500'}`}></div>
                    <span className="font-bold">
                        {marketsLoading ? 'CONNECTING...' : 'LIVE - Changes sync instantly across all clients'}
                    </span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="border-1 border-gray bg-transparent p-4" style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
                <div className="text-white font-bold mb-3 text-base">
                    ⚡ QUICK_DATABASE_ACTIONS
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        onClick={() => {
                            // Navigate to Firebase Console
                            window.open('https://console.firebase.google.com/project/poly-3b4c5/database/poly-3b4c5-default-rtdb/data', '_blank');
                        }}
                        className="border-2 border-gray px-4 py-2 font-bold text-xs"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        🌐 OPEN_FIREBASE_CONSOLE
                    </button>

                    <button
                        onClick={() => {
                            // Download Firebase data as JSON
                            const dataStr = JSON.stringify(markets, null, 2);
                            const dataBlob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `firebase-markets-${new Date().toISOString().split('T')[0]}.json`;
                            link.click();
                        }}
                        className="border-2 border-gray px-4 py-2 font-bold text-xs"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        💾 EXPORT_DATA_JSON
                    </button>
                </div>
            </div>
        </div>
    );
}