'use client';

import { MainNav } from '@/components/navigation/MainNav';
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

export default function AgentDetailPage() {
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

  // Keep track of cleanup functions for real-time listeners
  const cleanupFunctions = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!agentId) return;

    let isActive = true;

    const fetchAgentData = async () => {
      if (!isActive) return;

      try {
        setConnected(true);

        // Fetch agent details, balance, and predictions in parallel
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

  if (loading) {
    return (
      <div className="min-h-screen  text-white p-4 md:p-8">
        <MainNav />
        <div className="border-1 border-gray  p-12 text-center"
          style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
          <div className="text-4xl mb-4">⟲</div>
          <div className="text-2xl font-bold mb-2">LOADING_AGENT...</div>
          <div className="text-sm text-white-600">FETCHING AGENT DATA</div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen  text-white p-4 md:p-8">
        <MainNav />
        <div className="border-1 border-gray bg-red-50 p-12 text-center"
          style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
          <div className="text-4xl mb-4">⚠</div>
          <div className="text-2xl font-bold mb-2">AGENT_NOT_FOUND</div>
          <div className="text-sm text-white-600 mb-4">
            {error || 'The requested agent could not be found'}
          </div>
          <Link
            href="/agents"
            className="border-2 border-gray px-4 py-2 font-bold  hover:bg-gray-100"
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
    <div className="min-h-screen  text-white p-4 md:p-8">
      {/* Navigation */}
      <MainNav />

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <Link href="/agents" className="text-sm text-white-600 hover:text-white">
            ← BACK_TO_AGENTS
          </Link>
        </div>

        {/* Agent Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl">{agent.avatar}</div>
          <div>
            <div className="text-xs font-bold text-white-600 mb-1">
              AGENT #{agent.id.toUpperCase()}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {agent.name}
            </h1>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-gray-100 border border-gray">
                {agent.strategy_type}
              </span>
              <span className="px-2 py-1 bg-gray-100 border border-gray">
                GEN {agent.generation}
              </span>
              <span className={`px-2 py-1 border border-gray ${balance && balance.current_balance > 10
                ? 'bg-gray-100 text-green-800'
                : 'bg-red-100 text-red-800'
                }`}>
                {balance && balance.current_balance > 10 ? 'ACTIVE' : 'BANKRUPT'}
              </span>
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
            className={`px-4 py-2 border-2 border-gray font-bold text-xs uppercase ${activeTab === tab
              ? 'bg-black text-white'
              : ' text-white hover:bg-gray-100'
              }`}
            style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Card */}
          <div className="border-1 border-gray  p-6"
            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <h2 className="text-lg font-bold mb-4">PORTFOLIO</h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-white-600">NET WORTH</div>
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
                  <span className="font-bold text-white-600">${balance?.initial_balance.toFixed(2) || '1000.00'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Card */}
          <div className="border-1 border-gray  p-6"
            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <h2 className="text-lg font-bold mb-4">PERFORMANCE</h2>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-white-600">WIN RATE</div>
                <div className="text-2xl font-bold">
                  {balance?.win_rate.toFixed(1) || '0.0'}%
                </div>
              </div>
              <div>
                <div className="text-xs text-white-600">CURRENT STREAK</div>
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
          <div className="border-1 border-gray  p-6"
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
            <div className="border-2 border-gray p-4 text-center">
              <div className="text-2xl font-bold">{predictions.length}</div>
              <div className="text-xs text-white-600">TOTAL PREDICTIONS</div>
            </div>
            <div className="border-2 border-gray p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{openPositions.length}</div>
              <div className="text-xs text-white-600">OPEN POSITIONS</div>
            </div>
            <div className="border-2 border-gray p-4 text-center">
              <div className="text-2xl font-bold">{avgConfidence.toFixed(0)}%</div>
              <div className="text-xs text-white-600">AVG CONFIDENCE</div>
            </div>
            <div className="border-2 border-gray p-4 text-center">
              <div className="text-2xl font-bold">${avgBetSize.toFixed(0)}</div>
              <div className="text-xs text-white-600">AVG BET SIZE</div>
            </div>
          </div>


        </div>
      )}

      {activeTab === 'positions' && (
        <div className="space-y-6">
          {/* Open Positions */}
          <div className="border-1 border-gray  p-6"
            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <h2 className="text-xl font-bold mb-4">OPEN_POSITIONS ({openPositions.length})</h2>

            {openPositions.length === 0 ? (
              <div className="text-center py-8 text-white-500">
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
                          ? 'bg-gray-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                          }`}>
                          {prediction.prediction}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-white-600">BET:</span>
                          <span className="font-bold ml-1">${prediction.bet_amount}</span>
                        </div>
                        <div>
                          <span className="text-white-600">ENTRY:</span>
                          <span className="font-bold ml-1">{Math.round(entryOdd * 100)}¢</span>
                        </div>
                        <div>
                          <span className="text-white-600">CONFIDENCE:</span>
                          <span className="font-bold ml-1">{Math.round(prediction.confidence * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-white-600">P&L:</span>
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
        <div className="border-1 border-gray  p-6"
          style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
          <h2 className="text-xl font-bold mb-4">PREDICTION_HISTORY ({predictions.length})</h2>

          {predictions.length === 0 ? (
            <div className="text-center py-8 text-white-500">
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
                        ? 'bg-gray-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {prediction.prediction}
                      </span>
                      <span className={`px-2 py-1 text-xs font-bold ${prediction.position_status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-white-700'
                        }`}>
                        {prediction.position_status}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-white-600 mb-2">
                    <span>Bet: ${prediction.bet_amount}</span>
                    <span className="mx-2">•</span>
                    <span>Confidence: {Math.round(prediction.confidence * 100)}%</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(prediction.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="text-sm text-white-700">
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
            <div className="border-1 border-gray  p-6"
              style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
              <h3 className="font-bold mb-2">PREDICTION ACCURACY</h3>
              <div className="text-2xl font-bold mb-1">
                {resolvedPredictions.length > 0
                  ? ((resolvedPredictions.filter(p => p.correct).length / resolvedPredictions.length) * 100).toFixed(1)
                  : '0.0'}%
              </div>
              <div className="text-xs text-white-600">
                {resolvedPredictions.filter(p => p.correct).length} correct out of {resolvedPredictions.length} resolved
              </div>
            </div>

            <div className="border-1 border-gray  p-6"
              style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
              <h3 className="font-bold mb-2">AVG POSITION SIZE</h3>
              <div className="text-2xl font-bold mb-1">
                ${avgBetSize.toFixed(2)}
              </div>
              <div className="text-xs text-white-600">
                Across {predictions.length} predictions
              </div>
            </div>

            <div className="border-1 border-gray  p-6"
              style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
              <h3 className="font-bold mb-2">RISK APPETITE</h3>
              <div className="text-2xl font-bold mb-1">
                {avgConfidence.toFixed(0)}%
              </div>
              <div className="text-xs text-white-600">
                Average confidence level
              </div>
            </div>
          </div>

          {/* Strategy Breakdown */}
          <div className="border-1 border-gray  p-6"
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
        <div className="border-1 border-gray  p-6 mt-6"
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
                      className="sticky top-0  border-b border-gray-300 p-3 cursor-pointer hover:bg-gray-50 transition-colors z-10"
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
                              ? 'bg-gray-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                              }`}>
                              {prediction.prediction}
                            </span>
                            <span className="text-white-600">
                              ${prediction.bet_amount} • {Math.round(prediction.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/markets/${prediction.market_id}`}
                          className="px-3 py-1 text-xs font-bold border-2 border-gray  hover:bg-black hover:text-white transition-all ml-4"
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
                        <div className="text-sm text-white-700 leading-relaxed">
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
    </div>
  );
}

