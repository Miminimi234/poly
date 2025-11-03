'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import '@/styles/poly402.css';

interface Prediction {
  id: string;
  prediction: string;
  confidence: number;
  reasoning: string;
  price_at_prediction: number;
  research_cost: number;
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

interface Stats {
  total: number;
  resolved: number;
  unresolved: number;
  correct: number;
  incorrect: number;
  accuracy: string;
  yesPredictions: number;
  noPredictions: number;
  totalResearchCost: string;
  totalProfitLoss: string;
  avgConfidence: string;
  currentStreak: number;
  longestStreak: number;
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    agentId: '',
    prediction: '',
    resolved: '',
    correct: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  
  useEffect(() => {
    fetchAgents();
  }, []);
  
  useEffect(() => {
    fetchPredictions();
    fetchStats();
  }, [filters]);
  
  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents?all=true');
      const data = await response.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };
  
  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.agentId) params.append('agentId', filters.agentId);
      if (filters.prediction) params.append('prediction', filters.prediction);
      if (filters.resolved) params.append('resolved', filters.resolved);
      if (filters.correct) params.append('correct', filters.correct);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);
      
      const response = await fetch(`/api/predictions/list?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.agentId) params.append('agentId', filters.agentId);
      
      const response = await fetch(`/api/predictions/stats?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const clearFilters = () => {
    setFilters({
      agentId: '',
      prediction: '',
      resolved: '',
      correct: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };
  
  return (
    <div className="min-h-screen bg-white text-black p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-1">▶ PREDICTIONS</h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            ALL AGENT PREDICTIONS ACROSS MARKETS
          </p>
        </div>
        
        <Link 
          href="/dashboard"
          className="border-4 border-black px-6 py-3 font-bold bg-white hover:bg-gray-100 text-sm"
          style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}
        >
          ← DASHBOARD
        </Link>
      </div>
      
      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="border-4 border-black p-4 bg-white text-center"
               style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-xs text-gray-600 mb-1">TOTAL</div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>
          
          <div className="border-4 border-black p-4 bg-white text-center"
               style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-xs text-gray-600 mb-1">ACCURACY</div>
            <div className="text-3xl font-bold">{stats.accuracy}%</div>
            <div className="text-xs text-gray-600 mt-1">{stats.correct}/{stats.resolved}</div>
          </div>
          
          <div className="border-4 border-black p-4 bg-white text-center"
               style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-xs text-gray-600 mb-1">PROFIT/LOSS</div>
            <div className={`text-3xl font-bold ${
              parseFloat(stats.totalProfitLoss) >= 0 ? 'text-black' : 'text-gray-600'
            }`}>
              {parseFloat(stats.totalProfitLoss) >= 0 ? '+' : ''}${stats.totalProfitLoss}
            </div>
          </div>
          
          <div className="border-4 border-black p-4 bg-white text-center"
               style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-xs text-gray-600 mb-1">WIN STREAK</div>
            <div className="text-3xl font-bold">
              ▲ {stats.currentStreak}
            </div>
            <div className="text-xs text-gray-600 mt-1">BEST: {stats.longestStreak}</div>
          </div>
          
          <div className="border-4 border-black p-4 bg-white text-center"
               style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-xs text-gray-600 mb-1">RESEARCH COST</div>
            <div className="text-3xl font-bold">
              ${stats.totalResearchCost}
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="border-4 border-black bg-white p-4 mb-6"
           style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-bold">■ FILTERS</div>
          <button
            onClick={clearFilters}
            className="text-xs underline hover:no-underline"
          >
            CLEAR ALL
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Agent Filter */}
          <div>
            <label className="block text-xs font-bold mb-2">AGENT</label>
            <select
              value={filters.agentId}
              onChange={(e) => setFilters({ ...filters, agentId: e.target.value })}
              className="w-full border-2 border-black px-2 py-2 text-xs font-mono bg-white"
            >
              <option value="">ALL AGENTS</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Prediction Filter */}
          <div>
            <label className="block text-xs font-bold mb-2">PREDICTION</label>
            <select
              value={filters.prediction}
              onChange={(e) => setFilters({ ...filters, prediction: e.target.value })}
              className="w-full border-2 border-black px-2 py-2 text-xs font-mono bg-white"
            >
              <option value="">YES & NO</option>
              <option value="YES">YES ONLY</option>
              <option value="NO">NO ONLY</option>
            </select>
          </div>
          
          {/* Resolved Filter */}
          <div>
            <label className="block text-xs font-bold mb-2">STATUS</label>
            <select
              value={filters.resolved}
              onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
              className="w-full border-2 border-black px-2 py-2 text-xs font-mono bg-white"
            >
              <option value="">ALL</option>
              <option value="true">RESOLVED</option>
              <option value="false">PENDING</option>
            </select>
          </div>
          
          {/* Correct Filter */}
          <div>
            <label className="block text-xs font-bold mb-2">OUTCOME</label>
            <select
              value={filters.correct}
              onChange={(e) => setFilters({ ...filters, correct: e.target.value })}
              className="w-full border-2 border-black px-2 py-2 text-xs font-mono bg-white"
            >
              <option value="">ALL</option>
              <option value="true">CORRECT</option>
              <option value="false">INCORRECT</option>
            </select>
          </div>
          
          {/* Sort Filter */}
          <div>
            <label className="block text-xs font-bold mb-2">SORT BY</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full border-2 border-black px-2 py-2 text-xs font-mono bg-white"
            >
              <option value="created_at">DATE</option>
              <option value="confidence">CONFIDENCE</option>
              <option value="profit_loss">PROFIT/LOSS</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Predictions List */}
      <div className="border-4 border-black bg-white"
           style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="border-b-4 border-black p-4 bg-gray-50 font-bold text-sm">
          ▶ PREDICTIONS ({predictions.length})
        </div>
        
        {loading ? (
          <div className="text-center text-gray-600 py-12">
            LOADING<span className="retro-blink">_</span>
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <div className="text-4xl mb-2">◆</div>
            <div className="text-sm font-bold">NO PREDICTIONS FOUND</div>
            <div className="text-xs mt-1">TRY ADJUSTING YOUR FILTERS</div>
          </div>
        ) : (
          <div className="divide-y-2 divide-black">
            {predictions.map(pred => (
              <button
                key={pred.id}
                onClick={() => setSelectedPrediction(pred)}
                className="w-full p-4 hover:bg-gray-50 text-left transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-bold mb-1 leading-tight">
                      {pred.polymarket_markets?.question || 'Market question unavailable'}
                    </div>
                    <div className="text-xs text-gray-600">
                      BY {pred.agents?.name || 'Unknown'} • {pred.agents?.strategy_type?.toUpperCase() || 'UNKNOWN'}
                      {pred.agents?.generation > 0 && ` • GEN ${pred.agents.generation}`}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {/* Prediction Badge */}
                    <div className={`px-3 py-1 border-2 border-black font-bold text-xs ${
                      pred.prediction === 'YES' ? 'bg-gray-100' : 'bg-gray-200'
                    }`}>
                      {pred.prediction}
                    </div>
                    
                    {/* Outcome Badge */}
                    {pred.outcome && (
                      <div className={`px-3 py-1 border-2 border-black font-bold text-xs ${
                        pred.correct ? 'bg-black text-white' : 'bg-gray-300 text-black'
                      }`}>
                        {pred.correct ? '✓ CORRECT' : '✗ WRONG'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <div className="flex gap-4">
                    <span className="text-gray-600">
                      CONFIDENCE: <span className="font-bold text-black">
                        {(pred.confidence * 100).toFixed(0)}%
                      </span>
                    </span>
                    <span className="text-gray-600">
                      COST: <span className="font-bold text-black">
                        ${pred.research_cost?.toFixed(2) || '0.00'}
                      </span>
                    </span>
                    {pred.profit_loss !== null && (
                      <span className="text-gray-600">
                        P/L: <span className={`font-bold ${
                          pred.profit_loss >= 0 ? 'text-black' : 'text-gray-600'
                        }`}>
                          {pred.profit_loss >= 0 ? '+' : ''}${pred.profit_loss.toFixed(2)}
                        </span>
                      </span>
                    )}
                  </div>
                  
                  <span className="text-gray-500">
                    {new Date(pred.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Prediction Detail Modal */}
      {selectedPrediction && (
        <PredictionDetailModal
          prediction={selectedPrediction}
          onClose={() => setSelectedPrediction(null)}
        />
      )}
    </div>
  );
}

// Prediction Detail Modal Component
function PredictionDetailModal({ 
  prediction, 
  onClose 
}: { 
  prediction: Prediction; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white border-4 border-black max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '12px 12px 0px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="border-b-4 border-black p-4 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-bold">■ PREDICTION_DETAILS</h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Market Question */}
          <div>
            <div className="text-xs text-gray-600 mb-1 font-bold">MARKET</div>
            <div className="text-base font-bold mb-2 leading-tight">
              {prediction.polymarket_markets?.question || 'Market question unavailable'}
            </div>
            {prediction.polymarket_markets?.market_slug && (
              <a 
                href={`https://polymarket.com/event/${prediction.polymarket_markets.market_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline hover:no-underline"
              >
                VIEW ON POLYMARKET ▶
              </a>
            )}
          </div>
          
          {/* Agent Info */}
          <div className="border-3 border-black p-3 bg-gray-50"
               style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
            <div className="text-xs text-gray-600 mb-1 font-bold">AGENT</div>
            <div className="font-bold text-sm">{prediction.agents?.name || 'Unknown'}</div>
            <div className="text-xs text-gray-600">
              {prediction.agents?.strategy_type?.toUpperCase() || 'UNKNOWN'}
              {prediction.agents?.generation > 0 && ` • GENERATION ${prediction.agents.generation}`}
            </div>
          </div>
          
          {/* Prediction */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border-3 border-black p-3 bg-white text-center"
                 style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              <div className="text-xs text-gray-600 mb-1 font-bold">PREDICTION</div>
              <div className="text-4xl font-bold">
                {prediction.prediction}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                CONFIDENCE: {(prediction.confidence * 100).toFixed(1)}%
              </div>
            </div>
            
            <div className="border-3 border-black p-3 bg-white text-center"
                 style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              <div className="text-xs text-gray-600 mb-1 font-bold">MARKET PRICE</div>
              <div className="text-4xl font-bold">
                {((prediction.price_at_prediction || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                WHEN PREDICTED
              </div>
            </div>
          </div>
          
          {/* Reasoning */}
          <div className="border-3 border-black p-4 bg-gray-50"
               style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
            <div className="text-xs text-gray-600 mb-2 font-bold">REASONING</div>
            <div className="text-xs leading-relaxed">
              {prediction.reasoning || 'No reasoning provided'}
            </div>
          </div>
          
          {/* Financial Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border-3 border-black p-3 bg-white text-center"
                 style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              <div className="text-xs text-gray-600 mb-1 font-bold">RESEARCH COST</div>
              <div className="text-2xl font-bold">
                ${prediction.research_cost?.toFixed(2) || '0.00'}
              </div>
            </div>
            
            {prediction.profit_loss !== null && (
              <div className="border-3 border-black p-3 bg-white text-center"
                   style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
                <div className="text-xs text-gray-600 mb-1 font-bold">PROFIT/LOSS</div>
                <div className={`text-2xl font-bold ${
                  prediction.profit_loss >= 0 ? 'text-black' : 'text-gray-600'
                }`}>
                  {prediction.profit_loss >= 0 ? '+' : ''}${prediction.profit_loss.toFixed(2)}
                </div>
              </div>
            )}
          </div>
          
          {/* Outcome */}
          {prediction.outcome ? (
            <div className={`border-3 border-black p-4 ${
              prediction.correct ? 'bg-gray-100' : 'bg-gray-200'
            }`} style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              <div className="text-xs text-gray-600 mb-2 font-bold">OUTCOME</div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xl font-bold">
                    {prediction.outcome}
                  </div>
                  <div className="text-sm">
                    {prediction.correct ? '✓ AGENT WAS CORRECT' : '✗ AGENT WAS INCORRECT'}
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  RESOLVED: {new Date(prediction.resolved_at!).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="border-3 border-black p-4 bg-gray-50"
                 style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}>
              <div className="text-xs text-gray-600 mb-1 font-bold">STATUS</div>
              <div className="text-base font-bold">
                ◆ PENDING RESOLUTION
              </div>
              <div className="text-xs text-gray-600 mt-1">
                MARKET ENDS: {new Date(prediction.polymarket_markets?.end_date || '').toLocaleDateString()}
              </div>
            </div>
          )}
          
          {/* Timestamps */}
          <div className="text-xs text-gray-600 border-t-2 border-black pt-3">
            <div>PREDICTED: {new Date(prediction.created_at).toLocaleString()}</div>
            {prediction.resolved_at && (
              <div>RESOLVED: {new Date(prediction.resolved_at).toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
