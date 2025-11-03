import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Fetch predictions for an agent
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('agent_predictions')
      .select(`
        *,
        polymarket_markets (
          question,
          market_slug,
          end_date
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      predictions: data || []
    });
    
  } catch (error: any) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Save a new prediction
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      agentId,
      marketId,
      prediction,
      confidence,
      reasoning,
      priceAtPrediction,
      researchCost,
      researchSources
    } = body;
    
    // Validate required fields
    if (!agentId || !marketId || !prediction) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // First, ensure the market exists in our database
    const { error: marketError } = await supabase
      .from('polymarket_markets')
      .upsert({
        id: marketId,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (marketError) {
      console.warn('Market upsert warning:', marketError);
    }
    
    // Insert prediction
    const { data, error } = await supabase
      .from('agent_predictions')
      .insert({
        agent_id: agentId,
        market_id: marketId,
        prediction,
        confidence,
        reasoning,
        price_at_prediction: priceAtPrediction,
        research_cost: researchCost,
        research_sources: researchSources
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update agent's total predictions count
    const { error: updateError } = await supabase
      .rpc('increment_agent_predictions', { agent_id: agentId });
    
    if (updateError) {
      console.warn('Failed to increment prediction count:', updateError);
    }
    
    return NextResponse.json({
      success: true,
      prediction: data
    });
    
  } catch (error: any) {
    console.error('Error saving prediction:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

