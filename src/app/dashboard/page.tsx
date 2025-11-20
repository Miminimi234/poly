'use client';

import AdminControls from '@/components/AdminControls-secure';
import BreedAgentsModal from '@/components/BreedAgentsModal';
import CelebrityAIStats from '@/components/CelebrityAIStats';
import CreateAgentModal from '@/components/CreateAgentModal';
import FirebaseAdminPanel from '@/components/FirebaseAdminPanel';
import Leaderboard from '@/components/Leaderboard';
import LiveAIBattle from '@/components/LiveAIBattle';
import MarketStats from '@/components/MarketStats';
import PolymarketMarkets from '@/components/PolymarketMarkets';
import TrackerController from '@/components/TrackerController';
import { MainNav } from '@/components/navigation/MainNav';
import '@/styles/Polysentience.css';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Agent {
  id: string;
  name: string;
  strategy_type?: string;
  strategy?: string;
  current_balance_usdt?: number;
  balance?: number;
  total_spent_usdt?: number;
  total_earned_usdt?: number;
  accuracy: number;
  total_predictions: number;
  is_active: boolean;
  is_bankrupt: boolean;
  is_celebrity?: boolean;
  celebrity_model?: string;
  avatar?: string;
  traits?: any;
}

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value: unknown) => usdFormatter.format(toNumber(value));

