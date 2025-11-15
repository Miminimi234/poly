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
  // Implement retries for transient errors (5xx / network issues)
  const actualLimit = limit === 0 ? 1000 : limit;
  const url = `https://gamma-api.polymarket.com/markets?limit=${actualLimit}&offset=${offset}&closed=false`;

  const maxAttempts = 5;
  let attempt = 0;

  console.log(`📡 Fetching markets from Polymarket (limit: ${limit === 0 ? 'unlimited' : limit})...`);

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(60000) // 60 second timeout
      });

      if (!response.ok) {
        const status = response.status;
        const text = await response.text().catch(() => '');
        console.warn(`Polymarket API returned status ${status} (attempt ${attempt}): ${response.statusText}`);

        // Retry on 5xx server errors (including 502 Bad Gateway)
        if (status >= 500 && attempt < maxAttempts) {
          // Use exponential backoff with jitter
          const base = 1000; // base ms
          const backoff = Math.min(10000, base * Math.pow(2, attempt - 1));
          const jitter = Math.floor(Math.random() * 300);
          const wait = backoff + jitter;
          console.log(`Polymarket 5xx (${status}) response. Retrying in ${wait}ms (attempt ${attempt + 1}/${maxAttempts})...`);
          await new Promise((res) => setTimeout(res, wait));
          continue;
        }

        // Include response body for debugging in thrown error
        const errMsg = `Polymarket API returned ${status}: ${text || response.statusText}`;
        console.warn(errMsg);
        throw new Error(errMsg);
      }

      const data = await response.json();
      console.log(`✅ Fetched ${Array.isArray(data) ? data.length : 'unknown'} markets from Polymarket`);
      return data as PolymarketMarket[];

    } catch (error: any) {
      // Handle abort/timeouts explicitly
      if (error && error.name === 'AbortError') {
        console.error('❌ Polymarket API timeout after 45 seconds');
        // If last attempt, throw timeout error
        if (attempt >= maxAttempts) {
          throw new Error('Polymarket API timeout - request took too long');
        }
        const backoff = 500 * Math.pow(2, attempt - 1);
        console.log(`Retrying after timeout/network error in ${backoff}ms (attempt ${attempt + 1}/${maxAttempts})...`);
        await new Promise((res) => setTimeout(res, backoff));
        continue;
      }

      // Non-abort errors: if attempts remain, retry; otherwise rethrow
      console.error('❌ Error fetching from Polymarket (attempt', attempt, '):', error && error.message ? error.message : error);
      if (attempt < maxAttempts) {
        const base = 1000;
        const backoff = Math.min(10000, base * Math.pow(2, attempt - 1));
        const jitter = Math.floor(Math.random() * 300);
        const wait = backoff + jitter;
        console.log(`Retrying after error in ${wait}ms (attempt ${attempt + 1}/${maxAttempts})...`);
        await new Promise((res) => setTimeout(res, wait));
        continue;
      }
      throw error;
    }
  }

  // If we exit loop without returning, throw a generic error
  throw new Error('Failed to fetch Polymarket markets after multiple attempts');
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

