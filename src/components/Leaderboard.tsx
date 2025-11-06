'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface LeaderboardEntry {
  id: string;
  name: string;
  strategy_type: string;
  roi?: number;
  total_profit_loss?: number;
  resolved_predictions?: number;
  correct_predictions?: number;
  win_rate?: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Real-time Firebase subscription
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupFirebaseListener = async () => {
      try {
        setLoading(true);
        setError(null);

        const { database } = await import('@/lib/firebase-config');
        const { ref, onValue, off } = await import('firebase/database');

        // Listen to agent_predictions for real-time updates
        const predictionsRef = ref(database, 'agent_predictions');

        const unsubscribe = onValue(predictionsRef, async () => {
          try {
            // Fetch updated leaderboard when predictions change
            const response = await fetch(`/api/firebase/leaderboards?limit=10`);

            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                setLeaderboard(data.leaderboard || []);
                setLastUpdate(new Date());
                setError(null);
              } else {
                setError(data.error || 'Failed to fetch leaderboard');
              }
            } else {
              setError(`API ERROR: ${response.status}`);
            }
          } catch (fetchError) {
            console.error('Error fetching leaderboard:', fetchError);
            setError('Failed to update leaderboard');
          } finally {
            setLoading(false);
          }
        }, (error) => {
          console.error('Firebase listener error:', error);
          setError('Real-time connection failed');
          setLoading(false);
        });

        unsubscribeRef.current = unsubscribe;

      } catch (error) {
        console.error('Error setting up Firebase listener:', error);
        setError('Failed to connect to real-time updates');
        setLoading(false);
      }
    };

    setupFirebaseListener();

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const getRankSymbol = (index: number) => {
    if (index === 0) return '▲';
    if (index === 1) return '▶';
    if (index === 2) return '▼';
    return `${index + 1}`;
  };

  const getMetricValue = (entry: LeaderboardEntry) => {
    const roi = entry.roi || 0;
    return `${roi >= 0 ? '+' : ''}${roi}%`;
  };

  return (
    <div className="border-4 border-black bg-white p-4 h-[40vh] flex flex-col"
      style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      <div className="text-black font-bold mb-4 text-base">
        ■ LEADERBOARD
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 border-2 border-black bg-gray-100 text-xs">
          <div className="font-bold mb-1">⚠ WARNING</div>
          <div className="text-gray-700">{error}</div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="flex-1 overflow-hidden">
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
          <div className="space-y-2 h-full overflow-y-auto">
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
                    {entry.correct_predictions || 0}/{entry.resolved_predictions || 0} CORRECT
                  </span>
                  <span>
                    WIN RATE: {typeof entry.win_rate === 'number' ? entry.win_rate.toFixed(1) : '0.0'}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

