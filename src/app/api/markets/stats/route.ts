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

  const totalVolume = markets.reduce((sum, market) => sum + market.volume, 0);
  const avgVolume = total > 0 ? totalVolume / total : 0;
  const highVolumeCount = markets.filter(m => m.volume > 100000).length; // $100k+

  return {
    total,
    active,
    resolved,
    archived,
    totalVolume,
    avgVolume: Math.round(avgVolume),
    highVolumeCount,
    topVolume: Math.max(...markets.map(m => m.volume), 0),
    categories: [...new Set(markets.map(m => m.category))].length
  };
}
