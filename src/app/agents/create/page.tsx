'use client';

import { MainNav } from '@/components/navigation/MainNav';
import { AGENT_STRATEGIES } from '@/lib/agent-strategies';
import useUserAgentStore from '@/lib/stores/use-user-agent-store';
import '@/styles/Polysentience.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

export default function CreateAgentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    strategyType: AGENT_STRATEGIES[0]?.type || 'balanced',
    initialBalance: '10.0'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingAgentId, setExistingAgentId] = useState<string | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  const createAgentLocal = useUserAgentStore((s) => s.createAgent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || '',
        strategy_type: formData.strategyType,
        initial_balance: parseFloat(formData.initialBalance)
      };

      // Create agent locally using the persisted Zustand store (localStorage)
      const agentId = await createAgentLocal(payload);

      // Redirect to the user agent detail page (local user agents live under /agents/user/[id])
      router.push(`/agents/user/${agentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  const selectedStrategy = AGENT_STRATEGIES.find(s => s.type === formData.strategyType);

  // On mount, check localStorage for existing user agents saved by the Zustand store
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user-agent-storage');
      if (!raw) {
        setCheckingExisting(false);
        return;
      }

      const parsed = JSON.parse(raw);

      // Zustand persist may store state directly or under a `state` key depending on version
      const agents = parsed?.state?.agents ?? parsed?.agents ?? [];

      if (Array.isArray(agents) && agents.length > 0) {
        // pick the first agent (you can change this to other selection logic)
        const firstAgent = agents[0];
        const agentId = firstAgent?.id || null;
        if (agentId) {
          setExistingAgentId(agentId);
          // auto-redirect shortly to improve UX
          setTimeout(() => {
            router.push(`/agents/user/${agentId}`);
          }, 800);
        }
      }
    } catch (e) {
      // ignore parse errors and allow form to proceed
      console.error('Failed to read existing user agents from localStorage', e);
    } finally {
      setCheckingExisting(false);
    }
  }, [router]);

  return (
    <div className="min-h-screen  text-black">
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
          <Link href="/agents" className="text-xs mb-4 inline-block hover:underline">
            ← BACK TO AGENTS
          </Link>
          <h1 className="text-4xl font-bold mb-3">
            ▶ CREATE_AGENT
          </h1>
          <p className="text-xs text-black-600">
            CUSTOM AGENT CREATION
          </p>
        </div>

        {/* Create Agent Form or Existing-Agent Notice */}
        {checkingExisting ? (
          <div className="max-w-4xl">
            <div className=" border-1 border-gray p-12 text-center"
              style={{ boxShadow: '12px 12px 0px rgba(0,0,0,0.3)' }}>
              <div className="text-3xl mb-4">⟲</div>
              <div className="text-lg font-bold">CHECKING_FOR_EXISTING_AGENT...</div>
            </div>
          </div>
        ) : existingAgentId ? (
          <div className="max-w-4xl">
            <div className=" border-1 border-gray p-12 text-center"
              style={{ boxShadow: '12px 12px 0px rgba(0,0,0,0.3)' }}>
              <div className="text-6xl mb-6">🔎</div>
              <h2 className="text-3xl font-bold mb-4">YOU_ALREADY_HAVE_AN_AGENT</h2>
              <p className="text-sm text-black-600 mb-6">Opening your agent page now.</p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href={`/agents/user/${existingAgentId}`}
                  className="px-4 py-2 border-2 border-gray font-bold  hover:border-white"
                >
                  OPEN_AGENT_PAGE
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-4xl">
            <div className=" border-1 border-gray p-8"
              style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>
              <h2 className="text-2xl font-bold mb-4">▶ BASIC_INFO</h2>

              <div className="grid grid-cols-1 gap-4">
                <label className="text-xs">
                  NAME
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full mt-1 p-2 border-2 border-gray-200"
                  />
                </label>

                <label className="text-xs">
                  DESCRIPTION
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full mt-1 p-2 border-2 border-gray-200"
                    rows={4}
                  />
                </label>

                <label className="text-xs">
                  STRATEGY
                  <select
                    value={formData.strategyType}
                    onChange={(e) => setFormData({ ...formData, strategyType: e.target.value })}
                    className="w-full mt-1 p-2 border-2 border-gray-200"
                  >
                    {AGENT_STRATEGIES.map((s) => (
                      <option key={s.type} value={s.type}>{s.name}</option>
                    ))}
                  </select>
                </label>

                <label className="text-xs">
                  INITIAL BALANCE (USD)
                  <input
                    type="number"
                    min={10}
                    max={10000}
                    step="0.01"
                    value={formData.initialBalance}
                    onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                    className="w-full mt-1 p-2 border-2 border-gray-200"
                  />
                </label>

                {selectedStrategy && (
                  <div className="text-sm text-black-600 border-t pt-3">
                    <div className="font-bold">{selectedStrategy.name}</div>
                    <div className="text-xs">{selectedStrategy.description}</div>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-red-600 font-bold">{error}</div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border-2 border-gray font-bold  hover:border-white"
                  >
                    {loading ? 'CREATING...' : 'CREATE_AGENT'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
