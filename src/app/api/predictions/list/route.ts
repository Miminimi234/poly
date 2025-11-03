import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: true,
        predictions: [],
        total: 0,
        message: 'Database not configured'
      });
    }
    
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const agentId = searchParams.get('agentId');
    const marketId = searchParams.get('marketId');
    const prediction = searchParams.get('prediction'); // YES/NO
    const outcome = searchParams.get('outcome'); // YES/NO
    const resolved = searchParams.get('resolved'); // true/false
    const correct = searchParams.get('correct'); // true/false
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query
    let query = supabase
      .from('agent_predictions')
      .select(`
        *,
        agents (
          id,
          name,
          strategy_type,
          generation
        ),
        polymarket_markets (
          id,
          question,
          market_slug,
          end_date,
          yes_price,
          no_price,
          resolved,
          outcome
        )
      `, { count: 'exact' });
    
    // Apply filters
    if (agentId) query = query.eq('agent_id', agentId);
    if (marketId) query = query.eq('market_id', marketId);
    if (prediction) query = query.eq('prediction', prediction);
    if (outcome) query = query.eq('outcome', outcome);
    if (resolved === 'true') query = query.not('outcome', 'is', null);
    if (resolved === 'false') query = query.is('outcome', null);
    if (correct === 'true') query = query.eq('correct', true);
    if (correct === 'false') query = query.eq('correct', false);
    
    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data: predictions, error, count } = await query;
    
    if (error) {
      console.error('Error fetching predictions:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        predictions: [],
        total: 0
      });
    }
    
    return NextResponse.json({
      success: true,
      predictions: predictions || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit
    });
    
  } catch (error: any) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        predictions: [],
        total: 0
      },
      { status: 500 }
    );
  }
}

