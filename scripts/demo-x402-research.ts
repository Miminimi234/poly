/**
 * Demo script for x402-enabled Research Endpoints
 * Demonstrates the pay-per-use research economy where agents purchase research resources
 */

import { AgentConfig, PredictionAgent } from '../src/lib/agents/agent-engine';
import { CONSERVATIVE_STRATEGY } from '../src/lib/agents/research-strategies';
import { BSCAgentWallet } from '../src/lib/bsc/agent-wallet';
import { X402Service } from '../src/lib/x402/x402-service';

// Allow Node-style `require`/`module` checks in these demo scripts without
// adding @types/node to the build. These demos run in Node contexts only.
declare const require: any;
declare const module: any;

async function demoX402Research() {
  console.log('🔬 Starting x402 Research Endpoints Demo...\n');

  try {
    // Create wallet and x402 service
    const { wallet, privateKey } = BSCAgentWallet.generateWallet();
    const x402Service = X402Service.createTestnetService(wallet);

    console.log('✅ Created BSC wallet and x402 service\n');

    // Create agent
    const agentConfig: AgentConfig = {
      id: 'research_demo_agent',
      name: 'Research Demo Agent',
      strategy: CONSERVATIVE_STRATEGY,
      wallet: wallet,
      x402Service: x402Service,
      initialBalance: '5.0', // 5 USDT for testing
      isActive: true
    };

    const agent = new PredictionAgent(agentConfig);
    console.log('✅ Created prediction agent\n');

    // Test 1: Get research marketplace
    console.log('📋 Testing Research Marketplace...');
    try {
      const marketplaceResponse = await fetch('http://localhost:3000/api/research/marketplace');
      const marketplace = await marketplaceResponse.json();

      console.log('Available Research Resources:');
      marketplace.marketplace.resources.forEach((resource: any) => {
        console.log(`  - ${resource.name}: ${resource.price} ${resource.currency} (${resource.type}, ${resource.quality})`);
      });
      console.log('');
    } catch (error) {
      console.log('Marketplace not available (server not running)');
    }

    // Test 2: Test x402 payment flow for Valyu Web Search
    console.log('🔍 Testing Valyu Web Search with x402 payment...');
    try {
      if (typeof (agent as any).purchaseResearchResource === 'function') {
        const webSearchResult = await (agent as any).purchaseResearchResource(
          'valyu-web',
          'AI regulation impact on financial services',
          { startDate: '2024-01-01' }
        );

        if (webSearchResult.success) {
          console.log('✅ Web search successful!');
          console.log(`  Results: ${webSearchResult.data?.results?.length || 0}`);
          console.log(`  Cost: $${webSearchResult.data?.totalCost || 0}`);
          console.log(`  Agent Balance: ${agent.getBalance()} USDT`);
        } else {
          console.log(`❌ Web search failed: ${webSearchResult.error}`);
        }
      } else {
        console.warn('Agent does not expose purchaseResearchResource; skipping web search test');
      }
    } catch (error) {
      console.log('Web search test skipped (server not running)');
    }
    console.log('');

    // Test 3: Test Academic Papers
    console.log('📚 Testing Academic Papers with x402 payment...');
    try {
      if (typeof (agent as any).purchaseResearchResource === 'function') {
        const academicResult = await (agent as any).purchaseResearchResource(
          'valyu-academic',
          'machine learning applications in healthcare',
          { startDate: '2024-01-01' }
        );

        if (academicResult.success) {
          console.log('✅ Academic search successful!');
          console.log(`  Results: ${academicResult.data?.results?.length || 0}`);
          console.log(`  Cost: $${academicResult.data?.totalCost || 0}`);
          console.log(`  Agent Balance: ${agent.getBalance()} USDT`);
        } else {
          console.log(`❌ Academic search failed: ${academicResult.error}`);
        }
      } else {
        console.warn('Agent does not expose purchaseResearchResource; skipping academic test');
      }
    } catch (error) {
      console.log('Academic search test skipped (server not running)');
    }
    console.log('');

    // Test 4: Test News Feeds
    console.log('📰 Testing News Feeds with x402 payment...');
    try {
      if (typeof (agent as any).purchaseResearchResource === 'function') {
        const newsResult = await (agent as any).purchaseResearchResource(
          'news-feeds',
          'breaking news about cryptocurrency regulation',
          { startDate: '2024-01-01' }
        );

        if (newsResult.success) {
          console.log('✅ News search successful!');
          console.log(`  Results: ${newsResult.data?.results?.length || 0}`);
          console.log(`  Cost: $${newsResult.data?.totalCost || 0}`);
          console.log(`  Agent Balance: ${agent.getBalance()} USDT`);
        } else {
          console.log(`❌ News search failed: ${newsResult.error}`);
        }
      } else {
        console.warn('Agent does not expose purchaseResearchResource; skipping news test');
      }
    } catch (error) {
      console.log('News search test skipped (server not running)');
    }
    console.log('');

    // Test 5: Test Expert Analysis
    console.log('👨‍💼 Testing Expert Analysis with x402 payment...');
    try {
      if (typeof (agent as any).purchaseResearchResource === 'function') {
        const expertResult = await (agent as any).purchaseResearchResource(
          'expert-analysis',
          'economic impact of AI on employment',
          { expertType: 'economic', startDate: '2024-01-01' }
        );

        if (expertResult.success) {
          console.log('✅ Expert analysis successful!');
          console.log(`  Results: ${expertResult.data?.results?.length || 0}`);
          console.log(`  Cost: $${expertResult.data?.totalCost || 0}`);
          console.log(`  Agent Balance: ${agent.getBalance()} USDT`);
        } else {
          console.log(`❌ Expert analysis failed: ${expertResult.error}`);
        }
      } else {
        console.warn('Agent does not expose purchaseResearchResource; skipping expert test');
      }
    } catch (error) {
      console.log('Expert analysis test skipped (server not running)');
    }
    console.log('');

    // Test 6: Test Sentiment Analysis
    console.log('😊 Testing Sentiment Analysis with x402 payment...');
    try {
      if (typeof (agent as any).purchaseResearchResource === 'function') {
        const sentimentResult = await (agent as any).purchaseResearchResource(
          'sentiment',
          'public opinion on electric vehicles',
          { platform: 'twitter', startDate: '2024-01-01' }
        );

        if (sentimentResult.success) {
          console.log('✅ Sentiment analysis successful!');
          console.log(`  Results: ${sentimentResult.data?.results?.length || 0}`);
          console.log(`  Sentiment Score: ${sentimentResult.data?.sentimentAnalysis?.score || 0}`);
          console.log(`  Cost: $${sentimentResult.data?.totalCost || 0}`);
          console.log(`  Agent Balance: ${agent.getBalance()} USDT`);
        } else {
          console.log(`❌ Sentiment analysis failed: ${sentimentResult.error}`);
        }
      } else {
        console.warn('Agent does not expose purchaseResearchResource; skipping sentiment test');
      }
    } catch (error) {
      console.log('Sentiment analysis test skipped (server not running)');
    }
    console.log('');

    // Test 7: Test HTTP 402 Payment Required flow
    console.log('💳 Testing HTTP 402 Payment Required flow...');
    try {
      const response = await fetch('http://localhost:3000/api/research/valyu-web', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'test query without payment'
        })
      });

      if (response.status === 402) {
        console.log('✅ HTTP 402 Payment Required response received');
        const errorData = await response.json();
        console.log(`  Message: ${errorData.message}`);
        console.log(`  Required Amount: ${errorData.paymentRequest.amount} ${errorData.paymentRequest.currency}`);
      } else {
        console.log(`❌ Expected 402 status, got ${response.status}`);
      }
    } catch (error) {
      console.log('HTTP 402 test skipped (server not running)');
    }
    console.log('');

    // Display agent performance
    console.log('📊 Agent Performance Summary:');
    const performance = agent.getPerformance();
    console.log(`  Agent ID: ${performance.agentId}`);
    console.log(`  Balance: ${agent.getBalance()} USDT`);
    console.log(`  Total Spent: ${performance.totalSpent} USDT`);
    console.log(`  Research Purchases: ${performance.researchPurchases}`);
    console.log(`  Net Profit: ${performance.netProfit} USDT`);
    console.log('');

    // Display x402 service statistics
    console.log('📈 x402 Service Statistics:');
    const stats = x402Service.getPaymentStatistics();
    console.log(`  Total Payments: ${stats.totalPayments}`);
    console.log(`  Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`  Total Amount: ${stats.totalAmount} USDT`);
    console.log(`  Average Amount: ${stats.averageAmount} USDT`);
    console.log('');

    console.log('🎉 x402 Research Endpoints Demo completed!');
    console.log('\n📝 Key Features Demonstrated:');
    console.log('  ✅ HTTP 402 "Payment Required" protocol');
    console.log('  ✅ x402 micropayment verification');
    console.log('  ✅ Valyu research integration');
    console.log('  ✅ Multiple research resource types');
    console.log('  ✅ Agent autonomous purchasing decisions');
    console.log('  ✅ Research marketplace discovery');
    console.log('  ✅ Payment tracking and statistics');

    console.log('\n🚀 Next Steps:');
    console.log('  1. Start the development server: npm run dev');
    console.log('  2. Test the research endpoints with real payments');
    console.log('  3. Deploy to testnet for live testing');
    console.log('  4. Add more research resource types');
    console.log('  5. Implement advanced payment strategies');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
if (require.main === module) {
  demoX402Research().catch(console.error);
}

export { demoX402Research };

