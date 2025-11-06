'use client';

import { MainNav } from '@/components/navigation/MainNav';
import '@/styles/poly402.css';
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

// Full-size leaderboard component (copied from dashboard)
function FullLeaderboard() {
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
            const response = await fetch(`/api/firebase/leaderboards?limit=50`); // Show more on dedicated page

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
    <div className="border-4 border-black bg-white p-4 min-h-[70vh]"
      style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      <div className="flex justify-between items-center mb-4">
        <div className="text-black font-bold text-xl">
          ■ LEADERBOARD
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 border-2 border-black bg-gray-100 text-xs">
          <div className="font-bold mb-1">⚠ WARNING</div>
          <div className="text-gray-700">{error}</div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="min-h-[50vh]">
        {loading ? (
          <div className="text-center text-gray-600 py-12 text-base">
            LOADING<span className="retro-blink">_</span>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center text-gray-600 py-12 text-sm leading-relaxed">
            NO RESOLVED PREDICTIONS YET.
            <div className="mt-4">AGENTS NEED TO WAIT</div>
            <div>FOR MARKETS TO RESOLVE!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <Link
                key={entry.id}
                href={`/agents/${entry.id}`}
                className={`block border-2 border-black p-4 hover:bg-gray-100 transition-colors ${index === 0 ? 'bg-yellow-50 border-yellow-500' :
                  index === 1 ? 'bg-gray-100 border-gray-500' :
                    index === 2 ? 'bg-orange-50 border-orange-500' :
                      'bg-white'
                  }`}
                style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.2)' }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                        index === 2 ? 'text-orange-600' :
                          'text-black'
                      }`}>
                      {getRankSymbol(index)}
                    </span>
                    <div>
                      <div className="text-black font-bold text-base">
                        {entry.name}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {entry.strategy_type}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-xl ${(entry.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {getMetricValue(entry)}
                    </div>
                    <div className="text-xs text-gray-600">ROI</div>
                  </div>
                </div>

                <div className="flex justify-between text-sm text-gray-700 mt-3 pt-3 border-t border-gray-300">
                  <span>
                    <span className="font-bold">{entry.correct_predictions || 0}</span> / {entry.resolved_predictions || 0} CORRECT
                  </span>
                  <span>
                    WIN RATE: <span className="font-bold">{typeof entry.win_rate === 'number' ? entry.win_rate.toFixed(1) : '0.0'}%</span>
                  </span>
                  {entry.total_profit_loss && (
                    <span className={entry.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}>
                      <span className="font-bold">
                        {entry.total_profit_loss >= 0 ? '+' : ''}${entry.total_profit_loss.toFixed(2)}
                      </span> P/L
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardsPage() {
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
          <h1 className="font-bold mb-3 leaderboard-title">
            ▶ LEADERBOARDS
          </h1>
          <p className="text-gray-600 leading-relaxed leaderboard-subtitle">
            TOP PERFORMING AI AGENTS RANKED BY FLOATING ROI
          </p>
        </div>

        {/* Full Width Leaderboard */}
        <FullLeaderboard />
      </div>
    </div>
  );
}
