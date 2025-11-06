/**
 * Integrated Market & Position Tracker
 * Combines odds tracking with position management for real-time P&L calculations
 */

import { marketOddsTracker } from './market-odds-tracker';
import { positionManagementEngine } from './position-management-engine';

class IntegratedMarketTracker {
    private marketOddsTracker = marketOddsTracker;
    private updateInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private updateIntervalMs: number = 5 * 60 * 1000; // 5 minutes default

    constructor() {
        // marketOddsTracker is already initialized as an imported instance
    }

    /**
     * Start the integrated tracking system
     */
    async start(intervalMinutes: number = 5): Promise<void> {
        if (this.isRunning) {
            console.log('⚠️ Integrated Market Tracker already running');
            return;
        }

        this.updateIntervalMs = intervalMinutes * 60 * 1000;
        this.isRunning = true;

        console.log(`🚀 Starting Integrated Market Tracker (${intervalMinutes} min intervals)`);
        console.log('📊 This will track BOTH market odds AND position values concurrently');

        // Run initial update
        await this.runIntegratedUpdate();

        // Schedule periodic updates
        this.updateInterval = setInterval(async () => {
            await this.runIntegratedUpdate();
        }, this.updateIntervalMs);
    }

    /**
     * Stop the integrated tracking system
     */
    stop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // The marketOddsTracker instance doesn't have a stop method
        // It just fetches data when called

        this.isRunning = false;
        console.log('🛑 Integrated Market Tracker stopped');
    }

    /**
     * Run a single integrated update cycle
     */
    private async runIntegratedUpdate(): Promise<void> {
        try {
            const startTime = Date.now();
            console.log('🔄 Integrated Update: Starting market odds + position management cycle...');

            // Step 1: Update market odds first (this is the foundation)
            console.log('📈 Step 1: Updating market odds...');
            await this.marketOddsTracker.updateAllMarketOdds();

            // Step 2: Update position values based on new odds
            console.log('💼 Step 2: Updating position values...');
            await positionManagementEngine.forceUpdate();

            const duration = Date.now() - startTime;
            console.log(`✅ Integrated Update: Complete (${duration}ms) - Odds updated → Positions recalculated`);

        } catch (error) {
            console.error('❌ Integrated Update: Failed:', error);
        }
    }

    /**
     * Get comprehensive status of both systems
     */
    getStatus(): {
        isRunning: boolean;
        updateInterval: number;
        nextUpdate?: Date;
        oddsTracker: any;
        positionManager: any;
    } {
        return {
            isRunning: this.isRunning,
            updateInterval: this.updateIntervalMs,
            nextUpdate: this.isRunning ? new Date(Date.now() + this.updateIntervalMs) : undefined,
            oddsTracker: { status: 'Ready - fetches on demand' },
            positionManager: positionManagementEngine.getStatus()
        };
    }

    /**
     * Force an immediate integrated update
     */
    async forceUpdate(): Promise<void> {
        console.log('🔧 Forcing integrated market + position update...');
        await this.runIntegratedUpdate();
    }

    /**
     * Test the integration with sample data
     */
    async testIntegration(): Promise<{
        oddsUpdated: string;
        positionsUpdated: number;
        timeElapsed: number;
    }> {
        const startTime = Date.now();

        // Test odds update (returns void, so we just track completion)
        await this.marketOddsTracker.updateAllMarketOdds();

        // Test position update
        const positionReport = await positionManagementEngine.getPositionReport();

        return {
            oddsUpdated: "Completed successfully",
            positionsUpdated: positionReport.totalOpenPositions,
            timeElapsed: Date.now() - startTime
        };
    }
}

// Global integrated tracker instance
const integratedMarketTracker = new IntegratedMarketTracker();

export { integratedMarketTracker };
export default integratedMarketTracker;