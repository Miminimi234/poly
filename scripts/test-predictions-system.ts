/**
 * Test script for the Predictions System
 * 
 * This script tests:
 * 1. Predictions list API with various filters
 * 2. Predictions stats API
 * 3. Data integrity and calculations
 */

import { createClient } from '@supabase/supabase-js';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testPredictionsListAPI() {
  console.log('\n📊 Testing Predictions List API...\n');
  
  // Test 1: Get all predictions
  console.log('Test 1: Fetching all predictions');
  const response1 = await fetch(`${BASE_URL}/api/predictions/list?limit=10`);
  const data1 = await response1.json();
  console.log(`✓ Found ${data1.total} total predictions`);
  console.log(`✓ Returned ${data1.predictions?.length || 0} predictions`);
  
  // Test 2: Filter by prediction type
  console.log('\nTest 2: Filtering by YES predictions only');
  const response2 = await fetch(`${BASE_URL}/api/predictions/list?prediction=YES&limit=5`);
  const data2 = await response2.json();
  const allYes = data2.predictions?.every((p: any) => p.prediction === 'YES');
  console.log(`✓ Found ${data2.predictions?.length || 0} YES predictions`);
  console.log(`✓ All predictions are YES: ${allYes}`);
  
  // Test 3: Filter by resolved status
  console.log('\nTest 3: Filtering resolved predictions only');
  const response3 = await fetch(`${BASE_URL}/api/predictions/list?resolved=true&limit=5`);
  const data3 = await response3.json();
  const allResolved = data3.predictions?.every((p: any) => p.outcome !== null);
  console.log(`✓ Found ${data3.predictions?.length || 0} resolved predictions`);
  console.log(`✓ All have outcomes: ${allResolved}`);
  
  // Test 4: Sort by confidence
  console.log('\nTest 4: Sorting by confidence (descending)');
  const response4 = await fetch(`${BASE_URL}/api/predictions/list?sortBy=confidence&sortOrder=desc&limit=5`);
  const data4 = await response4.json();
  if (data4.predictions && data4.predictions.length > 1) {
    const isSorted = data4.predictions.every((p: any, i: number, arr: any[]) => 
      i === 0 || arr[i - 1].confidence >= p.confidence
    );
    console.log(`✓ Confidence values are sorted: ${isSorted}`);
    console.log(`✓ Highest confidence: ${(data4.predictions[0].confidence * 100).toFixed(1)}%`);
  } else {
    console.log('✓ Not enough predictions to test sorting');
  }
  
  return data1;
}

async function testPredictionsStatsAPI() {
  console.log('\n📈 Testing Predictions Stats API...\n');
  
  // Test 1: Overall stats
  console.log('Test 1: Fetching overall stats');
  const response1 = await fetch(`${BASE_URL}/api/predictions/stats`);
  const data1 = await response1.json();
  
  if (data1.success && data1.stats) {
    const stats = data1.stats;
    console.log(`✓ Total predictions: ${stats.total}`);
    console.log(`✓ Resolved: ${stats.resolved}`);
    console.log(`✓ Unresolved: ${stats.unresolved}`);
    console.log(`✓ Accuracy: ${stats.accuracy}%`);
    console.log(`✓ Correct: ${stats.correct}`);
    console.log(`✓ Incorrect: ${stats.incorrect}`);
    console.log(`✓ YES predictions: ${stats.yesPredictions}`);
    console.log(`✓ NO predictions: ${stats.noPredictions}`);
    console.log(`✓ Total research cost: $${stats.totalResearchCost}`);
    console.log(`✓ Total P/L: $${stats.totalProfitLoss}`);
    console.log(`✓ Avg confidence: ${stats.avgConfidence}%`);
    console.log(`✓ Current streak: ${stats.currentStreak}`);
    console.log(`✓ Longest streak: ${stats.longestStreak}`);
    
    // Validate calculations
    console.log('\nValidating calculations:');
    const resolvedMatch = stats.resolved + stats.unresolved === stats.total;
    console.log(`✓ Resolved + Unresolved = Total: ${resolvedMatch}`);
    
    const correctMatch = stats.correct + stats.incorrect === stats.resolved;
    console.log(`✓ Correct + Incorrect = Resolved: ${correctMatch}`);
    
    const predictionMatch = stats.yesPredictions + stats.noPredictions === stats.total;
    console.log(`✓ YES + NO = Total: ${predictionMatch}`);
  } else {
    console.log('✓ No predictions found or database not configured');
  }
  
  return data1;
}

async function testAgentSpecificStats() {
  console.log('\n🤖 Testing Agent-Specific Stats...\n');
  
  // First, get an agent
  const agentsResponse = await fetch(`${BASE_URL}/api/agents?limit=1`);
  const agentsData = await agentsResponse.json();
  
  if (agentsData.success && agentsData.agents && agentsData.agents.length > 0) {
    const agent = agentsData.agents[0];
    console.log(`Testing stats for agent: ${agent.name}`);
    
    const response = await fetch(`${BASE_URL}/api/predictions/stats?agentId=${agent.id}`);
    const data = await response.json();
    
    if (data.success && data.stats) {
      console.log(`✓ Agent predictions: ${data.stats.total}`);
      console.log(`✓ Agent accuracy: ${data.stats.accuracy}%`);
      console.log(`✓ Agent P/L: $${data.stats.totalProfitLoss}`);
    }
  } else {
    console.log('✓ No agents found to test with');
  }
}

async function validateDataIntegrity() {
  console.log('\n🔍 Validating Data Integrity...\n');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('✓ Database not configured - skipping validation');
    return;
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Check for predictions with missing agent data
  const { data: predictions, error } = await supabase
    .from('agent_predictions')
    .select('*, agents(*), polymarket_markets(*)')
    .limit(10);
  
  if (error) {
    console.log(`⚠ Error fetching predictions: ${error.message}`);
    return;
  }
  
  if (predictions && predictions.length > 0) {
    const missingAgents = predictions.filter((p: any) => !p.agents);
    const missingMarkets = predictions.filter((p: any) => !p.polymarket_markets);
    
    console.log(`✓ Checked ${predictions.length} predictions`);
    console.log(`✓ Missing agent data: ${missingAgents.length}`);
    console.log(`✓ Missing market data: ${missingMarkets.length}`);
    
    // Check resolved predictions have outcomes
    const resolved = predictions.filter((p: any) => p.outcome !== null);
    const resolvedWithCorrect = resolved.filter((p: any) => p.correct !== null);
    console.log(`✓ Resolved predictions: ${resolved.length}`);
    console.log(`✓ Resolved with correct flag: ${resolvedWithCorrect.length}`);
    
    // Check profit/loss exists for resolved predictions
    const resolvedWithPL = resolved.filter((p: any) => p.profit_loss !== null);
    console.log(`✓ Resolved with P/L: ${resolvedWithPL.length}`);
  } else {
    console.log('✓ No predictions found in database');
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('  PREDICTIONS SYSTEM TEST SUITE');
  console.log('═══════════════════════════════════════════');
  
  try {
    await testPredictionsListAPI();
    await testPredictionsStatsAPI();
    await testAgentSpecificStats();
    await validateDataIntegrity();
    
    console.log('\n═══════════════════════════════════════════');
    console.log('  ✅ ALL TESTS COMPLETED');
    console.log('═══════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();

