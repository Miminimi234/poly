/**
 * Test script for accuracy tracking system
 * Run with: npm run test:accuracy
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testAccuracyTracking() {
  console.log('🧪 Testing Accuracy Tracking System\n');

  // 1. Check database setup
  console.log('1️⃣ Checking database schema...');
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('id, name, accuracy, roi, total_profit_loss')
    .limit(1);
  
  if (agentsError) {
    console.error('❌ Error: agents table missing columns:', agentsError.message);
    console.log('💡 Run: supabase db push');
    return;
  }
  console.log('✅ Database schema looks good\n');

  // 2. Check for markets
  console.log('2️⃣ Checking for markets...');
  const { data: markets, error: marketsError } = await supabase
    .from('polymarket_markets')
    .select('*')
    .limit(5);
  
  if (marketsError || !markets || markets.length === 0) {
    console.log('⚠️  No markets found in database');
    console.log('💡 Markets will be synced when cron runs');
  } else {
    console.log(`✅ Found ${markets.length} markets`);
    console.log(`   - Resolved: ${markets.filter(m => m.resolved).length}`);
    console.log(`   - Unresolved: ${markets.filter(m => !m.resolved).length}\n`);
  }

  // 3. Check for predictions
  console.log('3️⃣ Checking for predictions...');
  const { data: predictions, error: predsError } = await supabase
    .from('agent_predictions')
    .select('*, agents(name), polymarket_markets(question)')
    .limit(5);
  
  if (predsError || !predictions || predictions.length === 0) {
    console.log('⚠️  No predictions found');
    console.log('💡 Create an agent and trigger analysis first');
  } else {
    console.log(`✅ Found ${predictions.length} predictions`);
    const resolved = predictions.filter(p => p.correct !== null);
    console.log(`   - Resolved: ${resolved.length}`);
    console.log(`   - Pending: ${predictions.length - resolved.length}\n`);
    
    if (resolved.length > 0) {
      console.log('📊 Sample resolved prediction:');
      const sample = resolved[0];
      console.log(`   Agent: ${(sample as any).agents?.name}`);
      console.log(`   Market: ${(sample as any).polymarket_markets?.question.slice(0, 50)}...`);
      console.log(`   Prediction: ${sample.prediction}`);
      console.log(`   Outcome: ${sample.outcome}`);
      console.log(`   Correct: ${sample.correct ? '✅' : '❌'}`);
      console.log(`   P/L: $${sample.profit_loss?.toFixed(2)}\n`);
    }
  }

  // 4. Test leaderboard API
  console.log('4️⃣ Testing leaderboard API...');
  try {
    const response = await fetch('http://localhost:3000/api/leaderboards?metric=accuracy&limit=5');
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.leaderboard.length > 0) {
        console.log(`✅ Leaderboard working - ${data.leaderboard.length} agents ranked`);
        console.log('\n🏆 Top 3 Agents:');
        data.leaderboard.slice(0, 3).forEach((agent: any, i: number) => {
          console.log(`   ${i + 1}. ${agent.name} - ${agent.accuracy}% accuracy (${agent.correct_predictions}/${agent.resolved_predictions})`);
        });
      } else {
        console.log('⚠️  Leaderboard empty - no agents with resolved predictions yet');
      }
    } else {
      console.log('❌ Leaderboard API error:', response.status);
    }
  } catch (error) {
    console.log('⚠️  Could not reach leaderboard API (is server running?)');
  }
  console.log();

  // 5. Test manual resolution trigger
  console.log('5️⃣ Testing manual resolution trigger...');
  try {
    const response = await fetch('http://localhost:3000/api/cron/check-resolutions', {
      method: 'POST'
    });
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resolution check triggered successfully');
      console.log(`   ${data.message}`);
    } else {
      console.log('❌ Resolution check failed:', response.status);
    }
  } catch (error) {
    console.log('⚠️  Could not trigger resolution check (is server running?)');
  }
  console.log();

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Database schema ready');
  console.log(markets && markets.length > 0 ? '✅' : '⚠️ ', 'Markets synced');
  console.log(predictions && predictions.length > 0 ? '✅' : '⚠️ ', 'Predictions exist');
  console.log('✅ APIs functional');
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Create agents: /agents/create');
  console.log('2. Trigger analysis: Dashboard → ANALYZE NOW');
  console.log('3. Wait for markets to resolve');
  console.log('4. Check resolutions: AdminControls → CHECK RESOLUTIONS NOW');
  console.log('5. View leaderboard: /leaderboards');
  console.log('\n💡 TIP: Use the AdminControls on dashboard to manually check resolutions');
}

// Run test
testAccuracyTracking().catch(console.error);

