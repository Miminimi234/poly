import { ethers } from 'ethers';
import type { SupabaseClient } from '@supabase/supabase-js';

interface Agent {
  id: string;
  name: string;
  strategy_type: string;
  accuracy: number;
  roi: number;
  total_profit_loss: number;
  current_balance_usdt: number;
  generation?: number;
  traits?: any;
  is_active: boolean;
  is_bankrupt: boolean;
}

interface BreedingResult {
  success: boolean;
  offspring?: {
    id: string;
    name: string;
    strategy_type: string;
    parent1_id: string;
    parent2_id: string;
    generation: number;
    mutations: string[];
  };
  error?: string;
}

// Genetic traits that can be inherited or mutated
const GENETIC_TRAITS = {
  confidence_threshold: [0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85],
  research_budget_ratio: [0.05, 0.10, 0.15, 0.20],
  decision_speed: ['FAST', 'MEDIUM', 'SLOW'],
  risk_tolerance: ['LOW', 'MEDIUM', 'HIGH'],
  research_depth: ['SHALLOW', 'MODERATE', 'DEEP']
};

// Strategy compatibility matrix (determines offspring strategy)
const STRATEGY_COMBINATIONS: Record<string, string> = {
  'AGGRESSIVE-CONSERVATIVE': 'balanced',
  'ACADEMIC-CONSERVATIVE': 'conservative',
  'CONSERVATIVE-SPEED_DEMON': 'data_driven',
  'AGGRESSIVE-SPEED_DEMON': 'aggressive',
  'ACADEMIC-DATA_DRIVEN': 'academic',
  'BALANCED-DATA_DRIVEN': 'data_driven',
  'AGGRESSIVE-NEWS_JUNKIE': 'news_junkie',
  'EXPERT_NETWORK-ACADEMIC': 'expert_network',
  'NEWS_JUNKIE-SPEED_DEMON': 'news_junkie',
  'BALANCED-CONSERVATIVE': 'balanced'
};

export async function canBreed(
  supabase: SupabaseClient,
  agent1Id: string,
  agent2Id: string
): Promise<{
  canBreed: boolean;
  reason?: string;
}> {
  try {
    // Get both agents
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .in('id', [agent1Id, agent2Id]);
    
    if (error) throw error;
    if (!agents || agents.length !== 2) {
      return { canBreed: false, reason: 'One or both agents not found' };
    }
    
    const [agent1, agent2] = agents;
    
    // Check if agents are the same
    if (agent1.id === agent2.id) {
      return { canBreed: false, reason: 'Cannot breed an agent with itself' };
    }
    
    // Check if either agent is bankrupt
    if (agent1.is_bankrupt || agent2.is_bankrupt) {
      return { canBreed: false, reason: 'Bankrupt agents cannot breed' };
    }
    
    // Check if either agent is inactive
    if (!agent1.is_active || !agent2.is_active) {
      return { canBreed: false, reason: 'Inactive agents cannot breed' };
    }
    
    // Check minimum performance requirements
    const { data: predictions1 } = await supabase
      .from('agent_predictions')
      .select('correct')
      .eq('agent_id', agent1.id)
      .not('correct', 'is', null);
    
    const { data: predictions2 } = await supabase
      .from('agent_predictions')
      .select('correct')
      .eq('agent_id', agent2.id)
      .not('correct', 'is', null);
    
    const resolvedCount1 = predictions1?.length || 0;
    const resolvedCount2 = predictions2?.length || 0;
    
    // Both agents must have at least 5 resolved predictions
    if (resolvedCount1 < 5 || resolvedCount2 < 5) {
      return { 
        canBreed: false, 
        reason: 'Both agents need at least 5 resolved predictions to breed' 
      };
    }
    
    // Check if agents have sufficient balance (breeding cost: $50)
    if (agent1.current_balance_usdt < 50 || agent2.current_balance_usdt < 50) {
      return {
        canBreed: false,
        reason: 'Both agents need at least $50 balance to breed'
      };
    }
    
    return { canBreed: true };
    
  } catch (error) {
    console.error('Error checking breed eligibility:', error);
    return { canBreed: false, reason: 'Error checking eligibility' };
  }
}

