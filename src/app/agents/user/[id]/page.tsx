"use client";

import { MainNav } from '@/components/navigation/MainNav';
import useUserAgentStore from '@/lib/stores/use-user-agent-store';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Agent {
    id: string;
    name: string;
    strategy_type: string;
    avatar: string;
    color: string;
    generation: number;
    description: string;
    personality: string;
}

interface AgentBalance {
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
    roi: number;
    biggest_win: number;
    biggest_loss: number;
    current_streak: number;
    last_updated: string;
}

interface AgentPrediction {
    id: string;
    agent_id: string;
    agent_name: string;
    market_id: string;
    market_question: string;
    prediction: 'YES' | 'NO';
    confidence: number;
    reasoning: string;
    bet_amount: number;
    entry_odds: {
        yes_price: number;
        no_price: number;
    };
    expected_payout: number;
    position_status: 'OPEN' | 'CLOSED_MANUAL' | 'CLOSED_RESOLVED';
    unrealized_pnl?: number;
    close_price?: number;
    close_reason?: 'PROFIT_TAKING' | 'STOP_LOSS' | 'MARKET_RESOLVED' | 'RANDOM_EXIT';
    closed_at?: string;
    resolved: boolean;
    correct?: boolean;
    profit_loss?: number;
    actual_payout?: number;
    outcome?: 'YES' | 'NO';
    resolved_at?: string;
    created_at: string;
    updated_at: string;
}

