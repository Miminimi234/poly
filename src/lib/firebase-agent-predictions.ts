/**
 * Firebase-based agent predictions system
 * Stores agent predictions and analysis in Firebase Realtime Database
 */

import type { Reference } from 'firebase-admin/database';
import { adminDatabase } from './firebase-admin';
import { resolveBet } from './firebase-agent-balances';

interface AgentPrediction {
    id: string;
    agent_id: string;
    agent_name: string;
    market_id: string;
    market_question: string;
    prediction: 'YES' | 'NO';
    confidence: number;
    reasoning: string;
    research_cost: number;
    research_sources?: string[];
    price_at_prediction: number;
    // Betting fields
    bet_amount: number;
    entry_odds: {
        yes_price: number;
        no_price: number;
    };
    expected_payout: number; // What they would get if they win
    // Position Management fields
    position_status: 'OPEN' | 'CLOSED_MANUAL' | 'CLOSED_RESOLVED';
    current_market_odds?: {
        yes_price: number;
        no_price: number;
        timestamp: string;
    };
    unrealized_pnl?: number; // Current profit/loss based on market movement
    close_price?: number; // Price at which position was closed (if manually closed)
    close_reason?: 'PROFIT_TAKING' | 'STOP_LOSS' | 'MARKET_RESOLVED' | 'RANDOM_EXIT';
    closed_at?: string;
    // Resolution fields
    resolved: boolean;
    correct?: boolean;
    profit_loss?: number;
    actual_payout?: number; // What they actually received
    outcome?: 'YES' | 'NO';
    resolved_at?: string;
    // Timestamps
    created_at: string;
    updated_at: string;
}

interface PredictionMetadata {
    total_predictions: number;
    last_update: string;
    version: number;
}

class FirebaseAgentPredictions {
    private predictionsRef: Reference;
    private metadataRef: Reference;

    constructor() {
        this.predictionsRef = adminDatabase.ref('agent_predictions');
        this.metadataRef = adminDatabase.ref('predictions_metadata');
    }

    /**
     * Save a new agent prediction
     */
    async savePrediction(prediction: Omit<AgentPrediction, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
        try {
            const timestamp = new Date().toISOString();
            const predictionId = this.predictionsRef.push().key;

            if (!predictionId) {
                throw new Error('Failed to generate prediction ID');
            }

            const fullPrediction: AgentPrediction = {
                ...prediction,
                id: predictionId,
                // Position Management initialization
                position_status: 'OPEN',
                current_market_odds: {
                    yes_price: prediction.entry_odds.yes_price,
                    no_price: prediction.entry_odds.no_price,
                    timestamp: timestamp
                },
                unrealized_pnl: 0, // No profit/loss yet
                // Resolution fields
                resolved: false,
                created_at: timestamp,
                updated_at: timestamp
            };

            await this.predictionsRef.child(predictionId).set(fullPrediction);

            // Update metadata
            await this.updateMetadata();

            console.log(`✅ Firebase: Saved prediction ${predictionId} for agent ${prediction.agent_name}`);
            return predictionId;

        } catch (error: any) {
            console.error('❌ Firebase: Failed to save prediction:', {
                error: error.message,
                code: error.code,
                details: error.details,
                stack: error.stack,
                predictionData: {
                    agent_name: prediction.agent_name,
                    market_id: prediction.market_id,
                    prediction: prediction.prediction
                }
            });

            // Check if it's a permission error
            if (error.code === 'PERMISSION_DENIED' || error.message?.includes('permission')) {
                console.error('🚨 FIREBASE PERMISSION ERROR: Database rules may be blocking writes. Check Firebase Console rules.');
            }

            throw error;
        }
    }

    /**
     * Get all predictions for an agent
     */
    async getPredictionsByAgent(agentId: string, limit: number = 50): Promise<AgentPrediction[]> {
        try {
            const snapshot = await this.predictionsRef
                .orderByChild('agent_id')
                .equalTo(agentId)
                .limitToLast(limit)
                .once('value');

            const data = snapshot.val();
            if (!data) {
                return [];
            }

            const predictions = Object.values(data) as AgentPrediction[];
            return predictions.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

        } catch (error) {
            console.error(`❌ Firebase: Failed to get predictions for agent ${agentId}:`, error);
            return [];
        }
    }

