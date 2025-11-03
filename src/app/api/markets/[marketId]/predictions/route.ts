import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  context: { params: any }
) {
  try {
    const params = await Promise.resolve(context.params);
    const { marketId } = params;

    // First get the market to get its internal ID
    const { data: market, error: marketError } = await supabase
      .from('polymarket_markets')
      .select('id')
      .eq('polymarket_id', marketId)
      .single();

    if (marketError) throw marketError;

    if (!market) {
      return NextResponse.json({
        success: true,
        predictions: []
      });
    }

    // Get predictions for this market with agent info
    const { data: predictions, error: predError } = await supabase
      .from('agent_predictions')
      .select(`
        id,
        agent_id,
        prediction,
        confidence,
        reasoning,
        created_at,
        agents (
          name,
          is_celebrity,
          celebrity_model,
          traits
        )
      `)
      .eq('market_id', market.id)
      .order('created_at', { ascending: false });

    if (predError) throw predError;

    // Format predictions with agent info
    const formattedPredictions = predictions?.map(pred => {
      const agent = pred.agents as any;
      const traits = agent?.traits || {};

      return {
        id: pred.id,
        agent_id: pred.agent_id,
        agent_name: agent?.name || 'Unknown Agent',
        agent_avatar: traits.avatar || '🤖',
        agent_model: agent?.celebrity_model || 'Custom Agent',
        prediction: pred.prediction,
        confidence: pred.confidence,
        reasoning: pred.reasoning,
        created_at: pred.created_at
      };
    }) || [];

    return NextResponse.json({
      success: true,
      predictions: formattedPredictions
    });

  } catch (error: any) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

