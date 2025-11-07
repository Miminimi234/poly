/**
 * Firebase-based market cache
 * Stores markets in Firebase Realtime Database with real-time sync capabilities
 */

import type { Reference } from 'firebase-admin/database';
import { adminDatabase } from './firebase-admin';
import { firebaseAgentPredictions } from './firebase-agent-predictions';

interface CachedMarket {
    polymarket_id: string;
    question: string;
    description: string;
    market_slug: string;
    yes_price: number;
    no_price: number;
    volume: number;
    volume_24hr: number;
    liquidity: number;
    end_date: string | null;
    start_date: string | null;
    category: string;
    image_url: string | null;
    active: boolean;
    resolved: boolean;
    archived: boolean;
    analyzed?: boolean; // Track if market has been analyzed by agents
    // Additional Firebase-specific fields
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

class FirebaseMarketCache {
    private marketsRef: Reference;
    private metadataRef: Reference;

    constructor() {
        this.marketsRef = adminDatabase.ref('markets');
        this.metadataRef = adminDatabase.ref('cache_metadata');
    }

    /**
     * Store markets in Firebase with batch operations (REPLACES ALL)
     */
    async setMarkets(markets: CachedMarket[], source: string = 'polymarket_api'): Promise<void> {
        try {
            const timestamp = new Date().toISOString();

            // Prepare market data with timestamps
            const marketData: { [key: string]: CachedMarket } = {};

            markets.forEach(market => {
                marketData[market.polymarket_id] = {
                    ...market,
                    analyzed: market.analyzed ?? false, // Default to false if not provided
                    cached_at: timestamp,
                    updated_at: timestamp,
                    source,
                    created_at: market.created_at || timestamp
                };
            });

            // Prepare metadata
            const metadata: CacheMetadata = {
                lastUpdate: timestamp,
                totalMarkets: markets.length,
                source,
                version: Date.now()
            };

            // Batch update: markets and metadata
            const updates: { [key: string]: any } = {
                'markets': marketData,
                'cache_metadata': metadata
            };

            await adminDatabase.ref().update(updates);

            console.log(`✅ Firebase: Cached ${markets.length} markets from ${source}`);

        } catch (error) {
            console.error('❌ Firebase: Failed to cache markets:', error);
            throw error;
        }
    }

