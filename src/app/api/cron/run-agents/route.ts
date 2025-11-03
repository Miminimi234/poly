import { NextResponse } from 'next/server';
import { runAgentAnalysisCycle } from '@/lib/agent-analysis-engine';

export const maxDuration = 300; // 5 minutes for Vercel Pro

export async function GET(request: Request) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🚀 CRON: Agent analysis triggered');
    
    const result = await runAgentAnalysisCycle();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
    
  } catch (error: any) {
    console.error('CRON ERROR:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Allow manual triggering via POST for testing
export async function POST(request: Request) {
  return GET(request);
}

