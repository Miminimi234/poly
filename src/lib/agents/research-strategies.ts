/**
 * Research Strategies - Different agent personalities and research approaches
 * Defines how agents make decisions about research purchases and analysis
 */

export type ResourceType = 'academic' | 'news' | 'data' | 'expert' | 'social';
export type ResourceQuality = 'high' | 'medium' | 'low';
export type ResourceFreshness = 'fresh' | 'recent' | 'stale';
export type SpeedPreference = 'fast' | 'balanced' | 'thorough';

export interface ResearchStrategy {
  name: string;
  description: string;
  
  // Risk and confidence parameters
  riskTolerance: number; // 0-1, where 1 is highest risk
  confidenceThreshold: number; // Minimum confidence to make predictions
  
  // Research budget and spending
  maxResearchBudget: string; // Maximum spending per analysis
  minResearchBudget: string; // Minimum spending per analysis
  maxResourcesPerAnalysis: number; // Maximum number of resources to purchase
  
  // Resource preferences
  preferredSources: ResourceType[]; // Preferred resource types
  minQualityThreshold: number; // Minimum quality threshold (0-1)
  minFreshnessThreshold: number; // Minimum freshness threshold (0-1)
  
  // Speed and thoroughness
  speedPreference: SpeedPreference;
  maxAnalysisTime: number; // Maximum time to spend on analysis (seconds)
  
  // Decision making parameters
  valueThreshold: number; // Minimum value threshold for resource purchase
  diversificationBonus: number; // Bonus for diversifying research sources
  costEfficiencyWeight: number; // Weight given to cost efficiency in decisions
}

export interface ResearchDecision {
  resource: ResearchResource;
  reasoning: string;
  expectedValue: number;
}

export interface ResearchResource {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  source: string;
  type: ResourceType;
  quality: ResourceQuality;
  freshness: ResourceFreshness;
}

/**
 * Conservative Strategy
 * High confidence threshold, academic sources, thorough analysis
 */
export const CONSERVATIVE_STRATEGY: ResearchStrategy = {
  name: 'Conservative',
  description: 'Low risk, thorough analysis, high confidence threshold, prefers academic sources',
  
  riskTolerance: 0.2,
  confidenceThreshold: 0.8,
  
  maxResearchBudget: '0.15',
  minResearchBudget: '0.05',
  maxResourcesPerAnalysis: 5,
  
  preferredSources: ['academic', 'expert'],
  minQualityThreshold: 0.8,
  minFreshnessThreshold: 0.6,
  
  speedPreference: 'thorough',
  maxAnalysisTime: 300, // 5 minutes
  
  valueThreshold: 0.7,
  diversificationBonus: 0.2,
  costEfficiencyWeight: 0.6
};

/**
 * Aggressive Strategy
 * Expensive data, lower confidence threshold, fast analysis
 */
export const AGGRESSIVE_STRATEGY: ResearchStrategy = {
  name: 'Aggressive',
  description: 'High risk, fast analysis, lower confidence threshold, willing to pay for premium data',
  
  riskTolerance: 0.8,
  confidenceThreshold: 0.6,
  
  maxResearchBudget: '0.25',
  minResearchBudget: '0.10',
  maxResourcesPerAnalysis: 8,
  
  preferredSources: ['expert', 'data', 'news'],
  minQualityThreshold: 0.6,
  minFreshnessThreshold: 0.8,
  
  speedPreference: 'fast',
  maxAnalysisTime: 120, // 2 minutes
  
  valueThreshold: 0.5,
  diversificationBonus: 0.1,
  costEfficiencyWeight: 0.3
};

/**
 * Speed Demon Strategy
 * Fast, cheap research, minimal confidence threshold
 */
export const SPEED_DEMON_STRATEGY: ResearchStrategy = {
  name: 'Speed Demon',
  description: 'Ultra-fast analysis, minimal research budget, quick decisions, low confidence threshold',
  
  riskTolerance: 0.9,
  confidenceThreshold: 0.5,
  
  maxResearchBudget: '0.05',
  minResearchBudget: '0.01',
  maxResourcesPerAnalysis: 3,
  
  preferredSources: ['social', 'news'],
  minQualityThreshold: 0.4,
  minFreshnessThreshold: 0.9,
  
  speedPreference: 'fast',
  maxAnalysisTime: 60, // 1 minute
  
  valueThreshold: 0.3,
  diversificationBonus: 0.05,
  costEfficiencyWeight: 0.8
};