    /**
     * Intelligently upsert markets - add new ones, update existing ones
     */
    async upsertMarkets(newMarkets: CachedMarket[], source: string = 'polymarket_api'): Promise<{
        added: number;
        updated: number;
        skipped: number;
        total: number;
    }> {
        try {
            const timestamp = new Date().toISOString();
            console.log(`🔄 Firebase: Starting intelligent upsert of ${newMarkets.length} markets...`);

            // Get existing markets from Firebase
            const existingMarkets = await this.getMarkets();
            const existingMap = new Map<string, CachedMarket>();

            existingMarkets.forEach(market => {
                existingMap.set(market.polymarket_id, market);
            });

            let addedCount = 0;
            let updatedCount = 0;
            let skippedCount = 0;

            const updates: { [key: string]: any } = {};
            const newlyResolvedMarkets: CachedMarket[] = []; // Track markets that just became resolved

            // Process each new market
            for (const newMarket of newMarkets) {
                const marketId = newMarket.polymarket_id;
                const existingMarket = existingMap.get(marketId);

                if (!existingMarket) {
                    // New market - add it
                    updates[`markets/${marketId}`] = {
                        ...newMarket,
                        analyzed: false, // New markets are not analyzed yet
                        cached_at: timestamp,
                        updated_at: timestamp,
                        created_at: timestamp,
                        source
                    };
                    addedCount++;
                    console.log(`➕ Adding new market: ${marketId} - ${newMarket.question.slice(0, 50)}...`);

                } else {
                    // Existing market - check if we need to update
                    const needsUpdate = this.shouldUpdateMarket(existingMarket, newMarket);

                    if (needsUpdate) {
                        // Update market but preserve important existing fields
                        updates[`markets/${marketId}`] = {
                            ...newMarket,
                            // Preserve these fields from existing market
                            analyzed: existingMarket.analyzed,
                            created_at: existingMarket.created_at,
                            cached_at: existingMarket.cached_at,
                            // Update these fields
                            updated_at: timestamp,
                            source
                        };
                        updatedCount++;
                        console.log(`🔄 Updating market: ${marketId} - ${this.getUpdateReason(existingMarket, newMarket)}`);

                        // Check if market just became resolved and track it for prediction resolution
                        if (!existingMarket.resolved && newMarket.resolved) {
                            console.log(`🎯 Market ${marketId} newly resolved - will resolve predictions after database update`);
                            newlyResolvedMarkets.push(newMarket);
                        }
                    } else {
                        skippedCount++;
                        console.log(`⏭️ Skipping market: ${marketId} - no significant changes`);
                    }
                }
            }

            // Apply batch updates if there are any changes
            if (Object.keys(updates).length > 0) {
                // Update metadata
                const currentMetadata = await this.getMetadata();
                const totalMarkets = existingMarkets.length + addedCount;

                updates['cache_metadata'] = {
                    lastUpdate: timestamp,
                    totalMarkets,
                    source,
                    version: Date.now()
                };

                await adminDatabase.ref().update(updates);
            }

            const result = {
                added: addedCount,
                updated: updatedCount,
                skipped: skippedCount,
                total: newMarkets.length
            };

            console.log(`✅ Firebase: Upsert complete - Added: ${addedCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}`);

            // Handle newly resolved markets - resolve their predictions
            if (newlyResolvedMarkets.length > 0) {
                console.log(`🎯 Processing ${newlyResolvedMarkets.length} newly resolved markets...`);

                // Resolve predictions for each newly resolved market (in parallel)
                await Promise.allSettled(
                    newlyResolvedMarkets.map(market =>
                        this.resolveMarketPredictions(market.polymarket_id, market)
                    )
                );
            }

            return result;

        } catch (error) {
            console.error('❌ Firebase: Failed to upsert markets:', error);
            throw error;
        }
    }

    /**
     * Determine if a market needs updating based on key fields
     */
    private shouldUpdateMarket(existing: CachedMarket, fresh: CachedMarket): boolean {
        // Check for significant changes that warrant an update
        const significantChanges = [
            // Price changes (threshold: 0.001 = 0.1%)
            Math.abs(existing.yes_price - fresh.yes_price) > 0.001,
            Math.abs(existing.no_price - fresh.no_price) > 0.001,

            // Volume changes (threshold: 1% or $100 minimum)
            Math.abs(existing.volume - fresh.volume) > Math.max(existing.volume * 0.01, 100),
            Math.abs(existing.volume_24hr - fresh.volume_24hr) > Math.max(existing.volume_24hr * 0.01, 50),

            // Status changes
            existing.active !== fresh.active,
            existing.resolved !== fresh.resolved,
            existing.archived !== fresh.archived,

            // Content changes
            existing.question !== fresh.question,
            existing.description !== fresh.description,
            existing.end_date !== fresh.end_date,

            // Liquidity changes (threshold: 5% or $50 minimum)
            Math.abs(existing.liquidity - fresh.liquidity) > Math.max(existing.liquidity * 0.05, 50)
        ];

        return significantChanges.some(changed => changed);
    }

