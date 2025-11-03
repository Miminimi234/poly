import { syncMarketsFromPolymarket } from '../src/lib/db/markets';

async function main() {
  console.log('🌱 SYNCING MARKETS FROM POLYMARKET\n');
  
  const result = await syncMarketsFromPolymarket();
  
  if (result.success) {
    console.log('\n✅ SUCCESS!');
    console.log(`   Added: ${result.added}`);
    console.log(`   Updated: ${result.updated}\n`);
  } else {
    console.error('\n❌ FAILED:', result.error);
    process.exit(1);
  }
}

main();

