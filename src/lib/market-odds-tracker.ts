/**
 * Market Odds Tracking System
 * Fetches and stores current Polymarket odds for real-time P&L calculations
 */

import { adminDatabase } from './firebase-admin';
import { storeMarketOdds, type MarketOdds } from './firebase-agent-balances';

interface PolymarketApiResponse {
    tokens: Array<{
        outcome: string;
        price: string;
        token_id: string;
    }>;
    market: {
        condition_id: string;
        question: string;
        description: string;
        end_date_iso: string;
        market_slug: string;
        volume: string;
        volume_24hr: string;
    };
}

class MarketOddsTracker {
    private readonly POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';
    private readonly UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes
    private intervalId: NodeJS.Timeout | null = null;

    /**
     * Start automatic odds tracking
     */
    startTracking(): void {
        if (this.intervalId) {
            console.log('📊 Market odds tracking already running');
            return;
        }

        console.log('📊 Starting market odds tracking (15min intervals)');

        // Run immediately
        this.updateAllMarketOdds();

        // Then run every 15 minutes
        this.intervalId = setInterval(() => {
            this.updateAllMarketOdds();
        }, this.UPDATE_INTERVAL);
    }

    /**
     * Stop automatic odds tracking
     */
    stopTracking(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('📊 Market odds tracking stopped');
        }
    }

    /**
     * Update odds for all active markets
     */
    async updateAllMarketOdds(): Promise<void> {
        try {
            console.log('🔄 Updating market odds...');

            // Get all unique market IDs from active predictions
            const marketIds = await this.getActiveMarketIds();

            if (marketIds.length === 0) {
                console.log('📊 No active markets to update');
                return;
            }

            console.log(`📊 Updating odds for ${marketIds.length} markets`);

            let successCount = 0;
            let errorCount = 0;

            // Update odds for each market
            for (const marketId of marketIds) {
                try {
                    await this.updateMarketOdds(marketId);
                    successCount++;

                    // Add small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 200));

                } catch (error) {
                    console.error(`❌ Failed to update odds for market ${marketId}:`, error);
                    errorCount++;
                }
            }

            console.log(`✅ Market odds update complete: ${successCount} success, ${errorCount} errors`);

        } catch (error) {
            console.error('❌ Failed to update market odds:', error);
        }
    }

    /**
     * Update odds for a specific market
     */
    async updateMarketOdds(marketId: string): Promise<void> {
        try {
            const odds = await this.fetchMarketOddsFromPolymarket(marketId);

            if (odds) {
                await storeMarketOdds(marketId, odds);
                console.log(`📊 Updated odds for ${marketId}: YES=$${odds.yes_price.toFixed(3)} NO=$${odds.no_price.toFixed(3)}`);
            }

        } catch (error) {
            console.error(`❌ Failed to update odds for market ${marketId}:`, error);
            throw error;
        }
    }

    /**
     * Fetch current market odds from Polymarket API
     */
    private async fetchMarketOddsFromPolymarket(marketId: string): Promise<MarketOdds | null> {
        try {
            // Use the market endpoint to get current prices
            const response = await fetch(`${this.POLYMARKET_API_BASE}/markets/${marketId}`, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Polysentience-agent-tracker/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Log the response structure for debugging
            console.log(`📊 Market ${marketId} API response structure:`, {
                hasTokens: !!data.tokens,
                tokensType: typeof data.tokens,
                tokensIsArray: Array.isArray(data.tokens),
                keys: Object.keys(data || {})
            });

            // Extract YES and NO prices from the response
            let yesPrice = 0.5; // Default fallback
            let noPrice = 0.5;

            // Check for outcomePrices first (current Polymarket API format)
            if (data.outcomePrices) {
                console.log(`📊 Market ${marketId}: Found outcomePrices:`, data.outcomePrices);

                try {
                    // outcomePrices comes as a JSON string, need to parse it
                    const pricesArray = typeof data.outcomePrices === 'string'
                        ? JSON.parse(data.outcomePrices)
                        : data.outcomePrices;

                    if (Array.isArray(pricesArray) && pricesArray.length >= 2) {
                        // outcomePrices is typically ["0.45", "0.55"] where first is Yes, second is No
                        yesPrice = parseFloat(pricesArray[0]);
                        noPrice = parseFloat(pricesArray[1]);
                        console.log(`📊 Market ${marketId}: Extracted prices - Yes: ${yesPrice}, No: ${noPrice}`);
                    }
                } catch (parseError) {
                    console.error(`❌ Market ${marketId}: Failed to parse outcomePrices:`, parseError);
                }
            }
            // Fallback: Check if tokens exist (legacy format)
            else if (data.tokens && Array.isArray(data.tokens)) {
                console.log(`📊 Market ${marketId}: Using legacy tokens format`);
                for (const token of data.tokens) {
                    const price = parseFloat(token.price);

                    if (token.outcome.toLowerCase() === 'yes') {
                        yesPrice = price;
                    } else if (token.outcome.toLowerCase() === 'no') {
                        noPrice = price;
                    }
                }
            }
            // Fallback: Check for direct price fields
            else if (data.yes_price !== undefined || data.no_price !== undefined) {
                console.log(`📊 Market ${marketId}: Using direct price fields`);
                if (data.yes_price !== undefined) {
                    yesPrice = parseFloat(data.yes_price);
                }
                if (data.no_price !== undefined) {
                    noPrice = parseFloat(data.no_price);
                }
            }
            else {
                console.log(`⚠️ Market ${marketId}: No price data found in response, using fallback 0.5/0.5`);
                console.log(`Available fields:`, Object.keys(data || {}));
            }

            // Ensure prices add up to ~1.0 (accounting for fees)
            const totalPrice = yesPrice + noPrice;
            if (totalPrice > 0) {
                yesPrice = yesPrice / totalPrice;
                noPrice = noPrice / totalPrice;
            }

            const marketOdds: MarketOdds = {
                market_id: marketId,
                question: data.market?.question || `Market ${marketId}`,
                yes_price: yesPrice,
                no_price: noPrice,
                volume_24h: parseFloat(data.market?.volume_24hr || data.volume_24hr || '0'),
                last_updated: new Date().toISOString()
            };

            return marketOdds;

        } catch (error) {
            console.error(`❌ Failed to fetch odds from Polymarket for ${marketId}:`, error);

            // Return a fallback odds object to keep the system functioning
            const fallbackOdds: MarketOdds = {
                market_id: marketId,
                question: `Market ${marketId}`,
                yes_price: 0.5,
                no_price: 0.5,
                volume_24h: 0,
                last_updated: new Date().toISOString()
            };

            console.log(`🔄 Using fallback odds for market ${marketId}`);
            return fallbackOdds;
        }
    }

    /**
     * Get all unique market IDs from agent predictions
     */
    private async getActiveMarketIds(): Promise<string[]> {
        try {
            console.log('🔍 Fetching market IDs from agent predictions...');
            const predictionsRef = adminDatabase.ref('agent_predictions');

            // Get all predictions (not just unresolved ones) to track odds for any market with predictions
            const snapshot = await predictionsRef.once('value');

            if (!snapshot.exists()) {
                console.log('⚠️  No agent predictions found in Firebase');
                return [];
            }

            const marketIds = new Set<string>();

            snapshot.forEach((child) => {
                const prediction = child.val();
                if (prediction && prediction.market_id) {
                    marketIds.add(prediction.market_id);
                }
            });

            const marketIdArray = Array.from(marketIds);
            console.log(`📊 Found ${marketIdArray.length} unique markets with predictions:`, marketIdArray);

            return marketIdArray;

        } catch (error) {
            console.error('❌ Failed to get market IDs from agent predictions:', error);
            return [];
        }
    }

    /**
     * Get historical odds for a market
     */
    async getMarketOddsHistory(marketId: string, hours: number = 24): Promise<MarketOdds[]> {
        try {
            const cutoffTime = new Date();
            cutoffTime.setHours(cutoffTime.getHours() - hours);

            const snapshot = await adminDatabase.ref(`market_odds_history/${marketId}`)
                .orderByChild('last_updated')
                .startAt(cutoffTime.toISOString())
                .once('value');

            if (!snapshot.exists()) {
                return [];
            }

            const history: MarketOdds[] = [];
            snapshot.forEach((child) => {
                history.push(child.val());
            });

            return history.sort((a, b) =>
                new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime()
            );

        } catch (error) {
            console.error(`❌ Failed to get odds history for market ${marketId}:`, error);
            return [];
        }
    }

    /**
     * Store odds in history for charting
     */
    async storeOddsHistory(marketId: string, odds: MarketOdds): Promise<void> {
        try {
            const timestamp = Date.now();
            await adminDatabase.ref(`market_odds_history/${marketId}/${timestamp}`).set(odds);

            // Clean up old history (keep last 7 days)
            const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
            await adminDatabase.ref(`market_odds_history/${marketId}`)
                .orderByKey()
                .endAt(cutoffTime.toString())
                .once('value', (snapshot) => {
                    if (snapshot.exists()) {
                        snapshot.ref.remove();
                    }
                });

        } catch (error) {
            console.error(`❌ Failed to store odds history for market ${marketId}:`, error);
        }
    }

    /**
     * Calculate price impact for potential trades
     */
    async calculatePriceImpact(marketId: string, side: 'YES' | 'NO', amount: number): Promise<{
        currentPrice: number;
        impactedPrice: number;
        priceImpact: number;
        slippage: number;
    } | null> {
        try {
            // This would require more complex Polymarket API calls
            // For now, return a simplified calculation
            const currentOdds = await this.getCurrentMarketOdds(marketId);

            if (!currentOdds) {
                return null;
            }

            const currentPrice = side === 'YES' ? currentOdds.yes_price : currentOdds.no_price;

            // Simplified price impact calculation (would need order book data for accuracy)
            const baseImpact = Math.min(amount / 1000, 0.05); // Max 5% impact
            const impactedPrice = side === 'YES'
                ? currentPrice + baseImpact
                : currentPrice - baseImpact;

            const priceImpact = Math.abs(impactedPrice - currentPrice);
            const slippage = (priceImpact / currentPrice) * 100;

            return {
                currentPrice,
                impactedPrice: Math.max(0.01, Math.min(0.99, impactedPrice)),
                priceImpact,
                slippage
            };

        } catch (error) {
            console.error(`❌ Failed to calculate price impact for ${marketId}:`, error);
            return null;
        }
    }

    /**
     * Get current market odds from cache
     */
    private async getCurrentMarketOdds(marketId: string): Promise<MarketOdds | null> {
        try {
            const snapshot = await adminDatabase.ref(`market_odds/${marketId}`).once('value');
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error(`❌ Failed to get current odds for ${marketId}:`, error);
            return null;
        }
    }

    /**
     * Manual trigger to update specific market
     */
    async forceUpdateMarket(marketId: string): Promise<boolean> {
        try {
            await this.updateMarketOdds(marketId);
            return true;
        } catch (error) {
            console.error(`❌ Failed to force update market ${marketId}:`, error);
            return false;
        }
    }

    /**
     * Get tracking status
     */
    getTrackingStatus(): {
        isRunning: boolean;
        updateInterval: number;
        nextUpdate?: Date;
    } {
        return {
            isRunning: this.intervalId !== null,
            updateInterval: this.UPDATE_INTERVAL,
            nextUpdate: this.intervalId ? new Date(Date.now() + this.UPDATE_INTERVAL) : undefined
        };
    }
}

// Global market odds tracker instance
const marketOddsTracker = new MarketOddsTracker();

export { marketOddsTracker, type MarketOdds };
export default marketOddsTracker;