'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '@/styles/poly402.css';
import { MainNav } from '@/components/navigation/MainNav';

interface Agent {
  id: string;
  name: string;
  strategy_type: string;
  current_balance_usdt?: number | null;
  total_spent_usdt?: number | null;
  total_earned_usdt?: number | null;
  accuracy?: number | null;
  balance?: number | null;
  total_predictions: number;
  is_active: boolean;
  is_bankrupt: boolean;
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'bankrupt'>('all');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    if (filter === 'active') return agent.is_active && !agent.is_bankrupt;
    if (filter === 'bankrupt') return agent.is_bankrupt;
    return true;
  });

  const handleDeleteAgent = async (id: string) => {
    if (!confirm('Delete this agent? This cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/agents/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setAgents(agents.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

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
        <MainNav />

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs mb-4 inline-block hover:underline">
            ← BACK TO DASHBOARD
          </Link>
          <h1 className="text-4xl font-bold mb-3">
            ▶ AGENTS
          </h1>
          <p className="text-xs text-gray-600">
            MANAGE YOUR AUTONOMOUS AI AGENTS
          </p>
        </div>

        {/* Filters & Create Button */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 uppercase text-xs border-2 border-black transition-all ${
                filter === 'all' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
              ALL ({agents.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 uppercase text-xs border-2 border-black transition-all ${
                filter === 'active' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
              ACTIVE ({agents.filter(a => a.is_active && !a.is_bankrupt).length})
            </button>
            <button
              onClick={() => setFilter('bankrupt')}
              className={`px-4 py-2 uppercase text-xs border-2 border-black transition-all ${
                filter === 'bankrupt' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
              BANKRUPT ({agents.filter(a => a.is_bankrupt).length})
            </button>
          </div>

          <Link href="/agents/create"
            className="px-6 py-3 bg-black border-2 border-black text-white font-bold uppercase text-xs hover:bg-gray-800 transition-all"
            style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
            + CREATE NEW AGENT
          </Link>
        </div>

        {/* No Agents */}
        {filteredAgents.length === 0 ? (
          <div className="bg-white border-4 border-black p-12 text-center"
            style={{ boxShadow: '12px 12px 0px rgba(0, 0, 0, 0.3)' }}>
            <h2 className="text-3xl font-bold mb-4">
              NO AGENTS FOUND
            </h2>
            <p className="text-xs text-gray-600 mb-8">
              {filter === 'active' && 'NO ACTIVE AGENTS. CREATE ONE OR CHANGE FILTER.'}
              {filter === 'bankrupt' && 'NO BANKRUPT AGENTS. GOOD JOB!'}
              {filter === 'all' && 'NO AGENTS CREATED YET. DEPLOY YOUR FIRST AGENT.'}
            </p>
            <Link href="/agents/create"
              className="inline-block px-8 py-4 bg-black border-2 border-black text-white font-bold uppercase text-xs hover:bg-gray-800 transition-all"
              style={{ boxShadow: '6px 6px 0px rgba(0, 0, 0, 0.3)' }}>
              CREATE AGENT
            </Link>
          </div>
        ) : (
          /* Agents Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map(agent => (
              <div key={agent.id} 
                className="bg-white border-3 border-black p-6 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
                style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>
                
                {/* Status */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs uppercase px-2 py-1 border-2 border-black ${
                    agent.is_bankrupt ? 'bg-gray-200' :
                    agent.is_active ? 'bg-white' : 'bg-gray-100'
                  }`}>
                    {agent.is_bankrupt ? '✗ BANKRUPT' : agent.is_active ? '● ACTIVE' : '○ INACTIVE'}
                  </span>
                  <span className="text-xs text-gray-600 uppercase">
                    {agent.strategy_type}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-base font-bold mb-4">
                  {agent.name}
                </h3>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                 <div>
                   <div className="text-gray-600 mb-1">BALANCE</div>
                   <div className="font-bold">
                      ${((agent.current_balance_usdt ?? agent.balance ?? 0)).toFixed(2)}
                    </div>
                  </div>
                  <div>
                   <div className="text-gray-600 mb-1">ACCURACY</div>
                   <div className="font-bold">
                      {(agent.accuracy ?? 0).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                   <div className="text-gray-600 mb-1">SPENT</div>
                   <div className="text-gray-700">
                      ${(agent.total_spent_usdt ?? 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                   <div className="text-gray-600 mb-1">EARNED</div>
                   <div className="text-gray-700">
                      ${(agent.total_earned_usdt ?? 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Predictions */}
                <div className="text-center pt-4 border-t-2 border-black mb-4">
                  <div className="text-2xl font-bold">
                    {agent.total_predictions}
                  </div>
                  <div className="text-xs text-gray-600 uppercase">
                    PREDICTIONS
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/agents/${agent.id}`}
                    className="flex-1 text-center py-2 border-2 border-black text-black text-xs font-bold uppercase hover:bg-black hover:text-white transition-all">
                    VIEW
                  </Link>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="px-4 py-2 border-2 border-black text-black text-xs font-bold uppercase hover:bg-black hover:text-white transition-all">
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
