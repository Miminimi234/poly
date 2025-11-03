'use client';

import { useState, useEffect } from 'react';

export default function MarketStats() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resolved: 0,
    avgVolume: 0
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
      const response = await fetch('/api/markets/stats');
      const data = await response.json();
      
      if (data.success) {
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
      <div className="border-4 border-black bg-white p-4 animate-pulse"
           style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-300 rounded w-3/4"></div>
      </div>
    );
  }
  
  return (
    <div className="border-4 border-black bg-white p-4"
         style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
      <div className="text-sm font-bold text-gray-600 mb-3">
        ▣ MARKET_DATABASE
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-600">TOTAL</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600">ACTIVE</div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600">RESOLVED</div>
          <div className="text-2xl font-bold text-gray-500">{stats.resolved}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600">AVG VOLUME</div>
          <div className="text-lg font-bold">${Math.round(stats.avgVolume).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

