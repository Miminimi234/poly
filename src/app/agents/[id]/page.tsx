'use client';

import '@/styles/poly402.css';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
  strategy_type: string;
  current_balance_usdt: number;
  initial_balance_usdt: number;
  total_spent: number;
  total_earned: number;
  accuracy: number;
  roi: number;
  total_profit_loss: number;
  total_predictions: number;
  generation: number;
  mutations: string[];
  traits: any;
  is_active: boolean;
  is_bankrupt: boolean;
  created_at: string;
  bankruptcy_date: string | null;
}

interface Prediction {
  id: string;
  prediction: string;
  confidence: number;
  reasoning: string;
  outcome: string | null;
  correct: boolean | null;
  profit_loss: number | null;
  research_cost: number;
  created_at: string;
  polymarket_markets: {
    question: string;
    market_slug: string;
    end_date: string;
  };
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

const getStrategyIcon = (strategy: string) => {
  const icons: any = {
    CONSERVATIVE: '🛡',
    AGGRESSIVE: '⚔',
    SPEED_DEMON: '⚡',
    ACADEMIC: '📚',
    BALANCED: '⚖',
    DATA_DRIVEN: '📊',
    NEWS_JUNKIE: '📰',
    EXPERT_NETWORK: '🎓',
    CONTRARIAN: '🔄',
    MOMENTUM: '📈',
    SOCIAL_SENTIMENT: '💭'
  };
  return icons[strategy] || '🤖';
};

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [offspring, setOffspring] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'transactions' | 'lineage'>('overview');