export async function breedAgents(
  supabase: SupabaseClient,
  parent1Id: string,
  parent2Id: string,
  offspringName?: string
): Promise<BreedingResult> {
  try {
    // Check if breeding is allowed
    const eligibility = await canBreed(supabase, parent1Id, parent2Id);
    if (!eligibility.canBreed) {
      return { success: false, error: eligibility.reason };
    }
    
    // Get parent agents
    const { data: parents, error } = await supabase
      .from('agents')
      .select('*')
      .in('id', [parent1Id, parent2Id]);
    
    if (error) throw error;
    if (!parents || parents.length !== 2) {
      return { success: false, error: 'Parents not found' };
    }
    
    const [parent1, parent2] = parents;
    
    // Determine offspring strategy (genetic crossover)
    const offspringStrategy = determineOffspringStrategy(
      parent1.strategy_type,
      parent2.strategy_type
    );
    
    // Generate offspring name
    const generatedName = offspringName || generateOffspringName(parent1, parent2);
    
    // Calculate generation (max of parents + 1)
    const parent1Gen = parent1.generation || 0;
    const parent2Gen = parent2.generation || 0;
    const offspringGeneration = Math.max(parent1Gen, parent2Gen) + 1;
    
    // Apply mutations (15% chance per trait)
    const mutations = applyMutations();
    
    // Calculate initial balance (average of parents / 2)
    const initialBalance = ((parent1.current_balance_usdt + parent2.current_balance_usdt) / 2) / 2;
    
    // Create wallet for offspring
    const wallet = ethers.Wallet.createRandom();
    
    // Calculate inherited traits
    const traits = inheritTraits(parent1, parent2, mutations);
    
    // Create offspring agent
    const { data: offspring, error: createError } = await supabase
      .from('agents')
      .insert({
        name: generatedName,
        description: `Offspring of ${parent1.name} × ${parent2.name}`,
        strategy_type: offspringStrategy,
        wallet_address: wallet.address,
        wallet_private_key_encrypted: wallet.privateKey,
        current_balance_usdt: initialBalance,
        initial_balance_usdt: initialBalance,
        total_spent_usdt: 0,
        total_earned_usdt: 0,
        accuracy: 0,
        total_predictions: 0,
        total_profit_loss: 0,
        roi: 0,
        is_active: true,
        is_bankrupt: false,
        parent1_id: parent1.id,
        parent2_id: parent2.id,
        generation: offspringGeneration,
        mutations: mutations,
        traits: traits
      })
      .select()
      .single();
    
    if (createError) throw createError;
    
    // Deduct breeding cost from parents ($50 each)
    await supabase
      .from('agents')
      .update({ current_balance_usdt: parent1.current_balance_usdt - 50 })
      .eq('id', parent1.id);
    
    await supabase
      .from('agents')
      .update({ current_balance_usdt: parent2.current_balance_usdt - 50 })
      .eq('id', parent2.id);
    
    // Log breeding event
    await supabase
      .from('breeding_history')
      .insert({
        parent1_id: parent1.id,
        parent2_id: parent2.id,
        offspring_id: offspring.id,
        strategy_combination: `${parent1.strategy_type}-${parent2.strategy_type}`,
        offspring_strategy: offspringStrategy,
        generation: offspringGeneration,
        mutations: mutations,
        breeding_cost: 100
      });
    
    console.log(`Bred new agent: ${offspring.name} (Gen ${offspringGeneration})`);
    
    return {
      success: true,
      offspring: {
        id: offspring.id,
        name: offspring.name,
        strategy_type: offspring.strategy_type,
        parent1_id: parent1.id,
        parent2_id: parent2.id,
        generation: offspringGeneration,
        mutations: mutations
      }
    };
    
  } catch (error: any) {
    console.error('Breeding error:', error);
    return { success: false, error: error.message || 'Breeding failed' };
  }
}

