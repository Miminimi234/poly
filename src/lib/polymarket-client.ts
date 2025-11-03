interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  liquidity: string;
  endDate: string;
  startDate: string;
  slug: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  categoryLabel: string;
  groupItemTitle: string;
  volume24hr: string;
  enableOrderBook: boolean;
  orderMinSize: number;
  orderPriceMinTickSize: number;
}

export async function fetchPolymarketMarkets(
  limit: number = 100,
  offset: number = 0
): Promise<PolymarketMarket[]> {
  try {
    const url = `https://gamma-api.polymarket.com/markets?limit=${limit}&offset=${offset}&closed=false`;
    
    console.log(`📡 Fetching markets from Polymarket (limit: ${limit})...`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Polymarket API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Fetched ${data.length} markets from Polymarket`);
    
    return data;
    
  } catch (error: any) {
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
  // Parse outcomes and prices
  const yesPrice = market.outcomePrices && market.outcomePrices[0] 
    ? parseFloat(market.outcomePrices[0]) 
    : 0.5;
  
  const noPrice = market.outcomePrices && market.outcomePrices[1]
    ? parseFloat(market.outcomePrices[1])
    : 1 - yesPrice;
  
  // Parse volume
  const volume = parseFloat(market.volume || '0');
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
    liquidity: parseFloat(market.liquidity || '0'),
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

