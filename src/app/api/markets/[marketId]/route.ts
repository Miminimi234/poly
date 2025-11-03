import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

  try {
export async function GET(
  request: NextRequest,
  context: { params: any }
) {
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

