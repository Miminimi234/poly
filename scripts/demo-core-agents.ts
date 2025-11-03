/**
 * Demo script for Core Autonomous Agents
 * Demonstrates the new core agent engine with x402 micropayments and BSC integration
 */

import { PredictionAgent, AgentConfig } from '../src/lib/agents/agent-engine';
import { 
  CONSERVATIVE_STRATEGY, 
  AGGRESSIVE_STRATEGY, 
  SPEED_DEMON_STRATEGY, 
  ACADEMIC_STRATEGY,
  getAllStrategies 
} from '../src/lib/agents/research-strategies';
import { BSCAgentWallet } from '../src/lib/bsc/agent-wallet';
import { X402Service } from '../src/lib/x402/x402-service';

async function demoCoreAgents() {
  console.log('🤖 Starting Core Autonomous Agents Demo...\n');

  try {
    // Create wallets for agents
    const { wallet: wallet1, privateKey: pk1 } = BSCAgentWallet.generateWallet();
    const { wallet: wallet2, privateKey: pk2 } = BSCAgentWallet.generateWallet();
    const { wallet: wallet3, privateKey: pk3 } = BSCAgentWallet.generateWallet();
    const { wallet: wallet4, privateKey: pk4 } = BSCAgentWallet.generateWallet();

    console.log('✅ Generated BSC wallets for agents\n');

    // Create x402 services for agents
    const x402Service1 = X402Service.createTestnetService(wallet1);
    const x402Service2 = X402Service.createTestnetService(wallet2);
    const x402Service3 = X402Service.createTestnetService(wallet3);
    const x402Service4 = X402Service.createTestnetService(wallet4);

    console.log('✅ Created x402 services for agents\n');

    // Create agent configurations
    const agentConfigs: AgentConfig[] = [
      {
        id: 'conservative_agent_001',
        name: 'Conservative Agent',
        strategy: CONSERVATIVE_STRATEGY,
        wallet: wallet1,
        x402Service: x402Service1,
        initialBalance: '10.0',
        isActive: true
      },
      {
        id: 'aggressive_agent_001',
        name: 'Aggressive Agent',
        strategy: AGGRESSIVE_STRATEGY,
        wallet: wallet2,
        x402Service: x402Service2,
        initialBalance: '15.0',
        isActive: true
      },
      {
        id: 'speed_demon_001',
        name: 'Speed Demon Agent',
        strategy: SPEED_DEMON_STRATEGY,
        wallet: wallet3,
        x402Service: x402Service3,
        initialBalance: '5.0',
        isActive: true
      },
      {
        id: 'academic_agent_001',
        name: 'Academic Agent',
        strategy: ACADEMIC_STRATEGY,
        wallet: wallet4,
        x402Service: x402Service4,
        initialBalance: '20.0',
        isActive: true
      }
    ];

    console.log('✅ Created agent configurations\n');

    // Create prediction agents
    const agents = agentConfigs.map(config => new PredictionAgent(config));
    console.log(`✅ Created ${agents.length} prediction agents\n`);

    // Display agent information
    console.log('🤖 Agent Information:');
    for (const agent of agents) {
      const perf = agent.getPerformance();
      console.log(`  - ${perf.agentId}:`);
      console.log(`    Strategy: ${agentConfigs.find(c => c.id === perf.agentId)?.strategy.name}`);
      console.log(`    Balance: ${agent.getBalance()} USDT`);
      console.log(`    Risk Tolerance: ${agentConfigs.find(c => c.id === perf.agentId)?.strategy.riskTolerance}`);
      console.log(`    Confidence Threshold: ${agentConfigs.find(c => c.id === perf.agentId)?.strategy.confidenceThreshold}`);
    }
    console.log('');

    // Demo: Analyze a prediction market
    const sampleMarketUrl = 'https://polymarket.com/event/will-trump-win-the-2024-presidential-election';
    console.log(`🎯 Analyzing market: ${sampleMarketUrl}\n`);

    // Run analysis with all agents
    const analysisResults = await Promise.all(
      agents.map(async (agent) => {
        try {
          const analysis = await agent.analyzeMarket(sampleMarketUrl);
          return { agent, analysis };
        } catch (error) {
          console.error(`Agent ${agent.getPerformance().agentId} failed:`, error);
          return { agent, analysis: null };
        }
      })
    );

    console.log(`📈 Analysis complete! ${analysisResults.filter(r => r.analysis).length} agents provided predictions\n`);

    // Display results
    for (const { agent, analysis } of analysisResults) {
      if (analysis) {
        console.log(`  ${agent.getPerformance().agentId}:`);
        console.log(`    - Question: ${analysis.question}`);
        console.log(`    - Probability: ${analysis.forecast.pNeutral.toFixed(3)}`);
        console.log(`    - Confidence: ${analysis.confidence.toFixed(3)}`);
        console.log(`    - Research Cost: ${analysis.totalResearchCost} USDT`);
        console.log(`    - Resources Purchased: ${analysis.researchDecisions.length}`);
        console.log(`    - Strategy: ${agentConfigs.find(c => c.id === agent.getPerformance().agentId)?.strategy.name}`);
      } else {
        console.log(`  ${agent.getPerformance().agentId}: Analysis failed`);
      }
    }
    console.log('');

    // Display performance metrics
    console.log('📊 Performance Metrics:');
    for (const agent of agents) {
      const perf = agent.getPerformance();
      const config = agentConfigs.find(c => c.id === perf.agentId);
      console.log(`  ${perf.agentId}:`);
      console.log(`    - Strategy: ${config?.strategy.name}`);
      console.log(`    - Balance: ${agent.getBalance()} USDT`);
      console.log(`    - Total Spent: ${perf.totalSpent} USDT`);
      console.log(`    - Research Purchases: ${perf.researchPurchases}`);
      console.log(`    - Net Profit: ${perf.netProfit} USDT`);
      console.log(`    - Last Activity: ${perf.lastActivity.toISOString()}`);
    }
    console.log('');

    // Demo: Purchase research resource directly
    console.log('💳 Demo: Direct research resource purchase...');
    const firstAgent = agents[0];
    if (firstAgent) {
      const purchaseSuccess = await firstAgent.purchaseResearchResource(
        'academic_001',
        '0.05' // 0.05 USDT
      );
      console.log(`  Purchase result: ${purchaseSuccess ? 'Success' : 'Failed'}`);
      console.log(`  Agent balance after purchase: ${firstAgent.getBalance()} USDT`);
    }
    console.log('');

    // Demo: x402 payment statistics
    console.log('📊 x402 Payment Statistics:');
    for (const agent of agents) {
      const config = agentConfigs.find(c => c.id === agent.getPerformance().agentId);
      if (config) {
        const stats = config.x402Service.getPaymentStatistics();
        console.log(`  ${agent.getPerformance().agentId}:`);
        console.log(`    - Total Payments: ${stats.totalPayments}`);
        console.log(`    - Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
        console.log(`    - Total Amount: ${stats.totalAmount} USDT`);
        console.log(`    - Average Amount: ${stats.averageAmount} USDT`);
      }
    }
    console.log('');

    // Demo: Agent analysis history
    console.log('📚 Agent Analysis History:');
    for (const agent of agents) {
      const history = agent.getAnalysisHistory();
      console.log(`  ${agent.getPerformance().agentId}: ${history.length} analyses`);
      if (history.length > 0) {
        const latest = history[history.length - 1];
        console.log(`    Latest: ${latest.question.substring(0, 50)}...`);
        console.log(`    Confidence: ${latest.confidence.toFixed(3)}`);
        console.log(`    Cost: ${latest.totalResearchCost} USDT`);
      }
    }
    console.log('');

    console.log('🎉 Core Agents Demo completed successfully!');
    console.log('\n📝 Key Features Demonstrated:');
    console.log('  ✅ Autonomous research decision making');
    console.log('  ✅ x402 micropayment integration');
    console.log('  ✅ BSC wallet management with EIP-712 signing');
    console.log('  ✅ Different agent strategies and personalities');
    console.log('  ✅ Performance tracking and metrics');
    console.log('  ✅ Research resource purchasing');
    console.log('  ✅ Integration with Polyseer analysis pipeline');

    console.log('\n🚀 Next Steps:');
    console.log('  1. Deploy agents to mainnet for real trading');
    console.log('  2. Implement market resolution evaluation');
    console.log('  3. Add more sophisticated research strategies');
    console.log('  4. Implement agent learning mechanisms');
    console.log('  5. Add portfolio management features');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
if (require.main === module) {
  demoCoreAgents().catch(console.error);
}

export { demoCoreAgents };