export default function UserAgentPage() {
    const params = useParams();
    const agentId = params.id as string;

    const [agent, setAgent] = useState<Agent | null>(null);
    const [balance, setBalance] = useState<AgentBalance | null>(null);
    const [predictions, setPredictions] = useState<AgentPrediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [connected, setConnected] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'history' | 'analytics'>('overview');
    const [expandedPositions, setExpandedPositions] = useState<{ [key: string]: boolean }>({});
    const [isRunning, setIsRunning] = useState<boolean>(false);

    // Keep track of cleanup functions for real-time listeners
    const cleanupFunctions = useRef<(() => void)[]>([]);

    useEffect(() => {
        if (!agentId) return;

        let isActive = true;

        const fetchAgentData = async () => {
            if (!isActive) return;

            try {
                setConnected(true);

                // First, check the local user-agent store (localStorage) for user-created agents
                try {
                    const store = useUserAgentStore.getState();
                    const localAgent = store.getAgent(agentId);
                    if (localAgent) {
                        // Map local UserAgent to Agent shape used by this page
                        const mappedAgent: Agent = {
                            id: localAgent.id,
                            name: localAgent.name,
                            strategy_type: (localAgent as any).strategy?.type || 'custom',
                            avatar: (localAgent as any).strategy?.icon || '◈',
                            color: (localAgent as any).strategy?.color || 'gray',
                            generation: 1,
                            description: localAgent.description || '',
                            personality: ''
                        };

                        const mappedBalance: AgentBalance = {
                            agent_id: localAgent.id,
                            agent_name: localAgent.name,
                            current_balance: localAgent.current_balance,
                            initial_balance: localAgent.initial_balance,
                            total_wagered: localAgent.total_wagered || 0,
                            total_winnings: localAgent.total_winnings || 0,
                            total_losses: localAgent.total_losses || 0,
                            prediction_count: localAgent.prediction_count || 0,
                            win_count: localAgent.win_count || 0,
                            loss_count: localAgent.loss_count || 0,
                            win_rate: localAgent.win_rate || 0,
                            roi: localAgent.roi || 0,
                            biggest_win: localAgent.biggest_win || 0,
                            biggest_loss: localAgent.biggest_loss || 0,
                            current_streak: localAgent.current_streak || 0,
                            last_updated: localAgent.last_updated || localAgent.created_at || new Date().toISOString()
                        };

                        const localPreds = store.getAgentPredictions(agentId) || [];

                        const mappedPredictions: AgentPrediction[] = localPreds.map(p => ({
                            id: p.id,
                            agent_id: p.agent_id,
                            agent_name: p.agent_name,
                            market_id: p.market_id,
                            market_question: p.market_question,
                            prediction: p.prediction,
                            confidence: p.confidence,
                            reasoning: p.reasoning,
                            bet_amount: p.bet_amount,
                            entry_odds: p.entry_odds,
                            expected_payout: p.expected_payout,
                            position_status: p.position_status,
                            unrealized_pnl: p.unrealized_pnl,
                            resolved: p.resolved,
                            correct: p.correct,
                            profit_loss: p.profit_loss,
                            actual_payout: p.actual_payout,
                            outcome: p.outcome,
                            resolved_at: p.resolved_at,
                            created_at: p.created_at,
                            updated_at: p.updated_at
                        }));

                        if (!isActive) return;
                        setAgent(mappedAgent);
                        setBalance(mappedBalance);
                        setPredictions(mappedPredictions);
                        setError('');
                        return; // done — local agent served
                    }
                } catch (localErr) {
                    console.warn('Local user agent lookup failed', localErr);
                    // Fall through to remote fetch
                }

                // Fallback to remote fetch for non-local agents
                const [agentsResponse, balancesResponse, predictionsResponse] = await Promise.all([
                    fetch('/api/firebase/agents'),
                    fetch('/api/firebase/agent-balances'),
                    fetch(`/api/firebase/agent-predictions/${agentId}`)
                ]);

                if (!isActive) return;

                const agentsData = await agentsResponse.json();
                const balancesData = await balancesResponse.json();
                let predictionsData = { success: false, predictions: [] };

                // Try to fetch predictions, but don't fail if endpoint doesn't exist
                try {
                    predictionsData = await predictionsResponse.json();
                } catch (e) {
                    console.log('Predictions endpoint not available yet');
                }

                if (agentsData.success) {
                    const foundAgent = agentsData.agents.find((a: Agent) => a.id === agentId);
                    if (foundAgent) {
                        setAgent(foundAgent);
                    } else {
                        throw new Error('Agent not found');
                    }
                }

                if (balancesData.success) {
                    const foundBalance = balancesData.balances.find((b: AgentBalance) => b.agent_id === agentId);
                    setBalance(foundBalance || null);
                }

                if (predictionsData.success) {
                    setPredictions(predictionsData.predictions || []);
                }

                setError('');

            } catch (error: any) {
                if (!isActive) return;
                console.error('Failed to fetch agent data:', error);
                setError(error.message);
                setConnected(false);
            } finally {
                if (isActive && loading) {
                    setLoading(false);
                }
            }
        };

        // Initial fetch
        fetchAgentData();

        // Set up real-time polling every 3 seconds
        const pollInterval = setInterval(() => {
            if (isActive && !loading) {
                fetchAgentData();
            }
        }, 3000);

        // Cleanup function
        const cleanup = () => {
            isActive = false;
            if (pollInterval) clearInterval(pollInterval);
            setConnected(false);
        };

        cleanupFunctions.current.push(cleanup);

        return cleanup;
    }, [agentId]);

    // Cleanup all connections on component unmount
    useEffect(() => {
        return () => {
            cleanupFunctions.current.forEach(cleanup => cleanup());
        };
    }, []);

    // Subscribe to the Zustand store for instant updates to predictions for this agent.
    // We subscribe regardless of active tab so that newly-created predictions appear
    // immediately in the UI for the current agent (same-tab updates).
    useEffect(() => {
        if (!agentId) return;

        let mounted = true;

        const unsubscribe = useUserAgentStore.subscribe((state: any) => {
            if (!mounted) return;
            try {
                const newPreds: any[] = state.predictions || [];
                const latestForAgent = newPreds.filter((p: any) => p.agent_id === agentId);
                if (latestForAgent.length === 0) return;

                setPredictions(prev => {
                    const prevIds = new Set(prev.map(x => x.id));
                    const toAdd = latestForAgent.filter((p: any) => !prevIds.has(p.id));
                    if (toAdd.length === 0) return prev;
                    return [...toAdd, ...prev];
                });
            } catch (err) {
                console.error('Positions subscription error', err);
            }
        });

        return () => {
            mounted = false;
            try { unsubscribe(); } catch (e) { /* ignore */ }
        };
    }, [agentId]);

    // Listen for lightweight storage signals from other tabs to silently refresh predictions
    useEffect(() => {
        if (!agentId) return;

        const handleSignal = (e: StorageEvent) => {
            if (e.key !== 'user-agent-storage-signal') return;
            if (!e.newValue) return;
            try {
                const data = JSON.parse(e.newValue);
                // If agentId is provided in the signal and doesn't match, ignore
                if (data.agentId && data.agentId !== agentId) return;

                // Refresh predictions and balance from the local store
                try {
                    const store = useUserAgentStore.getState();
                    const latestPreds = store.getAgentPredictions(agentId) || [];
                    setPredictions(latestPreds);

                    const updatedAgent = store.getAgent(agentId);
                    if (updatedAgent) {
                        const mappedBalance = {
                            agent_id: updatedAgent.id,
                            agent_name: updatedAgent.name,
                            current_balance: updatedAgent.current_balance,
                            initial_balance: updatedAgent.initial_balance,
                            total_wagered: updatedAgent.total_wagered || 0,
                            total_winnings: updatedAgent.total_winnings || 0,
                            total_losses: updatedAgent.total_losses || 0,
                            prediction_count: updatedAgent.prediction_count || 0,
                            win_count: updatedAgent.win_count || 0,
                            loss_count: updatedAgent.loss_count || 0,
                            win_rate: updatedAgent.win_rate || 0,
                            roi: updatedAgent.roi || 0,
                            biggest_win: updatedAgent.biggest_win || 0,
                            biggest_loss: updatedAgent.biggest_loss || 0,
                            current_streak: updatedAgent.current_streak || 0,
                            last_updated: updatedAgent.last_updated || updatedAgent.created_at || new Date().toISOString()
                        };

                        setBalance(mappedBalance);
                    }
                } catch (err) {
                    // ignore
                }
            } catch (err) {
                // ignore parse errors
            }
        };

        window.addEventListener('storage', handleSignal);
        return () => window.removeEventListener('storage', handleSignal);
    }, [agentId]);

    // Runner reference so we can recreate it when changing interval
    const runnerRef = useRef<{ start: () => void; stop: () => void } | null>(null);

    // Tab identifier for guarding against multiple tabs starting the same agent
    const tabIdRef = useRef<string>('');

    // Import UI state
    const importInputRef = useRef<HTMLInputElement | null>(null);
    const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
    const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);
    const [pendingImportedAgentName, setPendingImportedAgentName] = useState<string | null>(null);

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const text = String(reader.result || '');
                const parsed = JSON.parse(text);
                const importedAgent = parsed?.agent;

                // If there's an existing local agent, and both personalities exist and differ,
                // prompt the user whether to preserve current personality or replace it.
                const currentAgent = useUserAgentStore.getState().getAgent(agentId);
                const importedPersonality = importedAgent?.personality;
                const currentPersonality = (currentAgent as any)?.personality;

                if (importedAgent && importedPersonality && currentPersonality && importedPersonality !== currentPersonality) {
                    setPendingImportJson(text);
                    setPendingImportedAgentName(importedAgent.name || importedAgent.id || 'imported-agent');
                    setImportModalOpen(true);
                } else {
                    // No conflict — import immediately, default to replacing personality with imported one
                    const ok = useUserAgentStore.getState().importAgentData(text, { preservePersonality: false });
                    if (ok) {
                        try {
                            const store = useUserAgentStore.getState();
                            const updatedAgent = store.getAgent(agentId);
                            if (updatedAgent) {
                                const mappedBalance = {
                                    agent_id: updatedAgent.id,
                                    agent_name: updatedAgent.name,
                                    current_balance: updatedAgent.current_balance,
                                    initial_balance: updatedAgent.initial_balance,
                                    total_wagered: updatedAgent.total_wagered || 0,
                                    total_winnings: updatedAgent.total_winnings || 0,
                                    total_losses: updatedAgent.total_losses || 0,
                                    prediction_count: updatedAgent.prediction_count || 0,
                                    win_count: updatedAgent.win_count || 0,
                                    loss_count: updatedAgent.loss_count || 0,
                                    win_rate: updatedAgent.win_rate || 0,
                                    roi: updatedAgent.roi || 0,
                                    biggest_win: updatedAgent.biggest_win || 0,
                                    biggest_loss: updatedAgent.biggest_loss || 0,
                                    current_streak: updatedAgent.current_streak || 0,
                                    last_updated: updatedAgent.last_updated || updatedAgent.created_at || new Date().toISOString()
                                };

                                setBalance(mappedBalance);
                                setPredictions(store.getAgentPredictions(agentId) || []);
                            }
                        } catch (err) {
                            console.error('Refresh after import failed', err);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to read import file', err);
            } finally {
                // reset input value so the same file can be selected again if needed
                try { if (importInputRef.current) importInputRef.current.value = ''; } catch (e) { /* ignore */ }
            }
        };

        reader.readAsText(file);
    };

    const ensureTabId = () => {
        if (tabIdRef.current) return tabIdRef.current;
        try {
            let existing = sessionStorage.getItem('poly_tab_id');
            if (!existing) {
                existing = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                sessionStorage.setItem('poly_tab_id', existing);
            }
            tabIdRef.current = existing;
            return existing;
        } catch (e) {
            const fallback = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            tabIdRef.current = fallback;
            return fallback;
        }
    };

    useEffect(() => {
        ensureTabId();
    }, []);

    const heartbeatRef = useRef<number | null>(null);
    const RUN_LOCK_TTL = 2 * 60 * 1000; // 2 minutes

    const getRunLockKey = (id: string) => `user-agent-running:${id}`;

    const readRunLock = (id: string) => {
        try {
            const raw = localStorage.getItem(getRunLockKey(id));
            if (!raw) return null;
            return JSON.parse(raw) as { tabId: string; ts: number };
        } catch (e) {
            return null;
        }
    };

    const writeRunLock = (id: string, tabId: string) => {
        try {
            localStorage.setItem(getRunLockKey(id), JSON.stringify({ tabId, ts: Date.now() }));
        } catch (e) {
            // ignore
        }
    };

    const clearRunLock = (id: string) => {
        try {
            localStorage.removeItem(getRunLockKey(id));
        } catch (e) {
            // ignore
        }
    };

    const refreshRunLock = (id: string) => {
        try {
            const lock = readRunLock(id);
            if (!lock) return;
            if (lock.tabId !== tabIdRef.current) return;
            writeRunLock(id, tabIdRef.current);
        } catch (e) {
            // ignore
        }
    };

    // Speed control state: default to 'fast' for normal operation (1m)
    const [selectedSpeed, setSelectedSpeed] = useState<'dev' | 'slow' | 'moderate' | 'fast'>('fast');
    const [runnerIntervalMs, setRunnerIntervalMs] = useState<number>(1 * 60 * 1000);

    const createRunner = (intervalMs: number) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { default: useAgentAutoPredictor } = require('@/lib/hooks/use-agent-auto-predictor');
            runnerRef.current = useAgentAutoPredictor(agentId, { intervalMs, betAmount: 10 });
        } catch (e) {
            console.warn('Auto predictor not available', e);
            runnerRef.current = {
                start: () => setIsRunning(true),
                stop: () => setIsRunning(false)
            };
        }
    };

    // Initialize runner when agentId becomes available
    useEffect(() => {
        if (!agentId) return;
        createRunner(runnerIntervalMs);

        // NOTE: Persistent auto-start removed temporarily because persisted runner state
        // was causing the agent runner to be blocked in some environments. We will
        // reintroduce persistence later once cross-tab/startup behavior is stabilized.

        return () => {
            try { runnerRef.current?.stop(); } catch (e) { /* ignore */ }
            runnerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agentId]);

    // Recreate runner when interval changes
    useEffect(() => {
        if (!agentId) return;
        // Stop existing runner, recreate with new interval, and restart if previously running
        const wasRunning = isRunning;
        try { runnerRef.current?.stop(); } catch (e) { /* ignore */ }
        createRunner(runnerIntervalMs);
        if (wasRunning) {
            try { runnerRef.current?.start(); } catch (e) { console.warn('failed to restart runner after interval change', e); }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runnerIntervalMs]);

    const startAgent = () => {
        ensureTabId();
        // Guard: prevent starting the same agent in another tab
        try {
            const lock = readRunLock(agentId);
            const now = Date.now();
            if (lock && lock.tabId !== tabIdRef.current && (now - (lock.ts || 0)) < RUN_LOCK_TTL) {
                const proceed = confirm('This agent appears to be running in another tab. Are you sure you want to start it here? (Starting will take over)');
                if (!proceed) return;
            }
        } catch (e) {
            // ignore
        }

        // Acquire lock for this tab
        try {
            writeRunLock(agentId, tabIdRef.current);
            // start heartbeat to refresh lock periodically
            if (heartbeatRef.current) {
                window.clearInterval(heartbeatRef.current as number);
            }
            heartbeatRef.current = window.setInterval(() => refreshRunLock(agentId), 30 * 1000) as unknown as number;
        } catch (e) {
            // ignore
        }

        setIsRunning(true);
        try { runnerRef.current?.start(); } catch (e) { console.warn('start runner error', e); }
    };

    const stopAgent = () => {
        setIsRunning(false);
        // Stop runner and release lock if we own it
        try { runnerRef.current?.stop(); } catch (e) { console.warn('stop runner error', e); }
        try {
            const lock = readRunLock(agentId);
            if (lock && lock.tabId === tabIdRef.current) {
                clearRunLock(agentId);
            }
            if (heartbeatRef.current) {
                window.clearInterval(heartbeatRef.current as number);
                heartbeatRef.current = null;
            }
        } catch (e) {
            // ignore
        }
    };

    // Cleanup runner on unmount
    useEffect(() => {
        return () => {
            try { runnerRef.current?.stop(); } catch (e) { /* ignore */ }
            runnerRef.current = null;
            // On unmount, if this tab owns the run lock, clear it
            try {
                const lock = readRunLock(agentId);
                if (lock && lock.tabId === tabIdRef.current) {
                    clearRunLock(agentId);
                }
            } catch (e) {
                // ignore
            }
            try { if (heartbeatRef.current) window.clearInterval(heartbeatRef.current as number); } catch (e) { /* ignore */ }
        };
    }, []);

    // Listen for run-lock changes from other tabs to disable UI if another tab starts the agent
    useEffect(() => {
        if (!agentId) return;
        const handler = (e: StorageEvent) => {
            if (!e.key) return;
            if (e.key !== getRunLockKey(agentId)) return;
            try {
                const lock = e.newValue ? JSON.parse(e.newValue) : null;
                if (lock && lock.tabId !== tabIdRef.current) {
                    // Another tab acquired the lock — stop local runner UI
                    try { runnerRef.current?.stop(); } catch (err) { /* ignore */ }
                    setIsRunning(false);
                }
            } catch (err) {
                // ignore
            }
        };

        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, [agentId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white text-black p-4 md:p-8">
                <MainNav />
                <div className="border-4 border-black bg-white p-12 text-center"
                    style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
                    <div className="text-4xl mb-4">⟲</div>
                    <div className="text-2xl font-bold mb-2">LOADING_USER_AGENT...</div>
                    <div className="text-sm text-gray-600">FETCHING AGENT DATA</div>
                </div>

                {/* All Predictions - show agent's predictions inline */}
                <div className="border-4 border-black bg-white p-6 mb-6"
                    style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                    <h2 className="text-xl font-bold mb-4">ALL_PREDICTIONS ({predictions.length})</h2>

                    {predictions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-2xl mb-2">📭</div>
                            <div className="font-bold">NO_PREDICTIONS_YET</div>
                            <div className="text-sm">This agent hasn't made any predictions yet.</div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {predictions.map(prediction => (
                                <div key={prediction.id} className="border-l-4 border-gray-300 pl-4 py-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold">{prediction.market_question}</div>
                                        <div className="flex gap-2 items-center">
                                            <div className={`px-2 py-1 text-sm font-bold ${prediction.prediction === 'YES' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {prediction.prediction} ({Math.round(prediction.confidence * 100)}%)
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-600 mb-1">
                                        <span className="mr-2">Bet: <span className="font-bold">{`$${prediction.bet_amount}`}</span></span>
                                        <span className="mr-2">Status: <span className="font-bold">{prediction.position_status}</span></span>
                                        <span className={((prediction.expected_payout || 0) - (prediction.bet_amount || 0)) >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                            exPNL: {`$${((prediction.expected_payout || 0)).toFixed(2)}`}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-700">
                                        {prediction.reasoning ? prediction.reasoning.slice(0, 150) + '...' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div className="min-h-screen bg-white text-black p-4 md:p-8">
                <MainNav />
                <div className="border-4 border-black bg-red-50 p-12 text-center"
                    style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
                    <div className="text-4xl mb-4">⚠</div>
                    <div className="text-2xl font-bold mb-2">USER_AGENT_NOT_FOUND</div>
                    <div className="text-sm text-gray-600 mb-4">
                        {error || 'The requested agent could not be found'}
                    </div>
                    <Link
                        href="/agents"
                        className="border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100"
                    >
                        ← BACK_TO_AGENTS
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate derived stats
    const openPositions = predictions.filter(p => p.position_status === 'OPEN');
    const closedPositions = predictions.filter(p => p.position_status !== 'OPEN');
    const resolvedPredictions = predictions.filter(p => p.resolved);

    // Calculate P&L using the same logic as market view page
    let totalUnrealizedPnL = 0;
    let totalPositionValue = 0;

    // For open positions, calculate expected payout and wagered amounts
    let totalWagered = 0;
    openPositions.forEach(prediction => {
        // Position value is the expected payout if the prediction is correct
        const expectedPayout = prediction.expected_payout || 0;
        totalPositionValue += expectedPayout;

        // Track total wagered amount
        totalWagered += prediction.bet_amount || 0;
    });

    // Net Worth = Current Balance + Expected Payouts from Open Positions
    const currentBalance = balance?.current_balance || 0;
    const netWorth = currentBalance + totalPositionValue;

    // Floating P&L = Expected Payout - Amount Wagered (potential profit from positions)
    const totalPnL = totalPositionValue - totalWagered;

    // Floating ROI based on P&L vs initial investment
    const totalInvested = balance?.initial_balance || 1000;
    const pnlBasedROI = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    // Performance metrics
    const avgConfidence = predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
        : 0;
    const avgBetSize = predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.bet_amount, 0) / predictions.length
        : 0;

    return (
        <div className="min-h-screen bg-white text-black p-4 md:p-8">
            {/* Navigation */}
            <MainNav />

            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        <Link href="/agents" className="text-sm text-gray-600 hover:text-black">
                            ← BACK_TO_AGENTS
                        </Link>
                        <Link
                            href="/agents"
                            className="text-sm font-bold px-2 py-1 border-2 border-black bg-white hover:bg-gray-100"
                        >
                            CELEBRITY_AGENTS
                        </Link>
                    </div>
                </div>

                {/* Agent Header */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="text-6xl">{agent.avatar}</div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-gray-600 mb-1">
                            USER AGENT #{agent.id.toUpperCase()}
                        </div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                {agent.name}
                            </h1>
                            <Link
                                href={`/agents/user/${agent.id}/edit`}
                                className="border-2 border-black px-3 py-1 font-bold bg-white hover:bg-gray-100 text-sm"
                            >
                                EDIT_AGENT
                            </Link>
                        </div>

                        {/* Agent Controller UI (moved controls to right column) */}
                        <div className="mt-3">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                    <span className="text-sm font-bold">{isRunning ? 'Running' : 'Stopped'}</span>
                                </div>

                                {/* Cycle speed controls */}
                                <div className="ml-4 flex gap-2 items-center">
                                    <div className="text-xs text-gray-600 mr-2">CYCLE SPEED:</div>
                                    {(['slow', 'moderate', 'fast'] as const).map((s) => {
                                        const label = s === 'slow' ? 'SLOW' : s === 'moderate' ? 'MODERATE' : 'FAST';
                                        return (
                                            <button
                                                key={s}
                                                onClick={() => {
                                                    const map: Record<string, number> = {
                                                        slow: 10 * 60 * 1000,
                                                        moderate: 5 * 60 * 1000,
                                                        fast: 1 * 60 * 1000
                                                    };
                                                    setSelectedSpeed(s as any);
                                                    setRunnerIntervalMs(map[s]);
                                                }}
                                                className={`px-2 py-1 text-xs font-bold border-2 ${selectedSpeed === s ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-100 border-gray-300'}`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 text-xs mt-2">
                            <span className="px-2 py-1 bg-gray-100 border border-black">
                                {agent.strategy_type}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 border border-black">
                                GEN {agent.generation}
                            </span>
                            <span className={`px-2 py-1 border border-black ${balance && balance.current_balance > 10
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {balance && balance.current_balance > 10 ? 'ACTIVE' : 'BANKRUPT'}
                            </span>
                        </div>

                        {/* Controls column (right-aligned) */}
                        <div className="flex-none ml-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={startAgent}
                                    disabled={isRunning}
                                    className={`px-3 py-1 border-2 font-bold text-sm ${isRunning ? 'bg-gray-200 text-gray-600 border-gray-400' : 'bg-white hover:bg-green-50 border-green-600 text-green-700'}`}
                                >
                                    START_AGENT
                                </button>

                                <button
                                    onClick={stopAgent}
                                    disabled={!isRunning}
                                    className={`px-3 py-1 border-2 font-bold text-sm ${!isRunning ? 'bg-gray-200 text-gray-600 border-gray-400' : 'bg-white hover:bg-red-50 border-red-600 text-red-700'}`}
                                >
                                    STOP_AGENT
                                </button>

                                <button
                                    onClick={() => {
                                        // Stop the runner first using the page-level control
                                        try { stopAgent(); } catch (e) { console.warn('stop runner during reset failed', e); }
                                        setIsRunning(false);

                                        try {
                                            // Clear predictions and reset agent stats in the local store
                                            useUserAgentStore.getState().clearAgentPredictions(agent.id);

                                            // Refresh local state from the store
                                            const store = useUserAgentStore.getState();
                                            const updatedAgent = store.getAgent(agent.id);
                                            if (updatedAgent) {
                                                const mappedBalance = {
                                                    agent_id: updatedAgent.id,
                                                    agent_name: updatedAgent.name,
                                                    current_balance: updatedAgent.current_balance,
                                                    initial_balance: updatedAgent.initial_balance,
                                                    total_wagered: updatedAgent.total_wagered || 0,
                                                    total_winnings: updatedAgent.total_winnings || 0,
                                                    total_losses: updatedAgent.total_losses || 0,
                                                    prediction_count: updatedAgent.prediction_count || 0,
                                                    win_count: updatedAgent.win_count || 0,
                                                    loss_count: updatedAgent.loss_count || 0,
                                                    win_rate: updatedAgent.win_rate || 0,
                                                    roi: updatedAgent.roi || 0,
                                                    biggest_win: updatedAgent.biggest_win || 0,
                                                    biggest_loss: updatedAgent.biggest_loss || 0,
                                                    current_streak: updatedAgent.current_streak || 0,
                                                    last_updated: updatedAgent.last_updated || updatedAgent.created_at || new Date().toISOString()
                                                };

                                                setBalance(mappedBalance);
                                                setPredictions(store.getAgentPredictions(agent.id) || []);
                                            }
                                        } catch (err) {
                                            console.error('Reset agent failed', err);
                                        }
                                    }}
                                    className="px-3 py-1 border-2 font-bold text-sm bg-white hover:bg-yellow-50 border-yellow-600 text-yellow-700"
                                >
                                    RESET_AGENT
                                </button>

                                <button
                                    onClick={() => {
                                        try {
                                            const json = useUserAgentStore.getState().exportAgentData(agent.id);
                                            const blob = new Blob([json], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            // Build a safe filename: UserAGENT-{AGENT_NAME}.json
                                            const safeName = (agent.name || agent.id).toString().replace(/[^a-z0-9\-_.]/gi, '-').replace(/-+/g, '-');
                                            const filename = `UserAGENT-${safeName}.json`;
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = filename;
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                            URL.revokeObjectURL(url);
                                        } catch (err) {
                                            console.error('Export agent failed', err);
                                        }
                                    }}
                                    className="px-3 py-1 border-2 font-bold text-sm bg-white hover:bg-blue-50 border-blue-600 text-blue-700"
                                >
                                    EXPORT_STATE
                                </button>

                                {/* Hidden file input for importing agent JSON */}
                                <input
                                    ref={importInputRef}
                                    type="file"
                                    accept="application/json,.json"
                                    onChange={handleFileSelected}
                                    style={{ display: 'none' }}
                                />

                                <button
                                    onClick={() => importInputRef.current?.click()}
                                    className="px-3 py-1 border-2 font-bold text-sm bg-white hover:bg-green-50 border-green-600 text-green-700"
                                >
                                    IMPORT_AGENT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
                {(['overview', 'positions', 'history', 'analytics'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 border-2 border-black font-bold text-xs uppercase ${activeTab === tab
                            ? 'bg-black text-white'
                            : 'bg-white text-black hover:bg-gray-100'
                            }`}
                        style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content - reuses layout/logic from agent detail view */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Portfolio Card */}
                    <div className="border-4 border-black bg-white p-6"
                        style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                        <h2 className="text-lg font-bold mb-4">PORTFOLIO</h2>
                        <div className="space-y-3">
                            <div>
                                <div className="text-xs text-gray-600">NET WORTH</div>
                                <div className={`text-3xl font-bold ${netWorth > totalInvested ? 'text-green-600' :
                                    netWorth < totalInvested ? 'text-red-600' : ''}`}>
                                    ${netWorth.toFixed(2)}
                                </div>
                            </div>
                            <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span>Cash Balance:</span>
                                    <span className="font-bold">${balance?.current_balance.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Position Value:</span>
                                    <span className="font-bold">${totalPositionValue.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1">
                                    <span>Initial Capital:</span>
                                    <span className="font-bold text-gray-600">${balance?.initial_balance.toFixed(2) || '1000.00'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Card */}
                    <div className="border-4 border-black bg-white p-6"
                        style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                        <h2 className="text-lg font-bold mb-4">PERFORMANCE</h2>
                        <div className="space-y-3">
                            <div>
                                <div className="text-xs text-gray-600">WIN RATE</div>
                                <div className="text-2xl font-bold">
                                    {balance?.win_rate.toFixed(1) || '0.0'}%
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-600">CURRENT STREAK</div>
                                <div className="text-lg font-bold">
                                    {balance?.current_streak && balance.current_streak > 0
                                        ? `🔥 ${balance.current_streak} WINS`
                                        : balance?.current_streak && balance.current_streak < 0
                                            ? `❄️ ${Math.abs(balance.current_streak)} LOSSES`
                                            : '➖ NO STREAK'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating P&L Card */}
                    <div className="border-4 border-black bg-white p-6"
                        style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                        <h2 className="text-lg font-bold mb-4">FLOATING P&L</h2>
                        <div className="space-y-3">
                            <div>
                                <div className={`text-3xl font-bold ${totalPnL > 0 ? 'text-green-600' :
                                    totalPnL < 0 ? 'text-red-600' : ''
                                    }`}>
                                    {totalPnL > 0 ? '+' : ''}${totalPnL.toFixed(2)}
                                </div>
                            </div>
                            <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span>Open Positions:</span>
                                    <span className="font-bold">{openPositions.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Expected Payout:</span>
                                    <span className="font-bold">${totalPositionValue.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Cash at Risk:</span>
                                    <span className="font-bold">${totalWagered.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-200">
                                <div className="flex justify-between text-xs">
                                    <span>Biggest Win:</span>
                                    <span className="font-bold text-green-600">
                                        +${balance?.biggest_win.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span>Biggest Loss:</span>
                                    <span className="font-bold text-red-600">
                                        -${balance?.biggest_loss.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Stats */}
                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="border-2 border-black p-4 text-center">
                            <div className="text-2xl font-bold">{predictions.length}</div>
                            <div className="text-xs text-gray-600">TOTAL PREDICTIONS</div>
                        </div>
                        <div className="border-2 border-black p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{openPositions.length}</div>
                            <div className="text-xs text-gray-600">OPEN POSITIONS</div>
                        </div>
                        <div className="border-2 border-black p-4 text-center">
                            <div className="text-2xl font-bold">{avgConfidence.toFixed(0)}%</div>
                            <div className="text-xs text-gray-600">AVG CONFIDENCE</div>
                        </div>
                        <div className="border-2 border-black p-4 text-center">
                            <div className="text-2xl font-bold">${avgBetSize.toFixed(0)}</div>
                            <div className="text-xs text-gray-600">AVG BET SIZE</div>
                        </div>
                    </div>


                </div>
            )}

            {activeTab === 'positions' && (
                <div className="space-y-6">
                    {/* Open Positions */}
                    <div className="border-4 border-black bg-white p-6"
                        style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                        <h2 className="text-xl font-bold mb-4">OPEN_POSITIONS ({openPositions.length})</h2>

                        {openPositions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="text-2xl mb-2">💼</div>
                                <div className="font-bold">NO_OPEN_POSITIONS</div>
                                <div className="text-sm">Agent has no active positions</div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {openPositions.map((prediction) => {
                                    const entryOdd = prediction.prediction === 'YES'
                                        ? prediction.entry_odds.yes_price
                                        : prediction.entry_odds.no_price;

                                    return (
                                        <div key={prediction.id} className="border-2 border-gray-200 p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <Link
                                                        href={`/markets/${prediction.market_id}`}
                                                        className="font-bold hover:underline"
                                                    >
                                                        {prediction.market_question}
                                                    </Link>
                                                </div>
                                                <div className={`px-2 py-1 text-xs font-bold ${prediction.prediction === 'YES'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {prediction.prediction}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-4 text-xs">
                                                <div>
                                                    <span className="text-gray-600">BET:</span>
                                                    <span className="font-bold ml-1">${prediction.bet_amount}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">ENTRY:</span>
                                                    <span className="font-bold ml-1">{Math.round(entryOdd * 100)}¢</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">CONFIDENCE:</span>
                                                    <span className="font-bold ml-1">{Math.round(prediction.confidence * 100)}%</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">P&L:</span>
                                                    <span className={`font-bold ml-1 ${(() => {
                                                        // P&L = Expected Payout - Bet Amount
                                                        const expectedPayout = prediction.expected_payout || 0;
                                                        const pnl = expectedPayout - prediction.bet_amount;
                                                        return pnl >= 0 ? 'text-green-600' : 'text-red-600';
                                                    })()}`}>
                                                        {(() => {
                                                            // P&L = Expected Payout - Bet Amount
                                                            const expectedPayout = prediction.expected_payout || 0;
                                                            const pnl = expectedPayout - prediction.bet_amount;
                                                            return `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="border-4 border-black bg-white p-6"
                    style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                    <h2 className="text-xl font-bold mb-4">PREDICTION_HISTORY ({predictions.length})</h2>

                    {predictions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-2xl mb-2">📊</div>
                            <div className="font-bold">NO_PREDICTIONS_YET</div>
                            <div className="text-sm">Agent hasn't made any predictions</div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {predictions.slice(0, 10).map((prediction) => (
                                <div key={prediction.id} className="border-l-4 border-gray-300 pl-4 py-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <Link
                                            href={`/markets/${prediction.market_id}`}
                                            className="font-bold hover:underline"
                                        >
                                            {prediction.market_question}
                                        </Link>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 text-xs font-bold ${prediction.prediction === 'YES'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {prediction.prediction}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-bold ${prediction.position_status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                                }`}>
                                                {prediction.position_status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-600 mb-2">
                                        <span>Bet: ${prediction.bet_amount}</span>
                                        <span className="mx-2">•</span>
                                        <span>Confidence: {Math.round(prediction.confidence * 100)}%</span>
                                        <span className="mx-2">•</span>
                                        <span>{new Date(prediction.created_at).toLocaleDateString()}</span>
                                    </div>

                                    <div className="text-sm text-gray-700">
                                        {prediction.reasoning.slice(0, 200)}...
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="border-4 border-black bg-white p-6"
                            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                            <h3 className="font-bold mb-2">PREDICTION ACCURACY</h3>
                            <div className="text-2xl font-bold mb-1">
                                {resolvedPredictions.length > 0
                                    ? ((resolvedPredictions.filter(p => p.correct).length / resolvedPredictions.length) * 100).toFixed(1)
                                    : '0.0'}%
                            </div>
                            <div className="text-xs text-gray-600">
                                {resolvedPredictions.filter(p => p.correct).length} correct out of {resolvedPredictions.length} resolved
                            </div>
                        </div>

                        <div className="border-4 border-black bg-white p-6"
                            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                            <h3 className="font-bold mb-2">AVG POSITION SIZE</h3>
                            <div className="text-2xl font-bold mb-1">
                                ${avgBetSize.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-600">
                                Across {predictions.length} predictions
                            </div>
                        </div>

                        <div className="border-4 border-black bg-white p-6"
                            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                            <h3 className="font-bold mb-2">RISK APPETITE</h3>
                            <div className="text-2xl font-bold mb-1">
                                {avgConfidence.toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-600">
                                Average confidence level
                            </div>
                        </div>
                    </div>

                    {/* Strategy Breakdown */}
                    <div className="border-4 border-black bg-white p-6"
                        style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                        <h3 className="text-lg font-bold mb-4">STRATEGY_ANALYSIS</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold mb-2">PREDICTION BREAKDOWN</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>YES Predictions:</span>
                                        <span className="font-bold">{predictions.filter(p => p.prediction === 'YES').length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>NO Predictions:</span>
                                        <span className="font-bold">{predictions.filter(p => p.prediction === 'NO').length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>High Confidence (&gt;80%):</span>
                                        <span className="font-bold">{predictions.filter(p => p.confidence > 0.8).length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Low Confidence (&lt;60%):</span>
                                        <span className="font-bold">{predictions.filter(p => p.confidence < 0.6).length}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold mb-2">FINANCIAL METRICS</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Largest Bet:</span>
                                        <span className="font-bold">
                                            ${Math.max(...predictions.map(p => p.bet_amount), 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Smallest Bet:</span>
                                        <span className="font-bold">
                                            ${Math.min(...predictions.map(p => p.bet_amount), 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Volume:</span>
                                        <span className="font-bold">
                                            ${predictions.reduce((sum, p) => sum + p.bet_amount, 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Avg Days Active:</span>
                                        <span className="font-bold">
                                            {predictions.length > 0
                                                ? Math.round((Date.now() - new Date(predictions[predictions.length - 1].created_at).getTime()) / (1000 * 60 * 60 * 24))
                                                : 0} days
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Position Reasoning - Always visible at bottom */}
            {openPositions.length > 0 && (
                <div className="border-4 border-black bg-white p-6 mt-6"
                    style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                    <h2 className="text-xl font-bold mb-4">POSITION_REASONING ({openPositions.length})</h2>

                    <div className="h-96 overflow-y-auto border-2 border-gray-200 p-4">
                        <div className="space-y-1">
                            {openPositions.map((prediction, index) => {
                                const isExpanded = expandedPositions[prediction.id] ?? (index === 0); // First item expanded by default
                                const toggleExpanded = () => {
                                    setExpandedPositions(prev => ({
                                        ...prev,
                                        [prediction.id]: !isExpanded
                                    }));
                                };

                                return (
                                    <div key={prediction.id} className="border border-gray-300">
                                        {/* Sticky Header */}
                                        <div
                                            className="sticky top-0 bg-white border-b border-gray-300 p-3 cursor-pointer hover:bg-gray-50 transition-colors z-10"
                                            onClick={toggleExpanded}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-lg font-bold">
                                                            {isExpanded ? '▼' : '▶'}
                                                        </span>
                                                        <div className="font-bold text-sm">
                                                            {prediction.market_question}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 text-xs ml-6">
                                                        <span className={`px-2 py-1 font-bold ${prediction.prediction === 'YES'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {prediction.prediction}
                                                        </span>
                                                        <span className="text-gray-600">
                                                            ${prediction.bet_amount} • {Math.round(prediction.confidence * 100)}% confidence
                                                        </span>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/markets/${prediction.market_id}`}
                                                    className="px-3 py-1 text-xs font-bold border-2 border-black bg-white hover:bg-black hover:text-white transition-all ml-4"
                                                    style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}
                                                    onClick={(e) => e.stopPropagation()} // Prevent header click when clicking button
                                                >
                                                    VIEW MARKET
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Collapsible Content */}
                                        {isExpanded && (
                                            <div className="p-4 bg-gray-50">
                                                <div className="text-sm text-gray-700 leading-relaxed">
                                                    {prediction.reasoning || 'No reasoning provided'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Import confirmation modal */}
            {importModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white p-6 rounded shadow-lg max-w-lg mx-4">
                        <h3 className="text-lg font-bold mb-2">Imported agent personality differs</h3>
                        <p className="text-sm text-gray-700 mb-4">
                            The imported agent <span className="font-bold">{pendingImportedAgentName}</span> contains a different personality than the current agent. Do you want to replace the current personality with the imported one, or preserve the current personality?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    // Preserve current personality
                                    if (pendingImportJson) {
                                        try {
                                            useUserAgentStore.getState().importAgentData(pendingImportJson, { preservePersonality: true });
                                            const store = useUserAgentStore.getState();
                                            const updatedAgent = store.getAgent(agentId);
                                            if (updatedAgent) {
                                                const mappedBalance = {
                                                    agent_id: updatedAgent.id,
                                                    agent_name: updatedAgent.name,
                                                    current_balance: updatedAgent.current_balance,
                                                    initial_balance: updatedAgent.initial_balance,
                                                    total_wagered: updatedAgent.total_wagered || 0,
                                                    total_winnings: updatedAgent.total_winnings || 0,
                                                    total_losses: updatedAgent.total_losses || 0,
                                                    prediction_count: updatedAgent.prediction_count || 0,
                                                    win_count: updatedAgent.win_count || 0,
                                                    loss_count: updatedAgent.loss_count || 0,
                                                    win_rate: updatedAgent.win_rate || 0,
                                                    roi: updatedAgent.roi || 0,
                                                    biggest_win: updatedAgent.biggest_win || 0,
                                                    biggest_loss: updatedAgent.biggest_loss || 0,
                                                    current_streak: updatedAgent.current_streak || 0,
                                                    last_updated: updatedAgent.last_updated || updatedAgent.created_at || new Date().toISOString()
                                                };

                                                setBalance(mappedBalance);
                                                setPredictions(store.getAgentPredictions(agentId) || []);
                                            }
                                        } catch (err) {
                                            console.error('Import (preserve) failed', err);
                                        }
                                    }

                                    setImportModalOpen(false);
                                    setPendingImportJson(null);
                                    setPendingImportedAgentName(null);
                                }}
                                className="px-3 py-1 border-2 font-bold text-sm bg-white hover:bg-gray-100 border-gray-300"
                            >
                                PRESERVE_PERSONALITY
                            </button>

                            <button
                                onClick={() => {
                                    // Replace personality with imported one
                                    if (pendingImportJson) {
                                        try {
                                            useUserAgentStore.getState().importAgentData(pendingImportJson, { preservePersonality: false });
                                            const store = useUserAgentStore.getState();
                                            const updatedAgent = store.getAgent(agentId);
                                            if (updatedAgent) {
                                                const mappedBalance = {
                                                    agent_id: updatedAgent.id,
                                                    agent_name: updatedAgent.name,
                                                    current_balance: updatedAgent.current_balance,
                                                    initial_balance: updatedAgent.initial_balance,
                                                    total_wagered: updatedAgent.total_wagered || 0,
                                                    total_winnings: updatedAgent.total_winnings || 0,
                                                    total_losses: updatedAgent.total_losses || 0,
                                                    prediction_count: updatedAgent.prediction_count || 0,
                                                    win_count: updatedAgent.win_count || 0,
                                                    loss_count: updatedAgent.loss_count || 0,
                                                    win_rate: updatedAgent.win_rate || 0,
                                                    roi: updatedAgent.roi || 0,
                                                    biggest_win: updatedAgent.biggest_win || 0,
                                                    biggest_loss: updatedAgent.biggest_loss || 0,
                                                    current_streak: updatedAgent.current_streak || 0,
                                                    last_updated: updatedAgent.last_updated || updatedAgent.created_at || new Date().toISOString()
                                                };

                                                setBalance(mappedBalance);
                                                setPredictions(store.getAgentPredictions(agentId) || []);
                                            }
                                        } catch (err) {
                                            console.error('Import (replace) failed', err);
                                        }
                                    }

                                    setImportModalOpen(false);
                                    setPendingImportJson(null);
                                    setPendingImportedAgentName(null);
                                }}
                                className="px-3 py-1 border-2 font-bold text-sm bg-white hover:bg-blue-50 border-blue-600 text-blue-700"
                            >
                                REPLACE_PERSONALITY
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
