'use client';

import { useState, useEffect } from 'react';

interface Market {
  id: string;
  question: string;
  description: string;
  outcomePrices: number[];
  outcomes: string[];
  volume: string;
  liquidity: string;
  endDate: string;
  marketSlug: string;
}

export default function PolymarketMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/polymarket/markets?limit=10');
      const data = await response.json();
      
      if (data.success) {
        setMarkets(data.markets);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch markets');
      }
    } catch (err) {
      setError('Failed to connect to Polymarket API');
      console.error('Error fetching markets:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMarkets();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchMarkets, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading && markets.length === 0) {
    return (
      <div className="border-4 border-black bg-white p-4" 
           style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="text-black font-bold mb-4 flex items-center gap-2 text-base">
          ◎ POLYMARKET_FEED
        </div>
        <div className="text-center text-gray-600 py-8 text-xs">
          LOADING MARKETS<span className="retro-blink">_</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="border-4 border-black bg-white p-4" 
           style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="text-black font-bold mb-4 flex items-center gap-2 text-base">
          ◎ POLYMARKET_FEED
        </div>
        <div className="text-center py-8">
          <div className="text-xs text-gray-700 mb-4">{error}</div>
          <button 
            onClick={fetchMarkets}
            className="border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100 text-xs"
            style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="border-4 border-black bg-white p-4" 
         style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      <div className="flex justify-between items-center mb-4">
        <div className="text-black font-bold flex items-center gap-2 text-base">
          ◎ POLYMARKET_FEED
        </div>
        <div className="text-xs text-gray-500">
          {lastUpdate && `${lastUpdate.toLocaleTimeString()}`}
        </div>
      </div>
      
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {markets.map(market => {
          const yesPrice = market.outcomePrices[0] || 0;
          const noPrice = market.outcomePrices[1] || (1 - yesPrice);
          const yesPct = (yesPrice * 100).toFixed(1);
          const noPct = (noPrice * 100).toFixed(1);
          const volumeFormatted = parseFloat(market.volume).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });
          const endDate = new Date(market.endDate).toLocaleDateString();
          
          return (
            <div key={market.id} className="border-2 border-black p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="text-black text-xs mb-2 font-bold leading-tight">
                {market.question}
              </div>
              
              <div className="flex justify-between items-center text-xs mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-black font-bold">
                    YES {yesPct}%
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-black font-bold">
                    NO {noPct}%
                  </span>
                </div>
                <div className="text-black font-bold">
                  ${volumeFormatted}
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <div className="text-gray-600">
                  ENDS: {endDate}
                </div>
                <a 
                  href={`https://polymarket.com/event/${market.marketSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black underline hover:no-underline font-bold"
                >
                  VIEW ▶
                </a>
              </div>
            </div>
          );
        })}
      </div>
      
      <button
        onClick={fetchMarkets}
        disabled={loading}
        className="mt-4 w-full border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100 disabled:opacity-50 text-xs"
        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
      >
        {loading ? 'REFRESHING...' : '↻ REFRESH MARKETS'}
      </button>
    </div>
  );
}

