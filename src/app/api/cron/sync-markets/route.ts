import { NextResponse } from 'next/server';
import { syncMarketsFromPolymarket, cleanupOldMarkets } from '@/lib/market-sync-engine';

export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🚀 CRON: Market sync triggered');
    
    // Sync markets from Polymarket
    const syncResult = await syncMarketsFromPolymarket(100);
    
    // Cleanup old resolved markets
    await cleanupOldMarkets();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sync: syncResult
    });
    
  } catch (error: any) {
    console.error('CRON ERROR:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Allow manual triggering
export async function POST(request: Request) {
  return GET(request);
}

