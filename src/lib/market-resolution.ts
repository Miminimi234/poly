import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ResolvedMarket {
  id: string;
  outcome: 'YES' | 'NO';
  finalPrice: number;
}

export async function checkResolvedMarkets(): Promise<void> {
  try {
    console.log('Checking for resolved markets...');
    
    // 1. Get all unresolved markets from our database
    const { data: unresolvedMarkets, error } = await supabase
      .from('polymarket_markets')
      .select('*')
      .eq('resolved', false);
    
    if (error) throw error;
    if (!unresolvedMarkets || unresolvedMarkets.length === 0) {
      console.log('No unresolved markets to check');
      return;
    }
    
    console.log(`Checking ${unresolvedMarkets.length} unresolved markets...`);
    
    // 2. Check each market for resolution
    for (const market of unresolvedMarkets) {
      try {
        // Fetch latest market data from Polymarket
        const response = await fetch(
          `https://gamma-api.polymarket.com/markets/${market.id}`
        );
        
        if (!response.ok) continue;
        
        const liveMarket = await response.json();
        
        // Check if market is closed and has a clear winner
        if (liveMarket.closed) {
          const outcomePrices = JSON.parse(liveMarket.outcomePrices || '[]');
          const yesPrice = outcomePrices[0] || 0;
          const noPrice = outcomePrices[1] || 0;
          
          // Market resolved if one outcome is at 1.0 (100%) or 0.0 (0%)
          let outcome: 'YES' | 'NO' | null = null;
          
          if (yesPrice >= 0.99) {
            outcome = 'YES';
          } else if (noPrice >= 0.99 || yesPrice <= 0.01) {
            outcome = 'NO';
          }
          
          if (outcome) {
            console.log(`Market "${market.question}" resolved to ${outcome}`);
            await resolveMarket(market.id, outcome, yesPrice);
          }
        }
      } catch (error) {
        console.error(`Error checking market ${market.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error in checkResolvedMarkets:', error);
  }
}

async function resolveMarket(
  marketId: string,
  outcome: 'YES' | 'NO',
  finalPrice: number
): Promise<void> {
  try {
    // 1. Update market as resolved
    await supabase
      .from('polymarket_markets')
      .update({
        resolved: true,
        outcome,
        last_updated: new Date().toISOString()
      })
      .eq('id', marketId);
    
    // 2. Get all predictions for this market
    const { data: predictions, error } = await supabase
      .from('agent_predictions')
      .select('*')
      .eq('market_id', marketId)
      .is('outcome', null); // Only unresolved predictions
    
    if (error) throw error;
    if (!predictions || predictions.length === 0) return;
    
    console.log(`Resolving ${predictions.length} predictions for market ${marketId}`);
    
    // 3. Update each prediction
    for (const pred of predictions) {
      const correct = pred.prediction === outcome;
      
      // Calculate theoretical profit/loss
      const betAmount = 10.0; // Theoretical $10 bet
      let profitLoss = 0;
      
      if (correct) {
        // Won the bet
        const pricePaid = pred.price_at_prediction || 0.5;
        profitLoss = betAmount * (1 / pricePaid - 1);
      } else {
        // Lost the bet
        profitLoss = -betAmount;
      }
      
      // Subtract research cost
      profitLoss -= (pred.research_cost || 0);
      
      // Update prediction
      await supabase
        .from('agent_predictions')
        .update({
          outcome,
          correct,
          profit_loss: profitLoss,
          resolved_at: new Date().toISOString()
        })
        .eq('id', pred.id);
      
      // Update agent stats
      await updateAgentStats(pred.agent_id);
    }
    
  } catch (error) {
    console.error(`Error resolving market ${marketId}:`, error);
  }
}

async function updateAgentStats(agentId: string): Promise<void> {
  try {
    // Get all resolved predictions for this agent
    const { data: predictions, error } = await supabase
      .from('agent_predictions')
      .select('correct, profit_loss')
      .eq('agent_id', agentId)
      .not('correct', 'is', null);
    
    if (error) throw error;
    if (!predictions || predictions.length === 0) return;
    
    // Calculate accuracy
    const correctPredictions = predictions.filter(p => p.correct).length;
    const totalPredictions = predictions.length;
    const accuracy = (correctPredictions / totalPredictions) * 100;
    
    // Calculate total profit/loss
    const totalProfitLoss = predictions.reduce(
      (sum, p) => sum + (p.profit_loss || 0),
      0
    );
    
    // Calculate ROI (return on investment)
    const totalInvested = totalPredictions * 10; // $10 per prediction
    const roi = (totalProfitLoss / totalInvested) * 100;
    
    // Update agent stats
    await supabase
      .from('agents')
      .update({
        accuracy: accuracy.toFixed(2),
        total_profit_loss: totalProfitLoss.toFixed(2),
        roi: roi.toFixed(2)
      })
      .eq('id', agentId);
    
    console.log(`Updated stats for agent ${agentId}: ${accuracy.toFixed(1)}% accuracy, $${totalProfitLoss.toFixed(2)} P/L`);
    
  } catch (error) {
    console.error(`Error updating agent stats for ${agentId}:`, error);
  }
}

export async function syncMarketData(): Promise<void> {
  try {
    // Fetch latest markets from Polymarket
    const response = await fetch(
      'https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=50'
    );
    
    if (!response.ok) throw new Error('Failed to fetch markets');
    
    const markets = await response.json();
    
    // Upsert markets into our database
    for (const market of markets) {
      const outcomePrices = JSON.parse(market.outcomePrices || '["0.5", "0.5"]');
      
      await supabase
        .from('polymarket_markets')
        .upsert({
          id: market.id,
          question: market.question,
          description: market.description || '',
          yes_price: parseFloat(outcomePrices[0]),
          no_price: parseFloat(outcomePrices[1]),
          volume: parseFloat(market.volume || '0'),
          liquidity: parseFloat(market.liquidity || '0'),
          end_date: market.endDate,
          market_slug: market.marketSlug,
          resolved: market.closed,
          last_updated: new Date().toISOString()
        })
        .select();
    }
    
    console.log(`Synced ${markets.length} markets to database`);
    
  } catch (error) {
    console.error('Error syncing market data:', error);
  }
}

