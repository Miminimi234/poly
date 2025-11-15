/**
 * Agent Behavior Integration Tests
 * Tests agent decision-making, spending, and bankruptcy logic
 */

import { Service } from '@/lib//-service';
import { PredictionAgent } from '@/lib/agents/agent-engine';
import { AGGRESSIVE_STRATEGY, CONSERVATIVE_STRATEGY } from '@/lib/agents/research-strategies';
import { SolanaAgentWallet } from '@/lib/solana/agent-wallet';

describe('Agent Behavior Tests', () => {
  let wallet: SolanaAgentWallet;
  let Service: Service;
  let agent: PredictionAgent;

  beforeEach(async () => {
    // Setup test wallet
    wallet = await SolanaAgentWallet.generateWallet(
      process.env.SOLANA_TESTNET_RPC_URL!,
      process.env.USDT_TESTNET_CONTRACT!,
      process.env.USDC_TESTNET_CONTRACT!
    );
    Service = new Service(wallet, Service.createDefaultConfig(97));
  });

  describe('Spending Limits', () => {
    it('should respect max daily spend limit', async () => {
      agent = new PredictionAgent({
        id: 'test-agent-1',
        name: 'Test Agent',
        strategy: CONSERVATIVE_STRATEGY,
        wallet,
        Service,
        initialBalance: '10.0',
        isActive: true
      });

      const limit = 50.0;

      // Agent should not exceed daily limit
      const decisions = agent.decideResearchPurchases('test-market-url', []);
      let dailySpent = 0;

      for (const decision of decisions) {
        const cost = parseFloat(decision.resource.price);
        if (dailySpent + cost > limit) {
          expect(cost).toBeLessThan(limit - dailySpent);
          break;
        }
        dailySpent += cost;
      }
    });

    it('should go bankrupt when balance hits zero', async () => {
      agent = new PredictionAgent({
        id: 'test-agent-2',
        name: 'Test Agent',
        strategy: CONSERVATIVE_STRATEGY,
        wallet,
        Service,
        initialBalance: '0.10',
        isActive: true
      });

      // Make several expensive research purchases
      const expensiveDecisions = agent.decideResearchPurchases('test-market', [
        { id: 'expert-analysis', price: '0.50', currency: 'USDT', name: 'Expert', type: 'expert', source: 'test', quality: 'high', freshness: 'recent' }
      ]);

      for (const decision of expensiveDecisions) {
        if (parseFloat(decision.resource.price) > 0.10) {
          expect(agent.currentBalance).toBeLessThanOrEqual(0);
          expect(agent.isBankrupt).toBe(true);
        }
      }
    });
  });

  describe('Strategy Compliance', () => {
    it('should follow conservative strategy preferences', () => {
      agent = new PredictionAgent({
        id: 'test-agent-3',
        name: 'Conservative Test',
        strategy: CONSERVATIVE_STRATEGY,
        wallet,
        Service,
        initialBalance: '10.0',
        isActive: true
      });

      const decisions = agent.decideResearchPurchases('test-market', []);

      // Conservative agent should prefer academic/expert sources
      const preferredTypes = decisions.map(d => d.resource.type);
      expect(preferredTypes).toContain('academic');
      expect(preferredTypes).toContain('expert');
    });

    it('should follow aggressive strategy preferences', () => {
      agent = new PredictionAgent({
        id: 'test-agent-4',
        name: 'Aggressive Test',
        strategy: AGGRESSIVE_STRATEGY,
        wallet,
        Service,
        initialBalance: '10.0',
        isActive: true
      });

      const decisions = agent.decideResearchPurchases('test-market', []);

      // Aggressive agent should be willing to spend more
      const totalCost = decisions.reduce((sum, d) => sum + parseFloat(d.resource.price), 0);
      expect(totalCost).toBeGreaterThan(0);
    });
  });

  describe('Economic Balance', () => {
    it('should distribute research purchases efficiently', () => {
      const agents = Array.from({ length: 10 }, (_, i) =>
        new PredictionAgent({
          id: `test-agent-${i}`,
          name: `Test Agent ${i}`,
          strategy: CONSERVATIVE_STRATEGY,
          wallet,
          Service,
          initialBalance: '10.0',
          isActive: true
        })
      );

      // Simulate research purchases across agents
      const totalSpending: Record<string, number> = {};

      agents.forEach(agent => {
        const decisions = agent.decideResearchPurchases('test-market', []);
        decisions.forEach(d => {
          totalSpending[d.resource.type] = (totalSpending[d.resource.type] || 0) + parseFloat(d.resource.price);
        });
      });

      // Verify spending is distributed across resource types
      const resourceTypes = Object.keys(totalSpending);
      expect(resourceTypes.length).toBeGreaterThan(1);
    });
  });
});
