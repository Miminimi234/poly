'use client';

import { MainNav } from '@/components/navigation/MainNav';
import useUserAgentStore from '@/lib/stores/use-user-agent-store';
import '@/styles/Polysentience.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Agent {
  id: string;
  name: string;
  strategy_type: string;
  avatar: string;
  color: string;
  generation: number;
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
  prediction: 'YES' | 'NO';
  bet_amount: number;
  entry_odds: {
    yes_price: number;
    no_price: number;
  };
  position_status: 'OPEN' | 'CLOSED_MANUAL' | 'CLOSED_RESOLVED';
  unrealized_pnl?: number;
  profit_loss?: number;
  current_market_odds?: {
    yes_price: number;
    no_price: number;
  };
  resolved: boolean;
  expected_payout?: number;
}

interface EnhancedAgent extends Agent {
  balance: AgentBalance;
  is_active: boolean;
  is_bankrupt: boolean;
  totalPnL: number;
  totalPositionValue: number;
  netWorth: number;
  pnlBasedROI: number;
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<EnhancedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'bankrupt'>('all');
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [agentPredictions, setAgentPredictions] = useState<Record<string, AgentPrediction[]>>({});

  // Keep track of cleanup functions for real-time listeners
  const cleanupFunctions = useRef<(() => void)[]>([]);

