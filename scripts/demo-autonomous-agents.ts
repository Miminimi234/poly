/**
 * Demo script for Autonomous Agents
 * Demonstrates how to create and run autonomous AI agents with  micropayments
 */

import { AgentFactory } from '../src/lib/agents/agent-factory';
import { AutonomousAgentEngine } from '../src/lib/agents/autonomous-agent-engine';

async function demoAutonomousAgents() {
  console.log('🤖 Starting Autonomous Agents Demo...\n');

  try {
    // Create agent factory for testnet
    const factory = AgentFactory.createTestnetFactory();
    console.log('✅ Created agent factory for testnet\n');

    // Create a competitive environment with multiple strategies
    const agents = await factory.createCompetitiveEnvironment('demo', 2);
    console.log(`✅ Created ${agents.length} agents across 4 strategies\n`);

    // Create agent engine
    const engine = new AutonomousAgentEngine();
    console.log('✅ Created autonomous agent engine\n');

    // Add all agents to the engine
    for (const agentConfig of agents) {
      await engine.addAgent(agentConfig);
    }
    console.log(`✅ Added ${agents.length} agents to the engine\n`);

    // Get active agents
    const activeAgents = engine.getActiveAgents();
    console.log(`📊 Active agents: ${activeAgents.length}\n`);

    // Display agent information
    console.log('🤖 Agent Information:');
    for (const agent of activeAgents) {
      const perf = agent.getPerformance();
      console.log(`  - ${perf.agentId}: Balance ${agent.getBalance()} USDT, Strategy: ${agent.getPerformance().agentId.split('_')[1]}`);
    }
    console.log('');

    // Demo: Analyze a prediction market (using a sample Polymarket URL)
    const sampleMarketUrl = 'https://polymarket.com/event/will-trump-win-the-2024-presidential-election';
    console.log(`🎯 Analyzing market: ${sampleMarketUrl}\n`);

    // Run analysis with all agents
    const results = await engine.analyzeMarketWithAllAgents(sampleMarketUrl);
    console.log(`📈 Analysis complete! ${results.size} agents provided predictions\n`);

    // Display results
    for (const [agentId, forecast] of results) {
      console.log(`  ${agentId}:`);
      console.log(`    - Probability: ${forecast.pNeutral.toFixed(3)}`);
      console.log(`    - Confidence: ${forecast.pAware ? forecast.pAware.toFixed(3) : 'N/A'}`);
      console.log(`    - Drivers: ${forecast.drivers.slice(0, 3).join(', ')}...`);
    }
    console.log('');

    // Evaluate all agents
    await engine.evaluateAllAgents();
    console.log('✅ Agent evaluation complete\n');

    // Display performance summary
    const performanceSummary = engine.getPerformanceSummary();
    console.log('📊 Performance Summary:');
    for (const perf of performanceSummary) {
      console.log(`  ${perf.agentId}:`);
      console.log(`    - Predictions: ${perf.totalPredictions}`);
      console.log(`    - Accuracy: ${(perf.accuracy * 100).toFixed(1)}%`);
      console.log(`    - Net Profit: ${perf.netProfit} USDT`);
      console.log(`    - ROI: ${(perf.roi * 100).toFixed(1)}%`);
    }
    console.log('');

    // Demo: Purchase research resource
    console.log('💳 Demo: Purchasing research resource...');
    const firstAgent = activeAgents[0];
    if (firstAgent) {
      const purchaseSuccess = await firstAgent.purchaseResearchResource(
        'research_data_001',
        '0.01' // 0.01 USDT
      );
      console.log(`  Purchase result: ${purchaseSuccess ? 'Success' : 'Failed'}`);
      console.log(`  Agent balance after purchase: ${firstAgent.getBalance()} USDT`);
    }
    console.log('');

    console.log('🎉 Demo completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('  1. Deploy agents to mainnet for real trading');
    console.log('  2. Implement market resolution evaluation');
    console.log('  3. Add more sophisticated strategies');
    console.log('  4. Implement agent learning mechanisms');
    console.log('  5. Add risk management features');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
if (require.main === module) {
  demoAutonomousAgents().catch(console.error);
}

export { demoAutonomousAgents };

