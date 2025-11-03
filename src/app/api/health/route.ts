import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    database: false,
    polymarket: false,
    anthropic: false
  };
  
  try {
    // Check database
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createServiceClient();
        const { error: dbError } = await supabase
          .from('agents')
          .select('id')
          .limit(1);
        checks.database = !dbError;
      } catch (e) {
        checks.database = false;
      }
    }
    
    // Check Polymarket API
    try {
      const polyResponse = await fetch('https://gamma-api.polymarket.com/markets?limit=1', {
        next: { revalidate: 60 }
      });
      checks.polymarket = polyResponse.ok;
    } catch (e) {
      checks.polymarket = false;
    }
    
    // Check if Anthropic API key exists
    checks.anthropic = !!process.env.ANTHROPIC_API_KEY;
    
    const allHealthy = checks.database && checks.polymarket && checks.anthropic;
    
    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      checks
    }, {
      status: allHealthy ? 200 : 503
    });
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      checks,
      error: error.message
    }, {
      status: 503
    });
  }
}

