/**
 * Zustand store for managing user-created agents in localStorage
 * Provides CRUD operations and agent management functionality
 */

import { getStrategy } from '@/lib/agent-strategies';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
    CreateUserAgentData,
    UserAgent,
    UserAgentPrediction,
    UserAgentStats,
    UserAgentStore,
    UserAgentTransaction,
    UserAgentUpdate
} from './types/user-agent-types';

// Utility to generate unique IDs
// Prefer the browser's crypto.randomUUID() for strong uniqueness, fall back to timestamp+random string
const generateId = () => {
    try {
        if (typeof globalThis !== 'undefined' && (globalThis as any).crypto && typeof (globalThis as any).crypto.randomUUID === 'function') {
            return `user_${(globalThis as any).crypto.randomUUID()}`;
        }
    } catch (e) {
        // ignore and fallback
    }

    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

interface UserAgentStoreState extends UserAgentStore {
    // CRUD Operations
    createAgent: (data: CreateUserAgentData) => Promise<string>;
    updateAgent: (agentId: string, updates: UserAgentUpdate) => void;
    deleteAgent: (agentId: string) => void;
    getAgent: (agentId: string) => UserAgent | undefined;
    getAllAgents: () => UserAgent[];
    getActiveAgents: () => UserAgent[];

    // Agent Management
    pauseAgent: (agentId: string) => void;
    resumeAgent: (agentId: string) => void;
    // Persisted runner state for auto-start behavior
    setAgentRunning: (agentId: string, running: boolean) => void;
    adjustAgentBalance: (agentId: string, amount: number, reason: string) => void;

    // Predictions
    addPrediction: (prediction: Omit<UserAgentPrediction, 'id' | 'created_at' | 'updated_at'>) => string;
    updatePrediction: (predictionId: string, updates: Partial<UserAgentPrediction>) => void;
    resolvePrediction: (predictionId: string, outcome: 'YES' | 'NO', finalPrice: number) => void;
    getAgentPredictions: (agentId: string) => UserAgentPrediction[];

    // Clear all predictions and transactions for a specific agent and reset agent stats
    clearAgentPredictions: (agentId: string) => void;

    // Transactions
    addTransaction: (transaction: Omit<UserAgentTransaction, 'id' | 'created_at'>) => void;
    getAgentTransactions: (agentId: string) => UserAgentTransaction[];

    // Statistics
    getAgentStats: (agentId: string) => UserAgentStats;
    getLeaderboard: (sortBy?: 'balance' | 'roi' | 'accuracy' | 'profit') => UserAgent[];

    // Utility
    clearAllData: () => void;
    exportData: () => string;
    exportAgentData: (agentId: string) => string;
    importData: (jsonData: string) => boolean;
    importAgentData: (jsonData: string, options?: { preservePersonality?: boolean }) => boolean;
}

export const useUserAgentStore = create<UserAgentStoreState>()(
    persist(
        (set, get) => ({
            // Initial state
            agents: [],
            predictions: [],
            transactions: [],
            total_agents: 0,
            last_updated: new Date().toISOString(),
            version: 1,

            // Create a new agent
            createAgent: async (data: CreateUserAgentData): Promise<string> => {
                const strategy = getStrategy(data.strategy_type);
                if (!strategy) {
                    throw new Error(`Invalid strategy type: ${data.strategy_type}`);
                }

                const agentId = generateId();
                const timestamp = new Date().toISOString();

                const newAgent: UserAgent = {
                    id: agentId,
                    name: data.name.trim(),
                    description: data.description.trim(),
                    strategy,
                    current_balance: data.initial_balance,
                    initial_balance: data.initial_balance,
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
                    created_at: timestamp,
                    last_updated: timestamp,
                    is_active: true,
                    notes: ''
                    , is_running: false
                };

                set((state) => ({
                    agents: [...state.agents, newAgent],
                    total_agents: state.total_agents + 1,
                    last_updated: timestamp
                }));

                // Add creation transaction
                get().addTransaction({
                    agent_id: agentId,
                    type: 'MANUAL_ADJUSTMENT',
                    amount: data.initial_balance,
                    balance_before: 0,
                    balance_after: data.initial_balance,
                    description: 'Initial balance set'
                });

                console.log(`✅ Created user agent: ${data.name} with $${data.initial_balance} balance`);
                return agentId;
            },

            // Update an existing agent
            updateAgent: (agentId: string, updates: UserAgentUpdate) => {
                set((state) => ({
                    agents: state.agents.map(agent =>
                        agent.id === agentId
                            ? { ...agent, ...updates, last_updated: new Date().toISOString() }
                            : agent
                    ),
                    last_updated: new Date().toISOString()
                }));
            },

            // Delete an agent
            deleteAgent: (agentId: string) => {
                set((state) => ({
                    agents: state.agents.filter(agent => agent.id !== agentId),
                    predictions: state.predictions.filter(pred => pred.agent_id !== agentId),
                    transactions: state.transactions.filter(tx => tx.agent_id !== agentId),
                    total_agents: Math.max(0, state.total_agents - 1),
                    last_updated: new Date().toISOString()
                }));
            },

            // Get a specific agent
            getAgent: (agentId: string) => {
                return get().agents.find(agent => agent.id === agentId);
            },

            // Get all agents
            getAllAgents: () => {
                return get().agents;
            },

            // Get only active agents
            getActiveAgents: () => {
                return get().agents.filter(agent => agent.is_active);
            },

            // Pause an agent
            pauseAgent: (agentId: string) => {
                get().updateAgent(agentId, { is_active: false });
            },

            // Resume an agent
            resumeAgent: (agentId: string) => {
                get().updateAgent(agentId, { is_active: true });
            },

            // Set persisted running state for an agent (stored in localStorage via Zustand)
            setAgentRunning: (agentId: string, running: boolean) => {
                get().updateAgent(agentId, { is_running: running });
            },

            // Manually adjust agent balance
            adjustAgentBalance: (agentId: string, amount: number, reason: string) => {
                const agent = get().getAgent(agentId);
                if (!agent) return;

                const newBalance = Math.max(0, agent.current_balance + amount);

                get().updateAgent(agentId, {
                    current_balance: newBalance
                });

                get().addTransaction({
                    agent_id: agentId,
                    type: 'MANUAL_ADJUSTMENT',
                    amount,
                    balance_before: agent.current_balance,
                    balance_after: newBalance,
                    description: reason
                });
            },

            // Add a new prediction
            addPrediction: (predictionData: Omit<UserAgentPrediction, 'id' | 'created_at' | 'updated_at'>): string => {
                const predictionId = generateId();
                const timestamp = new Date().toISOString();

                const prediction: UserAgentPrediction = {
                    ...predictionData,
                    id: predictionId,
                    position_status: 'OPEN',
                    resolved: false,
                    created_at: timestamp,
                    updated_at: timestamp
                };

                set((state) => ({
                    predictions: [...state.predictions, prediction],
                    last_updated: timestamp
                }));

                // Update agent stats
                const agent = get().getAgent(predictionData.agent_id);
                if (agent) {
                    get().updateAgent(predictionData.agent_id, {
                        current_balance: agent.current_balance - predictionData.bet_amount - predictionData.research_cost,
                        total_wagered: agent.total_wagered + predictionData.bet_amount,
                        prediction_count: agent.prediction_count + 1
                    });

                    // Add transactions
                    get().addTransaction({
                        agent_id: predictionData.agent_id,
                        type: 'BET_PLACED',
                        amount: -predictionData.bet_amount,
                        balance_before: agent.current_balance,
                        balance_after: agent.current_balance - predictionData.bet_amount,
                        description: `Bet on: ${predictionData.market_question}`,
                        prediction_id: predictionId
                    });

                    if (predictionData.research_cost > 0) {
                        get().addTransaction({
                            agent_id: predictionData.agent_id,
                            type: 'RESEARCH_COST',
                            amount: -predictionData.research_cost,
                            balance_before: agent.current_balance - predictionData.bet_amount,
                            balance_after: agent.current_balance - predictionData.bet_amount - predictionData.research_cost,
                            description: `Research for: ${predictionData.market_question}`,
                            prediction_id: predictionId
                        });
                    }
                }

                // Emit a lightweight signal to notify other tabs/components to refresh
                try {
                    if (typeof window !== 'undefined' && window.localStorage) {
                        window.localStorage.setItem('user-agent-storage-signal', JSON.stringify({ ts: Date.now(), agentId: predictionData.agent_id }));
                    }
                } catch (e) {
                    // ignore
                }

                return predictionId;
            },


            // Update a prediction
            updatePrediction: (predictionId: string, updates: Partial<UserAgentPrediction>) => {
                set((state) => ({
                    predictions: state.predictions.map(pred =>
                        pred.id === predictionId
                            ? { ...pred, ...updates, updated_at: new Date().toISOString() }
                            : pred
                    ),
                    last_updated: new Date().toISOString()
                }));

                // Emit signal for updated prediction
                try {
                    if (typeof window !== 'undefined' && window.localStorage) {
                        const pred = get().predictions.find(p => p.id === predictionId);
                        const aid = pred ? pred.agent_id : null;
                        window.localStorage.setItem('user-agent-storage-signal', JSON.stringify({ ts: Date.now(), agentId: aid }));
                    }
                } catch (e) {
                    // ignore
                }
            },

            // Resolve a prediction
            resolvePrediction: (predictionId: string, outcome: 'YES' | 'NO', finalPrice: number) => {
                const prediction = get().predictions.find(p => p.id === predictionId);
                if (!prediction || prediction.resolved) return;

                const agent = get().getAgent(prediction.agent_id);
                if (!agent) return;

                const correct = prediction.prediction === outcome;
                let actualPayout = 0;
                let profitLoss = -prediction.bet_amount;

                if (correct) {
                    actualPayout = prediction.expected_payout;
                    profitLoss = actualPayout - prediction.bet_amount;
                }

                // Update prediction
                get().updatePrediction(predictionId, {
                    resolved: true,
                    correct,
                    outcome,
                    profit_loss: profitLoss,
                    actual_payout: actualPayout,
                    resolved_at: new Date().toISOString(),
                    position_status: 'CLOSED_RESOLVED'
                });

                // Update agent stats
                const newWinCount = agent.win_count + (correct ? 1 : 0);
                const newLossCount = agent.loss_count + (correct ? 0 : 1);
                const totalPredictions = newWinCount + newLossCount;
                const newWinRate = totalPredictions > 0 ? (newWinCount / totalPredictions) * 100 : 0;

                let newStreak: number;
                if (correct) {
                    newStreak = agent.current_streak >= 0 ? agent.current_streak + 1 : 1;
                } else {
                    newStreak = agent.current_streak <= 0 ? agent.current_streak - 1 : -1;
                }

                const newBalance = agent.current_balance + actualPayout;
                const newTotalWinnings = agent.total_winnings + (correct ? actualPayout : 0);
                const newTotalLosses = agent.total_losses + (correct ? 0 : prediction.bet_amount);

                const totalInvested = agent.total_wagered;
                const totalReturns = newTotalWinnings;
                const newROI = totalInvested > 0 ? ((totalReturns - totalInvested) / totalInvested) * 100 : 0;

                get().updateAgent(prediction.agent_id, {
                    current_balance: newBalance,
                    total_winnings: newTotalWinnings,
                    total_losses: newTotalLosses,
                    win_count: newWinCount,
                    loss_count: newLossCount,
                    win_rate: newWinRate,
                    roi: newROI,
                    biggest_win: correct && profitLoss > agent.biggest_win ? profitLoss : agent.biggest_win,
                    biggest_loss: !correct && Math.abs(profitLoss) > agent.biggest_loss ? Math.abs(profitLoss) : agent.biggest_loss,
                    current_streak: newStreak
                });

                // Add transaction for payout
                if (actualPayout > 0) {
                    get().addTransaction({
                        agent_id: prediction.agent_id,
                        type: 'WIN',
                        amount: actualPayout,
                        balance_before: agent.current_balance,
                        balance_after: newBalance,
                        description: `Won bet: ${prediction.market_question}`,
                        prediction_id: predictionId
                    });
                } else {
                    get().addTransaction({
                        agent_id: prediction.agent_id,
                        type: 'LOSS',
                        amount: 0,
                        balance_before: agent.current_balance,
                        balance_after: agent.current_balance,
                        description: `Lost bet: ${prediction.market_question}`,
                        prediction_id: predictionId
                    });
                }

                // Emit a signal to notify other tabs/components that a prediction was resolved
                try {
                    if (typeof window !== 'undefined' && window.localStorage) {
                        window.localStorage.setItem('user-agent-storage-signal', JSON.stringify({ ts: Date.now(), agentId: prediction.agent_id }));
                    }
                } catch (e) {
                    // ignore
                }
            },

            // Get agent predictions
            getAgentPredictions: (agentId: string) => {
                return get().predictions
                    .filter(pred => pred.agent_id === agentId)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            },

            // Clear all predictions & transactions for an agent and reset its stats to defaults
            clearAgentPredictions: (agentId: string) => {
                const timestamp = new Date().toISOString();

                set((state) => ({
                    predictions: state.predictions.filter(p => p.agent_id !== agentId),
                    transactions: state.transactions.filter(tx => tx.agent_id !== agentId),
                    agents: state.agents.map(agent =>
                        agent.id === agentId
                            ? {
                                ...agent,
                                current_balance: agent.initial_balance,
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
                                last_updated: timestamp
                            }
                            : agent
                    ),
                    last_updated: timestamp
                }));

                // Emit signal that agent predictions were cleared
                try {
                    if (typeof window !== 'undefined' && window.localStorage) {
                        window.localStorage.setItem('user-agent-storage-signal', JSON.stringify({ ts: Date.now(), agentId }));
                    }
                } catch (e) {
                    // ignore
                }
            },

            // Add a transaction
            addTransaction: (transactionData: Omit<UserAgentTransaction, 'id' | 'created_at'>) => {
                const transaction: UserAgentTransaction = {
                    ...transactionData,
                    id: generateId(),
                    created_at: new Date().toISOString()
                };

                set((state) => ({
                    transactions: [...state.transactions, transaction],
                    last_updated: new Date().toISOString()
                }));
            },

            // Get agent transactions
            getAgentTransactions: (agentId: string) => {
                return get().transactions
                    .filter(tx => tx.agent_id === agentId)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            },

            // Get agent statistics
            getAgentStats: (agentId: string): UserAgentStats => {
                const agent = get().getAgent(agentId);
                const predictions = get().getAgentPredictions(agentId);
                const transactions = get().getAgentTransactions(agentId);

                if (!agent) {
                    return {
                        totalPredictions: 0,
                        correctPredictions: 0,
                        accuracy: 0,
                        totalProfitLoss: 0,
                        roi: 0,
                        currentStreak: 0,
                        biggestWin: 0,
                        biggestLoss: 0,
                        averageBetSize: 0,
                        totalResearchCost: 0,
                        netProfit: 0
                    };
                }

                const resolvedPredictions = predictions.filter(p => p.resolved);
                const totalResearchCost = predictions.reduce((sum, p) => sum + p.research_cost, 0);
                const averageBetSize = predictions.length > 0
                    ? predictions.reduce((sum, p) => sum + p.bet_amount, 0) / predictions.length
                    : 0;

                const netProfit = agent.current_balance - agent.initial_balance;

                return {
                    totalPredictions: predictions.length,
                    correctPredictions: agent.win_count,
                    accuracy: agent.win_rate,
                    totalProfitLoss: agent.total_winnings - agent.total_losses,
                    roi: agent.roi,
                    currentStreak: agent.current_streak,
                    biggestWin: agent.biggest_win,
                    biggestLoss: agent.biggest_loss,
                    averageBetSize,
                    totalResearchCost,
                    netProfit
                };
            },

            // Get leaderboard
            getLeaderboard: (sortBy: 'balance' | 'roi' | 'accuracy' | 'profit' = 'balance') => {
                const agents = [...get().agents];

                return agents.sort((a, b) => {
                    switch (sortBy) {
                        case 'roi':
                            return b.roi - a.roi;
                        case 'accuracy':
                            return b.win_rate - a.win_rate;
                        case 'profit':
                            return (b.current_balance - b.initial_balance) - (a.current_balance - a.initial_balance);
                        default:
                            return b.current_balance - a.current_balance;
                    }
                });
            },

            // Clear all data
            clearAllData: () => {
                set({
                    agents: [],
                    predictions: [],
                    transactions: [],
                    total_agents: 0,
                    last_updated: new Date().toISOString(),
                    version: 1
                });
            },

            // Export data as JSON
            exportData: () => {
                const state = get();
                return JSON.stringify({
                    agents: state.agents,
                    predictions: state.predictions,
                    transactions: state.transactions,
                    exported_at: new Date().toISOString(),
                    version: state.version
                }, null, 2);
            },

            // Export a specific agent's data as JSON
            exportAgentData: (agentId: string) => {
                const state = get();
                const agent = state.agents.find(a => a.id === agentId);
                if (!agent) {
                    return JSON.stringify({ error: 'Agent not found', agentId }, null, 2);
                }

                const predictions = state.predictions.filter(p => p.agent_id === agentId);
                const transactions = state.transactions.filter(t => t.agent_id === agentId);
                const stats = get().getAgentStats(agentId);

                return JSON.stringify({
                    agent,
                    predictions,
                    transactions,
                    stats,
                    exported_at: new Date().toISOString(),
                    version: state.version
                }, null, 2);
            },

            // Import data from JSON
            importData: (jsonData: string): boolean => {
                try {
                    const data = JSON.parse(jsonData);

                    if (!data.agents || !Array.isArray(data.agents)) {
                        throw new Error('Invalid data format');
                    }

                    set({
                        agents: data.agents || [],
                        predictions: data.predictions || [],
                        transactions: data.transactions || [],
                        total_agents: data.agents?.length || 0,
                        last_updated: new Date().toISOString(),
                        version: data.version || 1
                    });

                    return true;
                } catch (error) {
                    console.error('Failed to import data:', error);
                    return false;
                }
            }

            // Import a single agent's data (format produced by exportAgentData)
            , importAgentData: (jsonData: string, options?: { preservePersonality?: boolean }): boolean => {
                try {
                    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
                    const agent = data.agent;
                    if (!agent || !agent.id) {
                        throw new Error('Invalid agent data');
                    }

                    const preservePersonality = options?.preservePersonality === true;

                    const importedPredictions = Array.isArray(data.predictions) ? data.predictions : [];
                    const importedTransactions = Array.isArray(data.transactions) ? data.transactions : [];

                    set((state) => {
                        const now = new Date().toISOString();

                        // Replace existing agent if present, otherwise add
                        const existingIndex = state.agents.findIndex(a => a.id === agent.id);
                        let agents = [...state.agents];
                        let total_agents = state.total_agents;

                        // If preserving personality and the agent exists, copy personality from existing
                        let agentToStore: any = { ...agent, last_updated: now };
                        if (preservePersonality && existingIndex !== -1) {
                            const existingAgent = state.agents[existingIndex] as any;
                            (agentToStore as any).personality = existingAgent.personality || (agentToStore as any).personality;
                        }

                        if (existingIndex !== -1) {
                            agents[existingIndex] = agentToStore as any;
                        } else {
                            agents = [...agents, agentToStore as any];
                            total_agents = (state.total_agents || 0) + 1;
                        }

                        // Remove any existing predictions/transactions for this agent and append imported ones
                        const predictions = state.predictions.filter(p => p.agent_id !== agent.id).concat(importedPredictions as any[]);
                        const transactions = state.transactions.filter(t => t.agent_id !== agent.id).concat(importedTransactions as any[]);

                        return {
                            agents,
                            predictions,
                            transactions,
                            total_agents,
                            last_updated: now
                        } as any;
                    });

                    // Emit storage signal for other tabs
                    try {
                        if (typeof window !== 'undefined' && window.localStorage) {
                            window.localStorage.setItem('user-agent-storage-signal', JSON.stringify({ ts: Date.now(), agentId: data.agent.id }));
                        }
                    } catch (e) {
                        // ignore
                    }

                    return true;
                } catch (error) {
                    console.error('Failed to import agent data:', error);
                    return false;
                }
            }
        }),
        {
            name: 'user-agent-storage',
            storage: createJSONStorage(() => localStorage),
            version: 1,
            migrate: (persistedState: any, version: number) => {
                // Handle migrations if needed in the future
                return persistedState;
            }
        }
    )
);

export default useUserAgentStore;

// Cross-tab synchronization: Broadcast state changes to other tabs and listen for remote updates.
// Uses BroadcastChannel when available, falls back to the storage event. Guards ensure this
// only runs in a browser environment (no-ops during SSR).
// Simple polling-only sync: periodically read persisted localStorage and merge into the
// in-memory Zustand store if it changed. This is intentionally minimal to avoid
// complex cross-tab signaling or BroadcastChannel usage.
if (typeof window !== 'undefined') {
    try {
        const persistedKey = 'user-agent-storage';
        let lastPolled = localStorage.getItem(persistedKey) || null;

        const pollIntervalMs = 1500; // 1.5s poll
        const poller = setInterval(() => {
            try {
                const current = localStorage.getItem(persistedKey);
                if (!current || current === lastPolled) return;

                const parsed = JSON.parse(current) as any;
                if (!parsed || !parsed.state) return;

                // Merge persisted state into in-memory store
                useUserAgentStore.setState((s) => ({ ...s, ...parsed.state }));

                lastPolled = current;
            } catch (err) {
                // ignore parse or access errors
            }
        }, pollIntervalMs);

        // Clean up on unload
        window.addEventListener('beforeunload', () => {
            try { clearInterval(poller); } catch (e) { /* ignore */ }
        });
    } catch (err) {
        // ignore
    }
}