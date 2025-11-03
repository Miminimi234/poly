import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;
    
    // Get agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();
    
    if (agentError) throw agentError;
    
    // Get resolved predictions
    const { data: predictions, error: predError } = await supabase
      .from('agent_predictions')
      .select('correct, profit_loss')
      .eq('agent_id', agentId)
      .not('correct', 'is', null);
    
    if (predError) throw predError;
    
    const resolvedPredictions = predictions?.length || 0;
    const correctPredictions = predictions?.filter(p => p.correct).length || 0;
    const accuracy = resolvedPredictions > 0 
      ? (correctPredictions / resolvedPredictions) * 100 
      : 0;
    
    const totalProfitLoss = predictions?.reduce(
      (sum, p) => sum + (p.profit_loss || 0),
      0
    ) || 0;
    
    const roi = resolvedPredictions > 0
      ? (totalProfitLoss / (resolvedPredictions * 10)) * 100
      : 0;
    
    return NextResponse.json({
      success: true,
      stats: {
        accuracy: accuracy.toFixed(2),
        roi: roi.toFixed(2),
        total_profit_loss: totalProfitLoss,
        resolved_predictions: resolvedPredictions,
        correct_predictions: correctPredictions
      }
    });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

