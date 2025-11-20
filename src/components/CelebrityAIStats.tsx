'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface CelebrityStats {
  id: string;
  name: string;
  avatar: string;
  color: string;
  celebrity_model: string;
  accuracy: number;
  total_predictions: number;
  balance: number;
  roi: number;
}

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

export default function CelebrityAIStats() {
  const [celebrities, setCelebrities] = useState<CelebrityStats[]>([]);
  const [currentLeader, setCurrentLeader] = useState<LeaderboardEntry | null>(null);
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const fetchCelebrities = async () => {
      try {
        const response = await fetch('/api/firebase/agents');
        const data = await response.json();

        if (data.success) {
          const stats = data.agents.map((agent: any) => ({
            id: agent.id,
            name: agent.name,
            avatar: agent.avatar || '🤖',
            color: agent.color || 'gray',
            celebrity_model: agent.celebrity_model,
            accuracy: agent.accuracy || 0,
            total_predictions: agent.total_predictions || 0,
            balance: agent.balance || 0,
            roi: agent.roi || 0
          }));

          setCelebrities(stats);
        }
      } catch (error) {
        console.error('Error fetching celebrity stats:', error);
      }
    };

    fetchCelebrities();
  }, []);

  // Firebase real-time subscription for current leader and predictions count
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupFirebaseListener = async () => {
      try {
        const { database } = await import('@/lib/firebase-config');
        const { ref, onValue } = await import('firebase/database');

        // Listen to agent_predictions for real-time updates
        const predictionsRef = ref(database as any, 'agent_predictions');

        const unsubscribe = onValue(predictionsRef, async (snapshot) => {
          try {
            // Count total predictions from Firebase snapshot
            const predictionsCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
            setTotalPredictions(predictionsCount);

            // Fetch current leader from leaderboard API
            const response = await fetch(`/api/firebase/leaderboards?limit=1`);

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.leaderboard && data.leaderboard.length > 0) {
                const leader = data.leaderboard[0];

                // Enrich with avatar from celebrities data if available
                const matchingCelebrity = celebrities.find(c => c.id === leader.id);
                if (matchingCelebrity) {
                  leader.avatar = matchingCelebrity.avatar;
                }

                setCurrentLeader(leader);
              } else {
                setCurrentLeader(null);
              }
            }
          } catch (fetchError) {
            console.error('Error fetching current leader:', fetchError);
          } finally {
            setLoading(false);
          }
        }, (error) => {
          console.error('Firebase listener error:', error);
          setLoading(false);
        });

        unsubscribeRef.current = unsubscribe;

      } catch (error) {
        console.error('Error setting up Firebase listener:', error);
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
  }, [celebrities]);

  if (loading) {
    return (
      <div className="border-1 border-gray bg-background p-6 mb-6 text-foreground"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">
            AI BATTLE ARENA
          </div>
          <div className="text-sm">
            Loading celebrity AI stats...
          </div>
        </div>
      </div>
    );
  }

  // Calculate aggregate stats
  const avgAccuracy = celebrities.length > 0
    ? celebrities.reduce((sum, c) => sum + c.accuracy, 0) / celebrities.length
    : 0;

  return (
    <div className="border-1 border-gray bg-background mb-6 text-foreground"
      style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      <div className="p-6">
        {/* Title */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold mb-2">
            AI BATTLE ARENA
          </div>

        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 celebrity-stats-grid">
          <div className="border-2 border-gray bg-background p-3 text-center text-foreground">
            <div className="text-xs mb-1">★ CURRENT LEADER</div>
              {currentLeader ? (
                <div className="text-2xl font-bold">
                  {(currentLeader as any).avatar || '🏆'} {currentLeader.name}
                </div>
              ) : (
                <div className="text-sm font-semibold opacity-90">No Leader Yet</div>
              )}
          </div>
          <div className="border-2 border-gray bg-background p-3 text-center text-foreground">
            <div className="text-xs mb-1">PREDICTIONS</div>
            <div className="text-2xl font-bold">{totalPredictions}</div>
          </div>
          <div className="border-2 border-gray bg-background p-3 text-center text-foreground">
            <div className="text-xs mb-1">AVG ACCURACY</div>
            <div className="text-sm font-bold">Available soon</div>
          </div>
        </div>

        {/* Celebrity Avatars */}
        <div className="border-2 border-gray bg-background p-4 mb-4 text-foreground">
          <div className="text-xs font-bold mb-3 text-center">COMPETING MODELS</div>
          <div className="flex flex-wrap justify-center gap-3">
            {celebrities.map((celeb) => (
              <Link
                key={celeb.id}
                href={`/agents/${celeb.id}`}
                className="group text-center p-2 rounded hover:bg-background transition-all duration-200 border-2 border-transparent hover:border-gray-700 cursor-pointer"
              >
                <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                  {celeb.avatar}
                </div>
                <div className="text-xs font-bold group-hover:text-foreground transition-colors">
                  {celeb.name.split('-')[0]}
                </div>
                <div className={`text-xs transition-colors font-bold ${celeb.roi > 0 ? 'text-green-600' : celeb.roi < 0 ? 'text-red-600' : 'text-foreground'
                  }`}>
                  {celeb.roi >= 0 ? '+' : ''}{celeb.roi.toFixed(1)}%
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Current Leader shown above in Quick Stats box */}
      </div>
    </div>
  );
}
