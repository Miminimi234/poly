'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Prediction {
  id: string;
  prediction: string;
  confidence: number;
  reasoning: string;
  created_at: string;
  polymarket_markets: {
    question: string;
    market_slug: string;
  };
}

interface Agent {
  id: string;
  name: string;
  strategy_type?: string;
  strategy?: string;
  current_balance_usdt?: number;
  balance?: number;
  total_predictions: number;
  accuracy: number;
  roi?: number;
  total_profit_loss?: number;
  generation?: number;
  mutations?: string[];
  parent1_id?: string;
  parent2_id?: string;
  is_active: boolean;
  is_bankrupt: boolean;
  is_celebrity?: boolean;
  celebrity_model?: string;
  avatar?: string;
  traits?: any;
}

interface AgentStats {
  accuracy: number;
  roi: number;
  total_profit_loss: number;
  resolved_predictions: number;
  correct_predictions: number;
}

export default function AgentPredictionCard({ agent }: { agent: Agent }) {
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  useEffect(() => {
    // Fetch latest prediction
    fetchLatestPrediction();
    // Fetch agent stats
    fetchAgentStats();
  }, [agent.id]);
  
  const fetchAgentStats = () => {
    fetch(`/api/agents/${agent.id}/stats`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch(err => console.error('Failed to fetch stats:', err));
  };
  
  const fetchLatestPrediction = () => {
    fetch(`/api/predictions?agentId=${agent.id}&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.predictions.length > 0) {
          setLatestPrediction(data.predictions[0]);
        }
      })
      .catch(err => console.error('Failed to fetch prediction:', err));
  };
  
  const triggerAnalysis = async () => {
    setAnalyzing(true);
    try {
      await fetch('/api/analyze-trigger', { method: 'POST' });
      // Refresh prediction after 5 seconds
      setTimeout(() => {
        fetchLatestPrediction();
        setAnalyzing(false);
      }, 5000);
    } catch (error) {
      console.error('Analysis trigger failed:', error);
      setAnalyzing(false);
    }
  };
  
  // Get color for celebrity agents
  const getAgentColor = () => {
    if (!agent.is_celebrity) return 'bg-white';
    
    const colorMap: Record<string, string> = {
      'ChatGPT-4': 'bg-green-50',
      'Claude-Sonnet': 'bg-blue-50',
      'Gemini-Pro': 'bg-purple-50',
      'GPT-3.5-Turbo': 'bg-yellow-50',
      'Llama-3-70B': 'bg-orange-50',
      'Mistral-Large': 'bg-indigo-50',
      'Perplexity-AI': 'bg-pink-50',
      'Grok-Beta': 'bg-cyan-50'
    };
    
    return colorMap[agent.name] || 'bg-gray-50';
  };
  
  const getBorderColor = () => {
    if (!agent.is_celebrity) return 'border-black';
    
    const borderMap: Record<string, string> = {
      'ChatGPT-4': 'border-green-600',
      'Claude-Sonnet': 'border-blue-600',
      'Gemini-Pro': 'border-purple-600',
      'GPT-3.5-Turbo': 'border-yellow-600',
      'Llama-3-70B': 'border-orange-600',
      'Mistral-Large': 'border-indigo-600',
      'Perplexity-AI': 'border-pink-600',
      'Grok-Beta': 'border-cyan-600'
    };
    
    return borderMap[agent.name] || 'border-black';
  };
  
  return (
    <Link href={`/agents/${agent.id}`}>
      <div className={`${getAgentColor()} border-3 ${getBorderColor()} p-6 cursor-pointer transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]`}
        style={{ boxShadow: '8px 8px 0px rgba(0, 0, 0, 0.3)' }}>
        
        {/* Status */}
        <div className="flex justify-between items-start mb-4">
          <span className={`text-xs uppercase px-2 py-1 border-2 ${getBorderColor()} ${
            agent.is_bankrupt ? 'bg-gray-200' :
            agent.is_active ? 'bg-white' : 'bg-gray-100'
          }`}>
            {agent.is_bankrupt ? '✗ BANKRUPT' : agent.is_active ? '● ACTIVE' : '○ INACTIVE'}
          </span>
          <span className="text-xs text-gray-600 uppercase">
            {agent.strategy_type || agent.strategy || 'AI_AGENT'}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-base font-bold mb-2">
          {agent.avatar || agent.traits?.avatar || '🤖'} {agent.name}
        </h3>
        
        {/* Model (for celebrity agents) */}
        {agent.is_celebrity && agent.celebrity_model && (
          <div className="text-xs text-gray-600 mb-3">
            {agent.celebrity_model}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          <div>
            <div className="text-gray-600 mb-1">BALANCE</div>
            <div className="font-bold">
              ${((agent.current_balance_usdt || agent.balance || 0)).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-gray-600 mb-1">ACCURACY</div>
            <div className="font-bold">
              {(agent.accuracy || 0).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Latest Prediction */}
        {latestPrediction && (
          <div className="border-t-2 border-black pt-3 mt-3">
            <div className="text-xs text-gray-600 mb-2 uppercase font-bold">
              LATEST PREDICTION:
            </div>
            <div className="text-xs mb-2 leading-tight">
              {latestPrediction.polymarket_markets?.question || 'Unknown market'}
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className={`font-bold text-xs ${
                latestPrediction.prediction === 'YES' ? 'text-black' : 'text-black'
              }`}>
                → {latestPrediction.prediction}
              </span>
              <span className="text-gray-600 text-xs">
                {(latestPrediction.confidence * 100).toFixed(0)}% CONFIDENT
              </span>
            </div>
            <div className="text-gray-600 text-xs italic leading-tight">
              "{latestPrediction.reasoning.slice(0, 100)}..."
            </div>
          </div>
        )}

        {/* Manual trigger button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerAnalysis();
          }}
          disabled={analyzing || !agent.is_active}
          className="mt-3 w-full border-2 border-black px-3 py-2 font-bold bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          style={{ boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)' }}
        >
          {analyzing ? 'ANALYZING...' : '↻ ANALYZE NOW'}
        </button>

        {/* Accuracy Stats */}
        {stats && stats.resolved_predictions > 0 && (
          <div className="border-t-2 border-black pt-3 mt-3">
            <div className="text-xs text-gray-600 mb-2 uppercase font-bold">
              PERFORMANCE:
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-gray-600 mb-1">ACCURACY</div>
                <div className="text-black font-bold">{stats.accuracy}%</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">ROI</div>
                <div className={`font-bold ${
                  parseFloat(stats.roi as any) >= 0 ? 'text-black' : 'text-gray-600'
                }`}>
                  {parseFloat(stats.roi as any) >= 0 ? '+' : ''}{stats.roi}%
                </div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">P/L</div>
                <div className={`font-bold ${
                  stats.total_profit_loss >= 0 ? 'text-black' : 'text-gray-600'
                }`}>
                  ${stats.total_profit_loss?.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2 text-center">
              {stats.correct_predictions}/{stats.resolved_predictions} CORRECT
            </div>
          </div>
        )}

        {/* Generation & Mutations */}
        {agent.generation && agent.generation > 0 && (
          <div className="border-t-2 border-black pt-3 mt-3">
            <div className="text-xs text-gray-600 mb-2 uppercase font-bold">
              GENETICS:
            </div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-600">GENERATION:</span>
              <span className="text-black font-bold">GEN {agent.generation}</span>
            </div>
            
            {agent.parent1_id && agent.parent2_id && (
              <div className="text-xs text-gray-600 mb-2">
                ◈ BRED OFFSPRING
              </div>
            )}
            
            {agent.mutations && agent.mutations.length > 0 && (
              <div>
                <div className="text-xs text-gray-600 mb-1">MUTATIONS:</div>
                <div className="flex flex-wrap gap-1">
                  {agent.mutations.slice(0, 2).map((mutation: string) => (
                    <span 
                      key={mutation}
                      className="text-xs px-2 py-1 bg-gray-100 border border-black"
                    >
                      {mutation.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {agent.mutations.length > 2 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 border border-black">
                      +{agent.mutations.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Predictions count */}
        <div className="text-center pt-3 border-t-2 border-black mt-3">
          <div className="text-2xl font-bold">{agent.total_predictions}</div>
          <div className="text-xs text-gray-600 uppercase">TOTAL PREDICTIONS</div>
        </div>
      </div>
    </Link>
  );
}

