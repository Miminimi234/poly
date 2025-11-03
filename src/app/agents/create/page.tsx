'use client';

import { AGENT_STRATEGIES } from '@/lib/agent-strategies';
import '@/styles/poly402.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MainNav } from '@/components/navigation/MainNav';

export default function CreateAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    strategyType: '',
    initialBalance: '10.0'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/agents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          strategy_type: formData.strategyType,
          initial_balance: parseFloat(formData.initialBalance)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create agent');
      router.push(`/agents/${data.agent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  const selectedStrategy = AGENT_STRATEGIES.find(s => s.type === formData.strategyType);

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
          <Link href="/agents" className="text-xs mb-4 inline-block hover:underline">
            ← BACK TO AGENTS
          </Link>
          <h1 className="text-4xl font-bold mb-3">
            ▶ CREATE_AGENT
          </h1>
          <p className="text-xs text-gray-600">
            STEP {step} OF 3
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-6 bg-gray-200 border-2 border-black">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <div className="bg-white border-4 border-black p-8"
              style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>
              <h2 className="text-2xl font-bold mb-6">▶ BASIC_INFO</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase">Agent Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black text-base bg-white focus:outline-none focus:border-black"
                    placeholder="ENTER AGENT NAME"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-2">Choose a unique identifier for your agent</p>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 uppercase">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black text-base bg-white focus:outline-none focus:border-black h-24"
                    placeholder="DESCRIBE YOUR AGENT'S PURPOSE"
                  />
                  <p className="text-xs text-gray-600 mt-2">Optional description of what this agent will do</p>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 uppercase">Initial Balance (USDT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="1000"
                    value={formData.initialBalance}
                    onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-black text-base bg-white focus:outline-none focus:border-black"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-2">Starting funds for research and predictions (min: $1, max: $1000)</p>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.name || parseFloat(formData.initialBalance) < 1}
                  className="px-8 py-3 bg-black border-2 border-black text-white font-bold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:border-gray-400 text-sm"
                  style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                  NEXT: CHOOSE STRATEGY →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Strategy Selection */}
          {step === 2 && (
            <div className="bg-white border-4 border-black p-8"
              style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>
              <h2 className="text-2xl font-bold mb-6">▶ SELECT_STRATEGY</h2>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {AGENT_STRATEGIES.map((strat) => (
                  <div
                    key={strat.type}
                    onClick={() => setFormData({ ...formData, strategyType: strat.type })}
                    className={`border-3 border-black p-6 cursor-pointer transition-all ${formData.strategyType === strat.type
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-gray-100'
                      }`}
                    style={{
                      boxShadow: formData.strategyType === strat.type
                        ? '6px 6px 0px rgba(0, 0, 0, 0.5)'
                        : '4px 4px 0px rgba(0, 0, 0, 0.3)'
                    }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{strat.icon}</span>
                      <h3 className="font-bold text-base uppercase">{strat.name}</h3>
                    </div>
                    <p className="text-xs mb-4">{strat.description}</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>RISK:</span>
                        <span className="font-bold uppercase">{strat.riskLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CONFIDENCE:</span>
                        <span className="font-bold">{(strat.confidenceThreshold * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SOURCES:</span>
                        <span className="font-bold">{strat.researchSources.length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedStrategy && (
                <div className="bg-gray-100 border-2 border-black p-6 mb-6">
                  <h3 className="font-bold text-sm mb-3">▶ STRATEGY_DETAILS</h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">PREFERRED SOURCES:</span>
                      <div className="mt-1">
                        {selectedStrategy.researchSources.join(', ')}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">CONFIDENCE THRESHOLD:</span>
                      <div className="mt-1">
                        {(selectedStrategy.confidenceThreshold * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-8 py-3 bg-white border-2 border-black text-black font-bold hover:bg-gray-100 transition-all text-sm"
                  style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                  ← BACK
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!formData.strategyType}
                  className="px-8 py-3 bg-black border-2 border-black text-white font-bold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:border-gray-400 text-sm"
                  style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                  NEXT: REVIEW →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review and Confirm */}
          {step === 3 && (
            <div className="bg-white border-4 border-black p-8"
              style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>
              <h2 className="text-2xl font-bold mb-6">▶ REVIEW_AND_CONFIRM</h2>

              {error && (
                <div className="bg-white border-2 border-black p-4 mb-6 text-xs">
                  <span className="font-bold">✗ ERROR:</span> {error}
                </div>
              )}

              <div className="bg-gray-100 border-2 border-black p-6 mb-6">
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <div className="text-gray-600 text-xs mb-1">AGENT NAME</div>
                    <div className="font-bold">{formData.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs mb-1">INITIAL BALANCE</div>
                    <div className="font-bold">${formData.initialBalance} USDT</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs mb-1">STRATEGY</div>
                    <div className="font-bold uppercase">{selectedStrategy?.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 text-xs mb-1">RISK LEVEL</div>
                    <div className="font-bold uppercase">{selectedStrategy?.riskLevel}</div>
                  </div>
                  {formData.description && (
                    <div className="col-span-2">
                      <div className="text-gray-600 text-xs mb-1">DESCRIPTION</div>
                      <div className="text-sm">{formData.description}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-100 border-2 border-black p-4 mb-6 text-xs">
                <p className="mb-2">
                  <span className="font-bold">▶</span> Your agent will be created with a unique BSC wallet
                </p>
                <p className="mb-2">
                  <span className="font-bold">▶</span> The agent will autonomously purchase research using x402 payments
                </p>
                <p>
                  <span className="font-bold">▶</span> Agent will become bankrupt if spending exceeds earnings
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3 bg-white border-2 border-black text-black font-bold hover:bg-gray-100 transition-all text-sm"
                  style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                  ← BACK
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-black border-2 border-black text-white font-bold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:border-gray-400 text-sm"
                  style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}>
                  {loading ? 'CREATING AGENT...' : '✓ CREATE AGENT'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
