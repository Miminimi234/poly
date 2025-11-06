'use client';

import { MainNav } from '@/components/navigation/MainNav';
import '@/styles/poly402.css';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface Prediction {
  id: string;
  prediction: string;
  confidence: number;
  reasoning: string;
  price_at_prediction: number;
  research_cost: number;
  // Betting fields
  bet_amount: number;
  entry_odds: {
    yes_price: number;
    no_price: number;
  };
  expected_payout: number;
  actual_payout: number;
  // Resolution fields
  outcome: string | null;
  correct: boolean | null;
  profit_loss: number | null;
  created_at: string;
  resolved_at: string | null;
  agents: {
    id: string;
    name: string;
    strategy_type: string;
    generation: number;
    avatar?: string;
    color?: string;
  };
  polymarket_markets: {
    id: string;
    question: string;
    market_slug: string;
    end_date: string;
    yes_price: number;
    no_price: number;
    resolved: boolean;
    outcome: string | null;
  };
}

interface Stats {
  total: number;
  resolved: number;
  unresolved: number;
  correct: number;
  incorrect: number;
  accuracy: string;
  yesPredictions: number;
  noPredictions: number;
  totalResearchCost: string;
  totalProfitLoss: string;
  avgConfidence: string;
  currentStreak: number;
  longestStreak: number;
}

const safeNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

