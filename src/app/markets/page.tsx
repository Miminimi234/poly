'use client';

import { MainNav } from '@/components/navigation/MainNav';
import { useFirebaseMarkets } from '@/hooks/useFirebaseMarkets';
import { checkAdminStatus } from '@/lib/admin-auth';
import '@/styles/poly402.css';
import Link from 'next/link';
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
  category: string;
  polymarket_category?: string; // Auto-categorized category
  end_date: string | null;
  start_date: string | null;
  image_url: string | null;
  active: boolean;
  resolved: boolean;
  archived: boolean;
  analyzed?: boolean; // Track if market has been analyzed by agents
  prediction_count?: number;
}

type ViewMode = 'live' | 'top';
type SortBy = 'volume' | 'predictions' | 'ending_soon' | 'newest';

// Polymarket-style categories
const POLYMARKET_CATEGORIES = [
  { id: 'trending', name: 'Trending' },
  { id: 'all', name: 'All Markets' },
  { id: 'breaking', name: 'Breaking' },
  { id: 'new', name: 'New' },
  { id: 'politics', name: 'Politics' },
  { id: 'sports', name: 'Sports' },
  { id: 'finance', name: 'Finance' },
  { id: 'crypto', name: 'Crypto' },
  { id: 'geopolitics', name: 'Geopolitics' },
  { id: 'earnings', name: 'Earnings' },
  { id: 'tech', name: 'Tech' },
  { id: 'culture', name: 'Culture' },
  { id: 'world', name: 'World' },
  { id: 'economy', name: 'Economy' },
  { id: 'elections', name: 'Elections' },
];

