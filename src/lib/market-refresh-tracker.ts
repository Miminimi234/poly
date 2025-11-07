/**
 * Market Refresh Tracker
 * Automatically refreshes market data from Polymarket API every 7 seconds
 * Uses intelligent upsert to only update changed markets in Firebase
 */

import firebaseMarketCache from './firebase-market-cache';
import { fetchPolymarketMarkets, parsePolymarketMarket } from './polymarket-client';

interface RefreshStats {
    totalMarkets: number;
    added: number;
    updated: number;
    skipped: number;
    lastRefresh: string;
    errors: number;
}

class MarketRefreshTracker {
    private readonly REFRESH_INTERVAL = 7000; // 7 seconds
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning = false;
    private stats: RefreshStats = {
        totalMarkets: 0,
        added: 0,
        updated: 0,
        skipped: 0,
        lastRefresh: '',
        errors: 0
    };

    /**
     * Start automatic market refresh tracking
     */
    startTracking(): void {
        if (this.intervalId) {
            console.log('⚠️ Market refresh tracker already running');
            return;
        }

        console.log('🚀 Starting market refresh tracker (every 7 seconds)...');
        this.isRunning = true;

        // Run immediately, then every 7 seconds
        this.refreshMarkets();
        this.intervalId = setInterval(() => {
            this.refreshMarkets();
        }, this.REFRESH_INTERVAL);

        console.log('✅ Market refresh tracker started');
    }

    /**
     * Stop automatic market refresh tracking
     */
    stopTracking(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            console.log('🛑 Market refresh tracker stopped');
        }
    }

    /**
     * Check if tracking is active
     */
    isTrackingActive(): boolean {
        return this.isRunning;
    }

    /**
     * Get current tracking status and stats
     */
    getStatus(): {
        isRunning: boolean;
        refreshInterval: number;
        nextRefresh?: Date;
        stats: RefreshStats;
    } {
        return {
            isRunning: this.isRunning,
            refreshInterval: this.REFRESH_INTERVAL,
            nextRefresh: this.isRunning ? new Date(Date.now() + this.REFRESH_INTERVAL) : undefined,
            stats: { ...this.stats }
        };
    }

    /**
     * Force an immediate refresh (for testing/manual triggers)
     */
    async forceRefresh(): Promise<RefreshStats> {
        console.log('🔄 Manual market refresh triggered...');
        return await this.refreshMarkets();
    }

    /**
     * Main refresh method - fetches and updates market data
     */
    private async refreshMarkets(): Promise<RefreshStats> {
        try {
            console.log('🔄 [Market Refresh] Fetching latest market data...');

            // Fetch ALL available markets from Polymarket (no limit)
            const rawMarkets = await fetchPolymarketMarkets(0);

            if (!rawMarkets || rawMarkets.length === 0) {
                console.warn('⚠️ [Market Refresh] No markets found from Polymarket API');
                this.stats.errors++;
                return this.stats;
            }

            console.log(`📊 [Market Refresh] Processing ${rawMarkets.length} markets...`);

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

            console.log(`🔧 [Market Refresh] Successfully parsed ${parsedMarkets.length} markets`);

            // Use intelligent upsert to update Firebase
            const upsertResult = await firebaseMarketCache.upsertMarkets(parsedMarkets, 'market_refresh_tracker');

            // Update our stats
            this.stats = {
                totalMarkets: parsedMarkets.length,
                added: upsertResult.added,
                updated: upsertResult.updated,
                skipped: upsertResult.skipped,
                lastRefresh: new Date().toISOString(),
                errors: this.stats.errors // Keep accumulated errors
            };

            const summary = `Added: ${upsertResult.added}, Updated: ${upsertResult.updated}, Skipped: ${upsertResult.skipped}`;
            console.log(`✅ [Market Refresh] Complete - ${summary}`);

            return this.stats;

        } catch (error) {
            console.error('❌ [Market Refresh] Failed:', error);
            this.stats.errors++;
            throw error;
        }
    }

    /**
     * Reset stats (useful for admin dashboard)
     */
    resetStats(): void {
        this.stats = {
            totalMarkets: 0,
            added: 0,
            updated: 0,
            skipped: 0,
            lastRefresh: '',
            errors: 0
        };
        console.log('📊 Market refresh stats reset');
    }
}

// Global market refresh tracker instance
const marketRefreshTracker = new MarketRefreshTracker();

export { marketRefreshTracker, type RefreshStats };
export default marketRefreshTracker;