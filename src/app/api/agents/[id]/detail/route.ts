import { NextResponse, NextRequest } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: true,
        agent: null,
        predictions: [],
        transactions: [],
        parents: [],
        offspring: [],
        performanceData: [],
        categoryBreakdown: {}
      });
    }
    
  const supabase = createServiceClient();
  const agentId = context.params.id;
    
    // Get agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();
    
    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }
    
    // Get predictions
    const { data: predictions, error: predError } = await supabase
      .from('agent_predictions')
      .select(`
        *,
        polymarket_markets (
          question,
          market_slug,
          end_date
        )
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    
    if (predError) {
      console.error('Error fetching predictions:', predError);
    }
    
    // Get transactions
    const { data: transactions, error: txError } = await supabase
      .from('agent_transactions')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (txError) {
      console.error('Error fetching transactions:', txError);
    }
    
    // Get parents if offspring
    let parents = null;
    if (agent.parent1_id && agent.parent2_id) {
      const { data: parentData, error: parentError } = await supabase
        .from('agents')
        .select('id, name, strategy_type, accuracy, generation')
        .in('id', [agent.parent1_id, agent.parent2_id]);
      
      if (!parentError) {
        parents = parentData;
      }
    }
    
    // Get offspring if parent
    const { data: offspring, error: offspringError } = await supabase
      .from('agents')
      .select('id, name, strategy_type, accuracy, generation')
      .or(`parent1_id.eq.${agentId},parent2_id.eq.${agentId}`);
    
    if (offspringError) {
      console.error('Error fetching offspring:', offspringError);
    }
    
    // Calculate performance over time
    const performanceData = calculatePerformanceOverTime(predictions || []);
    
    // Calculate category breakdown
    const categoryBreakdown = calculateCategoryBreakdown(predictions || []);
    
    return NextResponse.json({
      success: true,
      agent,
      predictions: predictions || [],
      transactions: transactions || [],
      parents: parents || [],
      offspring: offspring || [],
      performanceData,
      categoryBreakdown
    });
    
  } catch (error: any) {
    console.error('Error fetching agent detail:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function calculatePerformanceOverTime(predictions: any[]) {
  const resolved = predictions
    .filter(p => p.outcome !== null && p.resolved_at)
    .sort((a, b) => new Date(a.resolved_at).getTime() - new Date(b.resolved_at).getTime());
  
  let runningCorrect = 0;
  let runningTotal = 0;
  let runningProfit = 0;
  
  return resolved.map(pred => {
    runningTotal++;
    if (pred.correct) runningCorrect++;
    runningProfit += (pred.profit_loss || 0);
    
    return {
      date: new Date(pred.resolved_at).toLocaleDateString(),
      accuracy: ((runningCorrect / runningTotal) * 100).toFixed(1),
      predictions: runningTotal,
      profitLoss: runningProfit.toFixed(2)
    };
  });
}

function calculateCategoryBreakdown(predictions: any[]) {
  // Group predictions by market question keywords (simple categorization)
  const categories: any = {
    politics: 0,
    crypto: 0,
    sports: 0,
    tech: 0,
    other: 0
  };
  
  predictions.forEach(pred => {
    const question = pred.polymarket_markets?.question?.toLowerCase() || '';
    
    if (question.includes('election') || question.includes('president') || question.includes('trump') || question.includes('biden')) {
      categories.politics++;
    } else if (question.includes('bitcoin') || question.includes('btc') || question.includes('crypto') || question.includes('eth')) {
      categories.crypto++;
    } else if (question.includes('nba') || question.includes('nfl') || question.includes('soccer') || question.includes('game')) {
      categories.sports++;
    } else if (question.includes('ai') || question.includes('tech') || question.includes('apple') || question.includes('google')) {
      categories.tech++;
    } else {
      categories.other++;
    }
  });
  
  return categories;
}