    /**
     * Get all predictions for a market
     */
    async getPredictionsByMarket(marketId: string): Promise<AgentPrediction[]> {
        try {
            const snapshot = await this.predictionsRef
                .orderByChild('market_id')
                .equalTo(marketId)
                .once('value');

            const data = snapshot.val();
            if (!data) {
                return [];
            }

            const predictions = Object.values(data) as AgentPrediction[];
            return predictions.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

        } catch (error) {
            console.error(`❌ Firebase: Failed to get predictions for market ${marketId}:`, error);
            return [];
        }
    }

    /**
     * Get recent predictions across all agents
     */
    async getRecentPredictions(limit: number = 20): Promise<AgentPrediction[]> {
        try {
            const snapshot = await this.predictionsRef
                .orderByChild('created_at')
                .limitToLast(limit)
                .once('value');

            const data = snapshot.val();
            if (!data) {
                return [];
            }

            const predictions = Object.values(data) as AgentPrediction[];
            return predictions.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

        } catch (error) {
            console.error('❌ Firebase: Failed to get recent predictions:', error);
            return [];
        }
    }

    /**
     * Resolve a prediction when market outcome is known
     */
    async resolvePrediction(predictionId: string, outcome: 'YES' | 'NO', finalPrice: number): Promise<void> {
        try {
            const snapshot = await this.predictionsRef.child(predictionId).once('value');
            const prediction = snapshot.val() as AgentPrediction;

            if (!prediction) {
                throw new Error(`Prediction ${predictionId} not found`);
            }

            const correct = prediction.prediction === outcome;

            // Calculate actual payout based on betting odds
            let actualPayout = 0;
            let profitLoss = -prediction.bet_amount; // Default to losing the bet

            if (correct) {
                // If they were right, they get their expected payout
                actualPayout = prediction.expected_payout;
                profitLoss = actualPayout - prediction.bet_amount; // Net profit
            }

            const updates = {
                resolved: true,
                correct,
                outcome,
                profit_loss: profitLoss,
                actual_payout: actualPayout,
                resolved_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await this.predictionsRef.child(predictionId).update(updates);

            // Update agent balance
            await resolveBet(prediction.agent_id, prediction.bet_amount, correct, actualPayout);

            console.log(`✅ Firebase: Resolved prediction ${predictionId} - ${correct ? 'CORRECT' : 'INCORRECT'} (P&L: $${profitLoss.toFixed(2)})`);

        } catch (error) {
            console.error(`❌ Firebase: Failed to resolve prediction ${predictionId}:`, error);
            throw error;
        }
    }

    /**
     * Get unresolved predictions for a market
     */
    async getUnresolvedPredictions(marketId: string): Promise<AgentPrediction[]> {
        try {
            const predictions = await this.getPredictionsByMarket(marketId);
            return predictions.filter(p => !p.resolved);

        } catch (error) {
            console.error(`❌ Firebase: Failed to get unresolved predictions for market ${marketId}:`, error);
            return [];
        }
    }

    /**
     * Check if agent has already predicted on a market
     */
    async hasAgentPredicted(agentId: string, marketId: string): Promise<boolean> {
        try {
            const snapshot = await this.predictionsRef
                .orderByChild('agent_id')
                .equalTo(agentId)
                .once('value');

            const data = snapshot.val();
            if (!data) {
                return false;
            }

            const predictions = Object.values(data) as AgentPrediction[];
            return predictions.some(p => p.market_id === marketId);

        } catch (error) {
            console.error(`❌ Firebase: Failed to check if agent ${agentId} predicted on market ${marketId}:`, error);
            return false;
        }
    }

    /**
     * Get agent statistics
     */
    async getAgentStats(agentId: string): Promise<{
        totalPredictions: number;
        correctPredictions: number;
        accuracy: number;
        totalProfitLoss: number;
        roi: number;
    }> {
        try {
            const predictions = await this.getPredictionsByAgent(agentId, 1000); // Get all predictions
            const resolvedPredictions = predictions.filter(p => p.resolved);

            const totalPredictions = predictions.length;
            const correctPredictions = resolvedPredictions.filter(p => p.correct).length;
            const accuracy = resolvedPredictions.length > 0 ? (correctPredictions / resolvedPredictions.length) * 100 : 0;
            const totalProfitLoss = resolvedPredictions.reduce((sum, p) => sum + (p.profit_loss || 0), 0);
            const totalSpent = predictions.reduce((sum, p) => sum + p.research_cost, 0);
            const roi = totalSpent > 0 ? (totalProfitLoss / totalSpent) * 100 : 0;

            return {
                totalPredictions,
                correctPredictions,
                accuracy,
                totalProfitLoss,
                roi
            };

        } catch (error) {
            console.error(`❌ Firebase: Failed to get stats for agent ${agentId}:`, error);
            return {
                totalPredictions: 0,
                correctPredictions: 0,
                accuracy: 0,
                totalProfitLoss: 0,
                roi: 0
            };
        }
    }

    /**
     * Update predictions metadata
     */
    private async updateMetadata(): Promise<void> {
        try {
            const snapshot = await this.predictionsRef.once('value');
            const data = snapshot.val();
            const totalPredictions = data ? Object.keys(data).length : 0;

            const metadata: PredictionMetadata = {
                total_predictions: totalPredictions,
                last_update: new Date().toISOString(),
                version: Date.now()
            };

            await this.metadataRef.set(metadata);

        } catch (error) {
            console.error('❌ Firebase: Failed to update predictions metadata:', error);
        }
    }

    /**
     * Get predictions metadata
     */
    async getMetadata(): Promise<PredictionMetadata | null> {
        try {
            const snapshot = await this.metadataRef.once('value');
            return snapshot.val() as PredictionMetadata || null;

        } catch (error) {
            console.error('❌ Firebase: Failed to get predictions metadata:', error);
            return null;
        }
    }

    /**
     * Clear all agent predictions (Admin function)
     */
    async clearAllPredictions(): Promise<void> {
        try {
            console.log('🗑️ Clearing all agent predictions...');

            // Remove all predictions
            await this.predictionsRef.remove();

            // Reset metadata
            const metadata: PredictionMetadata = {
                total_predictions: 0,
                last_update: new Date().toISOString(),
                version: Date.now()
            };
            await this.metadataRef.set(metadata);

            console.log('✅ Firebase: All agent predictions cleared successfully');

        } catch (error) {
            console.error('❌ Firebase: Failed to clear all predictions:', error);
            throw error;
        }
    }

    /**
     * Update market odds for all open positions and calculate unrealized P&L
     */
    async updateMarketOdds(marketId: string, newOdds: { yes_price: number; no_price: number }): Promise<void> {
        try {
            const openPredictions = await this.getOpenPositions(marketId);

            if (openPredictions.length === 0) {
                return;
            }

            const timestamp = new Date().toISOString();
            const updates: { [key: string]: any } = {};

            for (const prediction of openPredictions) {
                const unrealizedPnl = this.calculateUnrealizedPnL(prediction, newOdds);

                updates[`${prediction.id}/current_market_odds`] = {
                    yes_price: newOdds.yes_price,
                    no_price: newOdds.no_price,
                    timestamp
                };
                updates[`${prediction.id}/unrealized_pnl`] = unrealizedPnl;
                updates[`${prediction.id}/updated_at`] = timestamp;
            }

            await this.predictionsRef.update(updates);
            console.log(`📊 Updated market odds for ${openPredictions.length} open positions in market ${marketId}`);

        } catch (error) {
            console.error(`❌ Failed to update market odds for market ${marketId}:`, error);
        }
    }

    /**
     * Get all open positions for a market
     */
    async getOpenPositions(marketId?: string): Promise<AgentPrediction[]> {
        try {
            let query = this.predictionsRef.orderByChild('position_status').equalTo('OPEN');

            const snapshot = await query.once('value');
            const data = snapshot.val();

            if (!data) {
                return [];
            }

            let predictions = Object.values(data) as AgentPrediction[];

            // Filter by market if specified
            if (marketId) {
                predictions = predictions.filter(p => p.market_id === marketId);
            }

            return predictions.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

        } catch (error) {
            console.error(`❌ Failed to get open positions:`, error);
            return [];
        }
    }

    /**
     * Calculate unrealized P&L based on current market odds
     */
    private calculateUnrealizedPnL(prediction: AgentPrediction, currentOdds: { yes_price: number; no_price: number }): number {
        const currentPrice = prediction.prediction === 'YES' ? currentOdds.yes_price : currentOdds.no_price;

        // Calculate current expected payout if we sold at current price
        // For prediction markets: payout = bet_amount / price_at_purchase * current_price
        const entryPrice = prediction.prediction === 'YES' ? prediction.entry_odds.yes_price : prediction.entry_odds.no_price;

        // Calculate the number of shares we have (bet_amount / entry_price)
        const shares = prediction.bet_amount / entryPrice;

        // Calculate current value of our shares (shares * current_price)
        const currentValue = shares * currentPrice;

        // P&L = current value - original bet amount
        return currentValue - prediction.bet_amount;
    }

    /**
     * Randomly decide to close positions (called periodically)
     */
    async randomPositionManagement(): Promise<void> {
        try {
            const openPositions = await this.getOpenPositions();

            if (openPositions.length === 0) {
                return;
            }

            console.log(`🎲 Evaluating ${openPositions.length} open positions for random closure...`);

            for (const position of openPositions) {
                const shouldClose = this.shouldRandomlyClosePosition(position);

                if (shouldClose.close) {
                    await this.closePosition(position.id, shouldClose.reason);
                }
            }

        } catch (error) {
            console.error('❌ Failed during random position management:', error);
        }
    }

    /**
     * Determine if a position should be randomly closed
     */
    private shouldRandomlyClosePosition(position: AgentPrediction): { close: boolean; reason: 'PROFIT_TAKING' | 'STOP_LOSS' | 'RANDOM_EXIT' } {
        const unrealizedPnl = position.unrealized_pnl || 0;
        const betAmount = position.bet_amount;
        const pnlPercentage = (unrealizedPnl / betAmount) * 100;

        // Age of position in hours
        const ageHours = (Date.now() - new Date(position.created_at).getTime()) / (1000 * 60 * 60);

        // Higher chance to close if big profit (>30%)
        if (pnlPercentage > 30 && Math.random() < 0.15) {
            return { close: true, reason: 'PROFIT_TAKING' };
        }

        // Stop loss if losing >50%
        if (pnlPercentage < -50 && Math.random() < 0.08) {
            return { close: true, reason: 'STOP_LOSS' };
        }

        // Random exit (very rare) - increases with age
        const randomExitChance = Math.min(0.02 + (ageHours / 1000), 0.05); // Max 5% chance
        if (Math.random() < randomExitChance) {
            return { close: true, reason: 'RANDOM_EXIT' };
        }

        return { close: false, reason: 'RANDOM_EXIT' };
    }

    /**
     * Close a position manually
     */
    async closePosition(predictionId: string, reason: 'PROFIT_TAKING' | 'STOP_LOSS' | 'MARKET_RESOLVED' | 'RANDOM_EXIT'): Promise<void> {
        try {
            const snapshot = await this.predictionsRef.child(predictionId).once('value');
            const prediction = snapshot.val() as AgentPrediction;

            if (!prediction || prediction.position_status !== 'OPEN') {
                console.warn(`⚠️ Cannot close position ${predictionId} - not open`);
                return;
            }

            const currentPrice = prediction.current_market_odds
                ? (prediction.prediction === 'YES' ? prediction.current_market_odds.yes_price : prediction.current_market_odds.no_price)
                : prediction.price_at_prediction;

            const realizedPnl = prediction.unrealized_pnl || 0;
            const timestamp = new Date().toISOString();

            const updates = {
                position_status: reason === 'MARKET_RESOLVED' ? 'CLOSED_RESOLVED' : 'CLOSED_MANUAL',
                close_price: currentPrice,
                close_reason: reason,
                closed_at: timestamp,
                profit_loss: realizedPnl,
                actual_payout: prediction.bet_amount + realizedPnl,
                updated_at: timestamp
            };

            await this.predictionsRef.child(predictionId).update(updates);

            // Update agent balance with realized P&L
            await this.updateAgentBalanceFromPosition(prediction.agent_id, realizedPnl, prediction.bet_amount);

            console.log(`📈 Closed position ${predictionId} (${reason}): P&L $${realizedPnl.toFixed(2)}`);

        } catch (error) {
            console.error(`❌ Failed to close position ${predictionId}:`, error);
        }
    }

    /**
     * Update agent balance from closed position
     */
    private async updateAgentBalanceFromPosition(agentId: string, realizedPnl: number, betAmount: number): Promise<void> {
        try {
            const { resolveBet } = await import('./firebase-agent-balances');

            // Use resolveBet to handle balance updates
            // If P&L is positive, agent won; if negative, agent lost
            const won = realizedPnl > 0;
            const payout = won ? betAmount + realizedPnl : 0; // Total payout (original bet + profit or 0)

            await resolveBet(agentId, betAmount, won, payout);

        } catch (error) {
            console.error(`❌ Failed to update agent balance for ${agentId}:`, error);
        }
    }
}

// Global Firebase predictions instance
const firebaseAgentPredictions = new FirebaseAgentPredictions();

export { firebaseAgentPredictions, type AgentPrediction };
export default firebaseAgentPredictions;