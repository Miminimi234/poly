/**
 * PredictionAgent - Core autonomous agent engine
 * Extends poly402's research capabilities with autonomous decision-making
 * and x402 micropayment integration for research resource purchases
 */

import { ethers } from 'ethers';
import { ForecastCard } from '../forecasting/types';
import { SolanaAgentWallet } from '../solana/agent-wallet';
import { X402Service } from '../x402/x402-service';
import { runUnifiedForecastPipeline, UnifiedOrchestratorOpts } from './orchestrator';
import type { ResearchDecision, ResearchResource, ResearchStrategy } from './research-strategies';

export interface AgentConfig {
  id: string;
  name: string;
  strategy: ResearchStrategy;
  wallet: SolanaAgentWallet;
  x402Service: X402Service;
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
  researchPurchases: number;
  avgResearchCost: string;
  lastActivity: Date;
}

export interface MarketAnalysis {
  question: string;
  marketUrl: string;
  forecast: ForecastCard;
  researchDecisions: ResearchDecision[];
  totalResearchCost: string;
  confidence: number;
  timestamp: Date;
}



export class PredictionAgent {
  private config: AgentConfig;
  private performance: AgentPerformance;
  private currentBalance: string;
  private isBankrupt: boolean = false;
  private analysisHistory: MarketAnalysis[] = [];

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
      researchPurchases: 0,
      avgResearchCost: '0',
      lastActivity: new Date()
    };
  }

  /**
   * Main method to analyze a prediction market question
   * Makes autonomous decisions about research purchases and generates forecasts
   */
  async analyzeMarket(marketUrl: string): Promise<MarketAnalysis | null> {
    if (this.isBankrupt || !this.config.isActive) {
      console.log(`Agent ${this.config.id} is inactive or bankrupt`);
      return null;
    }

    try {
      console.log(`Agent ${this.config.id} starting analysis of ${marketUrl}`);

      // Step 1: Get market question and basic info
      const marketInfo = await this.getMarketInfo(marketUrl);
      if (!marketInfo) {
        console.log(`Failed to get market info for ${marketUrl}`);
        return null;
      }

      // Step 2: Decide what research to purchase based on strategy
      const researchDecisions = await this.decideResearchPurchases(marketInfo.question);
      console.log(`Agent ${this.config.id} decided to purchase ${researchDecisions.length} research resources`);

      // Step 3: Purchase research resources using x402 payments
      const purchasedResources = await this.purchaseResearchResources(researchDecisions);
      console.log(`Agent ${this.config.id} purchased ${purchasedResources.length} research resources`);

      // Step 4: Run poly402 analysis with purchased research
      const forecast = await this.runPolyseerAnalysis(marketUrl, purchasedResources);
      if (!forecast) {
        console.log(`Agent ${this.config.id} failed to generate forecast`);
        return null;
      }

      // Step 5: Calculate confidence and create analysis result
      const confidence = this.calculateConfidence(forecast, purchasedResources);
      const totalResearchCost = this.calculateTotalResearchCost(researchDecisions);

      const analysis: MarketAnalysis = {
        question: marketInfo.question,
        marketUrl,
        forecast,
        researchDecisions,
        totalResearchCost,
        confidence,
        timestamp: new Date()
      };

      // Step 6: Update performance metrics
      await this.updatePerformance(analysis);

      // Step 7: Store analysis in history
      this.analysisHistory.push(analysis);

      console.log(`Agent ${this.config.id} completed analysis with confidence ${confidence.toFixed(3)}`);
      return analysis;

    } catch (error) {
      console.error(`Agent ${this.config.id} failed to analyze market:`, error);
      return null;
    }
  }

  /**
   * Decide what research resources to purchase based on agent strategy
   */
  private async decideResearchPurchases(question: string): Promise<ResearchDecision[]> {
    const strategy = this.config.strategy;
    const decisions: ResearchDecision[] = [];

    // Get available research resources
    const availableResources = await this.getAvailableResearchResources(question);

    // Filter resources based on strategy preferences
    const filteredResources = availableResources.filter(resource =>
      this.shouldPurchaseResource(resource, strategy)
    );

    // Sort by value and select based on budget
    const sortedResources = filteredResources.sort((a, b) => {
      const aValue = this.calculateResourceValue(a, strategy);
      const bValue = this.calculateResourceValue(b, strategy);
      return bValue - aValue;
    });

    // Select resources within budget
    let remainingBudget = parseFloat(strategy.maxResearchBudget);
    for (const resource of sortedResources) {
      const cost = parseFloat(resource.price);
      if (cost <= remainingBudget) {
        decisions.push({
          resource,
          reasoning: this.generatePurchaseReasoning(resource, strategy),
          expectedValue: this.calculateResourceValue(resource, strategy)
        });
        remainingBudget -= cost;
      }
    }

    return decisions;
  }

  /**
   * Purchase research resources using x402 micropayments
   */
  private async purchaseResearchResources(decisions: ResearchDecision[]): Promise<ResearchResource[]> {
    const purchasedResources: ResearchResource[] = [];

    for (const decision of decisions) {
      try {
        // Check if we can afford the resource
        if (!await this.canAfford(decision.resource.price)) {
          console.log(`Agent ${this.config.id} cannot afford ${decision.resource.name}`);
          continue;
        }

        // Use the new research endpoint purchase method
        const paymentResult = await this.config.x402Service.purchaseResearchResource(
          decision.resource.id,
          decision.resource.name, // Use resource name as query for now
          {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // Last 30 days
            expertType: decision.resource.type === 'expert' ? 'general' : undefined,
            platform: decision.resource.type === 'sentiment' ? 'all' : undefined
          }
        );

        if (paymentResult.success) {
          // Deduct cost from balance
          await this.spend(decision.resource.price, `research_purchase_${decision.resource.id}`);

          // Add to purchased resources with research data
          const enhancedResource = {
            ...decision.resource,
            researchData: paymentResult.data
          };
          purchasedResources.push(enhancedResource);

          // Update performance metrics
          this.performance.researchPurchases++;

          console.log(`Agent ${this.config.id} successfully purchased ${decision.resource.name} for ${decision.resource.price} ${decision.resource.currency}`);
        } else {
          console.log(`Agent ${this.config.id} failed to purchase ${decision.resource.name}: ${paymentResult.error}`);
        }
      } catch (error) {
        console.error(`Error purchasing ${decision.resource.name}:`, error);
      }
    }

    return purchasedResources;
  }

  /**
   * Run poly402 analysis with purchased research resources
   */
  private async runPolyseerAnalysis(marketUrl: string, resources: ResearchResource[]): Promise<ForecastCard | null> {
    try {
      // Create enhanced market data with purchased research
      const enhancedMarketData = await this.enhanceMarketDataWithResearch(marketUrl, resources);

      // Run poly402's unified forecast pipeline
      const opts: UnifiedOrchestratorOpts = {
        marketUrl,
        withBooks: true,
        withTrades: this.config.strategy.speedPreference === 'fast',
        onProgress: (step, details) => {
          console.log(`Agent ${this.config.id} - ${step}:`, details.message);
        }
      };

      const forecast = await runUnifiedForecastPipeline(opts);

      // Enhance forecast with research insights
      return this.enhanceForecastWithResearch(forecast, resources);

    } catch (error) {
      console.error(`Agent ${this.config.id} failed to run poly402 analysis:`, error);
      return null;
    }
  }

  /**
   * Calculate confidence score based on forecast and research quality
   */
  private calculateConfidence(forecast: ForecastCard, resources: ResearchResource[]): number {
    let confidence = forecast.pNeutral;

    // Adjust confidence based on research quality
    const qualityMultiplier = resources.reduce((acc, resource) => {
      const qualityScore = resource.quality === 'high' ? 1.2 :
        resource.quality === 'medium' ? 1.0 : 0.8;
      return acc + qualityScore;
    }, 0) / Math.max(resources.length, 1);

    // Adjust confidence based on research diversity
    const uniqueTypes = new Set(resources.map(r => r.type)).size;
    const diversityMultiplier = Math.min(1 + (uniqueTypes - 1) * 0.1, 1.3);

    // Adjust confidence based on research freshness
    const freshResources = resources.filter(r => r.freshness === 'fresh').length;
    const freshnessMultiplier = Math.min(1 + freshResources * 0.05, 1.2);

    confidence *= qualityMultiplier * diversityMultiplier * freshnessMultiplier;

    // Apply strategy-specific confidence adjustments
    const strategy = this.config.strategy;
    if (strategy.confidenceThreshold > 0.8) {
      confidence *= 1.1; // Conservative agents get slight confidence boost
    } else if (strategy.confidenceThreshold < 0.6) {
      confidence *= 0.9; // Aggressive agents get slight confidence reduction
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Get available research resources for a given question
   */
  private async getAvailableResearchResources(question: string): Promise<ResearchResource[]> {
    // This would typically query a research resource API or database
    // For now, we'll return mock data
    return [
      {
        id: 'academic_001',
        name: 'Academic Research Paper',
        description: 'Peer-reviewed academic research on the topic',
        price: '0.05',
        currency: 'USDT',
        source: 'Academic Database',
        type: 'academic',
        quality: 'high',
        freshness: 'recent'
      },
      {
        id: 'news_001',
        name: 'Breaking News Analysis',
        description: 'Latest news and analysis from reputable sources',
        price: '0.02',
        currency: 'USDT',
        source: 'News API',
        type: 'news',
        quality: 'medium',
        freshness: 'fresh'
      },
      {
        id: 'data_001',
        name: 'Market Data Feed',
        description: 'Real-time market data and statistics',
        price: '0.03',
        currency: 'USDT',
        source: 'Data Provider',
        type: 'data',
        quality: 'high',
        freshness: 'fresh'
      },
      {
        id: 'expert_001',
        name: 'Expert Opinion',
        description: 'Analysis from domain experts',
        price: '0.08',
        currency: 'USDT',
        source: 'Expert Network',
        type: 'expert',
        quality: 'high',
        freshness: 'recent'
      },
      {
        id: 'social_001',
        name: 'Social Sentiment Analysis',
        description: 'Social media sentiment and trends',
        price: '0.01',
        currency: 'USDT',
        source: 'Social API',
        type: 'social',
        quality: 'low',
        freshness: 'fresh'
      }
    ];
  }

  /**
   * Determine if a resource should be purchased based on strategy
   */
  private shouldPurchaseResource(resource: ResearchResource, strategy: ResearchStrategy): boolean {
    // Check if resource type is preferred by strategy
    if (strategy.preferredSources.length > 0 &&
      !strategy.preferredSources.includes(resource.type)) {
      return false;
    }

    // Check if resource quality meets minimum threshold
    const qualityScore = resource.quality === 'high' ? 1 :
      resource.quality === 'medium' ? 0.5 : 0;
    if (qualityScore < strategy.minQualityThreshold) {
      return false;
    }

    // Check if resource freshness meets requirements
    const freshnessScore = resource.freshness === 'fresh' ? 1 :
      resource.freshness === 'recent' ? 0.7 : 0.3;
    if (freshnessScore < strategy.minFreshnessThreshold) {
      return false;
    }

    return true;
  }

  /**
   * Calculate the value of a research resource for the agent's strategy
   */
  private calculateResourceValue(resource: ResearchResource, strategy: ResearchStrategy): number {
    let value = 1.0;

    // Quality multiplier
    const qualityMultiplier = resource.quality === 'high' ? 1.5 :
      resource.quality === 'medium' ? 1.0 : 0.5;

    // Freshness multiplier
    const freshnessMultiplier = resource.freshness === 'fresh' ? 1.2 :
      resource.freshness === 'recent' ? 1.0 : 0.7;

    // Type preference multiplier
    const typeMultiplier = strategy.preferredSources.includes(resource.type) ? 1.3 : 1.0;

    // Cost efficiency (higher value for lower cost)
    const cost = parseFloat(resource.price);
    const costEfficiency = Math.max(0.1, 1 / (cost + 0.01));

    value *= qualityMultiplier * freshnessMultiplier * typeMultiplier * costEfficiency;

    return value;
  }

  /**
   * Generate reasoning for why a resource should be purchased
   */
  private generatePurchaseReasoning(resource: ResearchResource, strategy: ResearchStrategy): string {
    const reasons = [];

    if (resource.quality === 'high') {
      reasons.push('high quality source');
    }

    if (resource.freshness === 'fresh') {
      reasons.push('fresh information');
    }

    if (strategy.preferredSources.includes(resource.type)) {
      reasons.push(`matches preferred source type (${resource.type})`);
    }

    if (parseFloat(resource.price) <= 0.02) {
      reasons.push('cost effective');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'general research value';
  }

  /**
   * Enhance market data with purchased research resources
   */
  private async enhanceMarketDataWithResearch(marketUrl: string, resources: ResearchResource[]): Promise<any> {
    // This would integrate the purchased research into the market data
    // For now, we'll return the original market URL
    return marketUrl;
  }

  /**
   * Enhance forecast with research insights
   */
  private enhanceForecastWithResearch(forecast: ForecastCard, resources: ResearchResource[]): ForecastCard {
    // Add research metadata to the forecast
    const enhancedForecast = { ...forecast };

    // Add research provenance
    enhancedForecast.provenance = [
      ...forecast.provenance,
      ...resources.map(r => `${r.source}: ${r.name}`)
    ];

    return enhancedForecast;
  }

  /**
   * Calculate total research cost for decisions
   */
  private calculateTotalResearchCost(decisions: ResearchDecision[]): string {
    const total = decisions.reduce((sum, decision) => {
      return sum + parseFloat(decision.resource.price);
    }, 0);
    return total.toString();
  }

  /**
   * Update performance metrics
   */
  private async updatePerformance(analysis: MarketAnalysis): Promise<void> {
    this.performance.totalPredictions++;
    this.performance.lastActivity = new Date();

    // Update average research cost
    const totalSpent = parseFloat(this.performance.totalSpent);
    const totalPurchases = this.performance.researchPurchases;
    if (totalPurchases > 0) {
      this.performance.avgResearchCost = (totalSpent / totalPurchases).toString();
    }
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
   * Get analysis history
   */
  getAnalysisHistory(): MarketAnalysis[] {
    return [...this.analysisHistory];
  }

  /**
   * Mark a prediction as correct and award earnings
   */
  async markPredictionCorrect(analysis: MarketAnalysis, earnings: string): Promise<void> {
    this.performance.correctPredictions++;
    await this.earn(earnings, 'correct_prediction');
  }

  /**
   * Mark a prediction as incorrect
   */
  async markPredictionIncorrect(analysis: MarketAnalysis): Promise<void> {
    // No earnings for incorrect predictions
    console.log(`Agent ${this.config.id} prediction for ${analysis.marketUrl} was incorrect`);
  }

  /**
   * Get market info (placeholder - would integrate with market APIs)
   */
  private async getMarketInfo(marketUrl: string): Promise<{ question: string } | null> {
    // This would typically parse the market URL and extract the question
    // For now, return a mock response
    return {
      question: 'Will the prediction market resolve in favor of the outcome?'
    };
  }
}
