'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  strategy_type: string;
  accuracy: number;
  roi: number;
  total_profit_loss: number;
  resolved_predictions: number;
  correct_predictions: number;
}

type Metric = 'accuracy' | 'roi' | 'profit';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [metric, setMetric] = useState<Metric>('accuracy');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leaderboards?metric=${metric}&limit=10`);

      if (!response.ok) {
        setError(`API ERROR: ${response.status}`);
        console.error('Leaderboard API error:', response.status, response.statusText);
        setLoading(false);
        return;
      }

      const text = await response.text();
      if (!text) {
        setError('EMPTY RESPONSE FROM SERVER');
        console.error('Empty response from leaderboard API');
        setLoading(false);
        return;
      }

      const data = JSON.parse(text);

      if (data.success) {
        setLeaderboard(data.leaderboard || []);
        if (data.message) {
          setError(data.message);
        }
      } else {
        const errorMsg = data.error || 'UNKNOWN ERROR';
        const details = data.details ? `\n\nDETAILS: ${data.details}` : '';
        setError(errorMsg);
        console.error('Leaderboard API returned error:', errorMsg);
        if (data.details) {
          console.error('Error details:', data.details);
        }
      }
    } catch (error) {
      setError('FETCH FAILED: ' + (error as Error).message);
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [metric]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankSymbol = (index: number) => {
    if (index === 0) return '▲';
    if (index === 1) return '▶';
    if (index === 2) return '▼';
    return `${index + 1}`;
  };

  const getMetricValue = (entry: LeaderboardEntry) => {
    if (metric === 'accuracy') return `${entry.accuracy}%`;
    if (metric === 'roi') return `${entry.roi >= 0 ? '+' : ''}${entry.roi}%`;
    if (metric === 'profit') return `$${entry.total_profit_loss?.toFixed(2)}`;
    return '';
  };

  return (
    <div className="border-4 border-black bg-white p-4"
      style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      <div className="text-black font-bold mb-4 text-base">
        ■ LEADERBOARD
      </div>

      {/* Metric Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMetric('accuracy')}
          className={`flex-1 border-2 border-black px-3 py-2 font-bold text-xs ${metric === 'accuracy' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
            }`}
          style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
        >
          ACCURACY
        </button>
        <button
          onClick={() => setMetric('roi')}
          className={`flex-1 border-2 border-black px-3 py-2 font-bold text-xs ${metric === 'roi' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
            }`}
          style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
        >
          ROI
        </button>
        <button
          onClick={() => setMetric('profit')}
          className={`flex-1 border-2 border-black px-3 py-2 font-bold text-xs ${metric === 'profit' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
            }`}
          style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
        >
          PROFIT
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 border-2 border-black bg-gray-100 text-xs">
          <div className="font-bold mb-1">⚠ WARNING</div>
          <div className="text-gray-700">{error}</div>
        </div>
      )}

      {/* Leaderboard List */}
      {loading ? (
        <div className="text-center text-gray-600 py-8 text-xs">
          LOADING<span className="retro-blink">_</span>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center text-gray-600 py-8 text-xs leading-relaxed">
          NO RESOLVED PREDICTIONS YET.
          <div className="mt-3">AGENTS NEED TO WAIT</div>
          <div>FOR MARKETS TO RESOLVE!</div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {leaderboard.map((entry, index) => (
            <Link
              key={entry.id}
              href={`/agents/${entry.id}`}
              className={`block border-2 border-black p-3 hover:bg-gray-100 transition-colors ${index === 0 ? 'bg-gray-200' :
                  index === 1 ? 'bg-gray-100' :
                    index === 2 ? 'bg-gray-50' :
                      'bg-white'
                }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{getRankSymbol(index)}</span>
                  <div>
                    <div className="text-black font-bold text-xs">
                      {entry.name}
                    </div>
                    <div className="text-gray-600 text-xs">
                      {entry.strategy_type}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-black font-bold text-base">
                    {getMetricValue(entry)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>
                  {entry.correct_predictions}/{entry.resolved_predictions} CORRECT
                </span>
                {metric === 'accuracy' && entry.roi !== undefined && (
                  <span>ROI: {entry.roi >= 0 ? '+' : ''}{entry.roi}%</span>
                )}
                {metric === 'roi' && entry.accuracy !== undefined && (
                  <span>ACC: {entry.accuracy}%</span>
                )}
                {metric === 'profit' && entry.roi !== undefined && (
                  <span>ROI: {entry.roi >= 0 ? '+' : ''}{entry.roi}%</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <button
        onClick={fetchLeaderboard}
        disabled={loading}
        className="mt-4 w-full border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100 disabled:opacity-50 text-xs"
        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
      >
        {loading ? 'REFRESHING...' : '↻ REFRESH'}
      </button>
    </div>
  );
}

