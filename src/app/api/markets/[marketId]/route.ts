import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: any }
) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables for /api/markets/[marketId]');
      return NextResponse.json(
        { success: false, error: 'Database not configured. Set SUPABASE environment variables.' },
        { status: 500 }
      );
    }

    const supabase = createServiceClient();
    const params = await Promise.resolve(context.params);
    const { marketId } = params;

    const { data: market, error } = await supabase
      .from('polymarket_markets')
      .select('*')
      .eq('polymarket_id', marketId)
      .single();

    if (error) throw error;

    if (!market) {
      return NextResponse.json(
        { success: false, error: 'Market not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      market
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
