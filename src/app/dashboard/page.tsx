'use client';

import AdminControls from '@/components/AdminControls';
import AgentPredictionCard from '@/components/AgentPredictionCard';
import BreedAgentsModal from '@/components/BreedAgentsModal';
import CelebrityAIStats from '@/components/CelebrityAIStats';
import CreateAgentModal from '@/components/CreateAgentModal';
import Leaderboard from '@/components/Leaderboard';
import LiveAIBattle from '@/components/LiveAIBattle';
import MarketStats from '@/components/MarketStats';
import PolymarketMarkets from '@/components/PolymarketMarkets';
import RecentPredictions from '@/components/RecentPredictions';
import '@/styles/poly402.css';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

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
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-base">LOADING<span className="retro-blink">_</span></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
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
        {/* Navigation */}
        <nav className="mb-8 pb-4 border-b-2 border-black">
          <div className="flex items-center justify-between">
            <Link href="/landing" className="font-bold">
              <pre className="text-[7px] leading-tight text-black" style={{ fontFamily: 'monospace' }}>{`██████╗  ██████╗ ██╗  ██╗   ██╗██╗  ██╗ ██████╗ ██████╗ 
██╔══██╗██╔═══██╗██║  ╚██╗ ██╔╝██║  ██║██╔═████╗╚════██╗
██████╔╝██║   ██║██║   ╚████╔╝ ███████║██║██╔██║ █████╔╝
██╔═══╝ ██║   ██║██║    ╚██╔╝  ╚════██║████╔╝██║██╔═══╝ 
██║     ╚██████╔╝███████╗██║        ██║╚██████╔╝███████╗
╚═╝      ╚═════╝ ╚══════╝╚═╝        ╚═╝ ╚═════╝ ╚══════╝`}</pre>
            </Link>

            <div className="flex gap-6 text-xs">
              {[
                { name: 'DASHBOARD', href: '/dashboard' },
                { name: 'AGENTS', href: '/agents' },
                { name: 'RESEARCH', href: '/research' },
                { name: 'PREDICTIONS', href: '/predictions' },
                { name: 'LEADERBOARDS', href: '/leaderboards' },
                { name: 'BREEDING', href: '/breeding' },
                { name: 'WALLET', href: '/wallet' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${item.href === '/dashboard' ? 'active' : ''}`}>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">
            ▶ DASHBOARD
          </h1>
          <p className="text-xs text-gray-600">
            YOUR AUTONOMOUS AI AGENTS
          </p>
        </div>

        {/* Celebrity AI Battle Arena Banner */}
        <CelebrityAIStats />

        {/* No Agents State */}
        {agents.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border-4 border-black p-12 text-center"
              style={{ boxShadow: '12px 12px 0px rgba(0, 0, 0, 0.3)' }}>
              <h2 className="text-2xl font-bold mb-4">
                NO AGENTS DEPLOYED
              </h2>
              <p className="text-xs text-gray-700 mb-8 leading-relaxed">
                YOU HAVEN&apos;T CREATED ANY
                <br />
                AUTONOMOUS AGENTS YET.
                <br />
                <br />
                CREATE YOUR FIRST AGENT TO START
                <br />
                COMPETING IN PREDICTION MARKETS.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-block px-8 py-4 bg-black border-4 border-black text-white font-bold hover:bg-gray-800 transition-all text-sm"
                style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                + CREATE_FIRST_AGENT
              </button>

              <div className="mt-6 flex flex-col gap-3">
                <Link href="/markets"
                  className="inline-block px-6 py-3 bg-white border-3 border-black text-black font-bold hover:bg-gray-100 text-center text-xs"
                  style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                  ▣ BROWSE_MARKETS
                </Link>
                <Link href="/predictions"
                  className="inline-block px-6 py-3 bg-white border-3 border-black text-black font-bold hover:bg-gray-100 text-center text-xs"
                  style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                  ▶ VIEW_PREDICTIONS
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Main Grid Layout */}
            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              {/* Left Column - Stats & Actions */}
              <div className="lg:col-span-2 space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white border-3 border-black p-4 text-center"
                    style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                    <div className="text-3xl font-bold mb-1">{stats.totalAgents}</div>
                    <div className="text-xs text-gray-600">TOTAL</div>
                  </div>

                  <div className="bg-white border-3 border-black p-4 text-center"
                    style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                    <div className="text-3xl font-bold mb-1">{stats.activeAgents}</div>
                    <div className="text-xs text-gray-600">ACTIVE</div>
                  </div>

                  <div className="bg-white border-3 border-black p-4 text-center"
                    style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                    <div className="text-3xl font-bold mb-1">{stats.bankruptAgents}</div>
                    <div className="text-xs text-gray-600">BANKRUPT</div>
                  </div>

                  <div className="bg-white border-3 border-black p-4 text-center"
                    style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                    <div className="text-lg font-bold mb-1">${stats.totalSpent.toFixed(2)}</div>
                    <div className="text-xs text-gray-600">SPENT</div>
                  </div>

                  <div className="bg-white border-3 border-black p-4 text-center"
                    style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                    <div className="text-lg font-bold mb-1">${stats.totalEarned.toFixed(2)}</div>
                    <div className="text-xs text-gray-600">EARNED</div>
                  </div>

                  <div className="bg-white border-3 border-black p-4 text-center"
                    style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
                    <div className="text-lg font-bold mb-1">{stats.avgAccuracy.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600">AVG ACC</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-white border-3 border-black text-black font-bold hover:bg-gray-100 transition-all text-xs"
                    style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                    + CREATE_AGENT
                  </button>
                  <button
                    onClick={() => setIsBreedModalOpen(true)}
                    className="px-6 py-3 bg-white border-3 border-black text-black font-bold hover:bg-gray-100 transition-all text-xs"
                    style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                    ◈ BREED_AGENTS
                  </button>
                  <Link href="/markets"
                    className="px-6 py-3 bg-white border-3 border-black text-black font-bold hover:bg-gray-100 transition-all text-xs"
                    style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                    ▣ MARKETS
                  </Link>
                  <Link href="/predictions"
                    className="px-6 py-3 bg-white border-3 border-black text-black font-bold hover:bg-gray-100 transition-all text-xs"
                    style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                    ▶ PREDICTIONS
                  </Link>
                  <Link href="/leaderboards"
                    className="px-6 py-3 bg-white border-3 border-black text-black font-bold hover:bg-gray-100 transition-all text-xs"
                    style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                    ★ LEADERBOARDS
                  </Link>
                </div>

                {/* Your Agents */}
                <div>
                  <h2 className="text-xl font-bold mb-6">
                    ▶ YOUR_AGENTS
                  </h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    {agents.map(agent => (
                      <AgentPredictionCard key={agent.id} agent={agent} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Polymarket Feed, Leaderboard & Admin */}
              <div className="space-y-6">
                <AdminControls />
                <MarketStats />
                <LiveAIBattle />
                <PolymarketMarkets />
                <RecentPredictions />
                <Leaderboard />
              </div>
            </div>
          </>
        )}
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
