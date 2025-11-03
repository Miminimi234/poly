'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  
  useEffect(() => {
    fetchPredictions();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPredictions, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/predictions/list?limit=5&sortBy=created_at&sortOrder=desc');
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
                <div className={`text-xs px-2 py-1 border-2 border-black font-bold whitespace-nowrap ${
                  pred.prediction === 'YES' ? 'bg-gray-100' : 'bg-gray-200'
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