// Helper function to get color classes based on agent color
const getAgentColorClasses = (color: string) => {
  const colorMap: { [key: string]: { bg: string; border: string; text: string } } = {
    green: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800' },
    blue: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800' },
    cyan: { bg: 'bg-cyan-100', border: 'border-cyan-500', text: 'text-cyan-800' },
    yellow: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800' },
    orange: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-800' },
    purple: { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-800' },
    indigo: { bg: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-800' },
    pink: { bg: 'bg-pink-100', border: 'border-pink-500', text: 'text-pink-800' },
  };
  return colorMap[color] || { bg: 'bg-gray-100', border: 'border-gray-500', text: 'text-gray-800' };
};

// Helper function to get prediction color classes
const getPredictionColorClasses = (prediction: string) => {
  return prediction === 'YES'
    ? { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800' }
    : { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800' };
};

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    agentId: '',
    prediction: '',
    resolved: '',
    correct: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    groupBy: ''
  });
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null);
  const predictionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    fetchAgents();
  }, []);

  // Auto-collapse reasoning when scrolling away
  useEffect(() => {
    if (!expandedReasoning) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && entry.target.id === `prediction-${expandedReasoning}`) {
            setExpandedReasoning(null);
          }
        });
      },
      { threshold: 0.1, rootMargin: '-50px 0px -50px 0px' }
    );

    const element = predictionRefs.current[expandedReasoning];
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [expandedReasoning]);

  useEffect(() => {
    fetchPredictions();
    fetchStats();
  }, [filters]);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/firebase/agents');
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.agentId) params.append('agentId', filters.agentId);
      if (filters.prediction) params.append('prediction', filters.prediction);
      if (filters.resolved) params.append('resolved', filters.resolved);
      if (filters.correct) params.append('correct', filters.correct);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/firebase/predictions/list?${params}`);
      const data = await response.json();

      if (data.success) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.agentId) params.append('agentId', filters.agentId);

      const response = await fetch(`/api/firebase/predictions/stats?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      agentId: '',
      prediction: '',
      resolved: '',
      correct: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      groupBy: ''
    });
  };

  // Group predictions based on the selected groupBy filter
  const groupPredictions = (predictions: Prediction[]) => {
    if (!filters.groupBy) {
      return { 'All Predictions': predictions };
    }

    return predictions.reduce((groups: { [key: string]: Prediction[] }, prediction) => {
      let groupKey = '';

      switch (filters.groupBy) {
        case 'market':
          groupKey = prediction.polymarket_markets?.question || 'Unknown Market';
          break;
        case 'agent':
          groupKey = prediction.agents?.name || 'Unknown Agent';
          break;
        case 'outcome':
          if (prediction.outcome === null) {
            groupKey = 'Pending Resolution';
          } else {
            groupKey = prediction.correct ? 'Correct Predictions' : 'Incorrect Predictions';
          }
          break;
        default:
          groupKey = 'All Predictions';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(prediction);
      return groups;
    }, {});
  };

  const groupedPredictions = groupPredictions(predictions);

  return (
    <div className="min-h-screen bg-white text-black p-4 sm:p-8">
      <MainNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-1">▶ PREDICTIONS</h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            ALL AGENT PREDICTIONS ACROSS MARKETS
          </p>
        </div>

        <Link
          href="/dashboard"
          className="border-4 border-black px-4 sm:px-6 py-2 sm:py-3 font-bold bg-white hover:bg-gray-100 text-xs sm:text-sm text-center"
          style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}
        >
          ← DASHBOARD
        </Link>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="border-4 border-black p-3 sm:p-4 bg-white text-center"
            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-xs text-gray-600 mb-1">TOTAL</div>
            <div className="text-2xl sm:text-3xl font-bold">{stats.total}</div>
          </div>

          <div className="border-4 border-black p-3 sm:p-4 bg-white text-center"
            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-xs text-gray-600 mb-1">ACCURACY</div>
            <div className="text-2xl sm:text-3xl font-bold">{stats.accuracy}%</div>
            <div className="text-xs text-gray-600 mt-1">{stats.correct}/{stats.resolved}</div>
          </div>

          <div className="border-4 border-black p-3 sm:p-4 bg-white text-center col-span-2 sm:col-span-1"
            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-xs text-gray-600 mb-1">PROFIT/LOSS</div>
            <div className={`text-2xl sm:text-3xl font-bold ${parseFloat(stats.totalProfitLoss) >= 0 ? 'text-black' : 'text-gray-600'
              }`}>
              {parseFloat(stats.totalProfitLoss) >= 0 ? '+' : ''}${stats.totalProfitLoss}
            </div>
          </div>

          <div className="border-4 border-black p-3 sm:p-4 bg-white text-center"
            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-xs text-gray-600 mb-1">WIN STREAK</div>
            <div className="text-2xl sm:text-3xl font-bold">
              ▲ {stats.currentStreak}
            </div>
            <div className="text-xs text-gray-600 mt-1">BEST: {stats.longestStreak}</div>
          </div>

          <div className="border-4 border-black p-3 sm:p-4 bg-white text-center"
            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-xs text-gray-600 mb-1">RESEARCH COST</div>
            <div className="text-2xl sm:text-3xl font-bold">
              ${stats.totalResearchCost}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="border-4 border-black bg-white p-3 sm:p-4 mb-4 sm:mb-6"
        style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <div className="text-sm sm:text-base font-bold">■ FILTERS</div>
          <button
            onClick={clearFilters}
            className="text-xs underline hover:no-underline"
          >
            CLEAR ALL
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Agent Filter */}
          <div>
            <label className="block text-xs font-bold mb-2">AGENT</label>
            <select
              value={filters.agentId}
              onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
              className="w-full border-2 border-black px-2 py-2 text-xs font-mono bg-white"
            >
              <option value="">ALL AGENTS</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prediction Filter */}
          <div>
            <label className="block text-xs font-bold mb-2">PREDICTION</label>
            <select
              value={filters.prediction}
              onChange={(e) => setFilters({ ...filters, prediction: e.target.value })}
              className="w-full border-2 border-black px-2 py-2 text-xs font-mono bg-white"
            >
              <option value="">YES & NO</option>
              <option value="YES">YES ONLY</option>
              <option value="NO">NO ONLY</option>
            </select>
          </div>

          {/* Resolved Filter */}
          <div>
            <label className="block text-xs font-bold mb-2">STATUS</label>
            <select
              value={filters.resolved}
              onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
              className="w-full border-2 border-black px-2 py-2 text-xs font-mono bg-white"
            >
              <option value="">ALL</option>
              <option value="true">RESOLVED</option>
              <option value="false">PENDING</option>
            </select>
          </div>

          {/* Correct Filter */}
          <div>
            <label className="block text-xs font-bold mb-2">OUTCOME</label>
            <select
              value={filters.correct}
              onChange={(e) => setFilters({ ...filters, correct: e.target.value })}
              className="w-full border-2 border-black px-2 py-2 text-xs font-mono bg-white"
            >
              <option value="">ALL</option>
              <option value="true">CORRECT</option>
              <option value="false">INCORRECT</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <label className="block text-xs font-bold mb-2">SORT BY</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full border-2 border-black px-2 py-2 text-xs font-mono bg-white"
            >
              <option value="created_at">DATE</option>
              <option value="confidence">CONFIDENCE</option>
              <option value="profit_loss">PROFIT/LOSS</option>
            </select>
          </div>

          {/* Group By Filter */}
          <div>
            <label className="block text-xs font-bold mb-2">GROUP BY</label>
            <select
              value={filters.groupBy}
              onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
              className="w-full border-2 border-black px-2 py-2 text-xs font-mono bg-white"
            >
              <option value="">NONE</option>
              <option value="market">MARKET</option>
              <option value="agent">AGENT</option>
              <option value="outcome">OUTCOME</option>
            </select>
          </div>
        </div>
      </div>

      {/* Predictions List */}
      <div className="border-4 border-black bg-white"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="border-b-4 border-black p-4 bg-gray-50 font-bold text-sm">
          ▶ PREDICTIONS ({predictions.length})
        </div>

        {loading ? (
          <div className="text-center text-gray-600 py-12">
            LOADING<span className="retro-blink">_</span>
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <div className="text-4xl mb-2">◆</div>
            <div className="text-sm font-bold">NO PREDICTIONS FOUND</div>
            <div className="text-xs mt-1">TRY ADJUSTING YOUR FILTERS</div>
          </div>
        ) : (
          <div>
            {Object.entries(groupedPredictions).map(([groupName, groupPredictions]) => (
              <div key={groupName}>
                {/* Group Header */}
                {filters.groupBy && (
                  <div className={`border-b-2 border-black p-3 font-bold text-xs ${filters.groupBy === 'agent' && groupPredictions[0]?.agents?.color
                    ? getAgentColorClasses(groupPredictions[0].agents.color).bg
                    : 'bg-gray-100'
                    }`}>
                    ■ {groupName.toUpperCase()} ({groupPredictions.length})
                  </div>
                )}

                {/* Group Predictions */}
                <div className={filters.groupBy ? "divide-y divide-gray-300" : "divide-y-2 divide-black"}>
                  {groupPredictions.map(pred => {
                    const agentColors = getAgentColorClasses(pred.agents?.color || 'gray');
                    const predictionColors = getPredictionColorClasses(pred.prediction);

                    const confidenceValue = safeNumber(pred.confidence);
                    const betAmount = safeNumber(pred.bet_amount);
                    const profitLoss = pred.profit_loss === null || pred.profit_loss === undefined
                      ? null
                      : safeNumber(pred.profit_loss);
                    const expectedPayout = safeNumber(pred.expected_payout);
                    const potentialGain = expectedPayout - betAmount;

                    return (
                      <div
                        key={pred.id}
                        id={`prediction-${pred.id}`}
                        ref={(el) => {
                          predictionRefs.current[pred.id] = el;
                        }}
                        className="w-full"
                      >
                        <div
                          onClick={() => setSelectedPrediction(pred)}
                          className="w-full p-3 sm:p-4 hover:bg-gray-50 text-left transition-colors cursor-pointer"
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2">
                            <div className="flex-1">
                              <div className="text-sm font-bold mb-2 leading-tight">
                                {pred.polymarket_markets?.question || 'Market question unavailable'}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                {/* Agent Tag with Color */}
                                <div className={`px-2 py-1 rounded-sm border-2 font-bold ${agentColors.bg} ${agentColors.border} ${agentColors.text}`}>
                                  {pred.agents?.name || 'Unknown'}
                                </div>
                                <span className="text-gray-600 hidden sm:inline">
                                  {pred.agents?.strategy_type?.toUpperCase() || 'UNKNOWN'}
                                  {pred.agents?.generation > 0 && ` • GEN ${pred.agents.generation}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:ml-4">
                              {/* Prediction Badge with Color */}
                              <div className={`px-2 sm:px-3 py-1 border-2 font-bold text-xs rounded-sm ${predictionColors.bg} ${predictionColors.border} ${predictionColors.text}`}>
                                {pred.prediction}
                              </div>

                              {/* Outcome Badge */}
                              {pred.outcome && (
                                <div className={`px-2 sm:px-3 py-1 border-2 border-gray-500 font-bold text-xs rounded-sm ${pred.correct ? 'bg-gray-800 text-white' : 'bg-gray-300 text-gray-700'
                                  }`}>
                                  {pred.correct ? '✓' : '✗'} {pred.correct ? 'CORRECT' : 'WRONG'}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-xs mb-2">
                            <div className="flex flex-wrap gap-3 sm:gap-4">
                              <span className="text-gray-600">
                                CONFIDENCE: <span className="font-bold text-black">
                                  {(confidenceValue * 100).toFixed(0)}%
                                </span>
                              </span>
                              <span className="text-gray-600">
                                BET: <span className="font-bold text-black">
                                  ${betAmount.toFixed(2)}
                                </span>
                              </span>
                              {profitLoss !== null && (
                                <span className="text-gray-600">
                                  P/L: <span className={`font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
                                  </span>
                                </span>
                              )}
                              {!pred.outcome && expectedPayout > 0 && (
                                <span className="text-gray-600">
                                  POTENTIAL: <span className="font-bold text-blue-600">
                                    +${potentialGain.toFixed(2)}
                                  </span>
                                </span>
                              )}
                            </div>

                            <span className="text-gray-500 text-right">
                              {new Date(pred.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Reasoning Snippet */}
                          {pred.reasoning && (
                            <div className="text-xs text-gray-600 border-t border-gray-200 pt-2">
                              {expandedReasoning === pred.id ? (
                                <div>
                                  <div className="leading-relaxed mb-2">
                                    {pred.reasoning}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedReasoning(null);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    See less
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <div className="leading-relaxed mb-1">
                                    {pred.reasoning.slice(0, 120)}
                                    {pred.reasoning.length > 120 && '...'}
                                  </div>
                                  {pred.reasoning.length > 120 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedReasoning(pred.id);
                                      }}
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      See more
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prediction Detail Modal */}
      {selectedPrediction && (
        <PredictionDetailModal
          prediction={selectedPrediction}
          onClose={() => setSelectedPrediction(null)}
        />
      )}
    </div>
  );
}

// Live Predictions Feed Component
function LivePredictionsFeed() {
  const [livePredictions, setLivePredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Firebase real-time subscription
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribe: (() => void) | null = null;

    const setupFirebaseListener = async () => {
      try {
        const { database } = await import('@/lib/firebase-config');
        const { ref, query, orderByChild, limitToLast, onValue } = await import('firebase/database');

        // Create a query for the most recent predictions
        const predictionsRef = ref(database, 'agent_predictions');
        const recentPredictionsQuery = query(
          predictionsRef,
          orderByChild('created_at'),
          limitToLast(20) // Get latest 20 predictions
        );

        // Set up real-time listener
        unsubscribe = onValue(recentPredictionsQuery, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const predictions = Object.entries(data).map(([id, pred]: [string, any]) => ({
              id,
              ...pred
            }));

            // Sort by created_at descending and limit to 10 for display
            const sortedPredictions = predictions
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 10);

            // Enrich predictions with agent and market data
            const enrichedPredictions = sortedPredictions.map(pred => ({
              ...pred,
              agents: {
                id: pred.agent_id,
                name: pred.agent_name || 'Unknown Agent',
                strategy_type: pred.agent_strategy || 'UNKNOWN',
                generation: 0,
                color: pred.agent_color || 'gray'
              },
              polymarket_markets: {
                id: pred.market_id,
                question: pred.market_question || 'Market question unavailable',
                market_slug: pred.market_slug || pred.market_id,
                end_date: pred.market_end_date || null,
                yes_price: pred.price_at_prediction || 0.5,
                no_price: 1 - (pred.price_at_prediction || 0.5),
                resolved: pred.resolved || false,
                outcome: pred.outcome || null
              }
            }));

            setLivePredictions(enrichedPredictions);
            setLastUpdate(new Date());
            setLoading(false);
          } else {
            setLoading(false);
          }
        }, (error) => {
          console.error('Firebase listener error:', error);
          setLoading(false);
        });

      } catch (error) {
        console.error('Error setting up Firebase listener:', error);
        setLoading(false);
      }
    };

    setupFirebaseListener();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'JUST NOW';
    if (diffMinutes < 60) return `${diffMinutes}M AGO`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}H AGO`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}D AGO`;
  };

  return (
    <div className="border-4 border-black bg-white mb-6"
      style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      {/* Header */}
      <div className="border-b-4 border-black p-4 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold">◉ LIVE PREDICTIONS FEED</div>
          <div className="text-xs text-gray-600">
            LAST UPDATE: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="text-xs font-bold text-green-600">LIVE</div>
        </div>
      </div>

      {/* Live Predictions */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-600 py-8">
            LOADING LIVE FEED<span className="retro-blink">_</span>
          </div>
        ) : livePredictions.length === 0 ? (
          <div className="text-center text-gray-600 py-8">
            <div className="text-2xl mb-2">◆</div>
            <div className="text-xs font-bold">NO RECENT PREDICTIONS</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {livePredictions.map(pred => {
              const agentColors = getAgentColorClasses(pred.agents?.color || 'gray');
              const predictionColors = getPredictionColorClasses(pred.prediction);

              const confidenceValue = safeNumber(pred.confidence);
              const betAmount = safeNumber(pred.bet_amount);
              const profitLoss = pred.profit_loss === null || pred.profit_loss === undefined
                ? null
                : safeNumber(pred.profit_loss);
              const expectedPayout = safeNumber(pred.expected_payout);
              const potentialGain = expectedPayout - betAmount;

              return (
                <div key={pred.id} className="p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start gap-3">
                    {/* Left: Agent & Prediction */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`px-2 py-1 rounded-sm border font-bold text-xs ${agentColors.bg} ${agentColors.border} ${agentColors.text}`}>
                          {pred.agents?.name || 'Unknown'}
                        </div>
                        <div className={`px-2 py-1 rounded-sm border font-bold text-xs ${predictionColors.bg} ${predictionColors.border} ${predictionColors.text}`}>
                          {pred.prediction}
                        </div>
                        <div className="text-xs text-gray-600">
                          {(confidenceValue * 100).toFixed(0)}%
                        </div>
                      </div>

                      <div className="text-xs text-gray-800 leading-tight mb-1 truncate">
                        {pred.polymarket_markets?.question || 'Market question unavailable'}
                      </div>

                      {pred.reasoning && (
                        <div className="text-xs text-gray-600 leading-tight">
                          {pred.reasoning.slice(0, 80)}
                          {pred.reasoning.length > 80 && '...'}
                        </div>
                      )}
                    </div>

                    {/* Right: Stats & Time */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-bold mb-1">
                        ${betAmount.toFixed(2)}
                      </div>

                      {profitLoss !== null ? (
                        <div className={`text-xs font-bold mb-1 ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
                        </div>
                      ) : expectedPayout > 0 && (
                        <div className="text-xs font-bold mb-1 text-blue-600">
                          +${potentialGain.toFixed(2)}
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(pred.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-200 p-2 bg-gray-50">
        <div className="text-xs text-gray-600 text-center">
          Auto-refreshes every 3 seconds • Showing latest 10 predictions
        </div>
      </div>
    </div>
  );
}

// Prediction Detail Modal Component
function PredictionDetailModal({
  prediction,
  onClose
}: {
  prediction: Prediction;
  onClose: () => void;
}) {
  const agentColors = getAgentColorClasses(prediction.agents?.color || 'gray');
  const predictionColors = getPredictionColorClasses(prediction.prediction);

  const confidenceValue = Number(prediction.confidence ?? 0);
  const priceAtPrediction = Number(prediction.price_at_prediction ?? 0);
  const betAmount = Number(prediction.bet_amount ?? 0);
  const profitLoss = prediction.profit_loss === null || prediction.profit_loss === undefined
    ? null
    : Number(prediction.profit_loss);
  const actualPayout = prediction.actual_payout === null || prediction.actual_payout === undefined
    ? null
    : Number(prediction.actual_payout);
  const expectedPayout = Number(prediction.expected_payout ?? 0);
  const potentialGain = expectedPayout - betAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className="bg-white border-4 border-black max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '12px 12px 0px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="border-b-4 border-black p-3 sm:p-4 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-lg sm:text-xl font-bold">■ PREDICTION_DETAILS</h2>
          <button
            onClick={onClose}
            className="text-xl sm:text-2xl font-bold hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* Market Question */}
          <div>
            <div className="text-xs text-gray-600 mb-1 font-bold">MARKET</div>
            <div className="text-base font-bold mb-2 leading-tight">
              {prediction.polymarket_markets?.question || 'Market question unavailable'}
            </div>
            {prediction.polymarket_markets?.market_slug && (
              <a
                href={`https://polymarket.com/event/${prediction.polymarket_markets.market_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline hover:no-underline"
              >
                VIEW ON POLYMARKET ▶
              </a>
            )}
          </div>

          {/* Agent Info */}
          <div className={`border-3 p-3 ${agentColors.bg} ${agentColors.border}`}
            style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
            <div className="text-xs text-gray-600 mb-1 font-bold">AGENT</div>
            <div className={`font-bold text-sm ${agentColors.text}`}>
              {prediction.agents?.name || 'Unknown'}
            </div>
            <div className="text-xs text-gray-600">
              {prediction.agents?.strategy_type?.toUpperCase() || 'UNKNOWN'}
              {prediction.agents?.generation > 0 && ` • GENERATION ${prediction.agents.generation}`}
            </div>
          </div>

          {/* Prediction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className={`border-3 p-3 text-center ${predictionColors.bg} ${predictionColors.border}`}
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              <div className="text-xs text-gray-600 mb-1 font-bold">PREDICTION</div>
              <div className={`text-3xl sm:text-4xl font-bold ${predictionColors.text}`}>
                {prediction.prediction}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                CONFIDENCE: {(confidenceValue * 100).toFixed(1)}%
              </div>
            </div>

            <div className="border-3 border-black p-3 bg-white text-center"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              <div className="text-xs text-gray-600 mb-1 font-bold">MARKET PRICE</div>
              <div className="text-3xl sm:text-4xl font-bold">
                {(priceAtPrediction * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                WHEN PREDICTED
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div className="border-3 border-black p-4 bg-gray-50"
            style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
            <div className="text-xs text-gray-600 mb-2 font-bold">REASONING</div>
            <div className="text-xs leading-relaxed">
              {prediction.reasoning || 'No reasoning provided'}
            </div>
          </div>

          {/* Betting Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="border-3 border-black p-3 bg-white text-center"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              <div className="text-xs text-gray-600 mb-1 font-bold">BET AMOUNT</div>
              <div className="text-xl sm:text-2xl font-bold">
                ${betAmount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                @ {((prediction.prediction === 'YES' ? prediction.entry_odds?.yes_price : prediction.entry_odds?.no_price) || 0.5).toFixed(3)} odds
              </div>
            </div>

            <div className="border-3 border-black p-3 bg-white text-center"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              <div className="text-xs text-gray-600 mb-1 font-bold">EXPECTED PAYOUT</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                ${expectedPayout.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                If correct
              </div>
            </div>

            {profitLoss !== null ? (
              <div className="border-3 border-black p-3 bg-white text-center"
                style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                <div className="text-xs text-gray-600 mb-1 font-bold">ACTUAL P&L</div>
                <div className={`text-xl sm:text-2xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {actualPayout !== null && actualPayout > 0 ? `Payout: $${actualPayout.toFixed(2)}` : 'No payout'}
                </div>
              </div>
            ) : (
              <div className="border-3 border-black p-3 bg-gray-50 text-center"
                style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                <div className="text-xs text-gray-600 mb-1 font-bold">POTENTIAL PROFIT</div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  +${potentialGain.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  If prediction correct
                </div>
              </div>
            )}
          </div>

          {/* Outcome */}
          {prediction.outcome ? (
            <div className={`border-3 p-4 ${prediction.correct ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
              }`} style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              <div className="text-xs text-gray-600 mb-2 font-bold">OUTCOME</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-bold">
                    {prediction.outcome}
                  </div>
                  <div className={`text-sm font-bold ${prediction.correct ? 'text-green-700' : 'text-red-700'}`}>
                    {prediction.correct ? '✓ AGENT WAS CORRECT' : '✗ AGENT WAS INCORRECT'}
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  RESOLVED: {new Date(prediction.resolved_at!).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="border-3 border-black p-4 bg-gray-50"
              style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              <div className="text-xs text-gray-600 mb-1 font-bold">STATUS</div>
              <div className="text-base font-bold">
                ◆ PENDING RESOLUTION
              </div>
              <div className="text-xs text-gray-600 mt-1">
                MARKET ENDS: {new Date(prediction.polymarket_markets?.end_date || '').toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-600 border-t-2 border-black pt-3">
            <div>PREDICTED: {new Date(prediction.created_at).toLocaleString()}</div>
            {prediction.resolved_at && (
              <div>RESOLVED: {new Date(prediction.resolved_at).toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
