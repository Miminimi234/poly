'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Prediction {
  id: string;
  prediction: string;
  confidence: number;
  created_at: string;
  agents: {
    name: string;
  };
  polymarket_markets: {
    question: string;
  };
}

export default function RecentPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

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
          limitToLast(10) // Get more to ensure we have 5 after sorting
        );

        // Set up real-time listener
        unsubscribe = onValue(recentPredictionsQuery, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const predictions = Object.entries(data).map(([id, pred]: [string, any]) => ({
              id,
              prediction: pred.prediction,
              confidence: pred.confidence,
              created_at: pred.created_at,
              agents: {
                name: pred.agent_name || 'Unknown Agent'
              },
              polymarket_markets: {
                question: pred.market_question || 'Market question unavailable'
              }
            }));

            // Sort by created_at descending and limit to 5 for display
            const sortedPredictions = predictions
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5);

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

    setupFirebaseListener();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <div className="border-4 border-black bg-white p-4"
      style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      <div className="flex justify-between items-center mb-4">
        <div className="text-black font-bold text-base">
          ▶ RECENT_PREDICTIONS
        </div>
        <Link
          href="/predictions"
          className="text-xs underline hover:no-underline"
        >
          VIEW ALL →
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-600 py-8 text-xs">
          LOADING<span className="retro-blink">_</span>
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center text-gray-600 py-8 text-xs">
          NO PREDICTIONS YET
        </div>
      ) : (
        <div className="space-y-2">
          {predictions.map(pred => (
            <div key={pred.id} className="border-2 border-black p-3 bg-gray-50">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="text-xs font-bold leading-tight flex-1">
                  {pred.polymarket_markets?.question?.slice(0, 60) || 'Unknown market'}...
                </div>
                <div className={`text-xs px-2 py-1 border-2 border-black font-bold whitespace-nowrap ${pred.prediction === 'YES' ? 'bg-gray-100' : 'bg-gray-200'
                  }`}>
                  {pred.prediction}
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {pred.agents?.name || 'Unknown'} • {(pred.confidence * 100).toFixed(0)}% CONFIDENT
                <span className="text-gray-400 ml-2">
                  {new Date(pred.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

