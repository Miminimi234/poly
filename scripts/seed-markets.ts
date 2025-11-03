import { syncMarketsFromPolymarket } from '../src/lib/market-sync-engine';

async function seedMarkets() {
  console.log('🌱 SEEDING MARKETS FROM POLYMARKET\n');
  console.log('This will fetch the top 100 trending markets and add them to your database.\n');
  
  try {
    // Fetch and sync 100 markets
    const result = await syncMarketsFromPolymarket(100);
    
    if (result.success) {
      console.log('\n✅ MARKET SEEDING COMPLETE!');
      console.log(`\n📊 Results:`);
      console.log(`   - ${result.added} new markets added`);
      console.log(`   - ${result.updated} markets updated`);
      console.log(`   - ${result.skipped} markets skipped`);
      console.log(`   - ${result.errors} errors\n`);
      
      if (result.added === 0) {
        console.log('💡 Tip: If no markets were added, they might already exist in your database.');
        console.log('   Markets will be updated with current prices instead.\n');
      }
    } else {
      console.error('\n❌ SEEDING FAILED:', result.error);
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error.message);
    process.exit(1);
  }
}

seedMarkets();

