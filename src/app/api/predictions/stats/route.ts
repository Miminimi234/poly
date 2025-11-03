import { NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: true,
        stats: {
          total: 0,
          resolved: 0,
          unresolved: 0,
          correct: 0,
          incorrect: 0,
          accuracy: '0.00',
          yesPredictions: 0,
          noPredictions: 0,
          totalResearchCost: '0.00',
          totalProfitLoss: '0.00',
          avgConfidence: '0.0',
          currentStreak: 0,
          longestStreak: 0
        }
      });
    }
    
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    
    // Base query
    let query = supabase
      .from('agent_predictions')
      .select('*');
    
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }
    
    const { data: predictions, error } = await query;
    
    if (error) throw error;
    
    // Calculate stats
    const total = predictions?.length || 0;
    const resolved = predictions?.filter(p => p.outcome !== null).length || 0;
    const unresolved = total - resolved;
    const correct = predictions?.filter(p => p.correct === true).length || 0;
    const incorrect = predictions?.filter(p => p.correct === false).length || 0;
    const accuracy = resolved > 0 ? (correct / resolved) * 100 : 0;
    
    const yesPredictions = predictions?.filter(p => p.prediction === 'YES').length || 0;
    const noPredictions = predictions?.filter(p => p.prediction === 'NO').length || 0;
    
    const totalResearchCost = predictions?.reduce((sum, p) => sum + (p.research_cost || 0), 0) || 0;
    const totalProfitLoss = predictions?.reduce((sum, p) => sum + (p.profit_loss || 0), 0) || 0;
    
    const avgConfidence = total > 0 
      ? (predictions?.reduce((sum, p) => sum + (p.confidence || 0), 0) || 0) / total 
      : 0;
    
    // Win streak calculation
    const resolvedPredictions = predictions
      ?.filter(p => p.outcome !== null)
      .sort((a, b) => new Date(b.resolved_at || 0).getTime() - new Date(a.resolved_at || 0).getTime()) || [];
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < resolvedPredictions.length; i++) {
      const pred = resolvedPredictions[i];
      if (pred.correct) {
        tempStreak++;
        if (i === 0 || currentStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        if (i === 0 || tempStreak === currentStreak) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }
    
    return NextResponse.json({
      success: true,
      stats: {
        total,
        resolved,
        unresolved,
        correct,
        incorrect,
        accuracy: accuracy.toFixed(2),
        yesPredictions,
        noPredictions,
        totalResearchCost: totalResearchCost.toFixed(2),
        totalProfitLoss: totalProfitLoss.toFixed(2),
        avgConfidence: (avgConfidence * 100).toFixed(1),
        currentStreak,
        longestStreak
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching prediction stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

