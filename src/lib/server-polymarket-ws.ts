/**
 * Server-side Polymarket WebSocket Manager
 * Manages WebSocket connection and market data caching
 */

import WebSocket from 'ws';
import firebaseMarketCache from './firebase-market-cache';
import { parsePolymarketMarket } from './polymarket-client';

interface PolymarketWSMessage {
    type: string;
    data: any;
}

interface ServerMarketUpdate {
    id: string;
    question: string;
    outcomes: string[];
    outcomePrices: string[];
    volume: string;
    liquidity: string;
    active: boolean;
    closed: boolean;
    archived: boolean;
    endDate: string;
    lastUpdate: number;
}

class ServerPolymarketWebSocket {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 5000; // 5 seconds
    private markets = new Map<string, ServerMarketUpdate>();
    private isConnected = false;
    private heartbeatInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.connect();
    }

    private connect() {
        try {
            console.log('🔌 Server: Connecting to Polymarket WebSocket...');

            this.ws = new WebSocket('wss://ws-live-data.polymarket.com/');

            this.ws.on('open', () => {
                console.log('✅ Server: Connected to Polymarket WebSocket');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.startHeartbeat();
                this.subscribe();
            });

            this.ws.on('message', (data: WebSocket.Data) => {
                this.handleMessage(data.toString());
            });

            this.ws.on('close', (code: number, reason: Buffer) => {
                console.log(`🔌 Server: WebSocket closed: ${code} ${reason.toString()}`);
                this.isConnected = false;
                this.stopHeartbeat();
                this.handleReconnect();
            });

            this.ws.on('error', (error: Error) => {
                console.error('❌ Server: WebSocket error:', error.message);
                this.isConnected = false;
            });

        } catch (error: any) {
            console.error('❌ Server: Failed to connect to WebSocket:', error.message);
            this.handleReconnect();
        }
    }

    private startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.ping();
            }
        }, 30000); // Ping every 30 seconds
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private subscribe() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        // Try different subscription formats that Polymarket might expect
        const subscriptions = [
            { type: 'subscribe', channel: 'markets' },
            { action: 'subscribe', stream: 'markets' },
            { method: 'SUBSCRIBE', params: ['markets'] },
            'subscribe:markets'
        ];

        subscriptions.forEach((sub, index) => {
            setTimeout(() => {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    const message = typeof sub === 'string' ? sub : JSON.stringify(sub);
                    this.ws.send(message);
                    console.log(`📡 Server: Sent subscription ${index + 1}:`, message);
                }
            }, index * 1000); // Stagger subscriptions
        });
    }

    private handleMessage(data: string) {
        try {
            // Try to parse as JSON first
            const message = JSON.parse(data);

            if (message.type === 'market_update' || message.event === 'market_update') {
                this.handleMarketUpdate(message.data || message);
            } else if (message.type === 'markets' || Array.isArray(message)) {
                this.handleMarketBatch(Array.isArray(message) ? message : message.data);
            } else {
                console.log('📨 Server: Unknown message type:', message.type || 'no-type');
            }
        } catch (error) {
            // Maybe it's not JSON, try other formats
            console.log('📨 Server: Non-JSON message received:', data.substring(0, 100));
        }
    }

    private handleMarketUpdate(marketData: any) {
        try {
            const market: ServerMarketUpdate = {
                id: marketData.id || marketData.market_id,
                question: marketData.question,
                outcomes: this.parseStringArray(marketData.outcomes),
                outcomePrices: this.parseStringArray(marketData.outcomePrices || marketData.outcome_prices),
                volume: marketData.volume || '0',
                liquidity: marketData.liquidity || '0',
                active: marketData.active !== false,
                closed: marketData.closed || false,
                archived: marketData.archived || false,
                endDate: marketData.endDate || marketData.end_date,
                lastUpdate: Date.now()
            };

            if (market.id && market.question) {
                this.markets.set(market.id, market);
                // Don't await - run in background to avoid blocking
                this.updateCache().catch(error => {
                    console.error('❌ Background cache update failed:', error);
                });
            }
        } catch (error: any) {
            console.error('❌ Server: Error processing market update:', error.message);
        }
    }

    private handleMarketBatch(markets: any[]) {
        console.log(`📊 Server: Processing batch of ${markets.length} markets`);

        markets.forEach(marketData => {
            this.handleMarketUpdate(marketData);
        });
    }

    private parseStringArray(value: any): string[] {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return [];
            }
        }
        return [];
    }

    private async updateCache() {
        const activeMarkets = Array.from(this.markets.values())
            .filter(market => market.active && !market.archived && !market.closed)
            .map(market => {
                // Convert to our standard format
                try {
                    return parsePolymarketMarket({
                        id: market.id,
                        question: market.question,
                        outcomes: market.outcomes,
                        outcomePrices: market.outcomePrices,
                        volume: market.volume,
                        liquidity: market.liquidity,
                        active: market.active,
                        closed: market.closed,
                        archived: market.archived,
                        endDate: market.endDate,
                        startDate: null,
                        slug: market.id,
                        image: null,
                        icon: null,
                        categoryLabel: 'Other',
                        groupItemTitle: '',
                        volume24hr: '0',
                        enableOrderBook: true,
                        orderMinSize: 1,
                        orderPriceMinTickSize: 0.01
                    } as any);
                } catch (error: any) {
                    console.error('❌ Error parsing market for cache:', error.message);
                    return null;
                }
            })
            .filter(market => market !== null)
            .sort((a, b) => b.volume - a.volume);

        // Update Firebase with all markets
        if (activeMarkets.length > 0) {
            try {
                const upsertResult = await firebaseMarketCache.upsertMarkets(activeMarkets, 'websocket_live');
                console.log(`✅ Server: Updated Firebase via WebSocket - Added: ${upsertResult.added}, Updated: ${upsertResult.updated}, Skipped: ${upsertResult.skipped}`);
            } catch (error: any) {
                console.error('❌ Error updating Firebase from WebSocket:', error.message);
            }
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Server: Max reconnection attempts reached');
            // Fall back to HTTP polling after max attempts
            setTimeout(() => {
                console.log('🔄 Server: Falling back to HTTP polling...');
                this.reconnectAttempts = 0; // Reset for future attempts
            }, 60000); // Wait 1 minute before allowing reconnection attempts again
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 60000); // Max 1 minute

        console.log(`🔄 Server: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    public getMarketCount(): number {
        return Array.from(this.markets.values())
            .filter(market => market.active && !market.archived && !market.closed).length;
    }

    public isConnectedToWS(): boolean {
        return this.isConnected;
    }

    public disconnect() {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.markets.clear();
        this.isConnected = false;
    }
}

// Global server WebSocket instance
let globalServerWS: ServerPolymarketWebSocket | null = null;

export function getServerPolymarketWS(): ServerPolymarketWebSocket {
    if (!globalServerWS) {
        globalServerWS = new ServerPolymarketWebSocket();
    }
    return globalServerWS;
}

// Initialize WebSocket connection when this module loads
if (typeof window === 'undefined') {
    // Only run on server
    getServerPolymarketWS();
}

export { ServerPolymarketWebSocket, type ServerMarketUpdate };

