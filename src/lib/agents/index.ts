/**
 * Autonomous Agents Module
 * Exports all autonomous agent functionality
 */

// Core agent engine and components
export { PredictionAgent } from './agent-engine';
export type {
  MarketAnalysis, AgentConfig as ResearchAgentConfig,
  AgentPerformance as ResearchAgentPerformance
} from './agent-engine';

export { AutonomousAgent } from './autonomous-agent-engine';
export type {
  AgentStrategy,
  AgentConfig as AutonomousAgentConfig,
  AgentPerformance as AutonomousAgentPerformance,
  MarketOpportunity
} from './autonomous-agent-engine';

export { AgentFactory } from './agent-factory';
export type { AgentFactoryConfig } from './agent-factory';

export * from './research-strategies';

// Re-export existing poly402 agents for compatibility
export * from './analyst';
export * from './critic';
export * from './driver-generator';
export * from './interval-optimizer';
export * from './orchestrator';
export * from './planner';
export * from './reporter';
export * from './researcher';

