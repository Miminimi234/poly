'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

export default function CelebrityAIStats() {
  const [celebrities, setCelebrities] = useState<CelebrityStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCelebrities = async () => {
      try {
        const response = await fetch('/api/agents?celebrities=true');
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
      } finally {
        setLoading(false);
      }
    };

    fetchCelebrities();
  }, []);

  if (loading) {
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
  const totalPredictions = celebrities.reduce((sum, c) => sum + c.total_predictions, 0);
  const avgAccuracy = celebrities.length > 0
    ? celebrities.reduce((sum, c) => sum + c.accuracy, 0) / celebrities.length
    : 0;
  const bestPerformer = celebrities.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best
  , celebrities[0] || { accuracy: 0, name: 'N/A', avatar: '?' });

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
        <div className="grid grid-cols-3 gap-4 mb-4">
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
            <div className="text-2xl font-bold">{Math.round(avgAccuracy * 100)}%</div>
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
                className="group text-center"
              >
                <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">
                  {celeb.avatar}
                </div>
                <div className="text-xs font-bold">
                  {celeb.name.split('-')[0]}
                </div>
                <div className="text-xs text-gray-600">
                  {Math.round(celeb.accuracy * 100)}%
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Current Leader */}
        {bestPerformer && bestPerformer.name !== 'N/A' && (
          <div className="border-2 border-black bg-yellow-100 p-3 text-center">
            <div className="text-xs font-bold mb-1">★ CURRENT LEADER</div>
            <div className="text-lg font-bold">
              {bestPerformer.avatar} {bestPerformer.name}
            </div>
            <div className="text-sm text-gray-700">
              {Math.round(bestPerformer.accuracy * 100)}% accuracy • {bestPerformer.total_predictions} predictions
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