const formatPercentValue = (value: unknown, decimals = 0) => {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatter.format(toNumber(value))}%`;
};

const formatRatioPercent = (ratio: unknown, decimals = 0) => {
  const percentage = toNumber(ratio) * 100;
  return formatPercentValue(percentage, decimals);
};

const formatSignedCurrency = (value: unknown) => {
  const amount = toNumber(value);
  const absolute = usdFormatter.format(Math.abs(amount));
  return amount >= 0 ? `+${absolute}` : `-${absolute}`;
};

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

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBreedModalOpen, setIsBreedModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    bankruptAgents: 0,
    totalSpent: 0,
    totalEarned: 0,
    avgAccuracy: 0
  });
  const [realTimeStats, setRealTimeStats] = useState({
    totalSpent: 0,
    totalEarned: 0,
    avgAccuracy: 0
  });

  const fetchAgents = useCallback(async () => {
    try {
      // Fetch all agents (including celebrities)
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        const allAgents = data.agents || [];

        // Separate celebrity and user agents
        const celebrityAgents = allAgents.filter((a: Agent) => a.is_celebrity);
        const userAgents = allAgents.filter((a: Agent) => !a.is_celebrity);

        // Show celebrity agents if no user agents
        setAgents(userAgents.length > 0 ? userAgents : celebrityAgents);
        calculateStats(allAgents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateStats = (agentList: Agent[]) => {
    const totalAgents = agentList.length;
    const activeAgents = agentList.filter(a => a.is_active && !a.is_bankrupt).length;
    const bankruptAgents = agentList.filter(a => a.is_bankrupt).length;
    const totalSpent = agentList.reduce((sum, a) => sum + (a.total_spent_usdt || 0), 0);
    const totalEarned = agentList.reduce((sum, a) => sum + (a.total_earned_usdt || 0), 0);
    const avgAccuracy = agentList.length > 0
      ? agentList.reduce((sum, a) => sum + (a.accuracy || 0), 0) / agentList.length
      : 0;

    setStats({
      totalAgents,
      activeAgents,
      bankruptAgents,
      totalSpent,
      totalEarned,
      avgAccuracy
    });
  };

  // Firebase real-time listener for spent/earned calculations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribe: (() => void) | null = null;

    const setupFirebaseListener = async () => {
      try {
        const { database } = await import('@/lib/firebase-config');
        const { ref, onValue } = await import('firebase/database');

        // If Firebase is not configured, skip setting up the listener
        if (!database) {
          console.warn('[dashboard] Firebase database not configured — skipping real-time stats listener.');
          setRealTimeStats({ totalSpent: 0, totalEarned: 0, avgAccuracy: 0 });
          return;
        }

        // Listen to agent_predictions for real-time financial calculations
        const predictionsRef = ref(database, 'agent_predictions');

        unsubscribe = onValue(predictionsRef, (snapshot) => {
          try {
            if (snapshot.exists()) {
              const predictions = Object.values(snapshot.val()) as any[];

              // Calculate total spent (sum of all bet amounts)
              const totalSpent = predictions.reduce((sum, pred) => {
                return sum + (pred.bet_amount || 0);
              }, 0);

              // Calculate total earned (sum of all expected payouts minus total spent)
              const totalPositionValue = predictions.reduce((sum, pred) => {
                return sum + (pred.expected_payout || 0);
              }, 0);

              const totalEarned = totalPositionValue - totalSpent;

              // Calculate average accuracy from resolved predictions
              const resolvedPredictions = predictions.filter(pred => pred.resolved === true && pred.correct !== null);
              const correctPredictions = resolvedPredictions.filter(pred => pred.correct === true);
              const avgAccuracy = resolvedPredictions.length > 0
                ? (correctPredictions.length / resolvedPredictions.length) * 100
                : 0;

              setRealTimeStats({
                totalSpent,
                totalEarned,
                avgAccuracy
              });
            } else {
              setRealTimeStats({
                totalSpent: 0,
                totalEarned: 0,
                avgAccuracy: 0
              });
            }
          } catch (error) {
            console.error('Error calculating real-time stats:', error);
          }
        }, (error) => {
          console.error('Firebase listener error:', error);
        });

      } catch (error) {
        console.error('Error setting up Firebase listener:', error);
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

  useEffect(() => {
    fetchAgents();

    // Trigger analysis on page load (runs in background)
    fetch('/api/analyze-trigger', { method: 'POST' })
      .then(res => res.json())
      .then(data => console.log('Analysis triggered:', data.message))
      .catch(err => console.error('Failed to trigger analysis:', err));

    // Set up interval to trigger every 10 minutes
    const interval = setInterval(() => {
      fetch('/api/analyze-trigger', { method: 'POST' })
        .then(res => res.json())
        .then(data => console.log('Auto-analysis triggered:', data.message))
        .catch(err => console.error('Failed to trigger analysis:', err));
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [fetchAgents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground dashboard-force flex items-center justify-center">
        <style jsx>{`
          .dashboard-force, .dashboard-force * {
            background-color: var(--background) !important;
            color: var(--foreground) !important;
            background-image: none !important;
            border-color: var(--border) !important;
          }
        `}</style>
        <div className="text-base">LOADING<span className="retro-blink">_</span></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground dashboard-force">
      <style jsx>{`
        .dashboard-force, .dashboard-force * {
          background-color: var(--background) !important;
          color: var(--foreground) !important;
          background-image: none !important;
          border-color: var(--border) !important;
        }
      `}</style>
      {/* Perspective Grid Background */}
      <div className="fixed bottom-0 left-0 right-0 h-[50vh] pointer-events-none opacity-30 z-0"
        style={{
          backgroundColor: 'var(--background)',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom'
        }}
      />

      <div className="relative z-10 p-8">
        <MainNav />

        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">
            ▶ DASHBOARD
          </h1>
          <p className="text-xs text-foreground">
            YOUR AUTONOMOUS AI AGENTS
          </p>
        </div>

        {/* Celebrity AI Battle Arena Banner */}
        <CelebrityAIStats />

        {/* Main Grid Layout - Always show regardless of agent count */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Stats & Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-background border-3 border-black p-4 text-center"
                style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                <div className="text-3xl font-bold mb-1">{stats.totalAgents}</div>
                <div className="text-xs text-gray-300">TOTAL</div>
              </div>

              <div className="bg-background border-3 border-black p-4 text-center"
                style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                <div className="text-3xl font-bold mb-1">{stats.activeAgents}</div>
                <div className="text-xs text-gray-300">ACTIVE</div>
              </div>

              <div className="bg-background border-3 border-black p-4 text-center"
                style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                <div className="text-3xl font-bold mb-1">{stats.bankruptAgents}</div>
                <div className="text-xs text-gray-300">BANKRUPT</div>
              </div>

              <div className="bg-background border-3 border-black p-4 text-center"
                style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                <div className="text-lg font-bold mb-1">{formatCurrency(realTimeStats.totalSpent)}</div>
                <div className="text-xs text-gray-300">SPENT</div>
              </div>

              <div className="bg-background border-3 border-black p-4 text-center"
                style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                <div className={`text-lg font-bold mb-1 ${realTimeStats.totalEarned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {realTimeStats.totalEarned >= 0 ? '+' : ''}{formatCurrency(Math.abs(realTimeStats.totalEarned))}
                </div>
                <div className="text-xs text-gray-300">exPNL</div>
              </div>

              <div className="bg-background border-3 border-black p-4 text-center"
                style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                <div className="text-lg font-bold mb-1">{formatPercentValue(realTimeStats.avgAccuracy, 1)}</div>
                <div className="text-xs text-foreground">AVG ACC</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-background border-3 border-black text-foreground font-bold hover:bg-background transition-all text-xs"
                style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                + CREATE_AGENT
              </button>
              <button
                onClick={() => setIsBreedModalOpen(true)}
                className="px-6 py-3 bg-background border-3 border-black text-foreground font-bold hover:bg-background transition-all text-xs"
                style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                ◈ BREED_AGENTS
              </button>
              <Link href="/markets"
                className="px-6 py-3 bg-background border-3 border-black text-foreground font-bold hover:bg-background transition-all text-xs"
                style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                ▣ MARKETS
              </Link>
              <Link href="/predictions"
                className="px-6 py-3 bg-background border-3 border-black text-foreground font-bold hover:bg-background transition-all text-xs"
                style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                ▶ PREDICTIONS
              </Link>
              <Link href="/leaderboards"
                className="px-6 py-3 bg-background border-3 border-black text-foreground font-bold hover:bg-background transition-all text-xs"
                style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                ★ LEADERBOARDS
              </Link>
            </div>

            {/* Live Predictions Feed */}
            <LivePredictionsFeed />

          </div>

          {/* Right Column - Polymarket Feed, Leaderboard & Admin */}
          <div className="space-y-6">
            <AdminControls />
            <FirebaseAdminPanel />
            <TrackerController />
            <MarketStats />
            <LiveAIBattle />
            <PolymarketMarkets />
            <Leaderboard />
          </div>
        </div>
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchAgents();
        }}
      />

      {/* Breed Agents Modal */}
      <BreedAgentsModal
        isOpen={isBreedModalOpen}
        onClose={() => setIsBreedModalOpen(false)}
        onSuccess={() => {
          fetchAgents();
        }}
      />
    </div>
  );
}

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