  useEffect(() => {
    let isActive = true;

    const fetchAgentsData = async () => {
      if (!isActive) return;

      try {
        setConnected(true);

        // Fetch agents and balances first
        const [agentsResponse, balancesResponse] = await Promise.all([
          fetch('/api/firebase/agents'),
          fetch('/api/firebase/agent-balances')
        ]);

        if (!isActive) return;

        const agentsData = await agentsResponse.json();
        const balancesData = await balancesResponse.json();

        if (agentsData.success && balancesData.success) {
          const agents = agentsData.agents || [];
          const balances = balancesData.balances || [];

          // Fetch predictions for each agent individually to get raw Firebase data
          const predictionsByAgent: Record<string, AgentPrediction[]> = {};

          await Promise.all(
            agents.map(async (agent: Agent) => {
              try {
                const response = await fetch(`/api/firebase/agent-predictions/${agent.id}`);
                const data = await response.json();

                if (data.success && data.predictions) {
                  console.log(`🔍 Agent ${agent.id} predictions:`, data.predictions.slice(0, 1)); // Debug first prediction

                  predictionsByAgent[agent.id] = data.predictions.map((pred: any) => ({
                    id: pred.id,
                    agent_id: pred.agent_id,
                    prediction: pred.prediction,
                    bet_amount: pred.bet_amount,
                    entry_odds: pred.entry_odds,
                    position_status: pred.position_status,
                    unrealized_pnl: pred.unrealized_pnl,
                    profit_loss: pred.profit_loss,
                    current_market_odds: pred.current_market_odds,
                    resolved: pred.resolved,
                    expected_payout: pred.expected_payout
                  }));
                }
              } catch (error) {
                console.error(`Failed to fetch predictions for agent ${agent.id}:`, error);
                predictionsByAgent[agent.id] = [];
              }
            })
          );

          console.log('📊 Final predictions by agent:', Object.keys(predictionsByAgent).map(agentId => ({
            agentId,
            count: predictionsByAgent[agentId].length,
            openPositions: predictionsByAgent[agentId].filter(p => p.position_status === 'OPEN').length,
            totalExpectedPayout: predictionsByAgent[agentId]
              .filter(p => p.position_status === 'OPEN')
              .reduce((sum, p) => sum + (p.expected_payout || 0), 0)
          })));

          setAgentPredictions(predictionsByAgent);

          // Helper function to calculate P&L using expected payouts for position values
          const calculateAgentPnL = (agentId: string): { totalPnL: number; totalPositionValue: number; netWorth: number; pnlBasedROI: number } => {
            const predictions = predictionsByAgent[agentId] || [];
            const balance = balances.find((b: AgentBalance) => b.agent_id === agentId);
            const currentBalance = balance?.current_balance || 0;
            const initialBalance = balance?.initial_balance || 1000;

            let totalUnrealizedPnL = 0;
            let totalPositionValue = 0;

            // For open positions, calculate total expected payouts and total wagered amounts
            const openPositions = predictions.filter(p => p.position_status === 'OPEN');
            let totalWagered = 0;

            openPositions.forEach(prediction => {
              // Position value is the expected payout if the prediction is correct
              const expectedPayout = prediction.expected_payout || 0;
              totalPositionValue += expectedPayout;

              // Track total wagered amount
              totalWagered += prediction.bet_amount || 0;
            });

            // Net Worth = Current Balance + Expected Payouts from Open Positions
            const netWorth = currentBalance + totalPositionValue;

            // Floating P&L = Expected Payouts - Amount Wagered (positions - wagered)
            const totalPnL = totalPositionValue - totalWagered;

            // ROI based on P&L vs initial investment
            const pnlBasedROI = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

            return { totalPnL, totalPositionValue, netWorth, pnlBasedROI };
          };

          // Combine agents with their balances and calculated P&L
          const enhancedAgents: EnhancedAgent[] = agents.map((agent: Agent) => {
            const balance = balances.find((b: AgentBalance) => b.agent_id === agent.id);
            const currentBalance = balance?.current_balance || 0;
            const pnlData = calculateAgentPnL(agent.id);

            return {
              ...agent,
              balance: balance || {
                agent_id: agent.id,
                agent_name: agent.name,
                current_balance: 1000,
                initial_balance: 1000,
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
                last_updated: new Date().toISOString()
              },
              is_active: currentBalance > 10, // Active if they have more than $10
              is_bankrupt: currentBalance <= 10, // Bankrupt if $10 or less
              ...pnlData
            };
          });

          setAgents(enhancedAgents);
          setLastUpdate(new Date().toLocaleTimeString());
        }

      } catch (error: any) {
        if (!isActive) return;
        console.error('Failed to fetch agents data:', error);
        setConnected(false);
      } finally {
        if (isActive && loading) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchAgentsData();

    // Set up real-time polling every 3 seconds
    const pollInterval = setInterval(() => {
      if (isActive && !loading) {
        fetchAgentsData();
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
  }, []);

  // Cleanup all connections on component unmount
  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => cleanup());
    };
  }, []);

  const filteredAgents = agents.filter(agent => {
    if (filter === 'active') return agent.is_active && !agent.is_bankrupt;
    if (filter === 'bankrupt') return agent.is_bankrupt;
    return true;
  });



  if (loading) {
    return (
      <div className="min-h-screen  text-white flex items-center justify-center">
        <div className="border-1 border-gray  p-12 text-center"
          style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
          <div className="text-4xl mb-4">⟲</div>
          <div className="text-2xl font-bold mb-2">LOADING_AGENTS...</div>
          <div className="text-sm text-white-600">FETCHING FIREBASE DATA</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  text-white">
      {/* Perspective Grid Background */}
      <div className="fixed bottom-0 left-0 right-0 h-[50vh] pointer-events-none opacity-30 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom'
        }}
      />

      <div className="relative z-10 p-8">
        <MainNav />

        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <Link href="/dashboard" className="text-xs hover:underline">
              ← BACK TO DASHBOARD
            </Link>

            {/* Connection Status */}
            <div className={`text-xs px-2 py-1 border-2 border-gray font-bold ${connected ? 'bg-gray-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
              {connected ? '🟢 LIVE' : '🔴 DISCONNECTED'}
              {lastUpdate && connected && (
                <span className="ml-2 text-white-600">
                  {lastUpdate}
                </span>
              )}
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-3">
            ▶ AGENTS
          </h1>
          <p className="text-xs text-white-600">
            MANAGE YOUR AUTONOMOUS AI AGENTS • REAL-TIME FIREBASE DATA
          </p>
        </div>

        {/* Filters & Create Button */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 uppercase text-xs border-2 border-gray transition-all ${filter === 'all'
                ? 'bg-black text-white'
                : ' text-white hover:bg-gray-100'
                }`}
              style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
              ALL ({agents.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 uppercase text-xs border-2 border-gray transition-all ${filter === 'active'
                ? 'bg-black text-white'
                : ' text-white hover:bg-gray-100'
                }`}
              style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
              ACTIVE ({agents.filter(a => a.is_active && !a.is_bankrupt).length})
            </button>
            <button
              onClick={() => setFilter('bankrupt')}
              className={`px-4 py-2 uppercase text-xs border-2 border-gray transition-all ${filter === 'bankrupt'
                ? 'bg-black text-white'
                : ' text-white hover:bg-gray-100'
                }`}
              style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
              BANKRUPT ({agents.filter(a => a.is_bankrupt).length})
            </button>
          </div>

          {/* YOUR AGENT / CREATE AGENT button: link to local agent if present, otherwise to create page */}
          <div>
            {(() => {
              try {
                const localAgents = useUserAgentStore.getState().getAllAgents() || [];
                const myAgent = localAgents.find(a => a && typeof a.id === 'string' && a.id.startsWith('user_'));
                if (myAgent) {
                  return (
                    <Link href={`/agents/user/${myAgent.id}`} className="px-4 py-2 uppercase text-xs border-2 border-gray font-bold  hover:bg-gray-100">
                      YOUR AGENT
                    </Link>
                  );
                }
              } catch (e) {
                // ignore
              }

              // No local agent — show a CREATE button so the control is always visible
              return (
                <Link href="/agents/create" className="px-4 py-2 uppercase text-xs border-2 border-gray font-bold  hover:bg-gray-100">
                  CREATE AGENT
                </Link>
              );
            })()}
          </div>
        </div>

        {/* No Agents */}
        {filteredAgents.length === 0 ? (
          <div className=" border-1 border-gray p-12 text-center"
            style={{ boxShadow: '12px 12px 0px rgba(0, 0, 0, 0.3)' }}>
            <h2 className="text-3xl font-bold mb-4">
              {filter === 'active' && '😴 NO ACTIVE AGENTS'}
              {filter === 'bankrupt' && '💰 NO BANKRUPT AGENTS'}
              {filter === 'all' && '🤖 AGENTS LOADING...'}
            </h2>
            <p className="text-xs text-white-600 mb-8">
              {filter === 'active' && 'ALL AGENTS ARE INACTIVE OR BANKRUPT.'}
              {filter === 'bankrupt' && 'NO AGENTS HAVE GONE BANKRUPT. GREAT JOB!'}
              {filter === 'all' && ''}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="inline-block px-8 py-4 bg-black border-2 border-gray text-white font-bold uppercase text-xs hover:bg-gray-800 transition-all"
                style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                VIEW ALL AGENTS
              </button>
            )}
          </div>
        ) : (
          /* Agents Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map(agent => {
              const streakText = agent.balance.current_streak > 0
                ? `🔥 ${agent.balance.current_streak}W`
                : agent.balance.current_streak < 0
                  ? `❄️ ${Math.abs(agent.balance.current_streak)}L`
                  : '➖';

              return (
                <div key={agent.id}
                  className=" border-1 border-gray p-6 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
                  style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>

                  {/* Status & Avatar */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{agent.avatar}</span>
                      <span className={`text-xs uppercase px-2 py-1 border-2 border-gray ${agent.is_bankrupt ? 'bg-red-100 text-red-800' :
                        agent.is_active ? 'bg-gray text-green-800' : 'bg-black text-white-600'
                        }`}>
                        {agent.is_bankrupt ? '💀 BANKRUPT' : agent.is_active ? '⚡ ACTIVE' : '😴 INACTIVE'}
                      </span>
                    </div>
                    <span className="text-xs text-white-600 uppercase">
                      {agent.strategy_type}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="text-base font-bold mb-4">
                    {agent.name}
                  </h3>

                  {/* Balance & Performance */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                    <div>
                      <div className="text-white-600 mb-1">NET WORTH</div>
                      <div className={`font-bold ${agent.netWorth > agent.balance.initial_balance ? 'text-green-600' :
                        agent.netWorth < agent.balance.initial_balance ? 'text-red-600' : ''
                        }`}>
                        ${agent.netWorth.toFixed(2)}
                      </div>
                      <div className="text-xs text-white-500 mt-1">
                        Cash: ${agent.balance.current_balance.toFixed(2)} + Positions: ${agent.totalPositionValue.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-white-600 mb-1">WIN RATE</div>
                      <div className="font-bold">
                        {agent.balance.win_rate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-white-600 mb-1">FLOATING P&L</div>
                      <div className={`font-bold ${agent.totalPnL > 0 ? 'text-green-600' :
                        agent.totalPnL < 0 ? 'text-red-600' : ''
                        }`}>
                        {agent.totalPnL > 0 ? '+' : ''}${agent.totalPnL.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-white-600 mb-1">STREAK</div>
                      <div className="font-bold text-xs">
                        {streakText}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-white-600">
                    <div>
                      <span>WAGERED:</span>
                      <span className="ml-1 font-medium">${agent.balance.total_wagered.toFixed(0)}</span>
                    </div>
                    <div>
                      <span>FROI:</span>
                      <span className={`ml-1 font-medium ${agent.pnlBasedROI > 0 ? 'text-green-600' : agent.pnlBasedROI < 0 ? 'text-red-600' : ''
                        }`}>
                        {agent.pnlBasedROI > 0 ? '+' : ''}{agent.pnlBasedROI.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Predictions Count */}
                  <div className="text-center pt-4 border-t-2 border-gray mb-4">
                    <div className="text-2xl font-bold">
                      {agent.balance.prediction_count}
                    </div>
                    <div className="text-xs text-white-600 uppercase">
                      PREDICTIONS ({agent.balance.win_count}W/{agent.balance.loss_count}L)
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/agents/${agent.id}`}
                      className="flex-1 text-center py-2 border-2 border-gray text-white text-xs font-bold uppercase hover:bg-black hover:text-white transition-all">
                      VIEW
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
