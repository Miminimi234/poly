/**
 * Agent Factory
 * Factory class for creating and configuring autonomous agents
 */

import { BSCWallet, BSCWalletConfig, BSCConfig } from '../bsc/wallet';
import { X402Client, X402PaymentConfig } from '../x402/client';
import { AutonomousAgent, AgentConfig, AgentStrategy } from './autonomous-agent-engine';
import { ethers } from 'ethers';

export interface AgentFactoryConfig {
  bscNetwork: 'mainnet' | 'testnet';
  defaultInitialBalance: string;
  defaultCurrency: string;
}

export class AgentFactory {
  private config: AgentFactoryConfig;

  constructor(config: AgentFactoryConfig) {
    this.config = config;
  }

  /**
   * Create a new autonomous agent with the specified strategy
   */
  async createAgent(
    agentId: string,
    agentName: string,
    strategyName: string,
    privateKey: string,
    customConfig?: Partial<AgentConfig>
  ): Promise<AgentConfig> {
    // Generate a new wallet if no private key provided
    const walletPrivateKey = privateKey || this.generatePrivateKey();
    
    // Create BSC wallet
    const bscWallet = this.config.bscNetwork === 'mainnet' 
      ? BSCWallet.createMainnetWallet(walletPrivateKey)
      : BSCWallet.createTestnetWallet(walletPrivateKey);

    // Create BSC wallet config
    const bscWalletConfig: BSCWalletConfig = {
      privateKey: walletPrivateKey,
      providerUrl: this.config.bscNetwork === 'mainnet' 
        ? 'https://bsc-dataseed1.binance.org/'
        : 'https://data-seed-prebsc-1-s1.binance.org:8545/'
    };

    // Create BSC config
    const bscConfig: BSCConfig = {
      rpcUrl: bscWalletConfig.providerUrl,
      chainId: this.config.bscNetwork === 'mainnet' ? 56 : 97,
      gasPriceMultiplier: 1.1,
      maxGasLimit: 300000,
      timeout: 30000
    };

    // Create provider and wallet for x402 client
    const provider = new ethers.JsonRpcProvider(bscConfig.rpcUrl);
    const wallet = new ethers.Wallet(walletPrivateKey, provider);

    // Create x402 payment config
    const x402Config: X402PaymentConfig = {
      defaultCurrency: this.config.defaultCurrency,
      maxPaymentAmount: '1.0', // 1 USDT max per payment
      minPaymentAmount: '0.001', // 0.001 USDT min per payment
      gasPriceMultiplier: 1.1,
      timeout: 30000
    };

    // Create x402 client
    const x402Client = new X402Client(provider, wallet, x402Config);

    // Get strategy
    const strategy = this.getStrategy(strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    // Create agent config
    const agentConfig: AgentConfig = {
      id: agentId,
      name: agentName,
      strategy: strategy,
      wallet: bscWallet,
      x402Client: x402Client,
      initialBalance: customConfig?.initialBalance || this.config.defaultInitialBalance,
      isActive: customConfig?.isActive ?? true,
      ...customConfig
    };

    console.log(`Created agent ${agentId} with strategy ${strategyName} and balance ${agentConfig.initialBalance} ${this.config.defaultCurrency}`);

    return agentConfig;
  }

  /**
   * Create multiple agents with different strategies
   */
  async createAgentSet(
    baseName: string,
    strategies: string[],
    privateKeys?: string[]
  ): Promise<AgentConfig[]> {
    const agents: AgentConfig[] = [];
    const keys = privateKeys || strategies.map(() => this.generatePrivateKey());

    for (let i = 0; i < strategies.length; i++) {
      const agentId = `${baseName}_${strategies[i]}_${i}`;
      const agentName = `${baseName} ${strategies[i]} Agent ${i + 1}`;
      
      try {
        const agentConfig = await this.createAgent(
          agentId,
          agentName,
          strategies[i],
          keys[i]
        );
        agents.push(agentConfig);
      } catch (error) {
        console.error(`Failed to create agent ${agentId}:`, error);
      }
    }

    return agents;
  }

  /**
   * Create a competitive agent environment with multiple strategies
   */
  async createCompetitiveEnvironment(
    environmentName: string,
    agentsPerStrategy: number = 2
  ): Promise<AgentConfig[]> {
    const strategies = ['conservative', 'aggressive', 'speed_demon', 'balanced'];
    const allAgents: AgentConfig[] = [];

    for (const strategy of strategies) {
      const strategyAgents = await this.createAgentSet(
        `${environmentName}_${strategy}`,
        Array(agentsPerStrategy).fill(strategy)
      );
      allAgents.push(...strategyAgents);
    }

    console.log(`Created competitive environment with ${allAgents.length} agents across ${strategies.length} strategies`);
    return allAgents;
  }

  /**
   * Generate a new private key
   */
  private generatePrivateKey(): string {
    const wallet = ethers.Wallet.createRandom();
    return wallet.privateKey;
  }

  /**
   * Get available strategies
   */
  private getStrategy(name: string): AgentStrategy | null {
    const strategies: Record<string, AgentStrategy> = {
      conservative: {
        name: 'Conservative',
        description: 'Low risk, thorough analysis, high confidence threshold',
        riskTolerance: 0.2,
        researchBudget: 0.1,
        predictionThreshold: 0.8,
        speedPreference: 'thorough'
      },
      aggressive: {
        name: 'Aggressive',
        description: 'High risk, fast analysis, lower confidence threshold',
        riskTolerance: 0.8,
        researchBudget: 0.3,
        predictionThreshold: 0.6,
        speedPreference: 'fast'
      },
      speed_demon: {
        name: 'Speed Demon',
        description: 'Ultra-fast analysis, minimal research, quick decisions',
        riskTolerance: 0.9,
        researchBudget: 0.05,
        predictionThreshold: 0.5,
        speedPreference: 'fast'
      },
      balanced: {
        name: 'Balanced',
        description: 'Moderate risk, balanced approach',
        riskTolerance: 0.5,
        researchBudget: 0.2,
        predictionThreshold: 0.7,
        speedPreference: 'balanced'
      }
    };

    return strategies[name] || null;
  }

  /**
   * Create factory for testnet environment
   */
  static createTestnetFactory(): AgentFactory {
    return new AgentFactory({
      bscNetwork: 'testnet',
      defaultInitialBalance: '10.0', // 10 USDT for testing
      defaultCurrency: 'USDT'
    });
  }

  /**
   * Create factory for mainnet environment
   */
  static createMainnetFactory(): AgentFactory {
    return new AgentFactory({
      bscNetwork: 'mainnet',
      defaultInitialBalance: '100.0', // 100 USDT for mainnet
      defaultCurrency: 'USDT'
    });
  }
}

