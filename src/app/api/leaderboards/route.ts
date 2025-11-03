import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const metric = searchParams.get('metric') || 'accuracy';
  const limit = parseInt(searchParams.get('limit') || '10');
  
  try {
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
      console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
      return NextResponse.json({
        success: true,
        metric,
        leaderboard: [],
        message: 'Database not configured. Set SUPABASE environment variables.'
      });
    }
    
    const supabase = createServiceClient();
    let orderBy = 'accuracy';
    if (metric === 'roi') orderBy = 'roi';
    if (metric === 'profit') orderBy = 'total_profit_loss';
    if (metric === 'predictions') orderBy = 'total_predictions';
    
    // Get agents with at least 1 resolved prediction
    const { data: agents, error } = await supabase
      .from('agents')
      .select(`
        id,
        name,
        strategy_type,
        accuracy,
        roi,
        total_profit_loss,
        total_predictions,
        current_balance_usdt
      `)
      .order(orderBy, { ascending: false, nullsFirst: false })
      .limit(limit);
    
    if (error) {
      console.error('Supabase error:', error);
      
      // If accuracy column doesn't exist, return empty leaderboard
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        return NextResponse.json({
          success: true,
          metric,
          leaderboard: [],
          message: 'Database migration needed. Run: supabase db push'
        });
      }
      
      throw error;
    }
    
    // Filter out agents with no accuracy data
    const filteredAgents = (agents || []).filter(agent => 
      agent.accuracy !== null && agent.accuracy !== undefined
    );
    
    // Get prediction count for each agent
    const agentsWithStats = await Promise.all(
      filteredAgents.map(async (agent) => {
        const { data: predictions } = await supabase
          .from('agent_predictions')
          .select('correct')
          .eq('agent_id', agent.id)
          .not('correct', 'is', null);
        
        const resolvedPredictions = predictions?.length || 0;
        const correctPredictions = predictions?.filter(p => p.correct).length || 0;
        
        return {
          ...agent,
          resolved_predictions: resolvedPredictions,
          correct_predictions: correctPredictions
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      metric,
      leaderboard: agentsWithStats
    });
    
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
