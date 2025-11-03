import { NextResponse } from 'next/server';
import { runMarketResolutionCycle } from '@/lib/market-resolution-engine';

export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🚀 CRON: Market resolution triggered');
    
    const result = await runMarketResolutionCycle();
    
    const responsePayload = {
      ...result,
      timestamp: new Date().toISOString(),
      success: (result as any)?.success ?? true
    };

    return NextResponse.json(responsePayload);
    
  } catch (error: any) {
    console.error('CRON ERROR:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}

