/**
 * TypeScript types for localStorage-based user agent system
 * Matches Firebase structure but optimized for client-side storage
 */

import type { Strategy } from '@/lib/agent-strategies';

export interface UserAgent {
    id: string;
    name: string;
    description: string;
    strategy: Strategy;

    // Balance & Financial Data
    current_balance: number;
    initial_balance: number;
    total_wagered: number;
    total_winnings: number;
    total_losses: number;

    // Performance Stats
    prediction_count: number;
    win_count: number;
    loss_count: number;
    win_rate: number;
    roi: number; // Return on Investment percentage
    biggest_win: number;
    biggest_loss: number;
    current_streak: number; // Positive for wins, negative for losses

    // Timestamps
    created_at: string;
    last_updated: string;

    // User-specific fields
    is_active: boolean; // User can pause/unpause agents
    is_running?: boolean; // Runner state persisted across sessions/navigation
    notes?: string; // User notes about the agent
}

export interface UserAgentPrediction {
    id: string;
    agent_id: string;
    agent_name: string;
    market_id: string;
    market_question: string;
    prediction: 'YES' | 'NO';
    confidence: number;
    reasoning: string;
    research_cost: number;
    research_sources: string[];
    price_at_prediction: number;

    // Betting fields
    bet_amount: number;
    entry_odds: {
        yes_price: number;
        no_price: number;
    };
    expected_payout: number;

    // Position Management
    position_status: 'OPEN' | 'CLOSED_MANUAL' | 'CLOSED_RESOLVED';
    current_market_odds?: {
        yes_price: number;
        no_price: number;
        timestamp: string;
    };
    unrealized_pnl?: number;
    close_price?: number;
    close_reason?: 'PROFIT_TAKING' | 'STOP_LOSS' | 'MARKET_RESOLVED' | 'RANDOM_EXIT';
    closed_at?: string;

    // Resolution fields
    resolved: boolean;
    correct?: boolean;
    profit_loss?: number;
    actual_payout?: number;
    outcome?: 'YES' | 'NO';
    resolved_at?: string;

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface UserAgentTransaction {
    id: string;
    agent_id: string;
    type: 'BET_PLACED' | 'WIN' | 'LOSS' | 'RESEARCH_COST' | 'MANUAL_ADJUSTMENT';
    amount: number;
    balance_before: number;
    balance_after: number;
    description: string;
    prediction_id?: string; // Link to related prediction
    created_at: string;
}

export interface UserAgentStore {
    agents: UserAgent[];
    predictions: UserAgentPrediction[];
    transactions: UserAgentTransaction[];

    // Metadata
    total_agents: number;
    last_updated: string;
    version: number;
}

export interface CreateUserAgentData {
    name: string;
    description: string;
    strategy_type: string;
    initial_balance: number;
}

export interface UserAgentStats {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    totalProfitLoss: number;
    roi: number;
    currentStreak: number;
    biggestWin: number;
    biggestLoss: number;
    averageBetSize: number;
    totalResearchCost: number;
    netProfit: number; // Profit after research costs
}

// Utility type for updating agents
export type UserAgentUpdate = Partial<Omit<UserAgent, 'id' | 'created_at'>>;

// Events for agent actions
export interface AgentEvent {
    id: string;
    agent_id: string;
    event_type: 'CREATED' | 'BET_PLACED' | 'PREDICTION_RESOLVED' | 'BALANCE_UPDATED' | 'PAUSED' | 'RESUMED';
    data: any;
    timestamp: string;
}