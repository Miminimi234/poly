/**
 * Autonomous Agent Engine
 * Extends poly402's research capabilities with autonomous AI agents
 * that use x402 micropayments to purchase research resources and compete in prediction markets
 */

import { ethers } from 'ethers';
import { ForecastCard } from '../forecasting/types';
import { SolanaWallet } from '../solana/wallet';
import { X402Client } from '../x402/client';
import { runUnifiedForecastPipeline, UnifiedOrchestratorOpts } from './orchestrator';

export interface AgentStrategy {
  name: string;
  description: string;
  riskTolerance: number; // 0-1, where 1 is highest risk
  researchBudget: number; // Maximum spending per analysis
  predictionThreshold: number; // Minimum confidence to make predictions
  speedPreference: 'fast' | 'balanced' | 'thorough';
}

export interface AgentConfig {
  id: string;
  name: string;
  strategy: AgentStrategy;
  wallet: SolanaWallet;
  x402Client: X402Client;
  initialBalance: string;
  isActive: boolean;
}

export interface AgentPerformance {
  agentId: string;
  totalPredictions: number;
  correctPredictions: number;
  totalSpent: string;
  totalEarned: string;
  netProfit: string;
  accuracy: number;
  roi: number;
  lastActivity: Date;
}

export interface MarketOpportunity {
  marketUrl: string;
  expectedValue: number;
  confidence: number;
  costToAnalyze: number;
  timeToExpiry: number;
}

export class AutonomousAgent {
  private config: AgentConfig;
  private performance: AgentPerformance;
  private currentBalance: string;
  private isBankrupt: boolean = false;

  constructor(config: AgentConfig) {
    this.config = config;
    this.currentBalance = config.initialBalance;
    this.performance = {
      agentId: config.id,
      totalPredictions: 0,
      correctPredictions: 0,
      totalSpent: '0',
      totalEarned: '0',
      netProfit: '0',
      accuracy: 0,
      roi: 0,
      lastActivity: new Date()
    };
  }

  /**
   * Analyze a prediction market and make a prediction
   */
  async analyzeMarket(marketUrl: string): Promise<ForecastCard | null> {
    if (this.isBankrupt || !this.config.isActive) {
      return null;
    }

    try {
      // Estimate cost of analysis
      const analysisCost = await this.estimateAnalysisCost();

      // Check if agent can afford the analysis
      if (!await this.canAfford(analysisCost)) {
        console.log(`Agent ${this.config.id} cannot afford analysis (cost: ${analysisCost}, balance: ${this.currentBalance})`);
        return null;
      }

      // Deduct analysis cost
      await this.spend(analysisCost, 'market_analysis');

      // Run poly402 analysis pipeline
      const forecastCard = await this.runAnalysis(marketUrl);

      if (forecastCard) {
        this.performance.totalPredictions++;
        this.performance.lastActivity = new Date();

        // Record prediction for later evaluation
        await this.recordPrediction(marketUrl, forecastCard);
      }

      return forecastCard;
    } catch (error) {
      console.error(`Agent ${this.config.id} failed to analyze market:`, error);
      return null;
    }
  }

