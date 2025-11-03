export interface Strategy {
  type: string;
  name: string;
  description: string;
  icon: string;
  confidenceThreshold: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  researchSources: string[];
  color: string;
  traits: string[];
}

export const AGENT_STRATEGIES: Strategy[] = [
  {
    type: 'conservative',
    name: 'Conservative',
    description: 'Careful analysis with academic sources. Only bets when confidence >80%.',
    icon: '■',
    confidenceThreshold: 0.80,
    riskLevel: 'LOW',
    researchSources: ['valyu-academic', 'news-feeds'],
    color: 'blue',
    traits: ['HIGH ACCURACY', 'LOW RISK', 'EXPENSIVE', 'SLOW']
  },
  {
    type: 'aggressive',
    name: 'Aggressive',
    description: 'Takes risks on high-upside opportunities. Confidence threshold 60%.',
    icon: '▲',
    confidenceThreshold: 0.60,
    riskLevel: 'HIGH',
    researchSources: ['valyu-web', 'sentiment'],
    color: 'red',
    traits: ['HIGH ROI', 'HIGH RISK', 'FAST', 'MANY BETS']
  },
  {
    type: 'speed_demon',
    name: 'Speed Demon',
    description: 'Lightning-fast decisions using cheap data sources. Volume over precision.',
    icon: '►',
    confidenceThreshold: 0.55,
    riskLevel: 'MEDIUM',
    researchSources: ['valyu-web'],
    color: 'yellow',
    traits: ['FASTEST', 'CHEAP', 'HIGH VOLUME', 'MOMENTUM']
  },
  {
    type: 'academic',
    name: 'Academic',
    description: 'Deep research with scholarly sources. Thorough analysis takes time.',
    icon: '▣',
    confidenceThreshold: 0.75,
    riskLevel: 'LOW',
    researchSources: ['valyu-academic', 'expert-analysis', 'news-feeds'],
    color: 'purple',
    traits: ['THOROUGH', 'EXPENSIVE', 'HIGH ACCURACY', 'SLOW']
  },
  {
    type: 'balanced',
    name: 'Balanced',
    description: 'Balanced approach combining multiple data sources for steady performance.',
    icon: '◆',
    confidenceThreshold: 0.70,
    riskLevel: 'MEDIUM',
    researchSources: ['valyu-web', 'news-feeds', 'sentiment'],
    color: 'green',
    traits: ['BALANCED', 'VERSATILE', 'STEADY', 'RELIABLE']
  },
  {
    type: 'data_driven',
    name: 'Data-Driven',
    description: 'Quantitative analysis focused on statistical edges and patterns.',
    icon: '▦',
    confidenceThreshold: 0.70,
    riskLevel: 'MEDIUM',
    researchSources: ['valyu-web', 'news-feeds'],
    color: 'cyan',
    traits: ['STATISTICAL', 'PATTERNS', 'BALANCED', 'MEDIUM COST']
  },
  {
    type: 'news_junkie',
    name: 'News Junkie',
    description: 'Focuses on breaking news and real-time events to make quick predictions.',
    icon: '▧',
    confidenceThreshold: 0.65,
    riskLevel: 'MEDIUM',
    researchSources: ['news-feeds', 'valyu-web'],
    color: 'orange',
    traits: ['NEWS FOCUSED', 'FAST', 'EVENT DRIVEN', 'REACTIVE']
  },
  {
    type: 'expert_network',
    name: 'Expert Network',
    description: 'Relies on expert analysis and high-quality insights for premium predictions.',
    icon: '◈',
    confidenceThreshold: 0.75,
    riskLevel: 'LOW',
    researchSources: ['expert-analysis', 'valyu-academic'],
    color: 'pink',
    traits: ['EXPERT DRIVEN', 'PREMIUM', 'HIGH QUALITY', 'EXPENSIVE']
  }
];

export function getStrategy(type: string): Strategy | undefined {
  return AGENT_STRATEGIES.find(s => s.type === type.toLowerCase());
}

export function getStrategyColor(type: string): string {
  const strategy = getStrategy(type);
  return strategy?.color || 'gray';
}

export function getStrategyIcon(type: string): string {
  const strategy = getStrategy(type);
  return strategy?.icon || '●';
}

