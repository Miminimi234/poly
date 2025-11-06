'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BattlePrediction {
  id: string;
  agent_name: string;
  agent_avatar: string;
  agent_color: string;
  celebrity_model: string;
  market_question: string;
  market_id: string;
  prediction: 'YES' | 'NO';
  confidence: number;
  reasoning: string;
  created_at: string;
}

export default function LiveAIBattle() {
  const [predictions, setPredictions] = useState<BattlePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Firebase real-time subscription
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let unsubscribe: (() => void) | null = null;

    const setupFirebaseListener = async () => {
      try {
        const { database } = await import('@/lib/firebase-config');
        const { ref, query, orderByChild, limitToLast, onValue } = await import('firebase/database');

        // Create a query for the most recent predictions
        const predictionsRef = ref(database, 'agent_predictions');
        const recentPredictionsQuery = query(
          predictionsRef,
          orderByChild('created_at'),
          limitToLast(30) // Get more predictions for battle view
        );

        // Set up real-time listener
        unsubscribe = onValue(recentPredictionsQuery, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const predictions = Object.entries(data).map(([id, pred]: [string, any]) => ({
              id,
              agent_id: pred.agent_id,
              agent_name: pred.agent_name || 'Unknown',
              market_id: pred.market_id,
              market_question: pred.market_question || 'Unknown Market',
              prediction: pred.prediction,
              confidence: pred.confidence,
              reasoning: pred.reasoning || 'No reasoning provided',
              created_at: pred.created_at
            }));

            // Sort by created_at descending and limit to 20 for display
            const sortedPredictions = predictions
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 20);

            setPredictions(sortedPredictions);
            setLoading(false);
          } else {
            setLoading(false);
          }
        }, (error) => {
          console.error('Firebase listener error:', error);
          setLoading(false);
        });

      } catch (error) {
        console.error('Error setting up Firebase listener:', error);
        setLoading(false);
      }
    };

    if (autoRefresh) {
      setupFirebaseListener();
    }

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [autoRefresh]);

  // Group predictions by market for "battle" view
  const battlesByMarket = predictions.reduce((acc, pred) => {
    if (!acc[pred.market_id]) {
      acc[pred.market_id] = {
        question: pred.market_question,
        yes: [],
        no: []
      };
    }

    if (pred.prediction === 'YES') {
      acc[pred.market_id].yes.push(pred);
    } else {
      acc[pred.market_id].no.push(pred);
    }

    return acc;
  }, {} as Record<string, { question: string; yes: BattlePrediction[]; no: BattlePrediction[] }>);

  const battles = Object.entries(battlesByMarket)
    .filter(([_, battle]) => battle.yes.length > 0 && battle.no.length > 0)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="border-4 border-black bg-white p-4"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="text-lg font-bold mb-4">⚔️ LIVE AI BATTLES</div>
        <div className="text-sm text-gray-600">Loading battles...</div>
      </div>
    );
  }

  return (
    <div className="border-4 border-black bg-white"
      style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      {/* Header */}
      <div className="border-b-4 border-black p-4 bg-gradient-to-r from-red-100 to-blue-100">
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold">▣ LIVE AI BATTLES</div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="border-2 border-black px-3 py-1 text-xs font-bold bg-white hover:bg-gray-100"
          >
            {autoRefresh ? '‖ PAUSE' : '▶ PLAY'}
          </button>
        </div>
        <div className="text-xs text-gray-700 mt-1">
          Watch AI models duke it out in real-time
        </div>
      </div>

      {/* Battles */}
      <div className="divide-y-2 divide-black max-h-[600px] overflow-y-auto">
        {battles.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-600">
            No active battles yet. Agents are analyzing markets...
          </div>
        ) : (
          battles.map(([marketId, battle]) => (
            <div key={marketId} className="p-4 hover:bg-gray-50">
              {/* Market Question */}
              <div className="text-sm font-bold mb-3 line-clamp-2">
                {battle.question}
              </div>

              {/* YES vs NO */}
              <div className="grid grid-cols-2 gap-4">
                {/* YES Camp */}
                <div className="border-2 border-green-600 bg-green-50 p-3">
                  <div className="text-xs font-bold text-green-800 mb-2">
                    ✓ YES CAMP ({battle.yes.length})
                  </div>
                  <div className="space-y-2">
                    {battle.yes.slice(0, 3).map((pred) => (
                      <Link
                        key={pred.id}
                        href={`/agents/${pred.id.split('-')[0]}`}
                        className="block text-xs hover:bg-green-100 p-1"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-sm">{pred.agent_avatar}</span>
                          <span className="font-bold truncate">
                            {pred.agent_name}
                          </span>
                          <span className="text-gray-600 ml-auto">
                            {Math.round(pred.confidence * 100)}%
                          </span>
                        </div>
                        <div className="text-gray-700 line-clamp-1">
                          &quot;{pred.reasoning.substring(0, 60)}...&quot;
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* NO Camp */}
                <div className="border-2 border-red-600 bg-red-50 p-3">
                  <div className="text-xs font-bold text-red-800 mb-2">
                    ✗ NO CAMP ({battle.no.length})
                  </div>
                  <div className="space-y-2">
                    {battle.no.slice(0, 3).map((pred) => (
                      <Link
                        key={pred.id}
                        href={`/agents/${pred.id.split('-')[0]}`}
                        className="block text-xs hover:bg-red-100 p-1"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-sm">{pred.agent_avatar}</span>
                          <span className="font-bold truncate">
                            {pred.agent_name}
                          </span>
                          <span className="text-gray-600 ml-auto">
                            {Math.round(pred.confidence * 100)}%
                          </span>
                        </div>
                        <div className="text-gray-700 line-clamp-1">
                          &quot;{pred.reasoning.substring(0, 60)}...&quot;
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* View Full Battle */}
              <Link
                href={`/battles/${marketId}`}
                className="block mt-3 text-center border-2 border-black px-3 py-1 text-xs font-bold bg-white hover:bg-gray-100"
              >
                VIEW FULL BATTLE →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

