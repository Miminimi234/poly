/**
 * Integrated Market Odds Tracker
 * Continuously updates current_market_odds field in agent predictions
 * Also updates agent balances with unrealized P&L from market movements
 * Runs every 5 seconds to keep predictions up-to-date with live market data
 */

import { adminDatabase } from './firebase-admin';
import { getAgentBalance } from './firebase-agent-balances';

interface MarketOdds {
    yes_price: number;
    no_price: number;
    timestamp: string;
}

interface AgentPrediction {
    id: string;
    market_id: string;
    agent_id: string;
    agent_name: string;
    market_question: string;
    prediction: 'YES' | 'NO';
    bet_amount: number;
    entry_odds: {
        yes_price: number;
        no_price: number;
    };
    current_market_odds?: MarketOdds;
    unrealized_pnl?: number;
    position_status: string;
    resolved: boolean;
    created_at: string;
    updated_at: string;
}

class IntegratedMarketOddsTracker {
    private readonly POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';
    private readonly UPDATE_INTERVAL = 5000; // 5 seconds
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning = false;

    /**
     * Start the integrated odds tracking
     */
    startTracking(): void {
        if (this.intervalId) {
            console.log('⚠️ Integrated tracker already running');
            return;
        }

        console.log('🚀 Starting integrated market odds tracker (every 5 seconds)...');
        this.isRunning = true;

        // Run immediately, then every 5 seconds
        this.updateAllPredictionOdds();
        this.intervalId = setInterval(() => {
            this.updateAllPredictionOdds();
        }, this.UPDATE_INTERVAL);

        console.log('✅ Integrated market odds tracker started');
    }

