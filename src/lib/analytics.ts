export function trackEvent(eventName: string, properties?: Record<string, any>) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}`, properties);
  }
  
  // In production, send to your analytics service
  // Example: window.gtag?.('event', eventName, properties);
  // Example: window.plausible?.(eventName, { props: properties });
}

export function trackAgentCreated(agent: any) {
  trackEvent('agent_created', {
    strategy: agent.strategy_type,
    initial_balance: agent.initial_balance_usdt,
    generation: agent.generation || 0
  });
}

export function trackAgentBred(parent1: any, parent2: any, offspring: any) {
  trackEvent('agent_bred', {
    parent1_strategy: parent1.strategy_type,
    parent2_strategy: parent2.strategy_type,
    offspring_strategy: offspring.strategy_type,
    offspring_generation: offspring.generation,
    mutations_count: offspring.mutations?.length || 0
  });
}

export function trackPredictionMade(prediction: any) {
  trackEvent('prediction_made', {
    agent_strategy: prediction.agent_strategy,
    prediction: prediction.prediction,
    confidence: prediction.confidence,
    research_cost: prediction.research_cost
  });
}

export function trackAgentBankrupt(agent: any) {
  trackEvent('agent_bankrupt', {
    strategy: agent.strategy_type,
    generation: agent.generation,
    total_predictions: agent.total_predictions,
    final_accuracy: agent.accuracy
  });
}

export function trackPageView(path: string) {
  trackEvent('page_view', { path });
}

export function trackError(error: Error, context?: string) {
  trackEvent('error', {
    message: error.message,
    stack: error.stack,
    context
  });
}

