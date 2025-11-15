'use client';

import { useEffect, useState } from 'react';

export default function MarketStats() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    archived: 0,
    totalVolume: 0,
    avgVolume: 0,
    highVolumeCount: 0,
    topVolume: 0,
    categories: 0,
    trendingVolume: 0,
    realCategories: [] as string[],
    topMarkets: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      // Use the dedicated stats endpoint
      const response = await fetch('/api/markets/stats');
      const data = await response.json();

      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching market stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border-1 border-gray bg-background text-foreground p-4 animate-pulse"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="border-1 border-gray bg-background text-foreground p-4"
      style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      <div className="text-sm font-bold text-foreground mb-3">
        ▣ MARKET_DATABASE
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-foreground">TOTAL</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div>
          <div className="text-xs text-foreground">ACTIVE</div>
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
        </div>
        <div>
          <div className="text-xs text-foreground" title="Top 10 trending markets total volume">TOP MARKETS VOL</div>
          <div className="text-xl font-bold text-blue-400">${Math.round((stats.trendingVolume || stats.topVolume) / 1000000)}M</div>
        </div>
        <div></div>
      </div>

      {/* Additional info */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex justify-between items-center text-xs">
          <span className="text-foreground" title={`Real categories from market data: ${stats.realCategories?.slice(0, 5).join(', ')}${stats.realCategories?.length > 5 ? '...' : ''}`}>
            CATEGORIES: {stats.categories}
          </span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

