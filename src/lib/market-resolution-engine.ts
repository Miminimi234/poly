import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/utils/supabase/server';

let cachedSupabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Database not configured. Set SUPABASE environment variables.');
  }

  if (!cachedSupabase) {
    cachedSupabase = createServiceClient();
  }

  return cachedSupabase;
}

export async function runMarketResolutionCycle() {
  console.log('🎲 Starting market resolution cycle...');
  
  try {
    const supabase = getSupabase();

    // 1. Get unresolved markets from our DB
    const { data: markets, error: marketsError } = await supabase
      .from('polymarket_markets')
      .select('*')
      .eq('resolved', false)
      .lte('end_date', new Date().toISOString());
    
    if (marketsError) throw marketsError;
    
    if (!markets || markets.length === 0) {
      console.log('✅ No markets to resolve');
      return { success: true, resolved: 0 };
    }
    
    console.log(`📊 Found ${markets.length} markets past end date`);
    
    let resolvedCount = 0;
    
    // 2. Check each market on Polymarket
    for (const market of markets) {
      try {
        // Fetch latest market data from Polymarket
        const polyResponse = await fetch(
          `https://gamma-api.polymarket.com/markets/${market.polymarket_id}`
        );
        
        if (!polyResponse.ok) {
          console.log(`⚠️  Could not fetch market ${market.market_slug}`);
          continue;
        }
        
        const polyData = await polyResponse.json();
        
        // Check if resolved
        if (polyData.closed && polyData.outcome) {
          console.log(`🎯 Resolving market: "${market.question.slice(0, 50)}..."`);
          console.log(`   Outcome: ${polyData.outcome}`);
          
          // Map Polymarket outcome to YES/NO
          const outcome = mapPolymarketOutcome(polyData.outcome);
          
          // 3. Update market in DB
          await supabase
            .from('polymarket_markets')
            .update({
              resolved: true,
              outcome: outcome,
              resolved_at: new Date().toISOString()
            })
            .eq('id', market.id);
          
          // 4. Update all predictions for this market
          await updatePredictionResults(supabase, market.id, outcome);
          
          resolvedCount++;
        }
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        console.error(`❌ Error resolving market ${market.market_slug}:`, error.message);
      }
    }
    
    console.log(`\n✅ Resolution cycle complete! Resolved ${resolvedCount} markets`);
    
    return {
      success: true,
      resolved: resolvedCount
    };
    
  } catch (error: any) {
    console.error('❌ Fatal error in resolution cycle:', error);
    return { success: false, error: error.message };
  }
}

function mapPolymarketOutcome(outcome: string): 'YES' | 'NO' {
  // Polymarket can have various outcome formats
  const outcomeUpper = outcome.toUpperCase();
  
  if (outcomeUpper.includes('YES') || outcomeUpper === '1' || outcomeUpper === 'TRUE') {
    return 'YES';
  }
  
  return 'NO';
}

async function updatePredictionResults(
  supabase: SupabaseClient,
  marketId: string,
  outcome: 'YES' | 'NO'
) {
  try {
    // Get all predictions for this market
    const { data: predictions, error } = await supabase
      .from('agent_predictions')
      .select('*')
      .eq('market_id', marketId)
      .is('outcome', null);
    
    if (error) throw error;
    
    if (!predictions || predictions.length === 0) {
      console.log('   No predictions to update');
      return;
    }
    
    console.log(`   Updating ${predictions.length} predictions...`);
    
    for (const pred of predictions) {
      const correct = pred.prediction === outcome;
      
      // Calculate profit/loss (simplified: 2x research cost if correct, lose research cost if wrong)
      const profitLoss = correct ? pred.research_cost * 2 : -pred.research_cost;
      
      // Update prediction
      await supabase
        .from('agent_predictions')
        .update({
          outcome: outcome,
          correct: correct,
          profit_loss: profitLoss,
          resolved_at: new Date().toISOString()
        })
        .eq('id', pred.id);
      
      // Update agent stats
      await updateAgentStats(supabase, pred.agent_id);
      
      console.log(`   ${correct ? '✅' : '❌'} Agent prediction: ${pred.prediction}`);
    }
    
  } catch (error) {
    console.error('❌ Error updating predictions:', error);
  }
}

async function updateAgentStats(supabase: SupabaseClient, agentId: string) {
  try {
    // Get all resolved predictions for this agent
    const { data: predictions, error } = await supabase
      .from('agent_predictions')
      .select('correct, profit_loss')
      .eq('agent_id', agentId)
      .not('outcome', 'is', null);
    
    if (error) throw error;
    if (!predictions || predictions.length === 0) return;
    
    // Calculate stats
    const totalResolved = predictions.length;
    const correctPredictions = predictions.filter(p => p.correct).length;
    const accuracy = (correctPredictions / totalResolved) * 100;
    
    const totalProfitLoss = predictions.reduce((sum, p) => sum + (p.profit_loss || 0), 0);
    
    // Get agent to calculate ROI
    const { data: agent } = await supabase
      .from('agents')
      .select('initial_balance, earned, balance')
      .eq('id', agentId)
      .single();
    
    const earned = (agent?.earned || 0) + (totalProfitLoss > 0 ? totalProfitLoss : 0);
    const roi = agent?.initial_balance ? ((totalProfitLoss / agent.initial_balance) * 100) : 0;
    
    // Update balance with profit/loss
    const newBalance = (agent?.balance || 0) + totalProfitLoss;
    
    // Update agent
    await supabase
      .from('agents')
      .update({
        accuracy: accuracy,
        total_profit_loss: totalProfitLoss,
        earned: earned,
        roi: roi,
        balance: newBalance
      })
      .eq('id', agentId);
    
  } catch (error) {
    console.error('❌ Error updating agent stats:', error);
  }
}
