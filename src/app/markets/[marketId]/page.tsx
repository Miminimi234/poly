'use client';

import { MainNav } from '@/components/navigation/MainNav';
import useUserAgentStore from '@/lib/stores/use-user-agent-store';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface Market {
    polymarket_id: string;
    question: string;
    description: string;
    market_slug: string;
    yes_price: number;
    no_price: number;
    volume: number;
    volume_24hr: number;
    liquidity: number;
    category: string;
    end_date: string | null;
    start_date: string | null;
    image_url: string | null;
    active: boolean;
    resolved: boolean;
    archived: boolean;
    analyzed?: boolean;
}

interface AgentPrediction {
    id: string;
    agent_id: string;
    agent_name: string;
    prediction: 'YES' | 'NO';
    confidence: number;
    reasoning: string;
    bet_amount: number;
    entry_odds: {
        yes_price: number;
        no_price: number;
    };
    expected_payout?: number; // What they would get if they win
    unrealized_pnl?: number;
    position_status: 'OPEN' | 'CLOSED_MANUAL' | 'CLOSED_RESOLVED';
    close_price?: number; // Price at which position was closed (if manually closed)
    created_at: string;
}

export default function MarketDetailPage() {
    const params = useParams();
    const marketId = params.marketId as string;

    const [market, setMarket] = useState<Market | null>(null);
    const [predictions, setPredictions] = useState<AgentPrediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [connected, setConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<string>('');

    // Keep track of cleanup functions for real-time listeners
    const cleanupFunctions = useRef<(() => void)[]>([]);

    useEffect(() => {
        if (!marketId) return;

        let isActive = true;
        let unsubscribe: (() => void) | null = null;

        const fetchMarketData = async () => {
            if (!isActive) return;

            try {
                setConnected(true);

                // Fetch market details (one-time fetch as market data doesn't change frequently)
                const marketResponse = await fetch(`/api/firebase/markets/${marketId}`);
                const marketData = await marketResponse.json();

                if (!isActive) return;

                if (marketData.success) {
                    setMarket(marketData.market);
                } else {
                    throw new Error(marketData.error || 'Failed to fetch market');
                }

                setError('');

            } catch (error: any) {
                if (!isActive) return;
                console.error('Failed to fetch market data:', error);
                setError(error.message);
                setConnected(false);
            }
        };

        const setupFirebasePredictionsListener = async () => {
            if (!isActive) return;

            try {
                const { database } = await import('@/lib/firebase-config');
                const { ref, query, orderByChild, equalTo, onValue } = await import('firebase/database');

                // Create a query for predictions for this specific market
                const predictionsRef = ref(database, 'agent_predictions');
                const marketPredictionsQuery = query(
                    predictionsRef,
                    orderByChild('market_id'),
                    equalTo(marketId)
                );

                // Set up real-time listener for predictions with debounce to reduce Firebase warnings
                let debounceTimer: NodeJS.Timeout | null = null;

                unsubscribe = onValue(marketPredictionsQuery, (snapshot) => {
                    if (!isActive) return;

                    // Debounce rapid updates to reduce Firebase index warnings during AI analysis
                    if (debounceTimer) {
                        clearTimeout(debounceTimer);
                    }

                    debounceTimer = setTimeout(() => {
                        if (!isActive) return;

                        if (snapshot.exists()) {
                            const data = snapshot.val();
                            const predictions = Object.entries(data).map(([id, pred]: [string, any]) => ({
                                id,
                                ...pred
                            }));

                            // Sort by created_at descending
                            const sortedPredictions = predictions
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                            setPredictions(sortedPredictions);
                            setLastUpdate(new Date().toLocaleTimeString());
                            setLoading(false);
                        } else {
                            setPredictions([]);
                            setLastUpdate(new Date().toLocaleTimeString());
                            setLoading(false);
                        }
                    }, 500); // 500ms debounce to reduce rapid updates during AI analysis

                }, (error) => {
                    if (!isActive) return;
                    console.error('Firebase predictions listener error:', error);
                    setLoading(false);
                });

            } catch (error) {
                if (!isActive) return;
                console.error('Error setting up Firebase predictions listener:', error);
                setLoading(false);
            }
        };

        // Initial market fetch and setup Firebase listener for predictions
        fetchMarketData();
        setupFirebasePredictionsListener();

        // Cleanup function
        const cleanup = () => {
            isActive = false;
            if (unsubscribe) {
                unsubscribe();
            }
            setConnected(false);
        };

        cleanupFunctions.current.push(cleanup);

        return cleanup;
    }, [marketId]);

    // Add 3-second polling for market data updates
    useEffect(() => {
        if (!marketId || loading) return;

        const pollingInterval = setInterval(async () => {
            try {
                // Refresh market data
                const marketResponse = await fetch(`/api/firebase/markets/${marketId}`);
                const marketData = await marketResponse.json(); if (marketData.success) {
                    setMarket(prevMarket => {
                        // Only update if data has actually changed to avoid unnecessary re-renders
                        const newMarket = marketData.market;
                        if (!prevMarket ||
                            prevMarket.yes_price !== newMarket.yes_price ||
                            prevMarket.no_price !== newMarket.no_price ||
                            prevMarket.volume !== newMarket.volume ||
                            prevMarket.volume_24hr !== newMarket.volume_24hr) {
                            return newMarket;
                        }
                        return prevMarket;
                    });
                    setLastUpdate(new Date().toLocaleTimeString());
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(pollingInterval);
    }, [marketId, loading]);

    // Cleanup all connections on component unmount
    useEffect(() => {
        return () => {
            cleanupFunctions.current.forEach(cleanup => cleanup());
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-white text-black p-4 md:p-8">
                <MainNav />
                <div className="border-4 border-black bg-white p-12 text-center"
                    style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
                    <div className="text-4xl mb-4">⟲</div>
                    <div className="text-2xl font-bold mb-2">LOADING_MARKET...</div>
                    <div className="text-sm text-gray-600">FETCHING MARKET DATA</div>
                </div>
            </div>
        );
    }

    if (error || !market) {
        return (
            <div className="min-h-screen bg-white text-black p-4 md:p-8">
                <MainNav />
                <div className="border-4 border-black bg-red-50 p-12 text-center"
                    style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
                    <div className="text-4xl mb-4">⚠</div>
                    <div className="text-2xl font-bold mb-2">MARKET_NOT_FOUND</div>
                    <div className="text-sm text-gray-600 mb-4">
                        {error || 'The requested market could not be found'}
                    </div>
                    <Link
                        href="/markets"
                        className="border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100"
                    >
                        ← BACK_TO_MARKETS
                    </Link>
                </div>
            </div>
        );
    }

    const yesPredictions = predictions.filter(p => p.prediction === 'YES');
    const noPredictions = predictions.filter(p => p.prediction === 'NO');
    const avgYesConfidence = yesPredictions.length > 0
        ? yesPredictions.reduce((sum, p) => sum + p.confidence, 0) / yesPredictions.length
        : 0;
    const avgNoConfidence = noPredictions.length > 0
        ? noPredictions.reduce((sum, p) => sum + p.confidence, 0) / noPredictions.length
        : 0;

    return (
        <div className="min-h-screen bg-white text-black p-4 md:p-8">
            {/* Navigation */}
            <MainNav />

            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                    <Link href="/markets" className="text-sm text-gray-600 hover:text-black">
                        ← BACK_TO_MARKETS
                    </Link>
                </div>

                <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-bold text-gray-600">
                        MARKET #{marketId}
                    </div>
                    {lastUpdate && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            Last updated: {lastUpdate}
                        </div>
                    )}
                </div>
                <h1 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">
                    {market.question}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Market Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Market Image */}
                    {market.image_url && (
                        <div className="border-4 border-black h-64 overflow-hidden bg-gray-100"
                            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                            <img
                                src={market.image_url}
                                alt={market.question}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    )}

                    {/* Description */}
                    {market.description && (
                        <div className="border-4 border-black bg-white p-6"
                            style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                            <h2 className="text-xl font-bold mb-4">MARKET_DESCRIPTION</h2>
                            <p className="text-gray-700 leading-relaxed">{market.description}</p>
                        </div>
                    )}

                    {/* AI Predictions Section */}
                    <div className="border-4 border-black bg-white p-6"
                        style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                        <div className="mb-4">
                            <h2 className="text-xl font-bold">AI_PREDICTIONS ({predictions.length})</h2>
                        </div>

                        {predictions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="text-2xl mb-2">🤖</div>
                                <div className="font-bold">NO_AI_PREDICTIONS_YET</div>
                                <div className="text-sm">AI agents haven't analyzed this market yet</div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Prediction Summary */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="border-2 border-black p-4 bg-green-50">
                                        <div className="text-lg font-bold text-green-800">YES_VOTES</div>
                                        <div className="text-2xl font-bold">{yesPredictions.length}</div>
                                        {avgYesConfidence > 0 && (
                                            <div className="text-sm text-green-600">
                                                Avg Confidence: {avgYesConfidence.toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-2 border-black p-4 bg-red-50">
                                        <div className="text-lg font-bold text-red-800">NO_VOTES</div>
                                        <div className="text-2xl font-bold">{noPredictions.length}</div>
                                        {avgNoConfidence > 0 && (
                                            <div className="text-sm text-red-600">
                                                Avg Confidence: {avgNoConfidence.toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* All Predictions */}
                                <div className="space-y-3">
                                    <h3 className="font-bold text-gray-800">ALL_PREDICTIONS:</h3>
                                    {predictions.map((prediction) => (
                                        <div key={prediction.id} className="border-l-4 border-gray-300 pl-4 py-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold">{prediction.agent_name}</div>
                                                <div className={`text-sm font-bold px-2 py-1 ${prediction.prediction === 'YES'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {prediction.prediction} ({prediction.confidence}%)
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600 mb-1">
                                                Bet: <span className="font-bold">{`$${prediction.bet_amount}`}</span> • Status: {prediction.position_status} •
                                                {(() => {
                                                    // Use unrealized_pnl if available and non-zero, otherwise calculate from expected_payout
                                                    const pnl = prediction.unrealized_pnl && prediction.unrealized_pnl !== 0
                                                        ? prediction.unrealized_pnl
                                                        : (prediction.expected_payout || 0) - prediction.bet_amount;

                                                    return (
                                                        <span className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                            {`exPNL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="text-sm text-gray-700">
                                                {prediction.reasoning.slice(0, 150)}...
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Current Odds */}
                    <div className="border-4 border-black bg-white p-6"
                        style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                        <h2 className="text-lg font-bold mb-4">CURRENT_ODDS</h2>
                        <div className="space-y-3">
                            <div className="border-2 border-black p-3 bg-green-50">
                                <div className="text-sm font-bold text-gray-600">YES</div>
                                <div className="text-2xl font-bold text-green-800">
                                    {Math.round(market.yes_price * 100)}¢
                                </div>
                            </div>
                            <div className="border-2 border-black p-3 bg-red-50">
                                <div className="text-sm font-bold text-gray-600">NO</div>
                                <div className="text-2xl font-bold text-red-800">
                                    {Math.round(market.no_price * 100)}¢
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Market Stats */}
                    <div className="border-4 border-black bg-white p-6"
                        style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                        <h2 className="text-lg font-bold mb-4">MARKET_STATS</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">VOLUME:</span>
                                <span className="font-bold">
                                    {market.volume >= 1000000
                                        ? `$${(market.volume / 1000000).toFixed(1)}M`
                                        : market.volume >= 1000
                                            ? `$${(market.volume / 1000).toFixed(0)}K`
                                            : `$${Math.round(market.volume).toLocaleString()}`
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">24H_VOLUME:</span>
                                <span className="font-bold">
                                    {market.volume_24hr >= 1000000
                                        ? `$${(market.volume_24hr / 1000000).toFixed(1)}M`
                                        : market.volume_24hr >= 1000
                                            ? `$${(market.volume_24hr / 1000).toFixed(0)}K`
                                            : `$${Math.round(market.volume_24hr).toLocaleString()}`
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">LIQUIDITY:</span>
                                <span className="font-bold">${market.liquidity.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">CATEGORY:</span>
                                <span className="font-bold">{market.category.toUpperCase()}</span>
                            </div>
                            {market.end_date && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">ENDS:</span>
                                    <span className="font-bold">
                                        {new Date(market.end_date).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">STATUS:</span>
                                <span className={`font-bold ${market.resolved ? 'text-gray-600' : market.active ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {market.resolved ? 'RESOLVED' : market.active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Agent Trades */}
                    <div className="border-4 border-black bg-white p-6"
                        style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.3)' }}>
                        <h2 className="text-lg font-bold mb-4">AGENT_TRADES ({predictions.length})</h2>

                        {/* Render any local (user) agent predictions for this market first */}
                        {(() => {
                            const localAgents = useUserAgentStore.getState().agents || [];
                            const localPreds = useUserAgentStore.getState().predictions || [];
                            const localAgentPredictions = localPreds.filter((p: any) => ((p as any).market_id === marketId) && localAgents.some((a: any) => a.id === (p as any).agent_id));

                            return (
                                <>
                                    {localAgentPredictions.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-sm font-bold mb-2">Your Agent's Trade</h3>
                                            {localAgentPredictions.map((lp: any) => {
                                                const entryOdd = (lp as any).prediction === 'YES'
                                                    ? (lp as any).entry_odds.yes_price
                                                    : (lp as any).entry_odds.no_price;
                                                const pnl = (lp as any).unrealized_pnl && (lp as any).unrealized_pnl !== 0
                                                    ? (lp as any).unrealized_pnl
                                                    : ((lp as any).expected_payout || 0) - (lp as any).bet_amount;

                                                return (
                                                    <div key={(lp as any).id} className="border-2 border-gray-200 p-3 text-xs mb-3 bg-yellow-50">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="font-bold text-sm">{(lp as any).agent_name} (You)</div>
                                                            <div className={`px-2 py-1 font-bold text-xs ${(lp as any).prediction === 'YES'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {(lp as any).prediction}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-gray-600">BET:</span>
                                                                <span className="font-bold ml-1">{`$${(lp as any).bet_amount}`}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">ENTRY:</span>
                                                                <span className="font-bold ml-1">{Math.round(entryOdd * 100)}¢</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">POSITION:</span>
                                                                <span className={`font-bold ml-1 ${(lp as any).position_status === 'OPEN' ? 'text-blue-600' : 'text-gray-600'
                                                                    }`}>
                                                                    {(lp as any).position_status === 'OPEN' ? 'OPEN' : 'CLOSED'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">exPNL:</span>
                                                                <span className={`font-bold ml-1 ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {`$${pnl.toFixed(2)}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {predictions.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500">
                                            <div className="text-2xl mb-2">📊</div>
                                            <div className="font-bold text-sm">NO_TRADES_YET</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {predictions.map((prediction) => {
                                                // Calculate entry odds and P&L
                                                const entryOdd = prediction.prediction === 'YES'
                                                    ? prediction.entry_odds.yes_price
                                                    : prediction.entry_odds.no_price;

                                                const pnl = prediction.unrealized_pnl && prediction.unrealized_pnl !== 0
                                                    ? prediction.unrealized_pnl
                                                    : (prediction.expected_payout || 0) - prediction.bet_amount;

                                                return (
                                                    <div key={prediction.id} className="border-2 border-gray-200 p-3 text-xs">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="font-bold text-sm">{prediction.agent_name}</div>
                                                            <div className={`px-2 py-1 font-bold text-xs ${prediction.prediction === 'YES'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {prediction.prediction}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-gray-600">BET:</span>
                                                                <span className="font-bold ml-1">{`$${prediction.bet_amount}`}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">ENTRY:</span>
                                                                <span className="font-bold ml-1">{Math.round(entryOdd * 100)}¢</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">POSITION:</span>
                                                                <span className={`font-bold ml-1 ${prediction.position_status === 'OPEN' ? 'text-blue-600' : 'text-gray-600'
                                                                    }`}>
                                                                    {prediction.position_status === 'OPEN' ? 'OPEN' : 'CLOSED'}
                                                                    {prediction.position_status !== 'OPEN' && prediction.close_price && (
                                                                        <span className="text-gray-500 ml-1">
                                                                            @{Math.round(prediction.close_price * 100)}¢
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-600">exPNL:</span>
                                                                <span className={`font-bold ml-1 ${((prediction.expected_payout || 0) - (prediction.bet_amount || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {`$${((prediction.expected_payout || 0)).toFixed(2)}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Trade on Polymarket link */}
                                            <div className="mt-4 pt-3 border-t-2 border-gray-200">
                                                <a
                                                    href={'https://polymarket.com/event/' + market.market_slug}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block border-2 border-black px-4 py-3 font-bold text-center bg-white hover:bg-gray-100 text-sm"
                                                >
                                                    🔗 TRADE_ON_POLYMARKET
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}