    /**
     * Get a human-readable reason for the update
     */
    private getUpdateReason(existing: CachedMarket, fresh: CachedMarket): string {
        const reasons: string[] = [];

        if (Math.abs(existing.yes_price - fresh.yes_price) > 0.001) {
            reasons.push(`YES: ${existing.yes_price.toFixed(3)} → ${fresh.yes_price.toFixed(3)}`);
        }
        if (Math.abs(existing.no_price - fresh.no_price) > 0.001) {
            reasons.push(`NO: ${existing.no_price.toFixed(3)} → ${fresh.no_price.toFixed(3)}`);
        }
        if (Math.abs(existing.volume - fresh.volume) > Math.max(existing.volume * 0.01, 100)) {
            reasons.push(`Volume: $${existing.volume.toLocaleString()} → $${fresh.volume.toLocaleString()}`);
        }
        if (existing.active !== fresh.active) {
            reasons.push(`Status: ${existing.active ? 'Active' : 'Inactive'} → ${fresh.active ? 'Active' : 'Inactive'}`);
        }
        if (existing.resolved !== fresh.resolved) {
            reasons.push(`Resolved: ${existing.resolved} → ${fresh.resolved}`);
        }

        return reasons.length > 0 ? reasons.join(', ') : 'General updates';
    }

    /**
     * Get all markets from Firebase
     */
    async getMarkets(): Promise<CachedMarket[]> {
        try {
            const snapshot = await this.marketsRef.once('value');
            const data = snapshot.val();

            if (!data) {
                console.log('📭 Firebase: No markets in cache');
                return [];
            }

            const markets = Object.values(data) as CachedMarket[];
            console.log(`✅ Firebase: Retrieved ${markets.length} markets from cache`);

            return markets;

        } catch (error) {
            console.error('❌ Firebase: Failed to retrieve markets:', error);
            return [];
        }
    }

    /**
     * Get a specific market by ID
     */
    async getMarket(marketId: string): Promise<CachedMarket | null> {
        try {
            const snapshot = await this.marketsRef.child(marketId).once('value');
            const market = snapshot.val();

            if (market) {
                console.log(`✅ Firebase: Retrieved market ${marketId}`);
                return market as CachedMarket;
            } else {
                console.log(`📭 Firebase: Market ${marketId} not found`);
                return null;
            }

        } catch (error) {
            console.error(`❌ Firebase: Failed to retrieve market ${marketId}:`, error);
            return null;
        }
    }

