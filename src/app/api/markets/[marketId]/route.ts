import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { marketId: string } }
) {
  try {
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

