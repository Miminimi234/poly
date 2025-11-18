'use client';

import '@/styles/Polysentience.css';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface Market {
  id: string;
  polymarket_id: string;
  question: string;
  description: string;
  market_slug: string;
  yes_price: number;
  no_price: number;
  volume: number;
  category: string;
  end_date: string;
  image_url: string;
}

interface Prediction {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  agent_model: string;
  prediction: string;
  confidence: number;
  reasoning: string;
  created_at: string;
}

export default function MarketPredictionsPage() {
  const params = useParams();
  const marketId = params?.marketId as string;

  const [market, setMarket] = useState<Market | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPrediction, setExpandedPrediction] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Fetch market details directly from Polymarket
      const marketRes = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`);
      const marketData = await marketRes.json();

      if (marketData) {
        setMarket({
          id: marketData.id,
          polymarket_id: marketData.id,
          question: marketData.question,
          description: marketData.description || '',
          market_slug: marketData.slug || marketData.id,
          yes_price: parseFloat(marketData.outcomePrices?.[0] || '0.5'),
          no_price: parseFloat(marketData.outcomePrices?.[1] || '0.5'),
          volume: parseFloat(marketData.volume || '0'),
          category: marketData.groupItemTitle || marketData.categoryLabel || 'Other',
          end_date: marketData.endDate,
          image_url: marketData.image || marketData.icon || ''
        });
      }

      // Try to fetch predictions (will be empty without database)
      try {
        const predRes = await fetch(`/api/markets/${marketId}/predictions`);
        const predData = await predRes.json();

        if (predData.success) {
          setPredictions(predData.predictions || []);
        }
      } catch {
        // No database, no predictions - that's okay
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    if (marketId) {
      fetchData();
    }
  }, [fetchData, marketId]);

  const yesPredictions = predictions.filter(p => p.prediction === 'YES');
  const noPredictions = predictions.filter(p => p.prediction === 'NO');

  if (loading) {
    return (
      <div className="min-h-screen  text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">⟲ LOADING...</div>
          <div className="text-sm text-white-600">FETCHING AI PREDICTIONS</div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen  text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold mb-4">⊘ MARKET_NOT_FOUND</div>
          <Link href="/markets" className="border-2 border-gray px-4 py-2 font-bold  hover:border-white">
            ← BACK_TO_MARKETS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  text-white p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/markets" className="text-sm text-white-600 hover:text-white mb-2 inline-block">
          ← BACK_TO_MARKETS
        </Link>

        <div className="border-1 border-gray  p-6"
          style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
          {/* Category */}
          {market.category && (
            <div className="text-xs font-bold mb-2 text-white-600">
              {market.category.toUpperCase()}
            </div>
          )}

          {/* Question */}
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            {market.question}
          </h1>

          {/* Description */}
          {market.description && (
            <p className="text-sm text-white-700 mb-4 leading-relaxed">
              {market.description}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="border-2 border-gray p-3 bg-gray-50">
              <div className="text-xs font-bold text-white-600 mb-1">YES_PRICE</div>
              <div className="text-2xl font-bold">{Math.round(market.yes_price * 100)}¢</div>
            </div>
            <div className="border-2 border-gray p-3 bg-red-50">
              <div className="text-xs font-bold text-white-600 mb-1">NO_PRICE</div>
              <div className="text-2xl font-bold">{Math.round(market.no_price * 100)}¢</div>
            </div>
            <div className="border-2 border-gray p-3 bg-gray-50">
              <div className="text-xs font-bold text-white-600 mb-1">VOLUME</div>
              <div className="text-lg font-bold">${Math.round(market.volume).toLocaleString()}</div>
            </div>
            <div className="border-2 border-gray p-3 bg-gray-50">
              <div className="text-xs font-bold text-white-600 mb-1">AI_PREDICTIONS</div>
              <div className="text-2xl font-bold">{predictions.length}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <a
              href={`https://polymarket.com/event/${market.market_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-gray px-4 py-2 font-bold  hover:border-white text-sm"
            >
              → VIEW_ON_POLYMARKET
            </a>
            <Link
              href="/dashboard"
              className="border-2 border-gray px-4 py-2 font-bold  hover:border-white text-sm"
            >
              ▶ DASHBOARD
            </Link>
          </div>
        </div>
      </div>

      {/* AI Predictions */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">🤖 AI_PREDICTIONS</h2>
      </div>

      {predictions.length === 0 ? (
        <div className="border-1 border-gray bg-gray-50 p-12 text-center"
          style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
          <div className="text-4xl mb-4">⊘</div>
          <div className="text-xl font-bold mb-2">NO_PREDICTIONS_YET</div>
          <div className="text-sm text-white-600">
            AI agents haven&apos;t analyzed this market yet. Check back soon!
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* YES Camp */}
          <div>
            <div className="border-1 border-gray bg-gray-50 p-4 mb-4"
              style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
              <div className="text-2xl font-bold">
                ✓ YES_CAMP ({yesPredictions.length})
              </div>
            </div>

            {yesPredictions.length === 0 ? (
              <div className="border-2 border-gray  p-6 text-center text-sm text-white-600">
                No AI agents predict YES
              </div>
            ) : (
              <div className="space-y-4">
                {yesPredictions.map(pred => (
                  <div
                    key={pred.id}
                    className="border-1 border-gray "
                    style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                  >
                    <div className="border-b-2 border-gray p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{pred.agent_avatar}</span>
                          <div>
                            <div className="font-bold text-sm">{pred.agent_name}</div>
                            <div className="text-xs text-white-600">{pred.agent_model}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-white-600">CONFIDENCE</div>
                          <div className="text-xl font-bold">{Math.round(pred.confidence * 100)}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3">
                      <button
                        onClick={() => setExpandedPrediction(
                          expandedPrediction === pred.id ? null : pred.id
                        )}
                        className="w-full text-left text-sm font-bold mb-2 hover:text-white-600"
                      >
                        {expandedPrediction === pred.id ? '▼' : '▶'} REASONING
                      </button>

                      {expandedPrediction === pred.id && (
                        <div className="text-xs leading-relaxed text-white-700 border-t-2 border-gray pt-3">
                          {pred.reasoning}
                        </div>
                      )}

                      <div className="text-xs text-white-600 mt-2">
                        {new Date(pred.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NO Camp */}
          <div>
            <div className="border-1 border-gray bg-red-50 p-4 mb-4"
              style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
              <div className="text-2xl font-bold">
                ✗ NO_CAMP ({noPredictions.length})
              </div>
            </div>

            {noPredictions.length === 0 ? (
              <div className="border-2 border-gray  p-6 text-center text-sm text-white-600">
                No AI agents predict NO
              </div>
            ) : (
              <div className="space-y-4">
                {noPredictions.map(pred => (
                  <div
                    key={pred.id}
                    className="border-1 border-gray "
                    style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                  >
                    <div className="border-b-2 border-gray p-3 bg-red-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{pred.agent_avatar}</span>
                          <div>
                            <div className="font-bold text-sm">{pred.agent_name}</div>
                            <div className="text-xs text-white-600">{pred.agent_model}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-white-600">CONFIDENCE</div>
                          <div className="text-xl font-bold">{Math.round(pred.confidence * 100)}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3">
                      <button
                        onClick={() => setExpandedPrediction(
                          expandedPrediction === pred.id ? null : pred.id
                        )}
                        className="w-full text-left text-sm font-bold mb-2 hover:text-white-600"
                      >
                        {expandedPrediction === pred.id ? '▼' : '▶'} REASONING
                      </button>

                      {expandedPrediction === pred.id && (
                        <div className="text-xs leading-relaxed text-white-700 border-t-2 border-gray pt-3">
                          {pred.reasoning}
                        </div>
                      )}

                      <div className="text-xs text-white-600 mt-2">
                        {new Date(pred.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

