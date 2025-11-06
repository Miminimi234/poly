/**
 * Position Management Engine
 * Handles real-time position tracking, unrealized P&L updates, and random position closures
 */

import { firebaseAgentPredictions } from './firebase-agent-predictions';
import { firebaseMarketCache } from './firebase-market-cache';

class PositionManagementEngine {
    private updateInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private updateIntervalMs: number = 5 * 60 * 1000; // 5 minutes default

    /**
     * Start the position management engine
     */
    async start(intervalMinutes: number = 5): Promise<void> {
        if (this.isRunning) {
            console.log('⚠️ Position Management Engine already running');
            return;
        }

        this.updateIntervalMs = intervalMinutes * 60 * 1000;
        this.isRunning = true;

        console.log(`🚀 Starting Position Management Engine (${intervalMinutes} min intervals)`);

        // Run initial update
        await this.runUpdate();

        // Schedule periodic updates
        this.updateInterval = setInterval(async () => {
            await this.runUpdate();
        }, this.updateIntervalMs);
    }

    /**
     * Stop the position management engine
     */
    stop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.isRunning = false;
        console.log('🛑 Position Management Engine stopped');
    }

    /**
     * Run a single update cycle
     */
    private async runUpdate(): Promise<void> {
        try {
            const startTime = Date.now();
            console.log('🔄 Position Management Engine: Starting update cycle...');

            // 1. Update market odds for all open positions
            await this.updateAllMarketOdds();

            // 2. Random position management (rare closures)
            await this.performRandomPositionManagement();

            // 3. Log performance stats
            await this.logPositionStats();

            const duration = Date.now() - startTime;
            console.log(`✅ Position Management Engine: Update complete (${duration}ms)`);

        } catch (error) {
            console.error('❌ Position Management Engine: Update failed:', error);
        }
    }

    /**
     * Update market odds for all open positions
     */
    private async updateAllMarketOdds(): Promise<void> {
        try {
            // Get all open positions
            const openPositions = await firebaseAgentPredictions.getOpenPositions();

            if (openPositions.length === 0) {
                console.log('📊 No open positions to update');
                return;
            }

            // Group positions by market
            const marketGroups = new Map<string, any[]>();
            openPositions.forEach(position => {
                if (!marketGroups.has(position.market_id)) {
                    marketGroups.set(position.market_id, []);
                }
                marketGroups.get(position.market_id)!.push(position);
            });

            console.log(`📊 Updating odds for ${marketGroups.size} markets with ${openPositions.length} open positions`);

            // Update odds for each market
            for (const [marketId, positions] of marketGroups) {
                try {
                    // Get current market data
                    const market = await firebaseMarketCache.getMarket(marketId);

                    if (!market) {
                        console.warn(`⚠️ Market ${marketId} not found, skipping odds update`);
                        continue;
                    }

                    // Update odds for all positions in this market
                    await firebaseAgentPredictions.updateMarketOdds(marketId, {
                        yes_price: market.yes_price,
                        no_price: market.no_price
                    });

                    console.log(`📈 Updated ${positions.length} positions for market: ${market.question.slice(0, 50)}...`);

                } catch (error) {
                    console.error(`❌ Failed to update odds for market ${marketId}:`, error);
                }
            }

        } catch (error) {
            console.error('❌ Failed to update all market odds:', error);
        }
    }

    /**
     * Perform random position management
     */
    private async performRandomPositionManagement(): Promise<void> {
        try {
            console.log('🎲 Performing random position management...');
            await firebaseAgentPredictions.randomPositionManagement();
        } catch (error) {
            console.error('❌ Random position management failed:', error);
        }
    }

    /**
     * Log position statistics
     */
    private async logPositionStats(): Promise<void> {
        try {
            const openPositions = await firebaseAgentPredictions.getOpenPositions();

            if (openPositions.length === 0) {
                return;
            }

            // Calculate aggregate stats
            const totalUnrealizedPnl = openPositions.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0);
            const totalBetAmount = openPositions.reduce((sum, pos) => sum + pos.bet_amount, 0);
            const avgUnrealizedPnl = totalUnrealizedPnl / openPositions.length;

            // Group by agent
            const agentStats = new Map<string, { positions: number; unrealized: number; bet_total: number }>();
            openPositions.forEach(pos => {
                if (!agentStats.has(pos.agent_name)) {
                    agentStats.set(pos.agent_name, { positions: 0, unrealized: 0, bet_total: 0 });
                }
                const stats = agentStats.get(pos.agent_name)!;
                stats.positions++;
                stats.unrealized += pos.unrealized_pnl || 0;
                stats.bet_total += pos.bet_amount;
            });

            console.log(`💰 Position Stats: ${openPositions.length} open positions, Total Unrealized P&L: $${totalUnrealizedPnl.toFixed(2)}, Avg: $${avgUnrealizedPnl.toFixed(2)}`);

            // Log top performers
            const sortedAgents = Array.from(agentStats.entries())
                .sort((a, b) => b[1].unrealized - a[1].unrealized)
                .slice(0, 3);

            if (sortedAgents.length > 0) {
                console.log('🏆 Top Unrealized P&L:', sortedAgents.map(([name, stats]) =>
                    `${name}: $${stats.unrealized.toFixed(2)} (${stats.positions} pos)`
                ).join(', '));
            }

        } catch (error) {
            console.error('❌ Failed to log position stats:', error);
        }
    }

    /**
     * Get engine status
     */
    getStatus(): { isRunning: boolean; updateInterval: number; nextUpdate?: Date } {
        return {
            isRunning: this.isRunning,
            updateInterval: this.updateIntervalMs,
            nextUpdate: this.isRunning ? new Date(Date.now() + this.updateIntervalMs) : undefined
        };
    }

    /**
     * Force an immediate update (useful for testing)
     */
    async forceUpdate(): Promise<void> {
        console.log('🔧 Forcing position management update...');
        await this.runUpdate();
    }

    /**
     * Get comprehensive position report
     */
    async getPositionReport(): Promise<{
        totalOpenPositions: number;
        totalUnrealizedPnl: number;
        positionsByAgent: { [agentName: string]: { count: number; unrealized: number; totalBet: number } };
        oldestPosition: { age_hours: number; agent: string; market: string } | null;
    }> {
        try {
            const openPositions = await firebaseAgentPredictions.getOpenPositions();

            if (openPositions.length === 0) {
                return {
                    totalOpenPositions: 0,
                    totalUnrealizedPnl: 0,
                    positionsByAgent: {},
                    oldestPosition: null
                };
            }

            const totalUnrealizedPnl = openPositions.reduce((sum, pos) => sum + (pos.unrealized_pnl || 0), 0);

            const positionsByAgent: { [agentName: string]: { count: number; unrealized: number; totalBet: number } } = {};

            openPositions.forEach(pos => {
                if (!positionsByAgent[pos.agent_name]) {
                    positionsByAgent[pos.agent_name] = { count: 0, unrealized: 0, totalBet: 0 };
                }
                positionsByAgent[pos.agent_name].count++;
                positionsByAgent[pos.agent_name].unrealized += pos.unrealized_pnl || 0;
                positionsByAgent[pos.agent_name].totalBet += pos.bet_amount;
            });

            // Find oldest position
            const oldestPos = openPositions.reduce((oldest, pos) =>
                new Date(pos.created_at) < new Date(oldest.created_at) ? pos : oldest
            );

            const ageHours = (Date.now() - new Date(oldestPos.created_at).getTime()) / (1000 * 60 * 60);

            return {
                totalOpenPositions: openPositions.length,
                totalUnrealizedPnl,
                positionsByAgent,
                oldestPosition: {
                    age_hours: ageHours,
                    agent: oldestPos.agent_name,
                    market: oldestPos.market_question.slice(0, 50) + '...'
                }
            };

        } catch (error) {
            console.error('❌ Failed to generate position report:', error);
            return {
                totalOpenPositions: 0,
                totalUnrealizedPnl: 0,
                positionsByAgent: {},
                oldestPosition: null
            };
        }
    }
}

// Global position management engine instance
const positionManagementEngine = new PositionManagementEngine();

export { positionManagementEngine };
export default positionManagementEngine;