import { NextResponse } from 'next/server';
import { getAllMarkets } from '@/lib/db/markets';

export async function GET() {
  try {
    const markets = getAllMarkets();
    
    return NextResponse.json({
      success: true,
      count: markets.length,
      markets
    });
  } catch (error: any) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
