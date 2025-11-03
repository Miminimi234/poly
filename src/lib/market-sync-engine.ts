import { createClient } from '@supabase/supabase-js';
import { fetchPolymarketMarkets, parsePolymarketMarket } from './polymarket-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function syncMarketsFromPolymarket(limit: number = 100) {
  console.log('🔄 Starting market sync from Polymarket...\n');
  
  try {
    // 1. Fetch markets from Polymarket
    const polymarkets = await fetchPolymarketMarkets(limit);
    
    if (polymarkets.length === 0) {
      console.log('⚠️  No markets returned from Polymarket');
      return { success: false, message: 'No markets found' };
    }
    
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // 2. Process each market
    for (const polymarket of polymarkets) {
      try {
        // Skip if archived or invalid
        if (polymarket.archived || !polymarket.question) {
          skippedCount++;
          continue;
        }
        
        // Skip if already closed
        if (polymarket.closed) {
          skippedCount++;
          continue;
        }
        
        // Skip if end date has passed
        if (polymarket.endDate && new Date(polymarket.endDate) < new Date()) {
          skippedCount++;
          continue;
        }
        
        // Parse market data
        const marketData = parsePolymarketMarket(polymarket);
        
        // Check if market already exists in our DB
        const { data: existing, error: checkError } = await supabase
          .from('polymarket_markets')
          .select('id, polymarket_id, yes_price, volume')
          .eq('polymarket_id', marketData.polymarket_id)
          .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        
        if (existing) {
          // Market exists - update prices and volume
          const { error: updateError } = await supabase
            .from('polymarket_markets')
            .update({
              yes_price: marketData.yes_price,
              no_price: marketData.no_price,
              volume: marketData.volume,
              volume_24hr: marketData.volume_24hr,
              liquidity: marketData.liquidity,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
          
          if (updateError) {
            console.error(`❌ Failed to update ${marketData.question.slice(0, 50)}...`);
            errorCount++;
          } else {
            updatedCount++;
            console.log(`🔄 Updated: ${marketData.question.slice(0, 60)}...`);
          }
          
        } else {
          // New market - insert
          const { error: insertError } = await supabase
            .from('polymarket_markets')
            .insert({
              ...marketData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error(`❌ Failed to insert ${marketData.question.slice(0, 50)}...`);
            console.error(insertError);
            errorCount++;
          } else {
            addedCount++;
            console.log(`✅ Added: ${marketData.question.slice(0, 60)}...`);
          }
        }
        
        // Rate limiting - small delay between inserts
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        console.error(`❌ Error processing market:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Sync Summary:');
    console.log(`   Added: ${addedCount}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total processed: ${polymarkets.length}\n`);
    
    return {
      success: true,
      added: addedCount,
      updated: updatedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: polymarkets.length
    };
    
  } catch (error: any) {
    console.error('❌ Fatal error in market sync:', error);
    return { success: false, error: error.message };
  }
}

export async function cleanupOldMarkets() {
  console.log('🧹 Cleaning up old resolved markets...');
  
  try {
    // Delete resolved markets older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data, error } = await supabase
      .from('polymarket_markets')
      .delete()
      .eq('resolved', true)
      .lt('resolved_at', thirtyDaysAgo.toISOString());
    
    if (error) throw error;
    
    console.log('✅ Cleaned up old markets');
    
  } catch (error: any) {
    console.error('❌ Error cleaning up markets:', error.message);
  }
}