/**
 * Academic Strategy
 * Deep research, scholarly sources, high quality threshold
 */
export const ACADEMIC_STRATEGY: ResearchStrategy = {
  name: 'Academic',
  description: 'Deep research, scholarly sources, high quality threshold, thorough analysis',
  
  riskTolerance: 0.3,
  confidenceThreshold: 0.85,
  
  maxResearchBudget: '0.20',
  minResearchBudget: '0.08',
  maxResourcesPerAnalysis: 6,
  
  preferredSources: ['academic', 'expert'],
  minQualityThreshold: 0.9,
  minFreshnessThreshold: 0.5,
  
  speedPreference: 'thorough',
  maxAnalysisTime: 600, // 10 minutes
  
  valueThreshold: 0.8,
  diversificationBonus: 0.3,
  costEfficiencyWeight: 0.4
};

/**
 * Balanced Strategy
 * Moderate approach, balanced preferences
 */
export const BALANCED_STRATEGY: ResearchStrategy = {
  name: 'Balanced',
  description: 'Moderate risk, balanced approach, moderate confidence threshold',
  
  riskTolerance: 0.5,
  confidenceThreshold: 0.7,
  
  maxResearchBudget: '0.12',
  minResearchBudget: '0.04',
  maxResourcesPerAnalysis: 4,
  
  preferredSources: ['academic', 'news', 'data'],
  minQualityThreshold: 0.6,
  minFreshnessThreshold: 0.7,
  
  speedPreference: 'balanced',
  maxAnalysisTime: 180, // 3 minutes
  
  valueThreshold: 0.6,
  diversificationBonus: 0.15,
  costEfficiencyWeight: 0.5
};

/**
 * Data-Driven Strategy
 * Focuses on quantitative data and statistics
 */
export const DATA_DRIVEN_STRATEGY: ResearchStrategy = {
  name: 'Data-Driven',
  description: 'Focuses on quantitative data, statistics, and numerical analysis',
  
  riskTolerance: 0.4,
  confidenceThreshold: 0.75,
  
  maxResearchBudget: '0.18',
  minResearchBudget: '0.06',
  maxResourcesPerAnalysis: 5,
  
  preferredSources: ['data', 'academic'],
  minQualityThreshold: 0.7,
  minFreshnessThreshold: 0.8,
  
  speedPreference: 'balanced',
  maxAnalysisTime: 240, // 4 minutes
  
  valueThreshold: 0.65,
  diversificationBonus: 0.2,
  costEfficiencyWeight: 0.6
};

/**
 * News Junkie Strategy
 * Focuses on breaking news and current events
 */
export const NEWS_JUNKIE_STRATEGY: ResearchStrategy = {
  name: 'News Junkie',
  description: 'Focuses on breaking news, current events, and real-time information',
  
  riskTolerance: 0.6,
  confidenceThreshold: 0.65,
  
  maxResearchBudget: '0.10',
  minResearchBudget: '0.03',
  maxResourcesPerAnalysis: 4,
  
  preferredSources: ['news', 'social'],
  minQualityThreshold: 0.5,
  minFreshnessThreshold: 0.95,
  
  speedPreference: 'fast',
  maxAnalysisTime: 90, // 1.5 minutes
  
  valueThreshold: 0.4,
  diversificationBonus: 0.1,
  costEfficiencyWeight: 0.7
};

/**
 * Expert Network Strategy
 * Focuses on expert opinions and professional insights
 */
export const EXPERT_NETWORK_STRATEGY: ResearchStrategy = {
  name: 'Expert Network',
  description: 'Focuses on expert opinions, professional insights, and specialized knowledge',
  
  riskTolerance: 0.35,
  confidenceThreshold: 0.8,
  
  maxResearchBudget: '0.22',
  minResearchBudget: '0.07',
  maxResourcesPerAnalysis: 5,
  
  preferredSources: ['expert', 'academic'],
  minQualityThreshold: 0.8,
  minFreshnessThreshold: 0.6,
  
  speedPreference: 'balanced',
  maxAnalysisTime: 300, // 5 minutes
  
  valueThreshold: 0.75,
  diversificationBonus: 0.25,
  costEfficiencyWeight: 0.4
};