  /**
   * Purchase research resources using x402 micropayments
   */
  async purchaseResearchResource(resourceId: string, price: string): Promise<boolean> {
    if (this.isBankrupt || !this.config.isActive) {
      return false;
    }

    try {
      // Check if agent can afford the resource
      if (!await this.canAfford(price)) {
        return false;
      }

      // Make x402 payment
      const paymentResult = await this.config.x402Client.purchaseResource({
        id: resourceId,
        name: `Research Resource ${resourceId}`,
        price: price,
        currency: 'USDT',
        description: 'Research data purchase'
      });

      if (paymentResult.success) {
        await this.spend(price, 'research_resource');
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Agent ${this.config.id} failed to purchase research resource:`, error);
      return false;
    }
  }

  /**
   * Evaluate agent performance and update statistics
   */
  async evaluatePerformance(): Promise<void> {
    // Calculate accuracy
    if (this.performance.totalPredictions > 0) {
      this.performance.accuracy = this.performance.correctPredictions / this.performance.totalPredictions;
    }

    // Calculate ROI
    const totalSpentBN = BigInt(this.performance.totalSpent);
    const totalEarnedBN = BigInt(this.performance.totalEarned);

    if (totalSpentBN > 0) {
      this.performance.roi = Number(totalEarnedBN - totalSpentBN) / Number(totalSpentBN);
    }

    // Check for bankruptcy
    if (totalEarnedBN < totalSpentBN && this.currentBalance === '0') {
      this.isBankrupt = true;
      this.config.isActive = false;
      console.log(`Agent ${this.config.id} has gone bankrupt!`);
    }
  }

  /**
   * Get agent performance metrics
   */
  getPerformance(): AgentPerformance {
    return { ...this.performance };
  }

  /**
   * Get current balance
   */
  getBalance(): string {
    return this.currentBalance;
  }

  /**
   * Check if agent is bankrupt
   */
  isAgentBankrupt(): boolean {
    return this.isBankrupt;
  }

  /**
   * Run poly402 analysis pipeline
   */
  private async runAnalysis(marketUrl: string): Promise<ForecastCard | null> {
    const opts: UnifiedOrchestratorOpts = {
      marketUrl,
      withBooks: true,
      withTrades: this.config.strategy.speedPreference === 'fast',
      onProgress: (step, details) => {
        console.log(`Agent ${this.config.id} - ${step}:`, details.message);
      }
    };

    return await runUnifiedForecastPipeline(opts);
  }

  /**
   * Estimate cost of market analysis
   */
  private async estimateAnalysisCost(): Promise<string> {
    // Base cost varies by strategy
    const baseCost = this.config.strategy.speedPreference === 'fast' ? '0.01' :
      this.config.strategy.speedPreference === 'thorough' ? '0.05' : '0.03';

    // Add risk tolerance multiplier
    const riskMultiplier = 1 + this.config.strategy.riskTolerance;
    const cost = parseFloat(baseCost) * riskMultiplier;

    return cost.toString();
  }

  /**
   * Check if agent can afford a purchase
   */
  private async canAfford(amount: string): Promise<boolean> {
    const balanceBN = BigInt(ethers.parseEther(this.currentBalance));
    const amountBN = BigInt(ethers.parseEther(amount));
    return balanceBN >= amountBN;
  }

  /**
   * Spend money and update balance
   */
  private async spend(amount: string, reason: string): Promise<void> {
    const balanceBN = BigInt(ethers.parseEther(this.currentBalance));
    const amountBN = BigInt(ethers.parseEther(amount));
    const newBalanceBN = balanceBN - amountBN;

    this.currentBalance = ethers.formatEther(newBalanceBN);

    // Update performance tracking
    const currentSpentBN = BigInt(this.performance.totalSpent);
    this.performance.totalSpent = ethers.formatEther(currentSpentBN + amountBN);
    this.performance.netProfit = ethers.formatEther(
      BigInt(this.performance.totalEarned) - BigInt(this.performance.totalSpent)
    );

    console.log(`Agent ${this.config.id} spent ${amount} USDT for ${reason}. New balance: ${this.currentBalance}`);
  }

  /**
   * Earn money and update balance
   */
  async earn(amount: string, reason: string): Promise<void> {
    const balanceBN = BigInt(ethers.parseEther(this.currentBalance));
    const amountBN = BigInt(ethers.parseEther(amount));
    const newBalanceBN = balanceBN + amountBN;

    this.currentBalance = ethers.formatEther(newBalanceBN);

    // Update performance tracking
    const currentEarnedBN = BigInt(this.performance.totalEarned);
    this.performance.totalEarned = ethers.formatEther(currentEarnedBN + amountBN);
    this.performance.netProfit = ethers.formatEther(
      BigInt(this.performance.totalEarned) - BigInt(this.performance.totalSpent)
    );

    console.log(`Agent ${this.config.id} earned ${amount} USDT for ${reason}. New balance: ${this.currentBalance}`);
  }

  /**
   * Record a prediction for later evaluation
   */
  private async recordPrediction(marketUrl: string, forecastCard: ForecastCard): Promise<void> {
    // Store prediction in memory or database for later evaluation
    // This would be implemented based on your storage solution
    console.log(`Agent ${this.config.id} recorded prediction for ${marketUrl}: ${forecastCard.pNeutral}`);
  }

  /**
   * Mark a prediction as correct and award earnings
   */
  async markPredictionCorrect(marketUrl: string, earnings: string): Promise<void> {
    this.performance.correctPredictions++;
    await this.earn(earnings, 'correct_prediction');
  }

  /**
   * Mark a prediction as incorrect
   */
  async markPredictionIncorrect(marketUrl: string): Promise<void> {
    // No earnings for incorrect predictions
    console.log(`Agent ${this.config.id} prediction for ${marketUrl} was incorrect`);
  }
}

/**
 * Agent Engine Manager
 * Manages multiple autonomous agents and coordinates their activities
 */
export class AutonomousAgentEngine {
  private agents: Map<string, AutonomousAgent> = new Map();
  private strategies: Map<string, AgentStrategy> = new Map();

  constructor() {
    this.initializeDefaultStrategies();
  }

  /**
   * Add a new agent to the engine
   */
  async addAgent(config: AgentConfig): Promise<void> {
    const agent = new AutonomousAgent(config);
    this.agents.set(config.id, agent);
    console.log(`Added agent ${config.id} with strategy ${config.strategy.name}`);
  }

  /**
   * Remove an agent from the engine
   */
  removeAgent(agentId: string): void {
    this.agents.delete(agentId);
    console.log(`Removed agent ${agentId}`);
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): AutonomousAgent[] {
    return Array.from(this.agents.values()).filter(agent =>
      !agent.isAgentBankrupt() && agent.getPerformance().agentId !== ''
    );
  }

  /**
   * Get agent performance summary
   */
  getPerformanceSummary(): AgentPerformance[] {
    return Array.from(this.agents.values()).map(agent => agent.getPerformance());
  }

  /**
   * Run analysis on a market with all active agents
   */
  async analyzeMarketWithAllAgents(marketUrl: string): Promise<Map<string, ForecastCard>> {
    const results = new Map<string, ForecastCard>();
    const activeAgents = this.getActiveAgents();

    console.log(`Running analysis on ${marketUrl} with ${activeAgents.length} active agents`);

    // Run analysis in parallel for all agents
    const promises = activeAgents.map(async (agent) => {
      try {
        const forecast = await agent.analyzeMarket(marketUrl);
        if (forecast) {
          results.set(agent.getPerformance().agentId, forecast);
        }
      } catch (error) {
        console.error(`Agent ${agent.getPerformance().agentId} failed:`, error);
      }
    });

    await Promise.all(promises);

    return results;
  }

  /**
   * Evaluate all agents and update their performance
   */
  async evaluateAllAgents(): Promise<void> {
    const promises = Array.from(this.agents.values()).map(agent => agent.evaluatePerformance());
    await Promise.all(promises);
  }

  /**
   * Initialize default agent strategies
   */
  private initializeDefaultStrategies(): void {
    this.strategies.set('conservative', {
      name: 'Conservative',
      description: 'Low risk, thorough analysis, high confidence threshold',
      riskTolerance: 0.2,
      researchBudget: 0.1,
      predictionThreshold: 0.8,
      speedPreference: 'thorough'
    });

    this.strategies.set('aggressive', {
      name: 'Aggressive',
      description: 'High risk, fast analysis, lower confidence threshold',
      riskTolerance: 0.8,
      researchBudget: 0.3,
      predictionThreshold: 0.6,
      speedPreference: 'fast'
    });

    this.strategies.set('speed_demon', {
      name: 'Speed Demon',
      description: 'Ultra-fast analysis, minimal research, quick decisions',
      riskTolerance: 0.9,
      researchBudget: 0.05,
      predictionThreshold: 0.5,
      speedPreference: 'fast'
    });

    this.strategies.set('balanced', {
      name: 'Balanced',
      description: 'Moderate risk, balanced approach',
      riskTolerance: 0.5,
      researchBudget: 0.2,
      predictionThreshold: 0.7,
      speedPreference: 'balanced'
    });
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies(): AgentStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get strategy by name
   */
  getStrategy(name: string): AgentStrategy | undefined {
    return this.strategies.get(name);
  }
}

