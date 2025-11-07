interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  outcomes: string | string[]; // Can be JSON string or array
  outcomePrices?: string | string[]; // Can be JSON string, array, or undefined
  volume?: string | number;
  liquidity?: string | number;
  volumeAmm?: number;
  volumeClob?: number;
  liquidityAmm?: number;
  liquidityClob?: number;
  endDate: string;
  startDate: string;
  slug: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  categoryLabel?: string;
  groupItemTitle?: string;
  volume24hr?: string;
  enableOrderBook: boolean;
  orderMinSize: number;
  orderPriceMinTickSize: number;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  spread?: number;
}

export async function fetchPolymarketMarkets(
  limit: number = 100,
  offset: number = 0
): Promise<PolymarketMarket[]> {
  try {
    // If limit is 0, fetch a large number to get all available markets
    const actualLimit = limit === 0 ? 1000 : limit;
    const url = `https://gamma-api.polymarket.com/markets?limit=${actualLimit}&offset=${offset}&closed=false`;

    console.log(`📡 Fetching markets from Polymarket (limit: ${limit === 0 ? 'unlimited' : limit})...`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout to prevent hanging on external API
      signal: AbortSignal.timeout(45000) // 45 second timeout
    });

    if (!response.ok) {
      throw new Error(`Polymarket API returned ${response.status}`);
    }

    const data = await response.json();

    console.log(`✅ Fetched ${data.length} markets from Polymarket`);

    return data;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('❌ Polymarket API timeout after 45 seconds');
      throw new Error('Polymarket API timeout - request took too long');
    }
    console.error('❌ Error fetching from Polymarket:', error.message);
    throw error;
  }
}

export async function fetchSingleMarket(marketId: string): Promise<PolymarketMarket | null> {
  try {
    const response = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();

  } catch (error) {
    console.error(`Error fetching market ${marketId}:`, error);
    return null;
  }
}

export function parsePolymarketMarket(market: PolymarketMarket) {
  // Parse outcomes
  let outcomes: string[] = [];
  try {
    if (typeof market.outcomes === 'string') {
      outcomes = JSON.parse(market.outcomes);
    } else if (Array.isArray(market.outcomes)) {
      outcomes = market.outcomes;
    }
  } catch (e) {
    outcomes = ['Yes', 'No']; // Default fallback
  }

  // Parse outcome prices
  let outcomePrices: string[] = [];
  try {
    if (typeof market.outcomePrices === 'string') {
      outcomePrices = JSON.parse(market.outcomePrices);
    } else if (Array.isArray(market.outcomePrices)) {
      outcomePrices = market.outcomePrices;
    }
  } catch (e) {
    outcomePrices = [];
  }

  // Calculate prices with fallbacks
  let yesPrice = 0.5;
  let noPrice = 0.5;

  if (outcomePrices.length >= 2) {
    yesPrice = parseFloat(outcomePrices[0]) || 0.5;
    noPrice = parseFloat(outcomePrices[1]) || (1 - yesPrice);
  } else if (market.bestBid !== undefined && market.bestAsk !== undefined) {
    // Use bid/ask spread as price estimate
    yesPrice = (market.bestBid + market.bestAsk) / 2;
    noPrice = 1 - yesPrice;
  } else if (market.lastTradePrice !== undefined) {
    yesPrice = market.lastTradePrice;
    noPrice = 1 - yesPrice;
  }

  // Parse volume - try multiple fields
  const volume = parseFloat(String(market.volume || market.volumeAmm || market.volumeClob || '0'));
  const volume24hr = parseFloat(market.volume24hr || '0');

  // Parse dates
  const endDate = market.endDate ? new Date(market.endDate).toISOString() : null;
  const startDate = market.startDate ? new Date(market.startDate).toISOString() : null;

  return {
    polymarket_id: market.id,
    question: market.question,
    description: market.description || market.groupItemTitle || '',
    market_slug: market.slug || market.id,
    yes_price: yesPrice,
    no_price: noPrice,
    volume: volume,
    volume_24hr: volume24hr,
    liquidity: parseFloat(String(market.liquidity || market.liquidityAmm || market.liquidityClob || '0')),
    end_date: endDate,
    start_date: startDate,
    category: market.categoryLabel || 'Other',
    image_url: market.image || market.icon || null,
    active: market.active !== false,
    resolved: market.closed || false,
    archived: market.archived || false,
    enable_order_book: market.enableOrderBook || false
  };
}

