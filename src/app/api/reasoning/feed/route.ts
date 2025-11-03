import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Fetch recent predictions from celebrity agents
    const { data: predictions, error } = await supabase
      .from('agent_predictions')
      .select(`
        id,
        prediction,
        confidence,
        reasoning,
        created_at,
        market_id,
        market_question,
        agents!inner (
          id,
          name,
          is_celebrity,
          celebrity_model,
          traits
        )
      `)
      .eq('agents.is_celebrity', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    // Format predictions for the feed
    const formattedPredictions = (predictions || []).map((pred: any) => {
      const agent = pred.agents;
      const traits = agent.traits || {};
      
      return {
        id: pred.id,
        agent_name: agent.name,
        agent_avatar: traits.avatar || '🤖',
        agent_color: traits.color || 'gray',
        celebrity_model: agent.celebrity_model,
        market_question: pred.market_question,
        market_id: pred.market_id,
        prediction: pred.prediction,
        confidence: pred.confidence,
        reasoning: pred.reasoning,
        created_at: pred.created_at
      };
    });
    
    return NextResponse.json({
      success: true,
      predictions: formattedPredictions
    });
    
  } catch (error: any) {
    console.error('Error fetching reasoning feed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

