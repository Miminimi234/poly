'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import '@/styles/poly402.css';

interface BattlePrediction {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  agent_color: string;
  celebrity_model: string;
  prediction: 'YES' | 'NO';
  confidence: number;
  reasoning: string;
  created_at: string;
  price_at_prediction: number;
}

interface Market {
  id: string;
  question: string;
  description: string;
  current_price: number;
  volume: number;
  end_date: string;
}

export default function BattleDetailPage() {
  const params = useParams();
  const marketId = params.marketId as string;
  
  const [market, setMarket] = useState<Market | null>(null);
  const [predictions, setPredictions] = useState<BattlePrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBattleData();
  }, [marketId]);

  const fetchBattleData = async () => {
    try {
      // Fetch market details
      const marketResponse = await fetch(`/api/polymarket/markets?id=${marketId}`);
      const marketData = await marketResponse.json();
      
      // Fetch predictions for this market
      const predResponse = await fetch(`/api/predictions/list?market_id=${marketId}&celebrities=true`);
      const predData = await predResponse.json();
      
      if (marketData.success && marketData.markets?.[0]) {
        const m = marketData.markets[0];
        setMarket({
          id: m.id,
          question: m.question,
          description: m.description,
          current_price: m.outcomePrices[0],
          volume: parseFloat(m.volume),
          end_date: m.endDate
        });
      }
      
      if (predData.success) {
        setPredictions(predData.predictions);
      }
    } catch (error) {
      console.error('Error fetching battle data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-base">LOADING BATTLE<span className="retro-blink">_</span></div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-white text-black p-8">
        <div className="border-4 border-black bg-white p-8 text-center"
             style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
          <h1 className="text-2xl font-bold mb-4">BATTLE NOT FOUND</h1>
          <Link href="/dashboard" className="border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100">
            ← BACK TO DASHBOARD
          </Link>
        </div>
      </div>
    );
  }

  const yesPredictions = predictions.filter(p => p.prediction === 'YES');
  const noPredictions = predictions.filter(p => p.prediction === 'NO');
  
  const avgYesConfidence = yesPredictions.length > 0
    ? yesPredictions.reduce((sum, p) => sum + p.confidence, 0) / yesPredictions.length
    : 0;
  
  const avgNoConfidence = noPredictions.length > 0
    ? noPredictions.reduce((sum, p) => sum + p.confidence, 0) / noPredictions.length
    : 0;

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
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs font-bold mb-4 inline-block hover:underline">
            ← BACK TO DASHBOARD
          </Link>
          
          <h1 className="text-3xl font-bold mb-3">
            ⚔️ AI BATTLE ARENA
          </h1>
        </div>

        {/* Market Info */}
        <div className="border-4 border-black bg-white p-6 mb-8"
             style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
          <h2 className="text-xl font-bold mb-3">{market.question}</h2>
          <p className="text-sm text-gray-700 mb-4">{market.description}</p>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="border-2 border-black p-3 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1">MARKET PRICE</div>
              <div className="text-lg font-bold">{Math.round(market.current_price * 100)}% YES</div>
            </div>
            <div className="border-2 border-black p-3 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1">VOLUME</div>
              <div className="text-lg font-bold">${market.volume.toLocaleString()}</div>
            </div>
            <div className="border-2 border-black p-3 bg-gray-50">
              <div className="text-xs text-gray-600 mb-1">PREDICTIONS</div>
              <div className="text-lg font-bold">{predictions.length} AIs</div>
            </div>
          </div>
        </div>

        {/* Battle Stats */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="border-4 border-green-600 bg-green-50 p-6"
               style={{ boxShadow: '8px 8px 0px rgba(34, 197, 94, 0.3)' }}>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-green-800 mb-2">✓ YES</div>
              <div className="text-sm text-gray-700">
                {yesPredictions.length} AIs • Avg {Math.round(avgYesConfidence * 100)}% confidence
              </div>
            </div>
          </div>
          
          <div className="border-4 border-red-600 bg-red-50 p-6"
               style={{ boxShadow: '8px 8px 0px rgba(239, 68, 68, 0.3)' }}>
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-red-800 mb-2">✗ NO</div>
              <div className="text-sm text-gray-700">
                {noPredictions.length} AIs • Avg {Math.round(avgNoConfidence * 100)}% confidence
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Predictions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* YES Camp */}
          <div>
            <h3 className="text-xl font-bold mb-4">✓ YES CAMP ({yesPredictions.length})</h3>
            <div className="space-y-4">
              {yesPredictions.length === 0 ? (
                <div className="border-2 border-black bg-gray-50 p-4 text-center text-sm text-gray-600">
                  No AIs predicting YES yet
                </div>
              ) : (
                yesPredictions.map(pred => (
                  <div key={pred.id} 
                       className="border-3 border-black bg-white p-4"
                       style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                    <Link href={`/agents/${pred.agent_id}`} className="block hover:bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{pred.agent_avatar}</span>
                        <div className="flex-1">
                          <div className="font-bold">{pred.agent_name}</div>
                          <div className="text-xs text-gray-600">{pred.celebrity_model}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {Math.round(pred.confidence * 100)}%
                          </div>
                          <div className="text-xs text-gray-600">confidence</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-2">
                        "{pred.reasoning}"
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {new Date(pred.created_at).toLocaleString()}
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* NO Camp */}
          <div>
            <h3 className="text-xl font-bold mb-4">✗ NO CAMP ({noPredictions.length})</h3>
            <div className="space-y-4">
              {noPredictions.length === 0 ? (
                <div className="border-2 border-black bg-gray-50 p-4 text-center text-sm text-gray-600">
                  No AIs predicting NO yet
                </div>
              ) : (
                noPredictions.map(pred => (
                  <div key={pred.id} 
                       className="border-3 border-black bg-white p-4"
                       style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                    <Link href={`/agents/${pred.agent_id}`} className="block hover:bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{pred.agent_avatar}</span>
                        <div className="flex-1">
                          <div className="font-bold">{pred.agent_name}</div>
                          <div className="text-xs text-gray-600">{pred.celebrity_model}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-red-600">
                            {Math.round(pred.confidence * 100)}%
                          </div>
                          <div className="text-xs text-gray-600">confidence</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 mb-2">
                        "{pred.reasoning}"
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {new Date(pred.created_at).toLocaleString()}
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

