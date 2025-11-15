'use client';

import { AGENT_STRATEGIES, Strategy } from '@/lib/agent-strategies';
import { useUserAgentStore } from '@/lib/stores/use-user-agent-store';
import { useState } from 'react';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAgentModal({ isOpen, onClose, onSuccess }: CreateAgentModalProps) {
  const createAgent = useUserAgentStore((state) => state.createAgent);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    strategy_type: '',
    initial_balance: 100
  });
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStrategySelect = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setFormData({ ...formData, strategy_type: strategy.type });
    setStep(2);
  };

  const handleSubmit = async () => {
    // Validate
    if (!formData.name.trim()) {
      setError('Agent name is required');
      return;
    }

    if (!formData.strategy_type) {
      setError('Please select a strategy');
      return;
    }

    if (formData.initial_balance < 10 || formData.initial_balance > 10000) {
      setError('Balance must be between $10 and $10,000');
      return;
    }

    setCreating(true);
    setError('');

    try {
      // Create agent using localStorage store
      const agentId = await createAgent({
        name: formData.name,
        description: formData.description,
        strategy_type: formData.strategy_type,
        initial_balance: formData.initial_balance
      });

      console.log(`✅ Created user agent: ${agentId}`);
      onSuccess();
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create agent';
      setError(errorMessage);
      console.error('❌ Failed to create agent:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: '',
      description: '',
      strategy_type: '',
      initial_balance: 100
    });
    setSelectedStrategy(null);
    setError('');
    onClose();
  };

  const estimateCost = (sources: string[]) => {
    const costs: Record<string, number> = {
      'valyu-web': 0.01,
      'valyu-academic': 0.10,
      'news-feeds': 0.05,
      'expert-analysis': 0.50,
      'sentiment': 0.02
    };
    return sources.reduce((total, source) => total + (costs[source] || 0.05), 0);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        className="border-1 border-gray max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '12px 12px 0px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="border-b-4 border-gray p-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold">
            {step === 1 ? '■ SELECT_STRATEGY' : '■ CONFIGURE_AGENT'}
          </h2>
          <button
            onClick={handleClose}
            className="text-2xl font-bold hover:text-white-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Strategy Selection */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              {AGENT_STRATEGIES.map(strategy => (
                <button
                  key={strategy.type}
                  onClick={() => handleStrategySelect(strategy)}
                  className="border-1 border-gray p-4 text-left transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
                  style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{strategy.icon}</span>
                    <div className="flex-1">
                      <div className="text-base font-bold mb-1">{strategy.name}</div>
                      <div className={`text-xs font-bold inline-block px-2 py-1 border-2 border-gray`}>
                        {strategy.riskLevel} RISK
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-white-700 mb-3 leading-relaxed">
                    {strategy.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {strategy.traits.map(trait => (
                      <span
                        key={trait}
                        className="text-xs px-2 py-1 border border-gray"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && selectedStrategy && (
            <div className="space-y-6">
              {/* Selected Strategy Preview */}
              <div className="border-1 border-gray p-4"
                style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{selectedStrategy.icon}</span>
                  <div>
                    <div className="text-base font-bold">{selectedStrategy.name}</div>
                    <div className="text-xs text-white-600">
                      CONFIDENCE: {(selectedStrategy.confidenceThreshold * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs underline hover:no-underline"
                >
                  ← CHANGE STRATEGY
                </button>
              </div>

              {/* Agent Name */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  AGENT_NAME *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="AGENT_ALPHA_001"
                  maxLength={50}
                  className="w-full border-1 border-gray px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <div className="text-xs text-white-600 mt-1">
                  {formData.name.length}/50 CHARACTERS
                </div>
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="DESCRIBE YOUR AGENT'S PURPOSE..."
                  maxLength={200}
                  rows={3}
                  className="w-full border-1 border-gray px-4 py-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
                <div className="text-xs text-white-600 mt-1">
                  {formData.description.length}/200 CHARACTERS
                </div>
              </div>

              {/* Initial Balance */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  INITIAL_BALANCE *
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="10000"
                    step="10"
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({
                      ...formData,
                      initial_balance: parseInt(e.target.value)
                    })}
                    className="flex-1 cursor-pointer"
                  />
                  <div className="text-2xl font-bold w-32 text-right border-1 border-gray px-4 py-2">
                    ${formData.initial_balance}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-white-600 mt-2">
                  <span>$10 MIN</span>
                  <span>$10,000 MAX</span>
                </div>
                <div className="text-xs text-white-600 mt-3 p-2 border border-gray">
                  ▶ MORE BALANCE = MORE RESEARCH = BETTER PREDICTIONS
                </div>
              </div>

              {/* Research Cost Estimate */}
              <div className="border-1 border-gray p-4"
                style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                <div className="text-sm font-bold mb-3">
                  ▦ ESTIMATED_RESEARCH_COSTS
                </div>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between pb-2 border-b border-gray">
                    <span>COST PER ANALYSIS:</span>
                    <span className="font-bold">
                      ${estimateCost(selectedStrategy.researchSources).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray">
                    <span>POTENTIAL ANALYSES:</span>
                    <span className="font-bold">
                      ~{Math.floor(formData.initial_balance / estimateCost(selectedStrategy.researchSources))} PREDICTIONS
                    </span>
                  </div>
                  <div className="pt-1">
                    <div className="text-white-600 mb-1">SOURCES USED:</div>
                    <div className="font-bold">{selectedStrategy.researchSources.map(s => s.toUpperCase()).join(', ')}</div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="border-1 border-gray p-3 text-xs">
                  ⚠ {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleClose}
                  className="flex-1 border-1 border-gray px-6 py-3 font-bold text-sm"
                  style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={creating}
                  className="flex-1 border-1 border-gray px-6 py-3 font-bold text-sm disabled:opacity-50"
                  style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}
                >
                  {creating ? 'CREATING...' : 'CREATE_AGENT'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

