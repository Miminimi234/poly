'use client';

import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  name: string;
  strategy_type: string;
  accuracy: number;
  roi: number;
  current_balance_usdt: number;
  generation?: number;
  is_active: boolean;
  is_bankrupt: boolean;
}

interface BreedAgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BreedAgentsModal({ isOpen, onClose, onSuccess }: BreedAgentsModalProps) {
  const [step, setStep] = useState(1);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedParent1, setSelectedParent1] = useState<Agent | null>(null);
  const [selectedParent2, setSelectedParent2] = useState<Agent | null>(null);
  const [offspringName, setOffspringName] = useState('');
  const [breeding, setBreeding] = useState(false);
  const [eligibilityCheck, setEligibilityCheck] = useState<{
    canBreed: boolean;
    reason?: string;
  } | null>(null);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      fetchEligibleAgents();
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (selectedParent1 && selectedParent2) {
      checkEligibility();
    }
  }, [selectedParent1, selectedParent2]);
  
  const fetchEligibleAgents = async () => {
    try {
      const response = await fetch('/api/agents?all=true');
      const data = await response.json();
      
      if (data.success) {
        // Filter for active, non-bankrupt agents with balance >= $50
        const eligible = data.agents.filter((a: Agent) => 
          a.current_balance_usdt >= 50 && !a.is_bankrupt && a.is_active
        );
        setAgents(eligible);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };
  
  const checkEligibility = async () => {
    if (!selectedParent1 || !selectedParent2) return;
    
    try {
      const response = await fetch('/api/breeding/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent1Id: selectedParent1.id,
          parent2Id: selectedParent2.id
        })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Eligibility check failed');
      }

      setEligibilityCheck({ canBreed: data.canBreed, reason: data.reason });
    } catch (error) {
      setEligibilityCheck({ canBreed: false, reason: 'Error checking eligibility' });
    }
  };
  
  const handleBreed = async () => {
    if (!selectedParent1 || !selectedParent2) return;
    
    setBreeding(true);
    setError('');
    
    try {
      const response = await fetch('/api/breeding/breed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent1Id: selectedParent1.id,
          parent2Id: selectedParent2.id,
          offspringName: offspringName || undefined
        })
      });
      const result = await response.json();

      if (response.ok && result.success) {
        onSuccess();
        handleClose();
      } else {
        setError(result.error || 'Breeding failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setBreeding(false);
    }
  };
  
  const handleClose = () => {
    setStep(1);
    setSelectedParent1(null);
    setSelectedParent2(null);
    setOffspringName('');
    setEligibilityCheck(null);
    setError('');
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white border-4 border-black max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '12px 12px 0px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="border-b-4 border-black p-4 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold">
            ◈ BREED_AGENTS
          </h2>
          <button
            onClick={handleClose}
            className="text-2xl font-bold hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Parent 1 */}
          {step === 1 && (
            <div>
              <div className="text-base font-bold mb-4">
                ▶ SELECT_FIRST_PARENT
              </div>
              <div className="grid grid-cols-2 gap-4">
                {agents.length === 0 ? (
                  <div className="col-span-2 text-center text-gray-600 py-8">
                    <div className="text-4xl mb-2">✗</div>
                    <div className="text-sm">
                      NO ELIGIBLE AGENTS FOUND.
                      <div className="text-xs mt-2 leading-relaxed">
                        AGENTS NEED $50+ BALANCE AND<br />
                        5+ RESOLVED PREDICTIONS TO BREED.
                      </div>
                    </div>
                  </div>
                ) : (
                  agents.map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setSelectedParent1(agent);
                        setStep(2);
                      }}
                      className="border-3 border-black p-4 bg-white hover:bg-gray-50 text-left transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
                      style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}
                    >
                      <div className="font-bold mb-1 text-sm">{agent.name}</div>
                      <div className="text-xs text-gray-600 mb-3">
                        {agent.strategy_type.toUpperCase()} • GEN {agent.generation || 0}
                      </div>
                      <div className="flex justify-between text-xs border-t-2 border-black pt-2">
                        <span className="text-gray-600">ACCURACY:</span>
                        <span className="font-bold">{agent.accuracy?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1">
                        <span className="text-gray-600">BALANCE:</span>
                        <span className="font-bold">${agent.current_balance_usdt?.toFixed(0) || 0}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          
          {/* Step 2: Select Parent 2 */}
          {step === 2 && selectedParent1 && (
            <div>
              <div className="text-base font-bold mb-4">
                ▶ SELECT_SECOND_PARENT
              </div>
              
              {/* Show Parent 1 */}
              <div className="border-3 border-black p-3 bg-gray-50 mb-4 flex justify-between items-center"
                   style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                <div>
                  <div className="font-bold text-sm">{selectedParent1.name}</div>
                  <div className="text-xs text-gray-600">
                    {selectedParent1.strategy_type.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedParent1(null);
                    setStep(1);
                  }}
                  className="text-xs underline hover:no-underline"
                >
                  ← CHANGE
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {agents
                  .filter(a => a.id !== selectedParent1.id)
                  .map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setSelectedParent2(agent);
                        setStep(3);
                      }}
                      className="border-3 border-black p-4 bg-white hover:bg-gray-50 text-left transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
                      style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}
                    >
                      <div className="font-bold mb-1 text-sm">{agent.name}</div>
                      <div className="text-xs text-gray-600 mb-3">
                        {agent.strategy_type.toUpperCase()} • GEN {agent.generation || 0}
                      </div>
                      <div className="flex justify-between text-xs border-t-2 border-black pt-2">
                        <span className="text-gray-600">ACCURACY:</span>
                        <span className="font-bold">{agent.accuracy?.toFixed(1) || 0}%</span>
                      </div>
                      <div className="flex justify-between text-xs pt-1">
                        <span className="text-gray-600">BALANCE:</span>
                        <span className="font-bold">${agent.current_balance_usdt?.toFixed(0) || 0}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
          
          {/* Step 3: Confirm & Name */}
          {step === 3 && selectedParent1 && selectedParent2 && (
            <div className="space-y-6">
              <div className="text-base font-bold">
                ▶ BREEDING_PREVIEW
              </div>
              
              {/* Parents */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border-3 border-black p-4 bg-gray-100"
                     style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                  <div className="text-xs text-gray-600 mb-2 font-bold">PARENT_1</div>
                  <div className="font-bold text-sm mb-1">{selectedParent1.name}</div>
                  <div className="text-xs text-gray-600 mb-3">
                    {selectedParent1.strategy_type.toUpperCase()}
                  </div>
                  <div className="text-xs border-t-2 border-black pt-2">
                    <div className="flex justify-between mb-1">
                      <span>ACCURACY:</span>
                      <span className="font-bold">{selectedParent1.accuracy?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ROI:</span>
                      <span className="font-bold">{selectedParent1.roi?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-3 border-black p-4 bg-gray-100"
                     style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                  <div className="text-xs text-gray-600 mb-2 font-bold">PARENT_2</div>
                  <div className="font-bold text-sm mb-1">{selectedParent2.name}</div>
                  <div className="text-xs text-gray-600 mb-3">
                    {selectedParent2.strategy_type.toUpperCase()}
                  </div>
                  <div className="text-xs border-t-2 border-black pt-2">
                    <div className="flex justify-between mb-1">
                      <span>ACCURACY:</span>
                      <span className="font-bold">{selectedParent2.accuracy?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ROI:</span>
                      <span className="font-bold">{selectedParent2.roi?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Eligibility Check */}
              {eligibilityCheck && !eligibilityCheck.canBreed && (
                <div className="border-3 border-black bg-gray-200 p-4 text-xs">
                  ⚠ {eligibilityCheck.reason?.toUpperCase()}
                </div>
              )}
              
              {/* Offspring Name */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  OFFSPRING_NAME (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={offspringName}
                  onChange={(e) => setOffspringName(e.target.value)}
                  placeholder="AUTO-GENERATED IF LEFT BLANK"
                  maxLength={50}
                  className="w-full border-3 border-black px-4 py-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              
              {/* Breeding Info */}
              <div className="border-3 border-black p-4 bg-gray-50"
                   style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                <div className="text-sm font-bold mb-3">
                  ◈ BREEDING_INFO
                </div>
                <div className="text-xs space-y-2">
                  <div className="flex justify-between pb-1 border-b border-black">
                    <span>COST:</span>
                    <span className="font-bold">$50 PER PARENT ($100 TOTAL)</span>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-black">
                    <span>OFFSPRING GENERATION:</span>
                    <span className="font-bold">GEN {Math.max(selectedParent1.generation || 0, selectedParent2.generation || 0) + 1}</span>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-black">
                    <span>STRATEGY:</span>
                    <span className="font-bold">HYBRID OF PARENTS</span>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-black">
                    <span>STARTING BALANCE:</span>
                    <span className="font-bold">${((selectedParent1.current_balance_usdt + selectedParent2.current_balance_usdt) / 4).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MUTATIONS:</span>
                    <span className="font-bold">15% CHANCE PER TRAIT</span>
                  </div>
                </div>
              </div>
              
              {/* Error */}
              {error && (
                <div className="border-3 border-black bg-gray-200 p-3 text-xs">
                  ⚠ {error.toUpperCase()}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border-3 border-black px-6 py-3 font-bold bg-white hover:bg-gray-100 text-sm"
                  style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                >
                  ← BACK
                </button>
                <button
                  onClick={handleBreed}
                  disabled={breeding || (eligibilityCheck ? !eligibilityCheck.canBreed : false)}
                  className="flex-1 border-3 border-black px-6 py-3 font-bold bg-black text-white hover:bg-gray-800 disabled:opacity-50 text-sm"
                  style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}
                >
                  {breeding ? 'BREEDING...' : '◈ BREED_AGENTS'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
