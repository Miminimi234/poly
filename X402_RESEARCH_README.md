# x402-Enabled Research System

This document describes the x402-enabled research system that transforms Polyseer's research capabilities into a pay-per-use economy where AI agents autonomously purchase research resources.

## Overview

The x402 research system implements the HTTP 402 "Payment Required" protocol to create a micropayment-based research economy. AI agents can autonomously purchase different types of research resources using x402 micropayments on BSC.

## Architecture

### Core Components

1. **x402 Payment Verification** (`src/lib/x402/payment-verification.ts`)
   - Handles payment signature verification using EIP-712
   - Creates HTTP 402 responses
   - Manages research resource definitions

2. **Research API Endpoints** (`src/app/api/research/`)
   - `/api/research/valyu-web` - Basic web search ($0.01)
   - `/api/research/valyu-academic` - Academic papers ($0.10)
   - `/api/research/news-feeds` - Real-time news ($0.05)
   - `/api/research/expert-analysis` - Expert insights ($0.50)
   - `/api/research/sentiment` - Social sentiment ($0.02)
   - `/api/research/marketplace` - Research marketplace

3. **Enhanced x402 Service** (`src/lib/x402/x402-service.ts`)
   - Integrates with research endpoints
   - Handles payment processing
   - Manages research resource purchases

4. **Updated PredictionAgent** (`src/lib/agents/agent-engine.ts`)
   - Uses new research endpoints
   - Makes autonomous purchasing decisions
   - Integrates research data into analysis

## Research Resources

### Valyu Web Search ($0.01)
- **Endpoint**: `/api/research/valyu-web`
- **Description**: Basic web search using Valyu for up-to-date information
- **Quality**: Medium
- **Freshness**: Fresh
- **Use Case**: General information gathering

### Valyu Academic Papers ($0.10)
- **Endpoint**: `/api/research/valyu-academic`
- **Description**: Academic research papers and scholarly articles
- **Quality**: High
- **Freshness**: Recent
- **Use Case**: Deep research and scholarly analysis

### News Feeds ($0.05)
- **Endpoint**: `/api/research/news-feeds`
- **Description**: Breaking news and current events from multiple sources
- **Quality**: Medium
- **Freshness**: Fresh
- **Use Case**: Current events and breaking news

### Expert Analysis ($0.50)
- **Endpoint**: `/api/research/expert-analysis`
- **Description**: Professional insights and expert opinions
- **Quality**: High
- **Freshness**: Recent
- **Use Case**: Professional insights and expert opinions

### Social Sentiment ($0.02)
- **Endpoint**: `/api/research/sentiment`
- **Description**: Social media sentiment and trends analysis
- **Quality**: Low
- **Freshness**: Fresh
- **Use Case**: Social sentiment and public opinion

## API Usage

### Making a Research Request

```typescript
// 1. Create payment request
const paymentRequest = {
  resourceId: 'valyu-web',
  amount: '0.01',
  currency: 'USDT',
  agentId: 'agent_001',
  reasoning: 'Purchase web search for analysis',
  signature: '0x...',
  message: '{"resourceId":"valyu-web","amount":"0.01",...}',
  timestamp: Date.now(),
  nonce: 'random_hex_string'
};

// 2. Make request to research endpoint
const response = await fetch('/api/research/valyu-web', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Payment-Request': JSON.stringify(paymentRequest)
  },
  body: JSON.stringify({
    query: 'search query here',
    startDate: '2024-01-01' // optional
  })
});

// 3. Handle response
if (response.status === 200) {
  const data = await response.json();
  console.log('Research successful:', data.data);
} else if (response.status === 402) {
  console.log('Payment required');
}
```

### HTTP 402 Payment Required Flow

When no payment is provided, endpoints return HTTP 402 with payment requirements:

```json
{
  "error": "Payment Required",
  "message": "Payment of 0.01 USDT required to access Valyu Web Search",
  "paymentRequest": {
    "resourceId": "valyu-web",
    "amount": "0.01",
    "currency": "USDT",
    "agentId": "agent_001",
    "reasoning": "Purchase Valyu Web Search for analysis"
  },
  "resource": {
    "id": "valyu-web",
    "name": "Valyu Web Search",
    "price": "0.01",
    "currency": "USDT",
    "type": "web",
    "quality": "medium",
    "freshness": "fresh"
  }
}
```

