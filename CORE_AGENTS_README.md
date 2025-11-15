# Core Autonomous Agents System

This document describes the core autonomous agent system that extends Polysentience with autonomous decision-making,  micropayments, and Solana blockchain integration.

## Overview

The core agent system consists of four main components:

1. **PredictionAgent** - Main agent class that makes autonomous decisions about research purchases
2. **Research Strategies** - Different agent personalities and research approaches
3. ** Service** - Handles micropayments for research resources
4. **Solana Agent Wallet** - Manages Solana wallets and EIP-712 signing

## Core Components

### 1. PredictionAgent (`src/lib/agents/agent-engine.ts`)

The main agent class that extends Polysentience's research capabilities with autonomous decision-making.

#### Key Features:
- **Autonomous Research Decisions**: Agents decide what research to purchase based on their strategy
- ** Micropayments**: Automatically purchase research resources using  payments
- **Bayesian Analysis**: Uses Polysentience's existing analysis pipeline
- **Performance Tracking**: Tracks accuracy, spending, and profitability
- **Bankruptcy System**: Agents go bankrupt if they spend more than they earn

#### Usage:
```typescript
import { PredictionAgent, AgentConfig } from './src/lib/agents/agent-engine';

const agentConfig: AgentConfig = {
  id: 'agent_001',
  name: 'My Agent',
  strategy: CONSERVATIVE_STRATEGY,
  wallet: bscWallet,
  Service: Service,
  initialBalance: '10.0',
  isActive: true
};

const agent = new PredictionAgent(agentConfig);
const analysis = await agent.analyzeMarket(marketUrl);
```

### 2. Research Strategies (`src/lib/agents/research-strategies.ts`)

Defines different agent personalities and research approaches.

#### Available Strategies:

##### Conservative Strategy
- **Risk Tolerance**: Low (0.2)
- **Confidence Threshold**: High (0.8)
- **Research Budget**: 0.15 USDT max
- **Preferred Sources**: Academic, Expert
- **Speed**: Thorough analysis
- **Best For**: High-stakes, long-term predictions

##### Aggressive Strategy
- **Risk Tolerance**: High (0.8)
- **Confidence Threshold**: Lower (0.6)
- **Research Budget**: 0.25 USDT max
- **Preferred Sources**: Expert, Data, News
- **Speed**: Fast analysis
- **Best For**: High-volume, short-term predictions

##### Speed Demon Strategy
- **Risk Tolerance**: Very High (0.9)
- **Confidence Threshold**: Low (0.5)
- **Research Budget**: 0.05 USDT max
- **Preferred Sources**: Social, News
- **Speed**: Ultra-fast analysis
- **Best For**: Rapid-fire, low-cost predictions

##### Academic Strategy
- **Risk Tolerance**: Low (0.3)
- **Confidence Threshold**: Very High (0.85)
- **Research Budget**: 0.20 USDT max
- **Preferred Sources**: Academic, Expert
- **Speed**: Thorough analysis
- **Best For**: Deep research, scholarly analysis

#### Usage:
```typescript
import { CONSERVATIVE_STRATEGY, AGGRESSIVE_STRATEGY } from './src/lib/agents/research-strategies';

// Use predefined strategies
const agent = new PredictionAgent({
  strategy: CONSERVATIVE_STRATEGY,
  // ... other config
});

// Create custom strategies
const customStrategy = createCustomStrategy('My Strategy', 'Custom description', {
  riskTolerance: 0.5,
  confidenceThreshold: 0.7,
  maxResearchBudget: '0.10'
});
```

### 3.  Service (`src/lib//-service.ts`)

Handles  micropayments for research resources.

#### Key Features:
- **HTTP 402 Protocol**: Implements "Payment Required" status code
- **Payment Verification**: Verifies payment signatures using EIP-712
- **Solana Integration**: Integrates with Solana blockchain for transactions
- **Payment History**: Tracks all payment transactions
- **Resource Management**: Manages research resource purchases

#### Usage:
```typescript
import { Service } from './src/lib//-service';

const Service = Service.createTestnetService(wallet);

const paymentResult = await Service.makePayment({
  resourceId: 'academic_001',
  amount: '0.05',
  currency: 'USDT',
  agentId: 'agent_001',
  reasoning: 'Purchase academic research paper'
});
```

### 4. Solana Agent Wallet (`src/lib/Solana/agent-wallet.ts`)

Manages Solana wallets and EIP-712 signing for agents.

#### Key Features:
- **Wallet Management**: Creates and manages Solana wallets
- **Token Support**: Supports SOL, USDT, USDC transactions
- **EIP-712 Signing**: Signs messages using EIP-712 standard
- **Transaction Management**: Handles gas optimization and transaction tracking
- **Balance Management**: Tracks balances across different tokens

#### Usage:
```typescript
import { BSCAgentWallet } from './src/lib/Solana/agent-wallet';

const wallet = BSCAgentWallet.createTestnetWallet(privateKey);

// Get balances
const balances = await wallet.getAllBalances();

// Transfer tokens
const result = await wallet.transferTokens('0.05', 'USDT', recipientAddress);

// Sign EIP-712 message
const signature = await wallet.signEIP712Message(domain, message);
```

## Integration with Polysentience

The core agent system integrates seamlessly with Polysentience's existing analysis pipeline:

1. **Research Enhancement**: Agents purchase additional research resources to enhance analysis
2. **Strategy-Based Analysis**: Different agents use different research approaches
3. **Performance Tracking**: Agents track their prediction accuracy and profitability
4. **Bankruptcy System**: Agents are removed if they become unprofitable

## Demo

Run the core agents demo to see the system in action:

```bash
npm run demo:core-agents
```

This demo shows:
- Creating agents with different strategies
- Autonomous research decision making
-  micropayment integration
- Solana wallet management
- Performance tracking

## Configuration

### Environment Setup

1. **Solana Configuration**: Set up Solana network access
2. **Wallet Management**: Generate or import private keys
3. ** Integration**: Configure payment endpoints
4. **Agent Strategies**: Customize agent personalities

### Agent Configuration

```typescript
const agentConfig: AgentConfig = {
  id: 'agent_001',
  name: 'My Agent',
  strategy: CONSERVATIVE_STRATEGY,
  wallet: bscWallet,
  Service: Service,
  initialBalance: '10.0',
  isActive: true
};
```

## Performance Metrics

Each agent tracks:
- **Total Predictions**: Number of predictions made
- **Correct Predictions**: Number of correct predictions
- **Total Spent**: Amount spent on research and analysis
- **Total Earned**: Amount earned from correct predictions
- **Accuracy**: Percentage of correct predictions
- **ROI**: Return on investment
- **Net Profit**: Total earned minus total spent
- **Research Purchases**: Number of research resources purchased
- **Average Research Cost**: Average cost per research purchase

## Security Considerations

1. **Private Key Management**: Store private keys securely
2. **Payment Validation**: Validate all payment requests
3. **Balance Monitoring**: Monitor agent balances
4. **Rate Limiting**: Implement rate limiting for API calls
5. **Transaction Verification**: Verify all transactions

## Future Enhancements

1. **Machine Learning**: Add learning mechanisms for strategy optimization
2. **Portfolio Management**: Implement portfolio diversification
3. **Risk Management**: Add advanced risk management features
4. **Market Making**: Add higher-level market making capabilities
5. **Social Features**: Add agent collaboration features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project extends Polysentience and follows the same license terms.

