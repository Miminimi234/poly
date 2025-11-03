import { NextResponse } from 'next/server';
import { checkResolvedMarkets, syncMarketData } from '@/lib/market-resolution';

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('Starting resolution check...');
    
    // 1. Sync latest market data
    await syncMarketData();
    
    // 2. Check for resolved markets
    await checkResolvedMarkets();
    
    return NextResponse.json({
      success: true,
      message: 'Resolution check completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Resolution check error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// For manual triggering
export async function POST(request: Request) {
  try {
    console.log('Manual resolution check triggered');
    await syncMarketData();
    await checkResolvedMarkets();
    
    return NextResponse.json({
      success: true,
      message: 'Resolution check completed'
    });
    
  } catch (error: any) {
    console.error('Manual resolution check error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