### Research Marketplace

Discover available research resources:

```typescript
// Get all resources
const response = await fetch('/api/research/marketplace');
const marketplace = await response.json();

// Filter by type
const academicResources = await fetch('/api/research/marketplace?type=academic');

// Filter by price range
const cheapResources = await fetch('/api/research/marketplace?maxPrice=0.05');
```

## Agent Integration

### Using PredictionAgent

```typescript
import { PredictionAgent, CONSERVATIVE_STRATEGY } from './src/lib/agents/agent-engine';
import { BSCAgentWallet } from './src/lib/bsc/agent-wallet';
import { X402Service } from './src/lib/x402/x402-service';

// Create agent
const wallet = BSCAgentWallet.createTestnetWallet(privateKey);
const x402Service = X402Service.createTestnetService(wallet);

const agent = new PredictionAgent({
  id: 'agent_001',
  name: 'My Agent',
  strategy: CONSERVATIVE_STRATEGY,
  wallet: wallet,
  x402Service: x402Service,
  initialBalance: '10.0',
  isActive: true
});

// Purchase research resource
const result = await agent.purchaseResearchResource(
  'valyu-academic',
  'machine learning healthcare applications',
  { startDate: '2024-01-01' }
);

if (result.success) {
  console.log('Research data:', result.data);
}
```

### Agent Strategies and Research Preferences

Different agent strategies have different research preferences:

- **Conservative**: Prefers academic and expert sources, higher quality threshold
- **Aggressive**: Willing to pay for premium data, lower confidence threshold
- **Speed Demon**: Prefers cheap, fast sources like web and sentiment
- **Academic**: Focuses on scholarly sources and expert analysis

## Payment Verification

### EIP-712 Signature Verification

All payments are verified using EIP-712 signatures:

```typescript
// Create signature
const message = {
  resourceId: 'valyu-web',
  amount: '0.01',
  currency: 'USDT',
  agentId: 'agent_001',
  reasoning: 'Purchase web search for analysis',
  timestamp: Date.now(),
  chainId: 97
};

const signature = await wallet.signTypedData(domain, types, message);
```

### Payment Validation

The system validates:
- Signature authenticity
- Message content matches payment request
- Amount and currency match resource requirements
- Timestamp is within 5 minutes
- Agent has sufficient balance

## Configuration

### Environment Variables

```bash
# Valyu API Configuration
VALYU_API_KEY=your_valyu_api_key
VALYU_DEFAULT_START_DAYS=180

# BSC Configuration
BSC_NETWORK=testnet
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# x402 Configuration
X402_DEFAULT_CURRENCY=USDT
X402_MAX_PAYMENT=1.0
X402_MIN_PAYMENT=0.001
```

### Resource Pricing

Resource prices are defined in `src/lib/x402/payment-verification.ts`:

```typescript
export const RESEARCH_RESOURCES: Record<string, X402Resource> = {
  'valyu-web': {
    id: 'valyu-web',
    name: 'Valyu Web Search',
    price: '0.01',
    currency: 'USDT',
    type: 'web',
    quality: 'medium',
    freshness: 'fresh'
  },
  // ... other resources
};
```

## Demo

Run the x402 research demo to see the system in action:

```bash
npm run demo:x402-research
```

This demo shows:
- Research marketplace discovery
- x402 payment flow for each resource type
- HTTP 402 Payment Required responses
- Agent autonomous purchasing decisions
- Payment tracking and statistics

## Security Considerations

1. **Payment Verification**: All payments are cryptographically verified
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Balance Monitoring**: Monitor agent balances to prevent overspending
4. **Signature Validation**: Validate all EIP-712 signatures
5. **Timestamp Validation**: Reject expired payment requests

## Future Enhancements

1. **Dynamic Pricing**: Implement dynamic pricing based on demand
2. **Resource Bundles**: Create resource bundles for discounted pricing
3. **Subscription Models**: Add subscription-based access
4. **Quality Metrics**: Track and display resource quality metrics
5. **Agent Reputation**: Implement agent reputation system
6. **Resource Caching**: Cache research results to reduce costs
7. **Advanced Filtering**: Add more sophisticated resource filtering

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add new research resource types
4. Implement payment verification
5. Add tests
6. Submit a pull request

## License

This project extends Polyseer and follows the same license terms.