/**
 * Get all available strategies
 */
export function getAllStrategies(): ResearchStrategy[] {
  return [
    CONSERVATIVE_STRATEGY,
    AGGRESSIVE_STRATEGY,
    SPEED_DEMON_STRATEGY,
    ACADEMIC_STRATEGY,
    BALANCED_STRATEGY,
    DATA_DRIVEN_STRATEGY,
    NEWS_JUNKIE_STRATEGY,
    EXPERT_NETWORK_STRATEGY
  ];
}

/**
 * Get strategy by name
 */
export function getStrategyByName(name: string): ResearchStrategy | null {
  const strategies = getAllStrategies();
  return strategies.find(strategy => strategy.name.toLowerCase() === name.toLowerCase()) || null;
}

/**
 * Create a custom strategy
 */
export function createCustomStrategy(
  name: string,
  description: string,
  overrides: Partial<ResearchStrategy>
): ResearchStrategy {
  const baseStrategy: ResearchStrategy = {
    name,
    description,
    riskTolerance: 0.5,
    confidenceThreshold: 0.7,
    maxResearchBudget: '0.10',
    minResearchBudget: '0.03',
    maxResourcesPerAnalysis: 4,
    preferredSources: ['academic', 'news'],
    minQualityThreshold: 0.6,
    minFreshnessThreshold: 0.7,
    speedPreference: 'balanced',
    maxAnalysisTime: 180,
    valueThreshold: 0.6,
    diversificationBonus: 0.15,
    costEfficiencyWeight: 0.5
  };

  return { ...baseStrategy, ...overrides };
}

/**
 * Validate a research strategy
 */
export function validateStrategy(strategy: ResearchStrategy): string[] {
  const errors: string[] = [];

  if (strategy.riskTolerance < 0 || strategy.riskTolerance > 1) {
    errors.push('Risk tolerance must be between 0 and 1');
  }

  if (strategy.confidenceThreshold < 0 || strategy.confidenceThreshold > 1) {
    errors.push('Confidence threshold must be between 0 and 1');
  }

  if (parseFloat(strategy.maxResearchBudget) < parseFloat(strategy.minResearchBudget)) {
    errors.push('Max research budget must be greater than min research budget');
  }

  if (strategy.maxResourcesPerAnalysis < 1) {
    errors.push('Max resources per analysis must be at least 1');
  }

  if (strategy.minQualityThreshold < 0 || strategy.minQualityThreshold > 1) {
    errors.push('Min quality threshold must be between 0 and 1');
  }

  if (strategy.minFreshnessThreshold < 0 || strategy.minFreshnessThreshold > 1) {
    errors.push('Min freshness threshold must be between 0 and 1');
  }

  if (strategy.maxAnalysisTime < 30) {
    errors.push('Max analysis time must be at least 30 seconds');
  }

  if (strategy.valueThreshold < 0 || strategy.valueThreshold > 1) {
    errors.push('Value threshold must be between 0 and 1');
  }

  if (strategy.diversificationBonus < 0 || strategy.diversificationBonus > 1) {
    errors.push('Diversification bonus must be between 0 and 1');
  }

  if (strategy.costEfficiencyWeight < 0 || strategy.costEfficiencyWeight > 1) {
    errors.push('Cost efficiency weight must be between 0 and 1');
  }

  return errors;
}

/**
 * Compare two strategies
 */
export function compareStrategies(strategy1: ResearchStrategy, strategy2: ResearchStrategy): {
  riskTolerance: number;
  confidenceThreshold: number;
  maxResearchBudget: number;
  speedPreference: string;
  preferredSources: string[];
} {
  return {
    riskTolerance: strategy1.riskTolerance - strategy2.riskTolerance,
    confidenceThreshold: strategy1.confidenceThreshold - strategy2.confidenceThreshold,
    maxResearchBudget: parseFloat(strategy1.maxResearchBudget) - parseFloat(strategy2.maxResearchBudget),
    speedPreference: strategy1.speedPreference,
    preferredSources: strategy1.preferredSources.filter(source => 
      !strategy2.preferredSources.includes(source)
    )
  };
}

