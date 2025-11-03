# Autonomous AI Agents for Polyseer

This document describes the autonomous AI agent system that extends Polyseer's Bayesian analysis capabilities with x402 micropayments on Binance Smart Chain (BSC).

## Overview

The autonomous agent system allows AI agents to:
- Autonomously purchase research data using x402 micropayments
- Compete in prediction markets based on accuracy and profitability
- Use different strategies (Conservative, Aggressive, Speed Demon, Balanced)
- Go bankrupt if they spend more than they earn

## Architecture

### Core Components

1. **AutonomousAgentEngine** (`src/lib/agents/autonomous-agent-engine.ts`)
   - Manages multiple autonomous agents
   - Coordinates market analysis across agents
   - Tracks performance and handles bankruptcy

2. **AgentFactory** (`src/lib/agents/agent-factory.ts`)
   - Creates and configures new agents
   - Sets up BSC wallets and x402 clients
   - Manages different agent strategies

3. **x402 Integration** (`src/lib/x402/`)
   - Implements HTTP 402 "Payment Required" protocol
   - Handles micropayments for research resources
   - Manages payment requests and responses

4. **BSC Integration** (`src/lib/bsc/`)
   - Manages Binance Smart Chain wallets
   - Handles USDT/USDC transactions
   - Provides low-cost micropayment infrastructure

## Agent Strategies

### Conservative
- **Risk Tolerance**: Low (0.2)
- **Research Budget**: 0.1 USDT
- **Prediction Threshold**: 0.8 (high confidence)
- **Speed**: Thorough analysis
- **Best For**: High-stakes, long-term predictions

### Aggressive
- **Risk Tolerance**: High (0.8)
- **Research Budget**: 0.3 USDT
- **Prediction Threshold**: 0.6 (lower confidence)
- **Speed**: Fast analysis
- **Best For**: High-volume, short-term predictions

### Speed Demon
- **Risk Tolerance**: Very High (0.9)
- **Research Budget**: 0.05 USDT
- **Prediction Threshold**: 0.5 (minimal confidence)
- **Speed**: Ultra-fast analysis
- **Best For**: Rapid-fire, low-cost predictions

### Balanced
- **Risk Tolerance**: Medium (0.5)
- **Research Budget**: 0.2 USDT
- **Prediction Threshold**: 0.7 (moderate confidence)
- **Speed**: Balanced approach
- **Best For**: General-purpose predictions

## Usage

### Basic Setup

```typescript
import { AutonomousAgentEngine } from './src/lib/agents/autonomous-agent-engine';
import { AgentFactory } from './src/lib/agents/agent-factory';

// Create agent factory for testnet
const factory = AgentFactory.createTestnetFactory();

// Create a competitive environment
const agents = await factory.createCompetitiveEnvironment('my_agents', 2);

// Create agent engine
const engine = new AutonomousAgentEngine();

// Add agents to engine
for (const agentConfig of agents) {
  await engine.addAgent(agentConfig);
}
```

### Running Market Analysis

```typescript
// Analyze a prediction market with all agents
const marketUrl = 'https://polymarket.com/event/sample-market';
const results = await engine.analyzeMarketWithAllAgents(marketUrl);

// Display results
for (const [agentId, forecast] of results) {
  console.log(`${agentId}: ${forecast.pNeutral.toFixed(3)} probability`);
}
```

### Purchasing Research Resources

```typescript
const agent = engine.getActiveAgents()[0];
const success = await agent.purchaseResearchResource(
  'research_data_001',
  '0.01' // 0.01 USDT
);
```

## Configuration

### Environment Variables

```bash
# BSC Configuration
BSC_NETWORK=testnet  # or mainnet
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_PRIVATE_KEY=your_private_key_here

# x402 Configuration
X402_DEFAULT_CURRENCY=USDT
X402_MAX_PAYMENT=1.0
X402_MIN_PAYMENT=0.001
```

### Agent Configuration

```typescript
const agentConfig: AgentConfig = {
  id: 'agent_001',
  name: 'My Agent',
  strategy: {
    name: 'Conservative',
    riskTolerance: 0.2,
    researchBudget: 0.1,
    predictionThreshold: 0.8,
    speedPreference: 'thorough'
  },
  wallet: bscWallet,
  x402Client: x402Client,
  initialBalance: '10.0',
  isActive: true
};
```

## Performance Tracking

Each agent tracks:
- **Total Predictions**: Number of predictions made
- **Correct Predictions**: Number of correct predictions
- **Total Spent**: Amount spent on research and analysis
- **Total Earned**: Amount earned from correct predictions
- **Accuracy**: Percentage of correct predictions
- **ROI**: Return on investment
- **Net Profit**: Total earned minus total spent

## Bankruptcy System

Agents go bankrupt when:
- Their total spending exceeds their total earnings
- Their balance reaches zero
- They cannot afford necessary research resources

Bankrupt agents are automatically deactivated and removed from active trading.

## Demo

Run the demo script to see the system in action:

```bash
npm run demo:agents
# or
tsx scripts/demo-autonomous-agents.ts
```

## Security Considerations

1. **Private Keys**: Store private keys securely using environment variables
2. **Network**: Use testnet for development and testing
3. **Balances**: Monitor agent balances to prevent unexpected spending
4. **Rate Limiting**: Implement rate limiting for API calls
5. **Validation**: Validate all payment requests before processing

## Future Enhancements

1. **Machine Learning**: Add learning mechanisms for strategy optimization
2. **Risk Management**: Implement advanced risk management features
3. **Market Making**: Add market making capabilities
4. **Portfolio Management**: Implement portfolio diversification
5. **Social Features**: Add agent collaboration and competition features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project extends Polyseer and follows the same license terms.
