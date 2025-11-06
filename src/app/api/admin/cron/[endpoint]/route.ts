import { NextResponse } from 'next/server';
import { verifyAdminUser } from '@/lib/admin-auth-server';
import { syncMarketsFromPolymarket, cleanupOldMarkets } from '@/lib/market-sync-engine';

export const maxDuration = 300;

/**
 * Admin-protected cron job proxy
 * Routes admin requests to appropriate cron endpoints
 */
export async function POST(
  request: Request,
  context: { params: any }
) {
  try {
    // Verify admin access first
    const { isAdmin, error } = await verifyAdminUser();
    
    if (!isAdmin) {
      console.log('[Admin API] Unauthorized cron access attempt');
      return NextResponse.json(
        { error: error || 'Admin privileges required' },
        { status: 403 }
      );
    }

    const params = await Promise.resolve(context.params);
    const { endpoint } = params;

    console.log(`[Admin API] Admin-authorized cron job: ${endpoint}`);

    // Route to appropriate cron function based on endpoint
    switch (endpoint) {
      case 'sync-markets':
        return await handleSyncMarkets();
      
      case 'run-agents':
        return await handleRunAgents();
      
      case 'resolve-markets':
        return await handleResolveMarkets();
      
      case 'check-bankruptcies':
        return await handleCheckBankruptcies();
      
      default:
        return NextResponse.json(
          { error: `Unknown endpoint: ${endpoint}` },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[Admin API] Cron execution error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function handleSyncMarkets() {
  console.log('[Admin Cron] Starting market sync...');
  
  const syncResult = await syncMarketsFromPolymarket(100);
  await cleanupOldMarkets();
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    sync: syncResult
  });
}

async function handleRunAgents() {
  console.log('[Admin Cron] Starting agent analysis...');
  
  // Call the existing cron endpoint internally
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/run-agents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}

async function handleResolveMarkets() {
  console.log('[Admin Cron] Starting market resolution...');
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/resolve-markets`, {
    method: 'POST',  
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}

async function handleCheckBankruptcies() {
  console.log('[Admin Cron] Starting bankruptcy check...');
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/check-bankruptcies`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}