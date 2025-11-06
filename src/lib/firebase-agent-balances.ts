/**
 * Firebase Agent Balance Management System
 * Handles dynamic balance tracking, bet sizing, and P&L calculations
 */

import { CELEBRITY_AGENTS } from './celebrity-agents';
import { adminDatabase } from './firebase-admin';

export interface AgentBalance {
    agent_id: string;
    agent_name: string;
    current_balance: number;
    initial_balance: number;
    total_wagered: number;
    total_winnings: number;
    total_losses: number;
    prediction_count: number;
    win_count: number;
    loss_count: number;
    win_rate: number;
    roi: number; // Return on Investment percentage
    biggest_win: number;
    biggest_loss: number;
    current_streak: number; // Positive for wins, negative for losses
    last_updated: string;
    created_at: string;
}

export interface MarketOdds {
    market_id: string;
    question: string;
    yes_price: number;    // Current YES price (0-1)
    no_price: number;     // Current NO price (0-1)
    volume_24h?: number;
    last_updated: string;
}

/**
 * Initialize agent balances for all celebrity agents
 */
export async function initializeAgentBalances(): Promise<void> {
    const balancesRef = adminDatabase.ref('agent_balances');

    for (const agent of CELEBRITY_AGENTS) {
        const existingBalance = await balancesRef.child(agent.id).once('value');

        if (!existingBalance.exists()) {
            const initialBalance: AgentBalance = {
                agent_id: agent.id,
                agent_name: agent.name,
                current_balance: agent.initial_balance,
                initial_balance: agent.initial_balance,
                total_wagered: 0,
                total_winnings: 0,
                total_losses: 0,
                prediction_count: 0,
                win_count: 0,
                loss_count: 0,
                win_rate: 0,
                roi: 0,
                biggest_win: 0,
                biggest_loss: 0,
                current_streak: 0,
                last_updated: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            await balancesRef.child(agent.id).set(initialBalance);
            console.log(`✅ Initialized balance for ${agent.name}: $${agent.initial_balance}`);
        }
    }
}

/**
 * Get agent balance by agent ID
 */
export async function getAgentBalance(agentId: string): Promise<AgentBalance | null> {
    const snapshot = await adminDatabase.ref(`agent_balances/${agentId}`).once('value');
    return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Get all agent balances
 */
export async function getAllAgentBalances(): Promise<AgentBalance[]> {
    const snapshot = await adminDatabase.ref('agent_balances').once('value');
    if (!snapshot.exists()) return [];

    const balances: AgentBalance[] = [];
    snapshot.forEach((child) => {
        balances.push(child.val());
    });

    return balances.sort((a, b) => b.current_balance - a.current_balance);
}

/**
 * Calculate bet amount based on confidence and current balance
 * Uses Kelly Criterion-inspired sizing with risk management
 */
export function calculateBetAmount(confidence: number, currentBalance: number): number {
    if (currentBalance <= 10) return 0; // Bankruptcy protection

    const maxBet = Math.min(5, currentBalance * 0.05); // Max $5 or 5% of balance
    const minBet = 1;

    // Confidence-based sizing with Kelly Criterion influence
    let baseBetRatio: number;

    if (confidence >= 0.85) baseBetRatio = 0.8;      // Very high confidence: 80% of max
    else if (confidence >= 0.75) baseBetRatio = 0.6; // High confidence: 60% of max
    else if (confidence >= 0.65) baseBetRatio = 0.4; // Medium confidence: 40% of max
    else if (confidence >= 0.55) baseBetRatio = 0.2; // Low confidence: 20% of max
    else return 0; // Too low confidence, skip bet

    const calculatedBet = Math.max(minBet, maxBet * baseBetRatio);
    return Math.min(calculatedBet, currentBalance - 10); // Keep $10 minimum
}

/**
 * Check if agent can make a bet
 */
export async function canAgentMakeBet(agentId: string, betAmount: number): Promise<boolean> {
    const balance = await getAgentBalance(agentId);
    if (!balance) return false;

    return balance.current_balance >= betAmount && balance.current_balance > 10;
}

/**
 * Place a bet - deduct from agent balance
 */
export async function placeBet(
    agentId: string,
    betAmount: number,
    predictionId: string
): Promise<boolean> {
    const balanceRef = adminDatabase.ref(`agent_balances/${agentId}`);
    const balance = await getAgentBalance(agentId);

    if (!balance || !await canAgentMakeBet(agentId, betAmount)) {
        return false;
    }

    const updatedBalance: Partial<AgentBalance> = {
        current_balance: balance.current_balance - betAmount,
        total_wagered: balance.total_wagered + betAmount,
        prediction_count: balance.prediction_count + 1,
        last_updated: new Date().toISOString()
    };

    await balanceRef.update(updatedBalance);

    console.log(`💰 ${balance.agent_name} placed bet: $${betAmount} (Balance: $${updatedBalance.current_balance})`);
    return true;
}

/**
 * Resolve a bet - handle win/loss and update statistics
 */
export async function resolveBet(
    agentId: string,
    betAmount: number,
    isWin: boolean,
    payout: number = 0
): Promise<void> {
    const balanceRef = adminDatabase.ref(`agent_balances/${agentId}`);
    const balance = await getAgentBalance(agentId);

    if (!balance) return;

    const netGain = isWin ? payout - betAmount : -betAmount;
    const newBalance = balance.current_balance + (isWin ? payout : 0);

    // Update streak
    let newStreak: number;
    if (isWin) {
        newStreak = balance.current_streak >= 0 ? balance.current_streak + 1 : 1;
    } else {
        newStreak = balance.current_streak <= 0 ? balance.current_streak - 1 : -1;
    }

    // Calculate new win rate and ROI
    const newWinCount = balance.win_count + (isWin ? 1 : 0);
    const newLossCount = balance.loss_count + (isWin ? 0 : 1);
    const totalPredictions = newWinCount + newLossCount;
    const newWinRate = totalPredictions > 0 ? (newWinCount / totalPredictions) * 100 : 0;

    const totalReturns = balance.total_winnings + (isWin ? payout : 0);
    const totalInvested = balance.total_wagered;
    const newROI = totalInvested > 0 ? ((totalReturns - totalInvested) / totalInvested) * 100 : 0;

    const updatedBalance: Partial<AgentBalance> = {
        current_balance: newBalance,
        total_winnings: balance.total_winnings + (isWin ? payout : 0),
        total_losses: balance.total_losses + (isWin ? 0 : betAmount),
        win_count: newWinCount,
        loss_count: newLossCount,
        win_rate: newWinRate,
        roi: newROI,
        biggest_win: isWin && netGain > balance.biggest_win ? netGain : balance.biggest_win,
        biggest_loss: !isWin && Math.abs(netGain) > balance.biggest_loss ? Math.abs(netGain) : balance.biggest_loss,
        current_streak: newStreak,
        last_updated: new Date().toISOString()
    };

    await balanceRef.update(updatedBalance);

    const action = isWin ? 'WON' : 'LOST';
    const amount = isWin ? `+$${payout}` : `-$${betAmount}`;
    console.log(`${isWin ? '🎉' : '😞'} ${balance.agent_name} ${action}: ${amount} (New Balance: $${newBalance})`);
}

/**
 * Calculate unrealized P&L for open positions
 */
export async function calculateUnrealizedPL(agentId: string): Promise<number> {
    // Get all unresolved predictions for this agent
    const predictionsRef = adminDatabase.ref('agent_predictions');
    const query = predictionsRef.orderByChild('agent_id').equalTo(agentId);
    const snapshot = await query.once('value');

    if (!snapshot.exists()) return 0;

    let unrealizedPL = 0;
    const predictions: any[] = [];

    snapshot.forEach((child) => {
        const prediction = child.val();
        if (!prediction.resolved_at && prediction.bet_amount && prediction.entry_odds) {
            predictions.push(prediction);
        }
    });

    // For each open position, calculate current value vs entry value
    for (const prediction of predictions) {
        const currentOdds = await getCurrentMarketOdds(prediction.market_id);
        if (currentOdds) {
            const entryPrice = prediction.prediction === 'YES' ? prediction.entry_odds.yes_price : prediction.entry_odds.no_price;
            const currentPrice = prediction.prediction === 'YES' ? currentOdds.yes_price : currentOdds.no_price;

            // Calculate unrealized P&L
            const priceChange = currentPrice - entryPrice;
            const positionPL = (priceChange / entryPrice) * prediction.bet_amount;
            unrealizedPL += positionPL;
        }
    }

    return unrealizedPL;
}

/**
 * Get current market odds from Firebase cache
 */
export async function getCurrentMarketOdds(marketId: string): Promise<MarketOdds | null> {
    const snapshot = await adminDatabase.ref(`market_odds/${marketId}`).once('value');
    return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Store current market odds
 */
export async function storeMarketOdds(marketId: string, odds: MarketOdds): Promise<void> {
    await adminDatabase.ref(`market_odds/${marketId}`).set({
        ...odds,
        last_updated: new Date().toISOString()
    });
}

/**
 * Reset agent balance to initial amount (admin function)
 */
export async function resetAgentBalance(agentId: string): Promise<boolean> {
    const agent = CELEBRITY_AGENTS.find(a => a.id === agentId);
    if (!agent) return false;

    const resetBalance: AgentBalance = {
        agent_id: agentId,
        agent_name: agent.name,
        current_balance: agent.initial_balance,
        initial_balance: agent.initial_balance,
        total_wagered: 0,
        total_winnings: 0,
        total_losses: 0,
        prediction_count: 0,
        win_count: 0,
        loss_count: 0,
        win_rate: 0,
        roi: 0,
        biggest_win: 0,
        biggest_loss: 0,
        current_streak: 0,
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString()
    };

    await adminDatabase.ref(`agent_balances/${agentId}`).set(resetBalance);
    console.log(`🔄 Reset balance for ${agent.name} to $${agent.initial_balance}`);
    return true;
}

/**
 * Get agent leaderboard sorted by various metrics
 */
export async function getAgentLeaderboard(sortBy: 'balance' | 'roi' | 'winRate' | 'totalWinnings' = 'balance'): Promise<AgentBalance[]> {
    const balances = await getAllAgentBalances();

    return balances.sort((a, b) => {
        switch (sortBy) {
            case 'roi':
                return b.roi - a.roi;
            case 'winRate':
                return b.win_rate - a.win_rate;
            case 'totalWinnings':
                return b.total_winnings - a.total_winnings;
            default:
                return b.current_balance - a.current_balance;
        }
    });
}

/**
 * Adjust bet amount based on recent performance (psychological modeling)
 */
export function adjustBetForPsychology(baseBetAmount: number, balance: AgentBalance): number {
    let multiplier = 1.0;

    // Hot streak - bet more aggressively
    if (balance.current_streak >= 3) {
        multiplier = 1.2; // 20% more aggressive
    }
    // Cold streak - bet more conservatively  
    else if (balance.current_streak <= -3) {
        multiplier = 0.8; // 20% more conservative
    }

    // Poor ROI - be more conservative
    if (balance.roi < -20) {
        multiplier *= 0.7;
    }
    // Great ROI - be slightly more aggressive
    else if (balance.roi > 20) {
        multiplier *= 1.1;
    }

    return Math.max(1, Math.min(5, baseBetAmount * multiplier));
}