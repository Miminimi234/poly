import firebaseMarketCache from '@/lib/firebase-market-cache';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get markets from Firebase
    const markets = await firebaseMarketCache.getMarkets();

    if (!markets || markets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No markets found in Firebase',
        stats: {
          total: 0,
          active: 0,
          resolved: 0,
          archived: 0,
          totalVolume: 0,
          avgVolume: 0,
          highVolumeCount: 0
        }
      });
    }

    const stats = calculateStats(markets);

    console.log(`🎯 Serving market statistics from Firebase (${markets.length} markets)`);

    return NextResponse.json({
      success: true,
      stats,
      cached: true
    });

  } catch (error: any) {
    console.error('❌ Market stats error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch market statistics',
      message: error.message,
      stats: {
        total: 0,
        active: 0,
        resolved: 0,
        archived: 0,
        totalVolume: 0,
        avgVolume: 0,
        highVolumeCount: 0
      }
    }, { status: 500 });
  }
}

function calculateStats(markets: any[]) {
  const total = markets.length;
  const active = markets.filter(m => m.active && !m.resolved).length;
  const resolved = markets.filter(m => m.resolved).length;
  const archived = markets.filter(m => m.archived).length;

  const totalVolume = markets.reduce((sum, market) => sum + (market.volume || 0), 0);
  const avgVolume = total > 0 ? totalVolume / total : 0;

  // Enhanced high volume calculation - use 24hr + total volume
  const highVolumeMarkets = markets.filter(m => {
    const totalVol = (m.volume || 0);
    const vol24hr = (m.volume_24hr || 0);
    return totalVol > 50000 || vol24hr > 10000; // $50k total or $10k daily
  });

  // Get real categories from market data (filter out null/undefined/empty)
  const realCategories = [...new Set(
    markets
      .map(m => m.category || m.categoryLabel)
      .filter(cat => cat && cat.trim() && cat.toLowerCase() !== 'other')
  )];

  // Calculate trending tokens volume (top 10 highest volume markets)
  const topMarkets = markets
    .sort((a, b) => ((b.volume || 0) + (b.volume_24hr || 0)) - ((a.volume || 0) + (a.volume_24hr || 0)))
    .slice(0, 10);

  const trendingVolume = topMarkets.reduce((sum, market) =>
    sum + (market.volume || 0) + (market.volume_24hr || 0), 0
  );

  // Hardcoded category count from markets page: politics, sports, finance, crypto, geopolitics, earnings, tech, culture, world, economy, elections
  const hardcodedCategoryCount = 11;

  return {
    total,
    active,
    resolved,
    archived,
    totalVolume,
    avgVolume: Math.round(avgVolume),
    highVolumeCount: highVolumeMarkets.length,
    topVolume: Math.max(...markets.map(m => (m.volume || 0)), 0),
    categories: hardcodedCategoryCount, // Use hardcoded count of real categories
    trendingVolume: Math.round(trendingVolume),
    realCategories: ['Politics', 'Sports', 'Finance', 'Crypto', 'Geopolitics', 'Earnings', 'Tech', 'Culture', 'World', 'Economy', 'Elections'], // Hardcoded category names
    topMarkets: topMarkets.slice(0, 5).map(m => ({ // Top 5 for reference
      question: m.question,
      volume: m.volume || 0,
      volume_24hr: m.volume_24hr || 0,
      category: m.category || m.categoryLabel
    }))
  };
}
