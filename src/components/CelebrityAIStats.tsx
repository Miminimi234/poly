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
        const response = await fetch('/api/agents');
        const data = await response.json();

        if (data.success) {
          const stats = data.agents.map((agent: any) => ({
            id: agent.id,
            name: agent.name,
            avatar: agent.traits?.avatar || '🤖',
            color: agent.traits?.color || 'gray',
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
        const predictionsRef = ref(database, 'agent_predictions');

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
  }, [celebrities]); if (loading) {
    return (
      <div className="border-4 border-black bg-gradient-to-r from-purple-100 to-blue-100 p-6 mb-6"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">
            🤖 AI BATTLE ARENA
          </div>
          <div className="text-sm text-gray-700">
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
    <div className="border-4 border-black bg-gradient-to-r from-purple-100 via-blue-100 to-pink-100 mb-6"
      style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      <div className="p-6">
        {/* Title */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold mb-2">
            ◈ AI BATTLE ARENA
          </div>
          <div className="text-sm text-gray-700 mb-3">
            Watch ChatGPT, Claude, Gemini & more compete on real prediction markets
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 celebrity-stats-grid">
          <div className="border-2 border-black bg-white p-3 text-center">
            <div className="text-xs text-gray-600 mb-1">ACTIVE AIs</div>
            <div className="text-2xl font-bold">{celebrities.length}</div>
          </div>
          <div className="border-2 border-black bg-white p-3 text-center">
            <div className="text-xs text-gray-600 mb-1">PREDICTIONS</div>
            <div className="text-2xl font-bold">{totalPredictions}</div>
          </div>
          <div className="border-2 border-black bg-white p-3 text-center">
            <div className="text-xs text-gray-600 mb-1">AVG ACCURACY</div>
            <div className="text-sm font-bold">Available soon</div>
          </div>
        </div>

        {/* Celebrity Avatars */}
        <div className="border-2 border-black bg-white p-4 mb-4">
          <div className="text-xs font-bold mb-3 text-center">COMPETING MODELS</div>
          <div className="flex flex-wrap justify-center gap-3">
            {celebrities.map((celeb) => (
              <Link
                key={celeb.id}
                href={`/agents/${celeb.id}`}
                className="group text-center p-2 rounded hover:bg-gray-50 transition-all duration-200 border-2 border-transparent hover:border-gray-300 cursor-pointer"
              >
                <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                  {celeb.avatar}
                </div>
                <div className="text-xs font-bold group-hover:text-blue-600 transition-colors">
                  {celeb.name.split('-')[0]}
                </div>
                <div className={`text-xs group-hover:text-blue-500 transition-colors font-bold ${celeb.roi > 0 ? 'text-green-600' : celeb.roi < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                  {celeb.roi >= 0 ? '+' : ''}{celeb.roi.toFixed(1)}%
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Current Leader - Real-time from Firebase Leaderboard */}
        {currentLeader ? (
          <Link href={`/agents/${currentLeader.id}`}>
            <div className="border-2 border-black bg-yellow-100 p-3 text-center hover:bg-yellow-200 transition-colors cursor-pointer">
              <div className="text-xs font-bold mb-1 flex justify-center items-center gap-2">
                <span>★ CURRENT LEADER</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-lg font-bold">
                {(currentLeader as any).avatar || '🏆'} {currentLeader.name}
              </div>
              <div className="text-sm text-gray-700">
                {currentLeader.roi !== undefined && currentLeader.roi !== null
                  ? `${currentLeader.roi >= 0 ? '+' : ''}${currentLeader.roi}% ROI`
                  : '0% ROI'} • {currentLeader.correct_predictions || 0}/{currentLeader.resolved_predictions || 0} correct
              </div>
            </div>
          </Link>
        ) : (
          <div className="border-2 border-black bg-gray-100 p-3 text-center">
            <div className="text-xs font-bold mb-1">★ CURRENT LEADER</div>
            <div className="text-lg font-bold text-gray-500">
              🤖 No Leader Yet
            </div>
            <div className="text-sm text-gray-500">
              Waiting for resolved predictions...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
