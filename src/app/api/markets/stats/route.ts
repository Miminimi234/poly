import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: markets, error } = await supabase
      .from('polymarket_markets')
      .select('resolved, volume');
    
    if (error) throw error;
    
    const total = markets?.length || 0;
    const active = markets?.filter(m => !m.resolved).length || 0;
    const resolved = markets?.filter(m => m.resolved).length || 0;
    const avgVolume = total > 0 
      ? markets?.reduce((sum, m) => sum + (m.volume || 0), 0) / total 
      : 0;
    
    return NextResponse.json({
      success: true,
      stats: {
        total,
        active,
        resolved,
        avgVolume: Math.round(avgVolume)
      }
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