  const fetchAgentDetail = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/agents/${agentId}/detail`);
      const data = await response.json();

      if (data.success) {
        setAgent(data.agent);
        setPredictions(data.predictions);
        setTransactions(data.transactions);
        setParents(data.parents);
        setOffspring(data.offspring);
        setPerformanceData(data.performanceData);
        setCategoryBreakdown(data.categoryBreakdown);
      }
    } catch (error) {
      console.error('Error fetching agent detail:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgentDetail();
  }, [fetchAgentDetail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-xl font-bold">LOADING AGENT<span className="retro-blink">_</span></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">◆</div>
          <div className="text-2xl font-bold mb-2">AGENT NOT FOUND</div>
          <Link href="/dashboard" className="text-sm underline hover:no-underline">
            ← BACK TO DASHBOARD
          </Link>
        </div>
      </div>
    );
  }

  const resolvedPredictions = predictions.filter(p => p.outcome !== null);
  const correctPredictions = resolvedPredictions.filter(p => p.correct);
  const accuracyPercent = resolvedPredictions.length > 0
    ? ((correctPredictions.length / resolvedPredictions.length) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <Link
            href="/dashboard"
            className="text-xs underline hover:no-underline mb-2 block"
          >
            ← BACK TO DASHBOARD
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{getStrategyIcon(agent.strategy_type)}</span>
            <div>
              <h1 className="text-4xl font-bold">{agent.name}</h1>
              <p className="text-gray-600 text-xs mt-1">
                {agent.strategy_type?.toUpperCase()}
                {agent.generation > 0 && ` • GENERATION ${agent.generation}`}
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`border-4 border-black px-6 py-3 font-bold text-base ${agent.is_bankrupt ? 'bg-black text-white' :
            agent.is_active ? 'bg-gray-100' :
              'bg-gray-200'
          }`} style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
          {agent.is_bankrupt ? '✗ BANKRUPT' :
            agent.is_active ? '✓ ACTIVE' :
              '⏸ INACTIVE'}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="border-4 border-black p-4 bg-white text-center"
          style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
          <div className="text-xs text-gray-600 mb-1 font-bold">BALANCE</div>
          <div className="text-3xl font-bold">
            ${agent.current_balance_usdt?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            STARTED: ${agent.initial_balance_usdt || 10}
          </div>
        </div>

        <div className="border-4 border-black p-4 bg-white text-center"
          style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
          <div className="text-xs text-gray-600 mb-1 font-bold">ACCURACY</div>
          <div className="text-3xl font-bold">
            {accuracyPercent}%
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {correctPredictions.length}/{resolvedPredictions.length} CORRECT
          </div>
        </div>

        <div className="border-4 border-black p-4 bg-white text-center"
          style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
          <div className="text-xs text-gray-600 mb-1 font-bold">PROFIT/LOSS</div>
          <div className="text-3xl font-bold">
            {agent.total_profit_loss >= 0 ? '+' : ''}${agent.total_profit_loss?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            ROI: {agent.roi?.toFixed(1) || '0.0'}%
          </div>
        </div>

        <div className="border-4 border-black p-4 bg-white text-center"
          style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
          <div className="text-xs text-gray-600 mb-1 font-bold">PREDICTIONS</div>
          <div className="text-3xl font-bold">
            {predictions.length}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {predictions.length - resolvedPredictions.length} PENDING
          </div>
        </div>

        <div className="border-4 border-black p-4 bg-white text-center"
          style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
          <div className="text-xs text-gray-600 mb-1 font-bold">TOTAL SPENT</div>
          <div className="text-3xl font-bold">
            ${agent.total_spent?.toFixed(2) || '0.00'}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            ON RESEARCH
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-4 border-black bg-white mb-6"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="flex border-b-4 border-black">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-3 font-bold border-r-4 border-black text-sm ${activeTab === 'overview' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
              }`}
          >
            OVERVIEW
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`flex-1 px-6 py-3 font-bold border-r-4 border-black text-sm ${activeTab === 'predictions' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
              }`}
          >
            PREDICTIONS
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 px-6 py-3 font-bold border-r-4 border-black text-sm ${activeTab === 'transactions' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
              }`}
          >
            TRANSACTIONS
          </button>
          <button
            onClick={() => setActiveTab('lineage')}
            className={`flex-1 px-6 py-3 font-bold text-sm ${activeTab === 'lineage' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
              }`}
          >
            LINEAGE
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <div className="text-sm font-bold mb-2">■ DESCRIPTION</div>
                <div className="text-xs text-gray-700 leading-relaxed">
                  {agent.description || 'No description provided'}
                </div>
              </div>

              {/* Mutations */}
              {agent.mutations && agent.mutations.length > 0 && (
                <div>
                  <div className="text-sm font-bold mb-2">■ MUTATIONS</div>
                  <div className="flex flex-wrap gap-2">
                    {agent.mutations.map((mutation, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-3 py-1 bg-gray-100 border-2 border-black font-bold"
                      >
                        ◈ {mutation}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Chart */}
              {performanceData.length > 0 && (
                <div>
                  <div className="text-sm font-bold mb-2">■ PERFORMANCE OVER TIME</div>
                  <div className="border-3 border-black p-4 bg-gray-50"
                    style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                    <div className="space-y-2">
                      {performanceData.slice(-10).map((point, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 font-mono">{point.date}</span>
                          <div className="flex gap-4">
                            <span>ACCURACY: <span className="font-bold">{point.accuracy}%</span></span>
                            <span className={parseFloat(point.profitLoss) >= 0 ? 'text-black' : 'text-gray-600'}>
                              P/L: <span className="font-bold">
                                {parseFloat(point.profitLoss) >= 0 ? '+' : ''}${point.profitLoss}
                              </span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Category Breakdown */}
              {Object.keys(categoryBreakdown).length > 0 && (
                <div>
                  <div className="text-sm font-bold mb-2">■ MARKETS BY CATEGORY</div>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(categoryBreakdown).map(([category, count]: [string, any]) => (
                      <div key={category} className="border-3 border-black p-3 bg-white text-center"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                        <div className="text-xs text-gray-600 uppercase mb-1 font-bold">{category}</div>
                        <div className="text-2xl font-bold">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Traits */}
              {agent.traits && (
                <div>
                  <div className="text-sm font-bold mb-2">■ GENETIC TRAITS</div>
                  <div className="border-3 border-black p-4 bg-gray-50"
                    style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-600">CONFIDENCE THRESHOLD:</span>
                        <span className="font-bold ml-2">
                          {((agent.traits.confidence_threshold || 0.7) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">DECISION SPEED:</span>
                        <span className="font-bold ml-2">
                          {agent.traits.decision_speed || 'MEDIUM'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">RISK TOLERANCE:</span>
                        <span className="font-bold ml-2">
                          {agent.traits.risk_tolerance || 'MEDIUM'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">RESEARCH BUDGET:</span>
                        <span className="font-bold ml-2">
                          {((agent.traits.research_budget_ratio || 0.1) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="text-xs text-gray-600 border-t-2 border-black pt-3">
                CREATED: {new Date(agent.created_at).toLocaleString()}
                {agent.bankruptcy_date && (
                  <span className="ml-4">
                    BANKRUPTED: {new Date(agent.bankruptcy_date).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="space-y-2">
              {predictions.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  <div className="text-2xl mb-2">◆</div>
                  <div className="text-xs">NO PREDICTIONS YET</div>
                </div>
              ) : (
                predictions.map(pred => (
                  <div key={pred.id} className="border-2 border-black p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-bold mb-1 leading-tight">
                          {pred.polymarket_markets?.question || 'Unknown market'}
                        </div>
                        <div className="text-xs text-gray-600 italic">
                          &quot;{pred.reasoning?.slice(0, 100) || 'No reasoning'}...&quot;
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <div className={`px-3 py-1 border-2 border-black font-bold text-xs ${pred.prediction === 'YES' ? 'bg-gray-100' : 'bg-gray-200'
                          }`}>
                          {pred.prediction}
                        </div>
                        {pred.outcome && (
                          <div className={`px-3 py-1 border-2 border-black font-bold text-xs ${pred.correct ? 'bg-black text-white' : 'bg-gray-300 text-black'
                            }`}>
                            {pred.correct ? '✓' : '✗'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <div className="flex gap-4">
                        <span>CONFIDENCE: <span className="font-bold">{(pred.confidence * 100).toFixed(0)}%</span></span>
                        <span>COST: <span className="font-bold">${pred.research_cost?.toFixed(2) || '0.00'}</span></span>
                        {pred.profit_loss !== null && (
                          <span className={pred.profit_loss >= 0 ? 'text-black' : 'text-gray-600'}>
                            P/L: <span className="font-bold">{pred.profit_loss >= 0 ? '+' : ''}${pred.profit_loss.toFixed(2)}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500">
                        {new Date(pred.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  <div className="text-2xl mb-2">◆</div>
                  <div className="text-xs">NO TRANSACTIONS YET</div>
                </div>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="border-2 border-black p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <div className="text-sm font-bold mb-1">
                          {tx.transaction_type?.replace(/_/g, ' ').toUpperCase() || 'TRANSACTION'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {tx.description || 'No description'}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-base font-bold ${tx.amount < 0 ? 'text-gray-600' : 'text-black'
                          }`}>
                          {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">
                          BALANCE: ${tx.balance_after?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(tx.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Lineage Tab */}
          {activeTab === 'lineage' && (
            <div className="space-y-6">
              {/* Parents */}
              {parents.length > 0 && (
                <div>
                  <div className="text-sm font-bold mb-3">■ PARENTS</div>
                  <div className="grid grid-cols-2 gap-4">
                    {parents.map(parent => (
                      <Link
                        key={parent.id}
                        href={`/agents/${parent.id}`}
                        className="border-3 border-black p-4 bg-gray-50 hover:bg-gray-100"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}
                      >
                        <div className="font-bold mb-1 text-sm">{parent.name}</div>
                        <div className="text-xs text-gray-600 mb-2">
                          {parent.strategy_type?.toUpperCase()} • GEN {parent.generation}
                        </div>
                        <div className="text-xs">
                          ACCURACY: <span className="font-bold">{parent.accuracy?.toFixed(1) || '0.0'}%</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Offspring */}
              {offspring.length > 0 && (
                <div>
                  <div className="text-sm font-bold mb-3">■ OFFSPRING ({offspring.length})</div>
                  <div className="grid grid-cols-3 gap-4">
                    {offspring.map(child => (
                      <Link
                        key={child.id}
                        href={`/agents/${child.id}`}
                        className="border-2 border-black p-3 bg-gray-50 hover:bg-gray-100"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}
                      >
                        <div className="font-bold mb-1 text-xs">{child.name}</div>
                        <div className="text-xs text-gray-600 mb-1">
                          {child.strategy_type?.toUpperCase()}
                        </div>
                        <div className="text-xs">
                          GEN {child.generation} • {child.accuracy?.toFixed(1) || '0.0'}% ACC
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* No lineage */}
              {parents.length === 0 && offspring.length === 0 && (
                <div className="text-center text-gray-600 py-8">
                  <div className="text-4xl mb-2">◈</div>
                  <div className="text-sm font-bold mb-1">
                    FIRST GENERATION AGENT
                  </div>
                  <div className="text-xs">
                    NO PARENTS OR OFFSPRING YET
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

