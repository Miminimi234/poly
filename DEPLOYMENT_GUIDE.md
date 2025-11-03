# Testnet Deployment & Launch Preparation Guide

## Overview
Complete guide for deploying AgentSeer to BSC testnet and preparing for mainnet launch.

## Phase 1: Testnet Deployment

### Prerequisites
- Node.js 18+ and npm
- Supabase account and database
- BSC testnet RPC endpoint
- Test USDT/USDC contracts on BSC testnet

### 1. Environment Setup

```bash
# Copy testnet environment
cp .env.testnet.example .env.local

# Configure environment variables
NEXT_PUBLIC_CHAIN_ID=97
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
USDT_TESTNET_CONTRACT=0x337610d27c682E347C9cD60BD4b3b107C9d34dDd
USDC_TESTNET_CONTRACT=0x645444d6ad3abf6b9fba36762b8b07ee7de2d986
```

### 2. Database Setup

```bash
# Run migrations
supabase migration up

# Or manually run the migration
psql -U postgres -d agentseer -f supabase/migrations/001_agent_system.sql
```

### 3. Test Faucet Setup

The faucet API is available at `/api/faucet` for funding test agents:

```bash
curl -X POST http://localhost:3000/api/faucet \
  -H "Content-Type: application/json" \
  -d '{"agentId": "agent-uuid", "amount": 50.0}'
```

### 4. Deploy to Testnet

```bash
# Build for production
npm run build

# Run on Vercel or similar
vercel deploy --prod --env-file .env.testnet
```

## Phase 2: Testing

### 1. Unit Tests

```bash
npm run test
```

### 2. Integration Tests

```bash
npm run test:integration
```

### 3. Load Testing

```bash
# Install k6 for load testing
brew install k6

# Run load test
k6 run tests/load/agent-load-test.js
```

### 4. E2E Tests

```bash
npm run test:e2e
```

## Phase 3: Economic Balance Testing

### Test Scenarios

1. **Agent Profitability**
   - Create 100 test agents with various strategies
   - Let them run for 24 hours
   - Monitor bankruptcy rate (should be < 30%)

2. **Research Pricing**
   - Test different pricing models
   - Monitor agent spending patterns
   - Ensure sustainable economics

3. **Circuit Breakers**
   - Simulate unusual spending patterns
   - Test rate limiting
   - Validate fraud detection

### Monitoring Scripts

```bash
# Monitor agent performance
node scripts/monitor-agent-performance.js

# Check economic health
node scripts/check-economic-balance.js
```

## Phase 4: Security Audit

### Checklist

- [ ] Smart contract security review
- [ ] x402 payment verification tested
- [ ] Wallet private key encryption validated
- [ ] Agent spending limits enforced
- [ ] User data privacy confirmed
- [ ] Penetration testing complete
- [ ] Security audit report reviewed

### Tools

```bash
# Run security audit
npm audit --production

# Test wallet security
npm run test:security
```

## Phase 5: Mainnet Preparation

### Configuration Changes

```bash
# Switch to mainnet
NEXT_PUBLIC_CHAIN_ID=56
BSC_RPC_URL=https://bsc-dataseed1.binance.org/
USDT_MAINNET_CONTRACT=0x55d398326f99059fF775485246999027B3197955
USDC_MAINNET_CONTRACT=0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
```

### Mainnet Deployment

```bash
# Final build
npm run build:production

# Deploy to production
vercel deploy --prod --env-file .env.production
```

## Monitoring & Alerts

### Set Up Monitoring

1. **Uptime Monitoring**
   - Use UptimeRobot or Pingdom
   - Monitor API endpoints
   - Alert on downtime

2. **Performance Monitoring**
   - Use Vercel Analytics
   - Track API response times
   - Monitor error rates

3. **Application Monitoring**
   - Set up Sentry for error tracking
   - Configure alerts for critical errors
   - Monitor agent performance metrics

### Alerting Rules

```yaml
# Example alerting configuration
alerts:
  - name: high_error_rate
    condition: error_rate > 5%
    action: notify_slack
  
  - name: agent_bankruptcy_spike
    condition: bankruptcy_rate > 50%
    action: pause_agents
  
  - name: api_downtime
    condition: uptime < 95%
    action: page_oncall
```

## Launch Checklist

### Pre-Launch

- [ ] All tests passing
- [ ] Security audit complete
- [ ] Economic balance validated
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Support channels ready
- [ ] Marketing materials prepared

### Launch Day

- [ ] Deploy to mainnet
- [ ] Verify all systems operational
- [ ] Monitor for issues
- [ ] Respond to user feedback
- [ ] Track key metrics

### Post-Launch

- [ ] Daily performance review
- [ ] User feedback collection
- [ ] Bug fixes and improvements
- [ ] Feature updates
- [ ] Marketing expansion

## Emergency Procedures

### If System Goes Down

1. Check Vercel status
2. Check database status
3. Review logs for errors
4. Restart services if needed
5. Communicate with users

### If Security Breach

1. Immediately pause all agents
2. Secure user wallets
3. Investigate breach
4. Notify affected users
5. Implement fixes
6. Review security measures

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourorg/agentseer/issues
- Discord: https://discord.gg/agentseer
- Email: support@agentseer.com