    /**
     * Update a specific market (allows real-time modifications)
     */
    async updateMarket(marketId: string, updates: Partial<CachedMarket>): Promise<void> {
        try {
            const timestamp = new Date().toISOString();
            const updateData = {
                ...updates,
                updated_at: timestamp
            };

            await this.marketsRef.child(marketId).update(updateData);
            console.log(`✅ Firebase: Updated market ${marketId}`);

        } catch (error) {
            console.error(`❌ Firebase: Failed to update market ${marketId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a specific market
     */
    async deleteMarket(marketId: string): Promise<void> {
        try {
            await this.marketsRef.child(marketId).remove();
            console.log(`✅ Firebase: Deleted market ${marketId}`);

        } catch (error) {
            console.error(`❌ Firebase: Failed to delete market ${marketId}:`, error);
            throw error;
        }
    }

    /**
     * Get cache metadata
     */
    async getMetadata(): Promise<CacheMetadata | null> {
        try {
            const snapshot = await this.metadataRef.once('value');
            const metadata = snapshot.val();

            if (metadata) {
                return metadata as CacheMetadata;
            } else {
                return null;
            }

        } catch (error) {
            console.error('❌ Firebase: Failed to retrieve metadata:', error);
            return null;
        }
    }

    /**
     * Clear all markets from cache
     */
    async clearCache(): Promise<void> {
        try {
            await this.marketsRef.remove();
            await this.metadataRef.remove();
            console.log('🗑️ Firebase: Cleared entire cache');

        } catch (error) {
            console.error('❌ Firebase: Failed to clear cache:', error);
            throw error;
        }
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{ totalMarkets: number; lastUpdate: string | null; source: string | null }> {
        try {
            const metadata = await this.getMetadata();
            const markets = await this.getMarkets();

            return {
                totalMarkets: markets.length,
                lastUpdate: metadata?.lastUpdate || null,
                source: metadata?.source || null
            };

        } catch (error) {
            console.error('❌ Firebase: Failed to get stats:', error);
            return {
                totalMarkets: 0,
                lastUpdate: null,
                source: null
            };
        }
    }

    /**
     * Search markets by text query
     */
    async searchMarkets(query: string): Promise<CachedMarket[]> {
        try {
            const markets = await this.getMarkets();
            const lowerQuery = query.toLowerCase();

            return markets.filter(market =>
                market.question.toLowerCase().includes(lowerQuery) ||
                market.description.toLowerCase().includes(lowerQuery) ||
                market.category.toLowerCase().includes(lowerQuery)
            );

        } catch (error) {
            console.error('❌ Firebase: Search failed:', error);
            return [];
        }
    }

    /**
     * Get markets by category
     */
    async getMarketsByCategory(category: string): Promise<CachedMarket[]> {
        try {
            const markets = await this.getMarkets();
            return markets.filter(market =>
                market.category.toLowerCase() === category.toLowerCase()
            );

        } catch (error) {
            console.error('❌ Firebase: Failed to get markets by category:', error);
            return [];
        }
    }

    /**
     * Get active markets for agent selection (removed analyzed filter - agents handle duplicates individually)
     */
    async getUnanalyzedMarkets(limit: number = 50): Promise<CachedMarket[]> {
        try {
            const markets = await this.getMarkets();
            return markets
                .filter(market =>
                    market.active &&
                    !market.resolved &&
                    !market.archived
                )
                .sort((a, b) => b.volume - a.volume) // Sort by volume descending
                .slice(0, limit);

        } catch (error) {
            console.error('❌ Firebase: Failed to get unanalyzed markets:', error);
            return [];
        }
    }

    /**
     * Mark a market as analyzed
     */
    async markMarketAsAnalyzed(marketId: string): Promise<void> {
        try {
            await this.marketsRef.child(marketId).update({
                analyzed: true,
                updated_at: new Date().toISOString()
            });
            console.log(`✅ Firebase: Marked market ${marketId} as analyzed`);

        } catch (error) {
            console.error(`❌ Firebase: Failed to mark market ${marketId} as analyzed:`, error);
            throw error;
        }
    }

    /**
     * Reset analyzed status for all markets (admin function)
     */
    async resetAnalyzedStatus(): Promise<void> {
        try {
            const markets = await this.getMarkets();
            const updates: { [key: string]: any } = {};

            markets.forEach(market => {
                updates[`${market.polymarket_id}/analyzed`] = false;
                updates[`${market.polymarket_id}/updated_at`] = new Date().toISOString();
            });

            await this.marketsRef.update(updates);
            console.log(`✅ Firebase: Reset analyzed status for ${markets.length} markets`);

        } catch (error) {
            console.error('❌ Firebase: Failed to reset analyzed status:', error);
            throw error;
        }
    }

    /**
     * Resolve market predictions when market becomes resolved
     */
    private async resolveMarketPredictions(marketId: string, resolvedMarket: CachedMarket): Promise<void> {
        try {
            if (!resolvedMarket.resolved) {
                return; // Market is not resolved, nothing to do
            }

            console.log(`🎯 Market ${marketId} is resolved, resolving predictions and closing positions...`);

            // Get unresolved predictions for this market
            const unresolvedPredictions = await firebaseAgentPredictions.getUnresolvedPredictions(marketId);

            // Get open positions for this market
            const openPositions = await firebaseAgentPredictions.getOpenPositions(marketId);

            if (unresolvedPredictions.length === 0 && openPositions.length === 0) {
                console.log(`📭 No unresolved predictions or open positions found for market ${marketId}`);
                return;
            }

            // Determine the outcome from market data
            const outcome = this.determineMarketOutcome(resolvedMarket);

            if (!outcome) {
                console.warn(`⚠️ Could not determine outcome for resolved market ${marketId}`);
                return;
            }

            console.log(`🏆 Market ${marketId} outcome: ${outcome} (based on prices: YES=${resolvedMarket.yes_price}, NO=${resolvedMarket.no_price})`);

            // Resolve each prediction
            let resolvedCount = 0;
            for (const prediction of unresolvedPredictions) {
                try {
                    await firebaseAgentPredictions.resolvePrediction(
                        prediction.id,
                        outcome,
                        outcome === 'YES' ? resolvedMarket.yes_price : resolvedMarket.no_price
                    );
                    resolvedCount++;
                } catch (error) {
                    console.error(`❌ Failed to resolve prediction ${prediction.id}:`, error);
                }
            }

            console.log(`✅ Resolved ${resolvedCount}/${unresolvedPredictions.length} predictions for market ${marketId}`);

            // Close all open positions for this market
            let closedPositions = 0;
            for (const position of openPositions) {
                try {
                    await firebaseAgentPredictions.closePosition(position.id, 'MARKET_RESOLVED');
                    closedPositions++;
                } catch (error) {
                    console.error(`❌ Failed to close position ${position.id}:`, error);
                }
            }

            if (closedPositions > 0) {
                console.log(`💼 Closed ${closedPositions}/${openPositions.length} open positions for resolved market ${marketId}`);
            }

        } catch (error) {
            console.error(`❌ Firebase: Failed to resolve predictions for market ${marketId}:`, error);
        }
    }

    /**
     * Determine market outcome from resolved market data
     */
    private determineMarketOutcome(market: CachedMarket): 'YES' | 'NO' | null {
        if (!market.resolved) {
            return null;
        }

        // For resolved markets, the winning outcome should have a price close to 1.0
        // and the losing outcome should have a price close to 0.0
        const yesPrice = market.yes_price;
        const noPrice = market.no_price;

        // Clear winner: YES price > 0.9 and NO price < 0.1
        if (yesPrice > 0.9 && noPrice < 0.1) {
            return 'YES';
        }

        // Clear winner: NO price > 0.9 and YES price < 0.1
        if (noPrice > 0.9 && yesPrice < 0.1) {
            return 'NO';
        }

        // Use majority rule if prices are closer
        if (yesPrice > noPrice) {
            return 'YES';
        } else if (noPrice > yesPrice) {
            return 'NO';
        }

        // Fallback: can't determine outcome
        console.warn(`⚠️ Ambiguous outcome for market ${market.polymarket_id}: YES=${yesPrice}, NO=${noPrice}`);
        return null;
    }

    /**
     * Manually resolve all predictions for a specific market (Admin function)
     */
    async manuallyResolveMarket(marketId: string, outcome: 'YES' | 'NO'): Promise<void> {
        try {
            console.log(`🔧 Admin: Manually resolving market ${marketId} with outcome: ${outcome}`);

            // Get the market data
            const market = await this.getMarket(marketId);
            if (!market) {
                throw new Error(`Market ${marketId} not found`);
            }

            // Get unresolved predictions
            const unresolvedPredictions = await firebaseAgentPredictions.getUnresolvedPredictions(marketId);

            if (unresolvedPredictions.length === 0) {
                console.log(`📭 No unresolved predictions found for market ${marketId}`);
                return;
            }

            // Resolve each prediction with the specified outcome
            let resolvedCount = 0;
            for (const prediction of unresolvedPredictions) {
                try {
                    await firebaseAgentPredictions.resolvePrediction(
                        prediction.id,
                        outcome,
                        outcome === 'YES' ? market.yes_price : market.no_price
                    );
                    resolvedCount++;
                } catch (error) {
                    console.error(`❌ Failed to resolve prediction ${prediction.id}:`, error);
                }
            }

            console.log(`✅ Admin: Manually resolved ${resolvedCount}/${unresolvedPredictions.length} predictions for market ${marketId}`);

        } catch (error) {
            console.error(`❌ Firebase: Failed to manually resolve market ${marketId}:`, error);
            throw error;
        }
    }
}

// Global Firebase cache instance
const firebaseMarketCache = new FirebaseMarketCache();

export { firebaseMarketCache, type CachedMarket, type CacheMetadata };
export default firebaseMarketCache;