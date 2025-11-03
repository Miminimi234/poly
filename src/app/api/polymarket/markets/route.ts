import { NextResponse } from 'next/server';

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';

interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  conditionId: string;
  clobTokenIds: string[];
  outcomePrices: number[];
  outcomes: string[];
  volume: string;
  liquidity: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  marketSlug: string;
  icon?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  try {
    const url = `${GAMMA_API_BASE}/markets?active=true&closed=false&archived=false&limit=${limit}&offset=${offset}`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    if (!response.ok) {
      throw new Error(`Polymarket API returned ${response.status}`);
    }
    
    const rawMarkets = await response.json();
    
    // Parse stringified JSON fields and transform data
    const markets: PolymarketMarket[] = rawMarkets.map((market: any) => {
      let clobTokenIds: string[] = [];
      let outcomePrices: number[] = [];
      
      // Parse stringified JSON arrays
      try {
        clobTokenIds = JSON.parse(market.clobTokenIds || '[]');
      } catch (e) {
        console.warn('Failed to parse clobTokenIds:', e);
      }
      
      try {
        outcomePrices = JSON.parse(market.outcomePrices || '[]').map(Number);
      } catch (e) {
        console.warn('Failed to parse outcomePrices:', e);
      }
      
      return {
        id: market.id,
        question: market.question,
        description: market.description || '',
        conditionId: market.conditionId,
        clobTokenIds,
        outcomePrices,
        outcomes: market.outcomes || ['Yes', 'No'],
        volume: market.volume || '0',
        liquidity: market.liquidity || '0',
        endDate: market.endDate,
        active: market.active,
        closed: market.closed,
        marketSlug: market.marketSlug,
        icon: market.icon
      };
    });
    
    return NextResponse.json({
      success: true,
      count: markets.length,
      markets
    });
    
  } catch (error: any) {
    console.error('Polymarket API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch markets from Polymarket',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// Optional: Endpoint to get a specific market by ID
export async function POST(request: Request) {
  try {
    const { marketId } = await request.json();
    
    if (!marketId) {
      return NextResponse.json(
        { success: false, error: 'marketId required' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${GAMMA_API_BASE}/markets/${marketId}`);
    
    if (!response.ok) {
      throw new Error('Market not found');
    }
    
    const market = await response.json();
    
    // Parse stringified fields
    const parsedMarket = {
      ...market,
      clobTokenIds: JSON.parse(market.clobTokenIds || '[]'),
      outcomePrices: JSON.parse(market.outcomePrices || '[]').map(Number)
    };
    
    return NextResponse.json({
      success: true,
      market: parsedMarket
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

