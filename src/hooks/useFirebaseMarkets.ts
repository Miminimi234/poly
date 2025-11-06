/**
 * React hook for real-time Firebase market data
 * Provides live updates when markets are modified in Firebase
 */

import { database } from '@/lib/firebase-config';
import { DataSnapshot, off, onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';

interface Market {
    polymarket_id: string;
    question: string;
    description: string;
    market_slug: string;
    yes_price: number;
    no_price: number;
    volume: number;
    volume_24hr: number;
    liquidity: number;
    category: string;
    polymarket_category?: string;
    end_date: string | null;
    start_date: string | null;
    image_url: string | null;
    active: boolean;
    resolved: boolean;
    archived: boolean;
    prediction_count?: number;
    // Firebase-specific fields
    created_at?: string;
    updated_at?: string;
    cached_at?: string;
    source?: string;
}

interface CacheMetadata {
    lastUpdate: string;
    totalMarkets: number;
    source: string;
    version: number;
}

/**
 * Custom hook for real-time Firebase market data
 */
export function useFirebaseMarkets() {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [metadata, setMetadata] = useState<CacheMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!database) {
            console.error('🔥 Firebase: Database not initialized');
            setError('Firebase not initialized');
            setLoading(false);
            return;
        }

        console.log('🔥 Firebase: Connecting to real-time market data...');

        const marketsRef = ref(database, 'markets');
        const metadataRef = ref(database, 'cache_metadata');

        // Listen for market data changes
        const handleMarketsData = (snapshot: DataSnapshot) => {
            try {
                const data = snapshot.val();

                if (data) {
                    const marketsList = Object.values(data) as Market[];

                    // Sort by volume descending
                    marketsList.sort((a, b) => (b.volume || 0) - (a.volume || 0));

                    setMarkets(marketsList);
                    setConnected(true);
                    setError(null);

                    console.log(`🔥 Firebase: Received ${marketsList.length} markets`);
                } else {
                    setMarkets([]);
                    console.log('🔥 Firebase: No markets data');
                }

                setLoading(false);
            } catch (err) {
                console.error('🔥 Firebase: Error processing markets data:', err);
                setError('Failed to process market data');
                setLoading(false);
            }
        };

        // Listen for metadata changes (with permission error handling)
        const handleMetadataData = (snapshot: DataSnapshot) => {
            try {
                const data = snapshot.val();
                if (data) {
                    setMetadata(data as CacheMetadata);
                    console.log('🔥 Firebase: Metadata updated:', data);
                }
            } catch (err) {
                console.error('🔥 Firebase: Error processing metadata:', err);
            }
        };

        // Handle metadata permission errors gracefully
        const handleMetadataError = (error: any) => {
            if (error.code === 'PERMISSION_DENIED') {
                console.warn('🔥 Firebase: Metadata access denied, continuing without metadata');
                // Don't set error state for metadata permission issues
                setMetadata(null);
            } else {
                console.error('🔥 Firebase: Metadata connection error:', error);
            }
        };

        // Handle general connection errors
        const handleError = (error: any) => {
            console.error('🔥 Firebase: Connection error:', error);
            setConnected(false);
            setError('Connection failed');
            setLoading(false);
        };

        // Set up listeners
        onValue(marketsRef, handleMarketsData, handleError);
        onValue(metadataRef, handleMetadataData, handleMetadataError);

        // Cleanup function
        return () => {
            console.log('🔥 Firebase: Disconnecting from real-time market data...');
            off(marketsRef);
            off(metadataRef);
        };
    }, []);

    // Manual refresh function (triggers server-side cache refresh)
    const refreshFromServer = async () => {
        try {
            console.log('🔄 Firebase: Requesting server refresh...');
            const response = await fetch('/api/admin/markets/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (result.success) {
                console.log(`✅ Firebase: Server refresh successful - ${result.count} markets`);
            } else {
                console.error('❌ Firebase: Server refresh failed:', result.error);
                setError(result.error || 'Server refresh failed');
            }
        } catch (err) {
            console.error('❌ Firebase: Manual refresh failed:', err);
            setError('Manual refresh failed');
        }
    };

    return {
        markets,
        metadata,
        loading,
        connected,
        error,
        lastUpdate: metadata?.lastUpdate || null,
        totalMarkets: markets.length,
        refreshFromServer
    };
}

/**
 * Hook for listening to a specific market
 */
export function useFirebaseMarket(marketId: string) {
    const [market, setMarket] = useState<Market | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!database || !marketId) {
            setLoading(false);
            return;
        }

        console.log(`🔥 Firebase: Listening to market ${marketId}...`);

        const marketRef = ref(database, `markets/${marketId}`);

        const handleMarketData = (snapshot: DataSnapshot) => {
            try {
                const data = snapshot.val();

                if (data) {
                    setMarket(data as Market);
                    console.log(`🔥 Firebase: Market ${marketId} updated`);
                } else {
                    setMarket(null);
                    console.log(`🔥 Firebase: Market ${marketId} not found`);
                }

                setLoading(false);
                setError(null);
            } catch (err) {
                console.error(`🔥 Firebase: Error processing market ${marketId}:`, err);
                setError('Failed to process market data');
                setLoading(false);
            }
        };

        const handleError = (error: any) => {
            console.error(`🔥 Firebase: Error listening to market ${marketId}:`, error);
            setError('Connection failed');
            setLoading(false);
        };

        onValue(marketRef, handleMarketData, handleError);

        return () => {
            console.log(`🔥 Firebase: Stopped listening to market ${marketId}`);
            off(marketRef);
        };
    }, [marketId]);

    return {
        market,
        loading,
        error
    };
}