    /**
     * Stop the integrated odds tracking
     */
    stopTracking(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isRunning = false;
            console.log('🛑 Integrated market odds tracker stopped');
        }
    }

    /**
     * Get tracking status
     */
    isTrackingActive(): boolean {
        return this.isRunning;
    }

    /**
     * Main update method - fetches all predictions and updates their current odds
     */
    private async updateAllPredictionOdds(): Promise<void> {
        try {
            const startTime = Date.now();
            console.log('🔄 [Integrated Tracker] Updating prediction odds...');

            // Step 1: Get all agent predictions
            const predictions = await this.getAllAgentPredictions();

            if (predictions.length === 0) {
                console.log('📊 No agent predictions found');
                return;
            }

            // Step 2: Group predictions by market_id for efficient API calls
            const marketGroups = this.groupPredictionsByMarket(predictions);
            const uniqueMarkets = Object.keys(marketGroups);

            console.log(`📊 Found ${predictions.length} predictions across ${uniqueMarkets.length} markets`);

            // Step 3: Fetch odds for each unique market
            const marketOddsMap = new Map<string, MarketOdds>();
            let successCount = 0;
            let errorCount = 0;

            for (const marketId of uniqueMarkets) {
                try {
                    const odds = await this.fetchMarketOddsFromPolymarket(marketId);
                    if (odds) {
                        marketOddsMap.set(marketId, odds);
                        successCount++;
                    }

                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (error) {
                    errorCount++;
                    console.error(`❌ Failed to fetch odds for market ${marketId}:`, error);
                }
            }

            // Step 4: Update all predictions with new odds and calculate agent balance updates
            const updatePromises: Promise<void>[] = [];
            const agentBalanceUpdates = new Map<string, number>(); // agentId -> total unrealized P&L

            for (const [marketId, odds] of marketOddsMap) {
                const predictionsForMarket = marketGroups[marketId];

                for (const prediction of predictionsForMarket) {
                    updatePromises.push(
                        this.updatePredictionOdds(prediction.id, odds, prediction)
                    );

                    // Calculate unrealized P&L for balance updates
                    const unrealizedPnl = this.calculateUnrealizedPnL(prediction, odds);
                    const currentTotal = agentBalanceUpdates.get(prediction.agent_id) || 0;
                    agentBalanceUpdates.set(prediction.agent_id, currentTotal + unrealizedPnl);
                }
            }

            // Execute all prediction updates in parallel
            await Promise.all(updatePromises);

            // Step 5: Update agent balances with total unrealized P&L
            await this.updateAgentBalances(agentBalanceUpdates);

            const duration = Date.now() - startTime;
            console.log(`✅ [Integrated Tracker] Updated ${predictions.length} predictions (${successCount}/${uniqueMarkets.length} markets) in ${duration}ms`);

        } catch (error) {
            console.error('❌ [Integrated Tracker] Failed to update prediction odds:', error);
        }
    }

    /**
     * Get all agent predictions from Firebase
     */
    private async getAllAgentPredictions(): Promise<AgentPrediction[]> {
        try {
            const predictionsRef = adminDatabase.ref('agent_predictions');
            const snapshot = await predictionsRef.once('value');

            if (!snapshot.exists()) {
                return [];
            }

            const predictions: AgentPrediction[] = [];
            snapshot.forEach((child) => {
                const prediction = child.val();
                if (prediction && prediction.market_id) {
                    predictions.push(prediction);
                }
            });

            return predictions;

        } catch (error) {
            console.error('❌ Failed to get agent predictions:', error);
            return [];
        }
    }

    /**
     * Group predictions by market_id for efficient processing
     */
    private groupPredictionsByMarket(predictions: AgentPrediction[]): { [marketId: string]: AgentPrediction[] } {
        const groups: { [marketId: string]: AgentPrediction[] } = {};

        for (const prediction of predictions) {
            if (!groups[prediction.market_id]) {
                groups[prediction.market_id] = [];
            }
            groups[prediction.market_id].push(prediction);
        }

        return groups;
    }

    /**
     * Fetch current market odds from Polymarket API (using the fixed parsing logic)
     */
    private async fetchMarketOddsFromPolymarket(marketId: string): Promise<MarketOdds | null> {
        try {
            const response = await fetch(`${this.POLYMARKET_API_BASE}/markets/${marketId}`, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Polysentience-integrated-tracker/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Extract YES and NO prices using the fixed parsing logic
            let yesPrice = 0.5; // Default fallback
            let noPrice = 0.5;

            // Check for outcomePrices first (current Polymarket API format)
            if (data.outcomePrices) {
                try {
                    // outcomePrices comes as a JSON string, need to parse it
                    const pricesArray = typeof data.outcomePrices === 'string'
                        ? JSON.parse(data.outcomePrices)
                        : data.outcomePrices;

                    if (Array.isArray(pricesArray) && pricesArray.length >= 2) {
                        // outcomePrices is typically ["0.45", "0.55"] where first is Yes, second is No
                        yesPrice = parseFloat(pricesArray[0]);
                        noPrice = parseFloat(pricesArray[1]);
                    }
                } catch (parseError) {
                    console.error(`❌ Market ${marketId}: Failed to parse outcomePrices:`, parseError);
                }
            }
            // Fallback: Check if tokens exist (legacy format)
            else if (data.tokens && Array.isArray(data.tokens)) {
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
                if (data.yes_price !== undefined) {
                    yesPrice = parseFloat(data.yes_price);
                }
                if (data.no_price !== undefined) {
                    noPrice = parseFloat(data.no_price);
                }
            }

            const marketOdds: MarketOdds = {
                yes_price: yesPrice,
                no_price: noPrice,
                timestamp: new Date().toISOString()
            };

            return marketOdds;

        } catch (error) {
            // Don't log every API error to avoid spam, just throw
            throw error;
        }
    }

    /**
     * Update a specific prediction's current market odds, expected payout, and calculate unrealized P&L
     */
    private async updatePredictionOdds(predictionId: string, newOdds: MarketOdds, prediction: AgentPrediction): Promise<void> {
        try {
            // Calculate unrealized P&L based on current market odds vs entry odds
            const unrealizedPnl = this.calculateUnrealizedPnL(prediction, newOdds);

            // Calculate expected payout based on current win probability × fixed max payout
            const expectedPayout = this.calculateExpectedPayout(prediction, newOdds);

            const updates = {
                current_market_odds: newOdds,
                unrealized_pnl: unrealizedPnl,
                expected_payout: expectedPayout,
                updated_at: new Date().toISOString()
            };

            const predictionRef = adminDatabase.ref(`agent_predictions/${predictionId}`);
            await predictionRef.update(updates);

        } catch (error) {
            console.error(`❌ Failed to update odds for prediction ${predictionId}:`, error);
            throw error;
        }
    }

    /**
     * Calculate unrealized profit/loss based on current win probability
     * Uses proper prediction market logic: current expected value minus bet amount
     */
    private calculateUnrealizedPnL(prediction: AgentPrediction, currentOdds: MarketOdds): number {
        try {
            const betAmount = prediction.bet_amount || 0;

            // Calculate FIXED maximum payout based on ENTRY odds
            const entryPrice = prediction.prediction === 'YES'
                ? prediction.entry_odds.yes_price
                : prediction.entry_odds.no_price;

            const maxPayout = entryPrice > 0 ? betAmount / entryPrice : betAmount;

            // Get current win probability
            const currentWinProbability = prediction.prediction === 'YES'
                ? currentOdds.yes_price
                : currentOdds.no_price;

            // Current expected value = probability × max payout
            const currentExpectedValue = currentWinProbability * maxPayout;

            // Unrealized P&L = current expected value - original bet amount
            const unrealizedPnl = currentExpectedValue - betAmount;

            return Math.round(unrealizedPnl * 100) / 100; // Round to 2 decimal places

        } catch (error) {
            console.error('❌ Failed to calculate unrealized P&L:', error);
            return 0;
        }
    }

    /**
     * Calculate expected payout based on current win probability
     * Uses proper prediction market logic: fixed payout weighted by current probability
     */
    private calculateExpectedPayout(prediction: AgentPrediction, currentOdds: MarketOdds): number {
        try {
            const betAmount = prediction.bet_amount || 0;

            // Calculate FIXED maximum payout based on ENTRY odds (what they'd get if they win)
            const entryPrice = prediction.prediction === 'YES'
                ? prediction.entry_odds.yes_price
                : prediction.entry_odds.no_price;

            const maxPayout = entryPrice > 0 ? betAmount / entryPrice : betAmount;

            // Get current win probability (current market price = probability)
            const currentWinProbability = prediction.prediction === 'YES'
                ? currentOdds.yes_price
                : currentOdds.no_price;

            // Expected payout = probability of winning × fixed maximum payout
            // This creates dynamics while respecting prediction market mechanics
            const expectedPayout = currentWinProbability * maxPayout;

            return Math.round(expectedPayout * 100) / 100; // Round to 2 decimal places

        } catch (error) {
            console.error('❌ Failed to calculate expected payout:', error);
            return prediction.bet_amount || 0;
        }
    }

    /**
     * Get statistics about the current tracking session
     */
    async getTrackingStats(): Promise<{
        isActive: boolean;
        totalPredictions: number;
        uniqueMarkets: number;
        lastUpdate: string;
    }> {
        try {
            const predictions = await this.getAllAgentPredictions();
            const uniqueMarkets = new Set(predictions.map(p => p.market_id)).size;

            return {
                isActive: this.isRunning,
                totalPredictions: predictions.length,
                uniqueMarkets: uniqueMarkets,
                lastUpdate: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Failed to get tracking stats:', error);
            return {
                isActive: this.isRunning,
                totalPredictions: 0,
                uniqueMarkets: 0,
                lastUpdate: new Date().toISOString()
            };
        }
    }

    /**
     * Update agent balances with unrealized P&L
     */
    private async updateAgentBalances(agentBalanceUpdates: Map<string, number>): Promise<void> {
        try {
            if (agentBalanceUpdates.size === 0) {
                return;
            }

            console.log(`💰 [Balance Update] Updating balances for ${agentBalanceUpdates.size} agents...`);

            const updatePromises: Promise<void>[] = [];

            for (const [agentId, totalUnrealizedPnl] of agentBalanceUpdates) {
                updatePromises.push(
                    this.updateSingleAgentBalance(agentId, totalUnrealizedPnl)
                );
            }

            await Promise.all(updatePromises);

            console.log(`✅ [Balance Update] Updated ${agentBalanceUpdates.size} agent balances`);

        } catch (error) {
            console.error('❌ Failed to update agent balances:', error);
        }
    }

    /**
     * Update a single agent's balance with unrealized P&L
     */
    private async updateSingleAgentBalance(agentId: string, unrealizedPnl: number): Promise<void> {
        try {
            const balance = await getAgentBalance(agentId);
            if (!balance) {
                console.warn(`⚠️ No balance found for agent ${agentId}`);
                return;
            }

            // Calculate new current balance: initial balance - wagered amount + winnings + unrealized P&L
            // This properly accounts for money that's been bet but not yet resolved
            const newCurrentBalance = balance.initial_balance - balance.total_wagered + balance.total_winnings + unrealizedPnl;

            // Update the agent balance in Firebase
            const balanceRef = adminDatabase.ref(`agent_balances/${agentId}`);
            const updates = {
                current_balance: Math.round(newCurrentBalance * 100) / 100, // Round to 2 decimals
                last_updated: new Date().toISOString()
            };

            await balanceRef.update(updates);

            // Log significant balance changes
            const balanceChange = newCurrentBalance - balance.current_balance;
            if (Math.abs(balanceChange) > 0.01) {
                console.log(`💰 ${balance.agent_name}: ${balance.current_balance.toFixed(2)} → ${newCurrentBalance.toFixed(2)} (${balanceChange > 0 ? '+' : ''}${balanceChange.toFixed(2)})`);
            }

        } catch (error) {
            console.error(`❌ Failed to update balance for agent ${agentId}:`, error);
        }
    }
}

// Global integrated tracker instance
const integratedMarketOddsTracker = new IntegratedMarketOddsTracker();

export { integratedMarketOddsTracker, type MarketOdds };
export default integratedMarketOddsTracker;