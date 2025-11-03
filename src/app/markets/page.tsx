'use client';

import '@/styles/poly402.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Market {
  id: string;
  polymarket_id: string;
  question: string;
  description: string;
  market_slug: string;
  yes_price: number;
  no_price: number;
  volume: number;
  volume_24hr: number;
  category: string;
  end_date: string;
  image_url: string;
  prediction_count?: number;
}

type ViewMode = 'live' | 'top';
type SortBy = 'volume' | 'predictions' | 'ending_soon' | 'newest';

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('volume');

  useEffect(() => {
    fetchMarkets();

    // Auto-refresh every 60 seconds on live tab
    if (viewMode === 'live') {
      const interval = setInterval(fetchMarkets, 60000);
      return () => clearInterval(interval);
    }
  }, [viewMode]);

  const fetchMarkets = async () => {
    try {
      // Fetch from local SQLite database
      const response = await fetch('/api/markets/list');
      const data = await response.json();

      if (data.success) {
        // Map database fields to display format
        const mappedMarkets = data.markets.map((m: any) => ({
          ...m,
          polymarket_id: m.id,
          market_slug: m.slug,
          prediction_count: 0
        }));
        setMarkets(mappedMarkets);
      }
    } catch (error) {
      console.error('Error fetching markets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = ['all', ...new Set(markets.map(m => m.category).filter(Boolean))];

  // Filter markets
  const filteredMarkets = markets.filter(market => {
    const matchesSearch = searchQuery === '' ||
      market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || market.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort markets
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return (b.volume || 0) - (a.volume || 0);
      case 'predictions':
        return (b.prediction_count || 0) - (a.prediction_count || 0);
      case 'ending_soon':
        return new Date(a.end_date || '').getTime() - new Date(b.end_date || '').getTime();
      case 'newest':
        return new Date(b.end_date || '').getTime() - new Date(a.end_date || '').getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-black mb-2 inline-block">
            ← BACK_TO_DASHBOARD
          </Link>
          <h1 className="text-4xl font-bold mb-2">MARKETS</h1>
          <p className="text-sm text-gray-600">
            BROWSE {markets.length} LIVE PREDICTION MARKETS
          </p>
        </div>

        <Link
          href="/dashboard"
          className="border-4 border-black px-6 py-3 font-bold bg-white hover:bg-gray-100"
          style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}
        >
          ▶ DASHBOARD
        </Link>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('live')}
          className={`px-6 py-3 font-bold border-4 border-black ${viewMode === 'live' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
            }`}
          style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
        >
          ▣ LIVE_MARKETS
        </button>
        <button
          onClick={() => setViewMode('top')}
          className={`px-6 py-3 font-bold border-4 border-black ${viewMode === 'top' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
            }`}
          style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
        >
          ★ TOP_MARKETS
        </button>
      </div>

      {/* Filters */}
      <div className="border-4 border-black bg-white p-6 mb-6"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-bold mb-2">SEARCH</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Bitcoin, Trump, AI..."
              className="w-full border-2 border-black px-4 py-2 text-sm font-bold"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold mb-2">CATEGORY</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border-2 border-black px-4 py-2 text-sm font-bold bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-bold mb-2">SORT_BY</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full border-2 border-black px-4 py-2 text-sm font-bold bg-white"
            >
              <option value="volume">VOLUME</option>
              <option value="predictions">AI_PREDICTIONS</option>
              <option value="ending_soon">ENDING_SOON</option>
              <option value="newest">NEWEST</option>
            </select>
          </div>
        </div>

        {/* Active filters */}
        {(searchQuery || selectedCategory !== 'all') && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-bold">ACTIVE_FILTERS:</span>
            {searchQuery && (
              <span className="text-xs border-2 border-black px-2 py-1 bg-gray-100">
                &quot;{searchQuery}&quot;
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="text-xs border-2 border-black px-2 py-1 bg-gray-100">
                {selectedCategory.toUpperCase()}
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs border-2 border-black px-2 py-1 bg-white hover:bg-red-100"
            >
              ✕ CLEAR
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm font-bold mb-4">
        SHOWING {sortedMarkets.length} MARKETS
        {viewMode === 'live' && <span className="text-gray-600 ml-2">(AUTO-REFRESH: 60S)</span>}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-20">
          <div className="text-2xl font-bold mb-2">⟲ LOADING_MARKETS...</div>
          <div className="text-sm text-gray-600">FETCHING DATA FROM POLYMARKET</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && sortedMarkets.length === 0 && (
        <div className="border-4 border-black bg-gray-50 p-12 text-center"
          style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
          <div className="text-4xl mb-4">⊘</div>
          <div className="text-xl font-bold mb-2">NO_MARKETS_FOUND</div>
          <div className="text-sm text-gray-600 mb-4">
            Try adjusting your filters or search query
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              fetchMarkets();
            }}
            className="border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100"
          >
            ⟲ RESET_FILTERS
          </button>
        </div>
      )}

      {/* Live Markets - Grid View */}
      {!loading && viewMode === 'live' && sortedMarkets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMarkets.map(market => (
            <div
              key={market.id}
              className="border-4 border-black bg-white"
              style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}
            >
              {/* Image */}
              {market.image_url && (
                <div className="border-b-4 border-black h-40 overflow-hidden bg-gray-100">
                  <img
                    src={market.image_url}
                    alt={market.question}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {/* Category */}
                {market.category && (
                  <div className="text-xs font-bold mb-2 text-gray-600">
                    {market.category.toUpperCase()}
                  </div>
                )}

                {/* Question */}
                <h3 className="font-bold mb-3 text-sm leading-tight">
                  {market.question}
                </h3>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="border-2 border-black p-2 bg-green-50">
                    <div className="text-xs font-bold text-gray-600">YES</div>
                    <div className="text-xl font-bold">
                      {Math.round(market.yes_price * 100)}¢
                    </div>
                  </div>
                  <div className="border-2 border-black p-2 bg-red-50">
                    <div className="text-xs font-bold text-gray-600">NO</div>
                    <div className="text-xl font-bold">
                      {Math.round(market.no_price * 100)}¢
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-xs mb-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">VOLUME:</span>
                    <span className="font-bold">${Math.round(market.volume).toLocaleString()}</span>
                  </div>
                  {market.prediction_count !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">AI_PREDICTIONS:</span>
                      <span className="font-bold">{market.prediction_count}</span>
                    </div>
                  )}
                  {market.end_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ENDS:</span>
                      <span className="font-bold">
                        {new Date(market.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/markets/${market.polymarket_id}/predictions`}
                    className="border-2 border-black px-3 py-2 font-bold text-center bg-white hover:bg-gray-100 text-xs"
                  >
                    🤖 AI_TAKES
                  </Link>
                  <a
                    href={`https://polymarket.com/event/${market.market_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-black px-3 py-2 font-bold text-center bg-white hover:bg-gray-100 text-xs"
                  >
                    → POLYMARKET
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Markets - List View */}
      {!loading && viewMode === 'top' && sortedMarkets.length > 0 && (
        <div className="space-y-4">
          {sortedMarkets.map((market, index) => {
            const isTop3 = index < 3;
            const bgColor = index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-orange-50' : 'bg-white';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

            return (
              <div
                key={market.id}
                className={`border-4 border-black ${bgColor}`}
                style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div className="text-center min-w-[60px]">
                      {medal && <div className="text-3xl mb-1">{medal}</div>}
                      <div className="text-2xl font-bold">#{index + 1}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      {/* Category */}
                      {market.category && (
                        <div className="text-xs font-bold mb-2 text-gray-600">
                          {market.category.toUpperCase()}
                        </div>
                      )}

                      {/* Question */}
                      <h3 className="font-bold mb-2 text-lg">
                        {market.question}
                      </h3>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-600">VOLUME: </span>
                          <span className="font-bold">${Math.round(market.volume).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">YES: </span>
                          <span className="font-bold text-green-600">{Math.round(market.yes_price * 100)}¢</span>
                        </div>
                        <div>
                          <span className="text-gray-600">NO: </span>
                          <span className="font-bold text-red-600">{Math.round(market.no_price * 100)}¢</span>
                        </div>
                        {market.prediction_count !== undefined && (
                          <div>
                            <span className="text-gray-600">AI_PREDICTIONS: </span>
                            <span className="font-bold">{market.prediction_count}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          href={`/markets/${market.polymarket_id}/predictions`}
                          className="border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100 text-xs"
                        >
                          🤖 SEE_AI_TAKES
                        </Link>
                        <a
                          href={`https://polymarket.com/event/${market.market_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100 text-xs"
                        >
                          → VIEW_ON_POLYMARKET
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

