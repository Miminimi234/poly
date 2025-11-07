import useUserAgentStore from '@/lib/stores/use-user-agent-store';
import { useCallback, useEffect, useRef } from 'react';

interface Options {
    intervalMs?: number;
    betAmount?: number;
}

export default function useAgentAutoPredictor(agentId: string | null, options: Options = {}) {
    const intervalMs = options.intervalMs ?? 6 * 1000; // 6 seconds default for dev/testing
    const betAmount = options.betAmount ?? 10;
    const timerRef = useRef<number | null>(null);
    const runningRef = useRef(false);

    const getState = useUserAgentStore.getState;

    const runOnce = useCallback(async () => {
        if (!agentId) return;

        try {
            const agent = getState().getAgent(agentId);
            if (!agent) {
                console.warn('Agent not found in local store:', agentId);
                return;
            }

            // 1) Fetch markets from polymarket endpoint
            const marketsRes = await fetch('/api/polymarket/markets?limit=100');
            if (!marketsRes.ok) {
                console.warn('Failed to fetch markets for agent runner');
                return;
            }

            const marketsData = await marketsRes.json();
            const markets = marketsData.markets || [];

            // 2) Filter markets: active, not resolved
            const candidates = markets.filter((m: any) => m && !m.resolved && !m.archived && m.active);
            if (!candidates || candidates.length === 0) return;

            // 3) Remove markets agent already predicted on (local store)
            const localPreds = getState().getAgentPredictions(agentId).map(p => p.market_id);
            const fresh = candidates.filter((m: any) => !localPreds.includes(m.id));
            const pool = fresh.length > 0 ? fresh : candidates; // fallback to all candidates if none fresh

            // 4) Pick a random market from pool
            const market = pool[Math.floor(Math.random() * pool.length)];
            if (!market) return;

            // 5) Call server-side analysis endpoint to run AI (server will use org key)
            const resp = await fetch('/api/agent/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId,
                    agentName: agent.name,
                    strategy_type: agent.strategy.type || agent.strategy_type || 'balanced',
                    marketId: market.id || market.polymarket_id || market.market_id,
                    betAmount
                })
            });

            if (!resp.ok) {
                const errText = await resp.text();
                console.error('Agent predict failed:', errText);
                return;
            }

            const data = await resp.json();
            if (!data.success || !data.prediction) {
                console.warn('No prediction returned', data);
                return;
            }

            // 6) Persist prediction into local store
            const pred = data.prediction;

            getState().addPrediction({
                agent_id: pred.agent_id,
                agent_name: pred.agent_name,
                market_id: pred.market_id,
                market_question: pred.market_question,
                prediction: pred.prediction,
                confidence: pred.confidence,
                reasoning: pred.reasoning,
                bet_amount: pred.bet_amount,
                entry_odds: pred.entry_odds,
                price_at_prediction: pred.entry_odds ?? 0,
                expected_payout: pred.expected_payout,
                research_cost: pred.research_cost || 0,
                research_sources: pred.research_sources || [],
                position_status: pred.position_status || 'OPEN',
                resolved: pred.resolved || false
            });

            console.log(`Agent ${agentId} saved prediction for market ${pred.market_id}`);
        } catch (err) {
            console.error('Agent auto-predict error:', err);
        }
    }, [agentId, betAmount]);

    const start = useCallback(() => {
        if (!agentId) return;
        if (runningRef.current) return;
        runningRef.current = true;

        // Run immediately
        runOnce();

        // Schedule interval
        timerRef.current = window.setInterval(() => {
            runOnce();
        }, intervalMs) as unknown as number;

        console.log('Agent auto-predict started for', agentId);
    }, [agentId, intervalMs, runOnce]);

    const stop = useCallback(() => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current as number);
            timerRef.current = null;
        }
        runningRef.current = false;
        console.log('Agent auto-predict stopped for', agentId);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => stop();
    }, [stop]);

    return { start, stop, isRunning: runningRef.current };
}