export default function MarketsPage() {
  // Use Firebase real-time updates instead of cache stream
  const { markets: streamMarkets, loading, connected, metadata, lastUpdate, refreshFromServer } = useFirebaseMarkets();

  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('volume');

  // Admin functionality
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [analyzingMarkets, setAnalyzingMarkets] = useState<Set<string>>(new Set());
  const [adminMessage, setAdminMessage] = useState<string>('');

  // Prediction counts
  const [predictionCounts, setPredictionCounts] = useState<{ [marketId: string]: number }>({});
  const [loadingPredictionCounts, setLoadingPredictionCounts] = useState<boolean>(false);

  // Process streamed markets with categorization
  const [markets, setMarkets] = useState<Market[]>([]);

  // Check admin status on component mount
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const adminStatus = await checkAdminStatus();
        setIsAdmin(adminStatus);
      } catch (error) {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  // Process markets when streamMarkets change
  useEffect(() => {
    const processedMarkets = streamMarkets.map((m: any) => ({
      ...m,
      prediction_count: predictionCounts[m.polymarket_id] || 0, // Use real prediction count
      // Ensure consistent field names
      end_date: m.end_date || null,
      image_url: m.image_url || null,
      // Auto-categorize based on content
      polymarket_category: categorizeMarket(m)
    }));

    setMarkets(processedMarkets);
  }, [streamMarkets, predictionCounts]);

  // Fetch prediction counts when markets change
  useEffect(() => {
    if (streamMarkets.length > 0) {
      const marketIds = streamMarkets.map(m => m.polymarket_id);
      fetchPredictionCounts(marketIds);
    }
  }, [streamMarkets]);

  // Add 3-second polling for market data updates
  useEffect(() => {
    const pollingInterval = setInterval(() => {
      if (!loading && streamMarkets.length > 0) {
        refreshFromServer();
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollingInterval);
  }, [loading, streamMarkets.length, refreshFromServer]);

  // Function to categorize markets based on content
  const categorizeMarket = (market: any): string => {
    const question = market.question.toLowerCase();
    const description = (market.description || '').toLowerCase();
    const category = (market.category || '').toLowerCase();
    const content = `${question} ${description} ${category}`;

    // Elections (specific election events)
    if (content.includes('election') || content.includes('presidential') || content.includes('vote') ||
      content.includes('nominee') || content.includes('primary') || content.includes('campaign') ||
      content.includes('ballot') || content.includes('democratic nominee') || content.includes('republican nominee')) {
      return 'elections';
    }

    // Politics (government, policy, politicians)
    if (content.includes('congress') || content.includes('senate') || content.includes('government') ||
      content.includes('policy') || content.includes('law') || content.includes('supreme court') ||
      content.includes('biden') || content.includes('trump') || content.includes('harris') ||
      content.includes('political') || content.includes('democrat') || content.includes('republican') ||
      content.includes('white house') || content.includes('administration')) {
      return 'politics';
    }

    // Crypto (specific crypto terms)
    if (content.includes('bitcoin') || content.includes('crypto') || content.includes('ethereum') ||
      content.includes('btc') || content.includes('eth') || content.includes('coin') ||
      content.includes('blockchain') || content.includes('defi') || content.includes('nft') ||
      content.includes('solana') || content.includes('cardano') || content.includes('binance') ||
      content.includes('coinbase') || content.includes('dogecoin')) {
      return 'crypto';
    }

    // Earnings (specific companies reporting earnings)
    if (content.includes('earnings') || content.includes('revenue') || content.includes('profit') ||
      content.includes('quarterly') || content.includes('q1') || content.includes('q2') ||
      content.includes('q3') || content.includes('q4') || content.includes('eps')) {
      return 'earnings';
    }

    // Finance (broader financial markets)
    if (content.includes('stock') || content.includes('fed') || content.includes('interest rate') ||
      content.includes('inflation') || content.includes('gdp') || content.includes('market cap') ||
      content.includes('ipo') || content.includes('nasdaq') || content.includes('s&p') ||
      content.includes('dow jones') || content.includes('bank') || content.includes('financial')) {
      return 'finance';
    }

    // Tech (technology companies and AI)
    if (content.includes('ai') || content.includes('tech') || content.includes('apple') ||
      content.includes('google') || content.includes('meta') || content.includes('tesla') ||
      content.includes('artificial intelligence') || content.includes('software') || content.includes('app') ||
      content.includes('microsoft') || content.includes('amazon') || content.includes('openai') ||
      content.includes('chatgpt') || content.includes('nvidia') || content.includes('semiconductor')) {
      return 'tech';
    }

    // Sports (specific sports and events)
    if (content.includes('sport') || content.includes('nfl') || content.includes('nba') ||
      content.includes('football') || content.includes('basketball') || content.includes('baseball') ||
      content.includes('soccer') || content.includes('olympics') || content.includes('championship') ||
      content.includes('super bowl') || content.includes('world cup') || content.includes('nhl') ||
      content.includes('tennis') || content.includes('golf') || content.includes('ufc')) {
      return 'sports';
    }

    // Geopolitics (international relations and conflicts)
    if (content.includes('war') || content.includes('ukraine') || content.includes('russia') ||
      content.includes('china') || content.includes('israel') || content.includes('iran') ||
      content.includes('nato') || content.includes('international') || content.includes('nuclear') ||
      content.includes('sanctions') || content.includes('ceasefire') || content.includes('gaza') ||
      content.includes('taiwan') || content.includes('north korea')) {
      return 'geopolitics';
    }

    // World (general world events)
    if (content.includes('global') || content.includes('world') || content.includes('country') ||
      content.includes('europe') || content.includes('asia') || content.includes('africa') ||
      content.includes('climate') || content.includes('pandemic') || content.includes('natural disaster')) {
      return 'world';
    }

    // Economy (economic indicators and trends)
    if (content.includes('recession') || content.includes('unemployment') || content.includes('jobs') ||
      content.includes('economic') || content.includes('trade') || content.includes('tariff') ||
      content.includes('consumer') || content.includes('retail') || content.includes('housing')) {
      return 'economy';
    }

    // Culture (entertainment, celebrities, awards)
    if (content.includes('movie') || content.includes('music') || content.includes('celebrity') ||
      content.includes('entertainment') || content.includes('award') || content.includes('film') ||
      content.includes('netflix') || content.includes('disney') || content.includes('oscar') ||
      content.includes('grammy') || content.includes('album') || content.includes('box office')) {
      return 'culture';
    }

    // Breaking news (high-volume recent events)
    const isRecent = market.start_date && new Date(market.start_date) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    if (isRecent && market.volume > 500000) {
      return 'breaking';
    }

    // New markets (recently created)
    if (isRecent || (!market.start_date && market.volume < 10000)) {
      return 'new';
    }

    // Default to trending for high-volume markets
    return 'trending';
  };

  // Manual refresh function that triggers server refresh
  const handleRefresh = async () => {
    console.log('🔄 Manual Firebase refresh requested');
    await refreshFromServer();
  };

  // Fetch prediction counts for visible markets
  const fetchPredictionCounts = async (marketIds: string[]) => {
    if (marketIds.length === 0) return;

    setLoadingPredictionCounts(true);
    try {
      const response = await fetch('/api/markets/prediction-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ marketIds }),
      });

      const data = await response.json();

      if (data.success) {
        setPredictionCounts(prevCounts => ({
          ...prevCounts,
          ...data.predictionCounts
        }));
      } else {
        console.error('Failed to fetch prediction counts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching prediction counts:', error);
    } finally {
      setLoadingPredictionCounts(false);
    }
  };

  // Admin function to trigger AI analysis for a specific market
  const triggerMarketAnalysis = async (marketId: string, marketQuestion: string) => {
    if (!isAdmin) {
      setAdminMessage('❌ Admin privileges required');
      setTimeout(() => setAdminMessage(''), 3000);
      return;
    }

    // Add to analyzing set
    setAnalyzingMarkets(prev => new Set(prev).add(marketId));
    setAdminMessage('');

    try {
      console.log(`🎯 Triggering AI analysis for market: ${marketId}`);

      const response = await fetch(`/api/admin/analyze-market/${marketId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.status === 403) {
        setAdminMessage('❌ Admin access denied');
        setIsAdmin(false);
        return;
      }

      if (data.success) {
        setAdminMessage(`✅ AI Analysis Complete: ${data.result.predictionsGenerated}/${data.result.agentsTriggered} agents analyzed "${marketQuestion.slice(0, 30)}..."`);

        // Update the market's analyzed status and prediction count in local state
        setMarkets(prevMarkets =>
          prevMarkets.map(market =>
            market.polymarket_id === marketId
              ? { ...market, analyzed: true, prediction_count: (market.prediction_count || 0) + data.result.predictionsGenerated }
              : market
          )
        );

        // Update prediction counts state as well
        setPredictionCounts(prevCounts => ({
          ...prevCounts,
          [marketId]: (prevCounts[marketId] || 0) + data.result.predictionsGenerated
        }));
      } else {
        setAdminMessage(`❌ Analysis Failed: ${data.error || 'Unknown error'}`);
      }

    } catch (error: any) {
      console.error('Failed to trigger market analysis:', error);
      setAdminMessage(`❌ Error: ${error.message}`);
    } finally {
      // Remove from analyzing set
      setAnalyzingMarkets(prev => {
        const newSet = new Set(prev);
        newSet.delete(marketId);
        return newSet;
      });
      // Clear message after 8 seconds
      setTimeout(() => setAdminMessage(''), 8000);
    }
  };

  // Filter markets based on selected category and search
  const filteredMarkets = markets.filter(market => {
    const matchesSearch = searchQuery === '' ||
      market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      market.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Special handling for trending - show highest volume markets
    if (selectedCategory === 'trending') {
      return matchesSearch && market.volume > 50000; // High volume threshold
    }

    // Special handling for 'all' - show all markets
    if (selectedCategory === 'all') {
      return matchesSearch;
    }

    // Match against auto-categorized category
    const matchesCategory = (market as any).polymarket_category === selectedCategory;

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
    <div className="min-h-screen bg-white text-black p-3 sm:p-4 md:p-8">
      <MainNav />

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="w-full">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-black mb-2 inline-block">
            ← BACK_TO_DASHBOARD
          </Link>
          <h1 className="text-2xl md:text-4xl font-bold mb-2 break-words">
            LIVE MARKETS - {POLYMARKET_CATEGORIES.find(c => c.id === selectedCategory)?.name.toUpperCase()}
          </h1>

        </div>
      </div>

      {/* Admin Message Display */}
      {isAdmin && adminMessage && (
        <div className="mb-4 p-3 border-2 border-black bg-yellow-50 text-sm font-bold">
          {adminMessage}
        </div>
      )}

      {/* Filters */}
      <div className="border-4 border-black bg-white p-4 md:p-6 mb-6"
        style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold mb-2">CATEGORY</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border-2 border-black px-3 md:px-4 py-2 text-sm font-bold bg-white"
            >
              {POLYMARKET_CATEGORIES.map(category => {
                const categoryCount = markets.filter(m =>
                  category.id === 'trending'
                    ? m.volume > 50000
                    : (m as any).polymarket_category === category.id
                ).length;

                return (
                  <option key={category.id} value={category.id}>
                    {category.name.toUpperCase()} ({categoryCount})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-bold mb-2">SEARCH</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search markets..."
              className="w-full border-2 border-black px-3 md:px-4 py-2 text-sm font-bold"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-bold mb-2">SORT_BY</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full border-2 border-black px-3 md:px-4 py-2 text-sm font-bold bg-white"
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
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold">ACTIVE_FILTERS:</span>
            {searchQuery && (
              <span className="text-xs border-2 border-black px-2 py-1 bg-gray-100">
                &quot;{searchQuery}&quot;
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="text-xs border-2 border-black px-2 py-1 bg-gray-100">
                {POLYMARKET_CATEGORIES.find(c => c.id === selectedCategory)?.name.toUpperCase()}
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs border-2 border-black px-2 py-1 bg-white hover:bg-red-100"
            >
              CLEAR_ALL
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              setSelectedCategory('trending');
              setSearchQuery('');
            }}
            className="text-xs border-2 border-black px-3 py-2 bg-white hover:bg-gray-100 font-bold w-full sm:w-auto"
            style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}
          >
            SHOW_ALL_TRENDING
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              // Show all markets by setting to 'all' category
              setSelectedCategory('all');
            }}
            className="text-xs border-2 border-black px-3 py-2 bg-white hover:bg-gray-100 font-bold w-full sm:w-auto"
            style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}
          >
            SHOW_ALL_MARKETS
          </button>

        </div>
      </div>

      {/* Results count */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <div className="text-sm font-bold">
          SHOWING {sortedMarkets.length} MARKETS
        </div>
        <div className="flex flex-col sm:flex-row gap-2 text-xs text-gray-500">
          <div>
            Category: {POLYMARKET_CATEGORIES.find(c => c.id === selectedCategory)?.name}
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              Last updated: {lastUpdate}
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="border-4 border-black bg-white p-6 sm:p-12 text-center"
          style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
          <div className="text-3xl sm:text-4xl mb-4">⟲</div>
          <div className="text-lg sm:text-2xl font-bold mb-2">LOADING_MARKETS...</div>
          <div className="text-sm text-gray-600">FETCHING LIVE DATA FROM FIREBASE DATABASE</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && sortedMarkets.length === 0 && (
        <div className="border-4 border-black bg-gray-50 p-6 sm:p-12 text-center"
          style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
          <div className="text-3xl sm:text-4xl mb-4">⊘</div>
          <div className="text-lg sm:text-xl font-bold mb-2">NO_MARKETS_FOUND</div>
          <div className="text-sm text-gray-600 mb-4">
            Try adjusting your filters or search query
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('trending');
              handleRefresh();
            }}
            className="border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100 w-full sm:w-auto"
          >
            RESET_FILTERS
          </button>
        </div>
      )}

      {/* Live Markets - Grid View */}
      {!loading && viewMode === 'live' && sortedMarkets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {sortedMarkets.map(market => (
            <div
              key={market.polymarket_id}
              className="border-4 border-black bg-white"
              style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}
            >
              {/* Image */}
              {market.image_url && (
                <div className="border-b-4 border-black h-32 sm:h-40 overflow-hidden bg-gray-100">
                  <img
                    src={market.image_url}
                    alt={market.question}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Hide broken images
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-3 sm:p-4">
                {/* Category */}
                {market.polymarket_category && (
                  <div className="text-xs font-bold mb-2 text-gray-600">
                    {POLYMARKET_CATEGORIES.find(c => c.id === market.polymarket_category)?.name.toUpperCase()}
                  </div>
                )}

                {/* Question */}
                <h3 className="font-bold mb-3 text-sm sm:text-base leading-tight">
                  {market.question}
                </h3>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="border-2 border-black p-2 bg-green-50">
                    <div className="text-xs font-bold text-gray-600">YES</div>
                    <div className="text-lg sm:text-xl font-bold">
                      {Math.round(market.yes_price * 100)}¢
                    </div>
                  </div>
                  <div className="border-2 border-black p-2 bg-red-50">
                    <div className="text-xs font-bold text-gray-600">NO</div>
                    <div className="text-lg sm:text-xl font-bold">
                      {Math.round(market.no_price * 100)}¢
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-xs mb-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">VOLUME:</span>
                    <span className="font-bold">
                      {market.volume >= 1000000
                        ? `$${(market.volume / 1000000).toFixed(1)}M`
                        : market.volume >= 1000
                          ? `$${(market.volume / 1000).toFixed(0)}K`
                          : `$${Math.round(market.volume).toLocaleString()}`
                      }
                    </span>
                  </div>
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
                <div className={`grid gap-2 ${isAdmin ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <Link
                    href={`/markets/${market.polymarket_id}`}
                    className="border-2 border-black px-2 sm:px-3 py-2 font-bold text-center bg-white hover:bg-gray-100 text-xs"
                  >
                    VIEW_MARKET
                  </Link>
                  <a
                    href={`https://polymarket.com/event/${market.market_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-black px-2 sm:px-3 py-2 font-bold text-center bg-white hover:bg-gray-100 text-xs"
                  >
                    POLYMARKET
                  </a>

                  {/* Admin Only: Trigger AI Analysis Button */}
                  {isAdmin && (
                    <button
                      onClick={() => !market.analyzed && triggerMarketAnalysis(market.polymarket_id, market.question)}
                      disabled={analyzingMarkets.has(market.polymarket_id) || market.analyzed}
                      className={`border-2 border-black px-2 sm:px-3 py-2 font-bold text-center text-xs transition-colors ${market.analyzed
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : analyzingMarkets.has(market.polymarket_id)
                          ? 'bg-yellow-100 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
                        }`}
                      title={
                        market.analyzed
                          ? 'This market has already been analyzed by AI agents'
                          : 'Trigger AI analysis for this market by all agents'
                      }
                    >
                      {market.analyzed
                        ? '✅ ANALYZED'
                        : analyzingMarkets.has(market.polymarket_id)
                          ? '⟲ ANALYZING...'
                          : '🤖 TRIGGER_AI'
                      }
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Markets - List View */}
      {!loading && viewMode === 'top' && sortedMarkets.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          {sortedMarkets.map((market, index) => {
            const isTop3 = index < 3;
            const bgColor = index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-orange-50' : 'bg-white';
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

            return (
              <div
                key={market.polymarket_id}
                className={`border-4 border-black ${bgColor}`}
                style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}
              >
                <div className="p-3 sm:p-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Rank */}
                    <div className="text-center min-w-[50px] sm:min-w-[60px] flex-shrink-0">
                      {medal && <div className="text-2xl sm:text-3xl mb-1">{medal}</div>}
                      <div className="text-lg sm:text-2xl font-bold">#{index + 1}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Category */}
                      {market.polymarket_category && (
                        <div className="text-xs font-bold mb-2 text-gray-600">
                          {POLYMARKET_CATEGORIES.find(c => c.id === market.polymarket_category)?.name.toUpperCase()}
                        </div>
                      )}

                      {/* Question */}
                      <h3 className="font-bold mb-2 text-sm sm:text-lg leading-tight">
                        {market.question}
                      </h3>

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-2 sm:gap-4 mb-3 text-xs sm:text-sm">
                        <div>
                          <span className="text-gray-600">VOLUME: </span>
                          <span className="font-bold">
                            {market.volume >= 1000000
                              ? `$${(market.volume / 1000000).toFixed(1)}M`
                              : market.volume >= 1000
                                ? `$${(market.volume / 1000).toFixed(0)}K`
                                : `$${Math.round(market.volume).toLocaleString()}`
                            }
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">YES: </span>
                          <span className="font-bold text-green-600">{Math.round(market.yes_price * 100)}¢</span>
                        </div>
                        <div>
                          <span className="text-gray-600">NO: </span>
                          <span className="font-bold text-red-600">{Math.round(market.no_price * 100)}¢</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                          href={`/markets/${market.polymarket_id}`}
                          className="border-2 border-black px-3 sm:px-4 py-2 font-bold bg-white hover:bg-gray-100 text-xs text-center"
                        >
                          VIEW_MARKET
                        </Link>
                        <a
                          href={`https://polymarket.com/event/${market.market_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border-2 border-black px-3 sm:px-4 py-2 font-bold bg-white hover:bg-gray-100 text-xs text-center"
                        >
                          VIEW_ON_POLYMARKET
                        </a>

                        {/* Admin Only: Trigger AI Analysis Button */}
                        {isAdmin && (
                          <button
                            onClick={() => !market.analyzed && triggerMarketAnalysis(market.polymarket_id, market.question)}
                            disabled={analyzingMarkets.has(market.polymarket_id) || market.analyzed}
                            className={`border-2 border-black px-3 sm:px-4 py-2 font-bold text-xs text-center transition-colors ${market.analyzed
                              ? 'bg-green-100 text-green-700 cursor-default'
                              : analyzingMarkets.has(market.polymarket_id)
                                ? 'bg-yellow-100 text-gray-600 cursor-not-allowed'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-800'
                              }`}
                            title={
                              market.analyzed
                                ? 'This market has already been analyzed by AI agents'
                                : 'Trigger AI analysis for this market by all agents'
                            }
                          >
                            {market.analyzed
                              ? '✅ ANALYZED'
                              : analyzingMarkets.has(market.polymarket_id)
                                ? '⟲ ANALYZING...'
                                : '🤖 TRIGGER_AI'
                            }
                          </button>
                        )}
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

