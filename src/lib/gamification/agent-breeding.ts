/**
 * Agent Breeding System
 * Genetic algorithm approach to evolving better research strategies
 */

import { ResearchStrategy } from '../agents/research-strategies';

export interface AgentDNA {
  // Risk profile
  riskTolerance: number;
  confidenceThreshold: number;
  
  // Budget management
  maxResearchBudget: number;
  researchEfficiencyFactor: number;
  
  // Source preferences
  academicWeight: number;
  expertWeight: number;
  newsWeight: number;
  dataWeight: number;
  
  // Timing preferences
  speedPreference: number; // 0-1 where 0 is thorough, 1 is fast
  urgencyThreshold: number;
  
  // Quality thresholds
  qualityThreshold: number;
  freshnessThreshold: number;
  
  // Diversification
  diversificationBonus: number;
  researchCountPreference: number;
  
  // Parent information
  parentA?: string;
  parentB?: string;
  generation: number;
}

export interface BreedingResult {
  childDNA: AgentDNA;
  childStrategy: ResearchStrategy;
  expectedPerformance: number;
  mutationCount: number;
}

/**
 * Create DNA from a research strategy
 */
export function createDNAFromStrategy(
  strategy: ResearchStrategy,
  parentA?: string,
  parentB?: string,
  generation: number = 0
): AgentDNA {
  return {
    riskTolerance: strategy.riskTolerance,
    confidenceThreshold: strategy.confidenceThreshold,
    maxResearchBudget: parseFloat(strategy.maxResearchBudget),
    researchEfficiencyFactor: strategy.costEfficiencyWeight,
    academicWeight: strategy.preferredSources.includes('academic') ? 1 : 0,
    expertWeight: strategy.preferredSources.includes('expert') ? 1 : 0,
    newsWeight: strategy.preferredSources.includes('news') ? 0.5 : 0,
    dataWeight: strategy.preferredSources.includes('data') ? 0.8 : 0,
    speedPreference: strategy.speedPreference === 'fast' ? 0.8 : 
                    strategy.speedPreference === 'thorough' ? 0.2 : 0.5,
    urgencyThreshold: 0.7,
    qualityThreshold: strategy.minQualityThreshold,
    freshnessThreshold: strategy.minFreshnessThreshold,
    diversificationBonus: strategy.diversificationBonus,
    researchCountPreference: strategy.maxResourcesPerAnalysis,
    parentA,
    parentB,
    generation
  };
}

/**
 * Breed two agents to create offspring
 */
export function breedAgents(
  parentA: AgentDNA,
  parentB: AgentDNA,
  mutationRate: number = 0.1
): BreedingResult {
  const childDNA: AgentDNA = {
    // Crossover - take traits from both parents
    riskTolerance: Math.random() > 0.5 ? parentA.riskTolerance : parentB.riskTolerance,
    confidenceThreshold: Math.random() > 0.5 ? parentA.confidenceThreshold : parentB.confidenceThreshold,
    maxResearchBudget: Math.random() > 0.5 ? parentA.maxResearchBudget : parentB.maxResearchBudget,
    researchEfficiencyFactor: Math.random() > 0.5 ? parentA.researchEfficiencyFactor : parentB.researchEfficiencyFactor,
    
    // Average weights for source preferences
    academicWeight: (parentA.academicWeight + parentB.academicWeight) / 2,
    expertWeight: (parentA.expertWeight + parentB.expertWeight) / 2,
    newsWeight: (parentA.newsWeight + parentB.newsWeight) / 2,
    dataWeight: (parentA.dataWeight + parentB.dataWeight) / 2,
    
    speedPreference: (parentA.speedPreference + parentB.speedPreference) / 2,
    urgencyThreshold: (parentA.urgencyThreshold + parentB.urgencyThreshold) / 2,
    qualityThreshold: (parentA.qualityThreshold + parentB.qualityThreshold) / 2,
    freshnessThreshold: (parentA.freshnessThreshold + parentB.freshnessThreshold) / 2,
    diversificationBonus: (parentA.diversificationBonus + parentB.diversificationBonus) / 2,
    researchCountPreference: Math.round((parentA.researchCountPreference + parentB.researchCountPreference) / 2),
    
    parentA: parentA.parentA, // Preserve lineage
    parentB: parentB.parentB,
    generation: Math.max(parentA.generation, parentB.generation) + 1
  };

  // Apply mutations
  let mutationCount = 0;
  const traitsToMutate = Object.keys(childDNA).filter(key => 
    !['parentA', 'parentB', 'generation'].includes(key)
  );

  for (const trait of traitsToMutate) {
    if (Math.random() < mutationRate) {
      mutationCount++;
      childDNA[trait as keyof AgentDNA] = mutateTrait(
        trait as keyof AgentDNA,
        childDNA[trait as keyof AgentDNA] as number
      );
    }
  }

  // Convert DNA back to strategy
  const childStrategy = dnaToStrategy(childDNA);
  
  // Estimate expected performance based on DNA fitness
  const expectedPerformance = calculateFitness(childDNA, parentA, parentB);

  return {
    childDNA,
    childStrategy,
    expectedPerformance,
    mutationCount
  };
}

/**
 * Mutate a trait with small random variations
 */