function determineOffspringStrategy(
  strategy1: string,
  strategy2: string
): string {
  // Create combination key (alphabetically sorted, uppercase)
  const combo = [strategy1.toUpperCase(), strategy2.toUpperCase()].sort().join('-');
  
  // Check predefined combinations
  if (STRATEGY_COMBINATIONS[combo]) {
    return STRATEGY_COMBINATIONS[combo];
  }
  
  // Default: random choice between parents
  return Math.random() > 0.5 ? strategy1 : strategy2;
}

function generateOffspringName(parent1: Agent, parent2: Agent): string {
  const prefixes = ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'OMEGA', 'NOVA', 'APEX', 'PRIME'];
  const suffixes = ['X', 'II', 'NEO', 'PRO', 'ELITE', 'PLUS', 'MAX', 'ULTRA'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const timestamp = Date.now().toString().slice(-4);
  
  return `${prefix}_${suffix}_${timestamp}`;
}

function applyMutations(): string[] {
  const mutations: string[] = [];
  const mutationChance = 0.15; // 15% chance per trait
  
  const possibleMutations = [
    'ENHANCED_ACCURACY',
    'INCREASED_SPEED',
    'RISK_ADAPTED',
    'RESEARCH_EFFICIENT',
    'PATTERN_RECOGNITION',
    'CONTRARIAN_BIAS',
    'MOMENTUM_SENSITIVE',
    'CONSERVATIVE_SHIFT',
    'AGGRESSIVE_SHIFT'
  ];
  
  for (const mutation of possibleMutations) {
    if (Math.random() < mutationChance) {
      mutations.push(mutation);
    }
  }
  
  return mutations;
}

function inheritTraits(parent1: Agent, parent2: Agent, mutations: string[]): any {
  const traits: any = {};
  
  // Inherit confidence threshold (average of parents with mutation)
  const baseConfidence = (
    (parent1.traits?.confidence_threshold || 0.7) +
    (parent2.traits?.confidence_threshold || 0.7)
  ) / 2;
  
  traits.confidence_threshold = mutations.includes('ENHANCED_ACCURACY')
    ? Math.min(baseConfidence + 0.05, 0.90)
    : baseConfidence;
  
  // Inherit research budget (average)
  traits.research_budget_ratio = (
    (parent1.traits?.research_budget_ratio || 0.10) +
    (parent2.traits?.research_budget_ratio || 0.10)
  ) / 2;
  
  if (mutations.includes('RESEARCH_EFFICIENT')) {
    traits.research_budget_ratio *= 0.8; // 20% more efficient
  }
  
  // Inherit decision speed
  const parent1Speed = parent1.traits?.decision_speed || 'MEDIUM';
  const parent2Speed = parent2.traits?.decision_speed || 'MEDIUM';
  
  traits.decision_speed = mutations.includes('INCREASED_SPEED')
    ? 'FAST'
    : (Math.random() > 0.5 ? parent1Speed : parent2Speed);
  
  // Inherit risk tolerance
  const parent1Risk = parent1.traits?.risk_tolerance || 'MEDIUM';
  const parent2Risk = parent2.traits?.risk_tolerance || 'MEDIUM';
  
  if (mutations.includes('CONSERVATIVE_SHIFT')) {
    traits.risk_tolerance = 'LOW';
  } else if (mutations.includes('AGGRESSIVE_SHIFT')) {
    traits.risk_tolerance = 'HIGH';
  } else if (mutations.includes('RISK_ADAPTED')) {
    // Adapt based on parent performance
    const parent1ROI = parent1.roi || 0;
    const parent2ROI = parent2.roi || 0;
    const avgROI = (parent1ROI + parent2ROI) / 2;
    
    if (avgROI > 20) {
      traits.risk_tolerance = parent1ROI > parent2ROI ? parent1Risk : parent2Risk;
    } else {
      traits.risk_tolerance = 'MEDIUM';
    }
  } else {
    traits.risk_tolerance = Math.random() > 0.5 ? parent1Risk : parent2Risk;
  }
  
  return traits;
}

export async function getBreedingHistory(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('breeding_history')
      .select(`
        *,
        parent1:parent1_id (name, strategy_type, accuracy),
        parent2:parent2_id (name, strategy_type, accuracy),
        offspring:offspring_id (name, strategy_type, accuracy, is_active)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return { success: true, history: data };
    
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

