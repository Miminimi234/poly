'use client';

import { useFirebaseMarkets } from '@/hooks/useFirebaseMarkets';
import { useEffect, useState } from 'react';

interface Market {
  polymarket_id: string;
  question: string;
  description: string;
  market_slug: string;
  yes_price: number;
  no_price: number;
  volume: number;
  volume_24hr: number;
  liquidity: number;
  end_date: string | null;
  start_date: string | null;
  category: string;
  image_url: string | null;
  active: boolean;
  resolved: boolean;
  archived: boolean;
}

export default function PolymarketMarkets() {
  // Use Firebase real-time updates instead of cache stream
  const { markets: firebaseMarkets, loading, connected, lastUpdate } = useFirebaseMarkets();

  // Limit to top 10 markets for the feed
  const markets = firebaseMarkets.slice(0, 10);
  const [error, setError] = useState<string | null>(null);

  // Clear error when connection is restored
  useEffect(() => {
    if (connected) {
      setError(null);
    }
  }, [connected]);

  if (loading && markets.length === 0) {
    return (
      <div className="border-4 border-black bg-background text-foreground p-4 h-[40vh] flex flex-col"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="text-foreground font-bold mb-4 flex items-center gap-2 text-base flex-shrink-0">
          ◎ HOT_MARKETS
        </div>
        <div className="text-center text-foreground py-8 text-xs flex-1 flex items-center justify-center">
          CONNECTING TO SERVER<span className="retro-blink">_</span>
        </div>
      </div>
    );
  }

  if (!connected && !loading) {
    return (
      <div className="border-4 border-black bg-background text-foreground p-4 h-[40vh] flex flex-col"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="text-foreground font-bold mb-4 flex items-center gap-2 text-base flex-shrink-0">
          ◎ HOT_MARKETS
        </div>
        <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
          <div className="text-xs text-foreground mb-4">Database connection lost</div>
          <div className="text-xs text-foreground">
            Reconnecting to database...
          </div>
        </div>
      </div>
    );
  }

  if (markets.length === 0 && !loading) {
    return (
      <div className="border-4 border-black bg-background text-foreground p-4 h-[40vh] flex flex-col"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="text-foreground font-bold mb-4 flex items-center gap-2 text-base flex-shrink-0">
          ◎ HOT_MARKETS
        </div>
        <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
          <div className="text-xs text-foreground mb-4">Market database is empty</div>
          <div className="text-xs text-foreground">
            Use admin controls to refresh markets
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-4 border-black bg-background text-foreground p-4 h-[40vh] flex flex-col"
      style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="text-foreground font-bold flex items-center gap-2 text-base">
          ◎ HOT_MARKETS
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {markets.map(market => {
          const yesPrice = market.yes_price;
          const noPrice = market.no_price;
          const yesPct = (yesPrice * 100).toFixed(1);
          const noPct = (noPrice * 100).toFixed(1);
          const volumeFormatted = market.volume.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });
          const endDate = market.end_date ? new Date(market.end_date).toLocaleDateString() : 'TBD';

          return (
            <div key={market.polymarket_id} className="border-2 border-black p-3 bg-background hover:bg-background transition-colors">
              <div className="text-foreground text-xs mb-2 font-bold leading-tight">
                {market.question}
              </div>

              {/* Category and Status */}
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-white text-foreground text-xs font-bold">
                  {market.category.toUpperCase()}
                </span>
                {market.volume > 1000000 && (
                  <span className="px-2 py-1 bg-green-600 text-foreground text-xs font-bold">
                    HOT
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center text-xs mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-bold">
                    YES {yesPct}%
                  </span>
                  <span className="text-foreground">|</span>
                  <span className="text-red-400 font-bold">
                    NO {noPct}%
                  </span>
                </div>
                <div className="text-foreground font-bold">
                  ${volumeFormatted}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="text-foreground">
                  ENDS: {endDate}
                </div>
                <a
                  href={`/markets/${market.polymarket_id}`}
                  className="text-foreground underline hover:no-underline font-bold"
                >
                  VIEW ▶
                </a>
              </div>
            </div>
          );
        })}
      </div>


    </div>
  );
}

