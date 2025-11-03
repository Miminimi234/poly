import { NextResponse } from 'next/server';
import { runBankruptcyCheck } from '@/lib/bankruptcy-check-engine';

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🚀 CRON: Bankruptcy check triggered');
    
    const result = await runBankruptcyCheck();
    
    // Spread result first so we don't accidentally duplicate keys TypeScript knows about
    const responsePayload = {
      ...result,
      timestamp: new Date().toISOString(),
      // prefer result.success if present, otherwise default to true
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