function mutateTrait(trait: keyof AgentDNA, value: number): number {
  const mutationStrength = 0.2; // 20% variation
  const variation = (Math.random() - 0.5) * 2 * mutationStrength;
  
  let mutated = value + variation;
  
  // Clamp to valid ranges
  switch (trait) {
    case 'riskTolerance':
    case 'confidenceThreshold':
    case 'speedPreference':
    case 'qualityThreshold':
    case 'freshnessThreshold':
    case 'diversificationBonus':
      mutated = Math.max(0, Math.min(1, mutated));
      break;
    case 'maxResearchBudget':
      mutated = Math.max(0.01, Math.min(1.0, mutated));
      break;
    case 'academicWeight':
    case 'expertWeight':
    case 'newsWeight':
    case 'dataWeight':
      mutated = Math.max(0, Math.min(1, mutated));
      break;
    case 'urgencyThreshold':
      mutated = Math.max(0.3, Math.min(1.0, mutated));
      break;
    case 'researchCountPreference':
      mutated = Math.max(1, Math.min(10, Math.round(mutated)));
      break;
  }
  
  return mutated;
}

/**
 * Convert DNA to research strategy
 */
function dnaToStrategy(dna: AgentDNA): ResearchStrategy {
  const preferredSources: string[] = [];
  if (dna.academicWeight > 0.3) preferredSources.push('academic');
  if (dna.expertWeight > 0.3) preferredSources.push('expert');
  if (dna.newsWeight > 0.3) preferredSources.push('news');
  if (dna.dataWeight > 0.3) preferredSources.push('data');
  
  if (preferredSources.length === 0) {
    preferredSources.push('academic', 'news');
  }

  const speedPreference = dna.speedPreference > 0.6 ? 'fast' :
                         dna.speedPreference < 0.4 ? 'thorough' : 'balanced';

  return {
    name: `Hybrid Gen${dna.generation}`,
    description: `Evolved agent with combined traits from generation ${dna.generation}`,
    riskTolerance: dna.riskTolerance,
    confidenceThreshold: dna.confidenceThreshold,
    maxResearchBudget: dna.maxResearchBudget.toString(),
    minResearchBudget: (dna.maxResearchBudget * 0.3).toString(),
    maxResourcesPerAnalysis: dna.researchCountPreference,
    preferredSources: preferredSources as any,
    minQualityThreshold: dna.qualityThreshold,
    minFreshnessThreshold: dna.freshnessThreshold,
    speedPreference: speedPreference as any,
    maxAnalysisTime: dna.speedPreference > 0.7 ? 60 : dna.speedPreference < 0.3 ? 600 : 180,
    valueThreshold: 0.6,
    diversificationBonus: dna.diversificationBonus,
    costEfficiencyWeight: dna.researchEfficiencyFactor
  };
}

/**
 * Calculate fitness score for DNA
 */
function calculateFitness(
  dna: AgentDNA,
  parentA: AgentDNA,
  parentB: AgentDNA
): number {
  // Higher diversity is better
  const sourceDiversity = dna.academicWeight + dna.expertWeight + 
                         dna.newsWeight + dna.dataWeight;
  
  // Balanced traits are generally better
  const balanceScore = 1 - Math.abs(dna.riskTolerance - 0.5) - 
                       Math.abs(dna.confidenceThreshold - 0.7);
  
  // Good cost efficiency is valuable
  const efficiencyScore = dna.researchEfficiencyFactor;
  
  // Combine scores
  const fitness = (sourceDiversity * 0.3) + (balanceScore * 0.3) + (efficiencyScore * 0.4);
  
  return Math.max(0, Math.min(1, fitness));
}

/**
 * Generate random DNA for initial population
 */
export function generateRandomDNA(generation: number = 0): AgentDNA {
  return {
    riskTolerance: Math.random(),
    confidenceThreshold: 0.5 + Math.random() * 0.3,
    maxResearchBudget: 0.05 + Math.random() * 0.15,
    researchEfficiencyFactor: Math.random(),
    academicWeight: Math.random(),
    expertWeight: Math.random(),
    newsWeight: Math.random() * 0.5,
    dataWeight: Math.random() * 0.8,
    speedPreference: Math.random(),
    urgencyThreshold: 0.5 + Math.random() * 0.3,
    qualityThreshold: 0.4 + Math.random() * 0.4,
    freshnessThreshold: 0.5 + Math.random() * 0.3,
    diversificationBonus: Math.random() * 0.3,
    researchCountPreference: 3 + Math.floor(Math.random() * 5),
    generation
  };
}

/**
 * Extract DNA from agent performance to preserve good traits
 */
export function extractDNAFromPerformance(
  agentPerformance: {
    accuracy: number;
    roi: number;
    researchPurchasesCount: number;
    strategyType: string;
  }
): Partial<AgentDNA> {
  // Infer DNA traits from performance
  const highAccuracy = agentPerformance.accuracy > 0.7;
  const highROI = agentPerformance.roi > 0;
  
  return {
    riskTolerance: highROI ? 0.6 : 0.3,
    confidenceThreshold: highAccuracy ? 0.75 : 0.6,
    researchEfficiencyFactor: highROI ? 0.7 : 0.5
  };
}