// Live Predictions Feed Component
function LivePredictionsFeed() {
  const [livePredictions, setLivePredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [previousPredictionCount, setPreviousPredictionCount] = useState(0);

  // Firebase real-time subscription
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribe: (() => void) | null = null;

    const setupFirebaseListener = async () => {
      try {
        const { database } = await import('@/lib/firebase-config');
        const { ref, query, orderByChild, limitToLast, onValue, off } = await import('firebase/database');

        // If Firebase is not configured, skip setting up the listener
        if (!database) {
          console.warn('[dashboard] Firebase database not configured — skipping live predictions listener.');
          setLoading(false);
          return;
        }

        // Create a query for the most recent predictions
        const predictionsRef = ref(database, 'agent_predictions');
        const recentPredictionsQuery = query(
          predictionsRef,
          orderByChild('created_at'),
          limitToLast(50) // Get more for better real-time updates
        );

        // Set up real-time listener
        unsubscribe = onValue(recentPredictionsQuery, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const predictions = Object.entries(data).map(([id, pred]: [string, any]) => ({
              id,
              ...pred
            }));

            // Sort by created_at descending and limit to 20 for display
            const sortedPredictions = predictions
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 20);

            // Use existing data from Firebase predictions (no need for additional API calls)
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

            // Auto-scroll to top when new predictions arrive
            if (enrichedPredictions.length > previousPredictionCount && previousPredictionCount > 0) {
              setTimeout(() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  });
                }
              }, 100);
            }
            setPreviousPredictionCount(enrichedPredictions.length);
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
  }, [previousPredictionCount]); const formatTimeAgo = (dateString: string) => {
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
    <div className="border-4 border-black bg-background"
      style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      {/* Header */}
      <div className="border-b-4 border-black p-4 bg-background flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold">◉ LIVE PREDICTIONS FEED</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="text-xs font-bold text-foreground">LIVE</div>
        </div>
      </div>

      {/* Live Predictions */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto"
        style={{ height: '90vh' }}
      >
        {loading ? (
          <div className="text-center text-foreground py-8">
            LOADING LIVE FEED<span className="retro-blink">_</span>
          </div>
        ) : livePredictions.length === 0 ? (
          <div className="text-center text-foreground py-8">
            <div className="text-2xl mb-2">◆</div>
            <div className="text-xs font-bold text-foreground">NO RECENT PREDICTIONS</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {livePredictions.map(pred => {
              const agentColors = getAgentColorClasses(pred.agents?.color || 'gray');
              const predictionColors = getPredictionColorClasses(pred.prediction);

              const confidenceValue = toNumber(pred.confidence);
              const betAmount = toNumber(pred.bet_amount);
              const profitLoss = pred.profit_loss === null || pred.profit_loss === undefined
                ? null
                : toNumber(pred.profit_loss);
              const expectedPayout = toNumber(pred.expected_payout);
              const potentialGain = expectedPayout - betAmount;

              return (
                <div key={pred.id} className="p-4 bg-background hover:bg-background transition-colors border-l-4 border-transparent hover:border-blue-500">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    {/* Left: Agent & Prediction */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`px-2 py-1 rounded-sm border font-bold text-xs ${agentColors.bg} ${agentColors.border} ${agentColors.text} text-foreground`}>
                          {pred.agents?.name || 'Unknown'}
                        </div>
                        <div className={`px-2 py-1 rounded-sm border font-bold text-xs ${predictionColors.bg} ${predictionColors.border} ${predictionColors.text} text-foreground`}>
                          {pred.prediction}
                        </div>
                        <div className="text-xs text-foreground font-bold">
                          {(pred.confidence * 100).toFixed(0)}%
                        </div>
                      </div>

                      <div className="text-sm text-foreground leading-tight mb-3 font-medium">
                        {pred.polymarket_markets?.question || 'Market question unavailable'}
                      </div>

                      {pred.reasoning && (
                        <div className="text-xs text-foreground leading-relaxed bg-background p-3 rounded border-l-2 border-gray-700">
                          <div className="font-bold text-foreground mb-1">REASONING:</div>
                          {pred.reasoning}
                        </div>
                      )}
                    </div>

                    {/* Right: Stats */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-foreground mb-2">
                        {formatTimeAgo(pred.created_at)}
                      </div>
                      <div className="text-xs font-bold mb-1 text-foreground">
                        {formatCurrency(betAmount)}
                      </div>

                      {profitLoss !== null ? (
                        <div className={`text-xs font-bold mb-1 text-foreground`}>
                          {formatSignedCurrency(profitLoss)}
                        </div>
                      ) : expectedPayout > 0 && (
                        <div className="text-sm font-bold mb-1 text-foreground">
                          {formatSignedCurrency(potentialGain)}
                        </div>
                      )}

                      {pred.outcome && (
                        <div className={`text-xs px-2 py-1 rounded font-bold ${pred.correct ? 'bg-green-100' : 'bg-red-100'} text-foreground`}>
                          {pred.correct ? '✓ WIN' : '✗ LOSS'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-700 p-2 bg-background">
        <div className="text-xs text-foreground text-center">
          <Link href="/predictions" className="underline hover:no-underline">View All</Link>
        </div>
      </div>
    </div>
  );
}
