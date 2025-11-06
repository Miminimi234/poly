import firebaseMarketCache from '@/lib/firebase-market-cache';
import { fetchPolymarketMarkets, parsePolymarketMarket } from '@/lib/polymarket-client';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '0'); // 0 means no limit
  const forceRefresh = searchParams.get('refresh') === 'true';

  try {
    // Try to get from Firebase cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedMarkets = await firebaseMarketCache.getMarkets();
      if (cachedMarkets && cachedMarkets.length > 0) {
        console.log(`🔥 Serving ${cachedMarkets.length} markets from Firebase cache`);

        // Apply limit if specified, otherwise return all
        const limitedMarkets = limit > 0 ? cachedMarkets.slice(0, limit) : cachedMarkets;

        return NextResponse.json({
          success: true,
          count: limitedMarkets.length,
          totalAvailable: cachedMarkets.length,
          markets: limitedMarkets,
          source: 'firebase_cache',
          cached: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`🔄 Fetching fresh markets from Polymarket API (unlimited)...`);

    // Fetch ALL available markets (no limit)
    const rawMarkets = await fetchPolymarketMarkets(0); // 0 means no limit

    if (!rawMarkets || rawMarkets.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No markets found',
        markets: [],
        source: 'http_api'
      });
    }

    // Parse markets (no filtering)
    const parsedMarkets = rawMarkets
      .map(market => {
        try {
          return parsePolymarketMarket(market);
        } catch (error) {
          console.warn(`Failed to parse market ${market.id}:`, error);
          return null;
        }
      })
      .filter(market => market !== null)
      .sort((a, b) => b.volume - a.volume); // Sort by volume descending

    // Apply limit if specified (for display, but cache all)
    const limitedMarkets = limit > 0 ? parsedMarkets.slice(0, limit) : parsedMarkets;

    // Store ALL parsed markets in Firebase using intelligent upsert
    const upsertResult = await firebaseMarketCache.upsertMarkets(parsedMarkets, 'polymarket_api');

    console.log(`✅ Fetched and processed ${parsedMarkets.length} markets to Firebase:`,
      `${upsertResult.added} added, ${upsertResult.updated} updated, ${upsertResult.skipped} unchanged (returning ${limitedMarkets.length})`);

    return NextResponse.json({
      success: true,
      count: limitedMarkets.length,
      totalAvailable: parsedMarkets.length,
      markets: limitedMarkets,
      source: 'http_api',
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Polymarket API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch markets from Polymarket',
      message: error.message,
      markets: [],
      source: 'error'
    }, { status: 500 });
  }
}