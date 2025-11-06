/**
 * Polymarket WebSocket Client for Real-time Market Data
 * Connects to wss://ws-live-data.polymarket.com/ for live updates
 */

interface PolymarketWSMessage {
    type: string;
    data: any;
}

interface MarketUpdate {
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

class PolymarketWebSocketClient {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second
    private markets = new Map<string, MarketUpdate>();
    private subscribers = new Set<(markets: MarketUpdate[]) => void>();
    private isConnected = false;

    constructor() {
        this.connect();
    }

    private connect() {
        try {
            console.log('🔌 Connecting to Polymarket WebSocket...');

            this.ws = new WebSocket('wss://ws-live-data.polymarket.com/');

            this.ws.onopen = () => {
                console.log('✅ Connected to Polymarket WebSocket');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;

                // Subscribe to all market updates
                this.subscribe();
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket connection closed:', event.code, event.reason);
                this.isConnected = false;
                this.handleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.isConnected = false;
            };

        } catch (error) {
            console.error('❌ Failed to connect to WebSocket:', error);
            this.handleReconnect();
        }
    }

    private subscribe() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return;
        }

        // Subscribe to market data updates
        const subscribeMessage = {
            type: 'subscribe',
            channel: 'markets',
            // Request all active markets without limit
            filter: {
                active: true,
                archived: false
            }
        };

        this.ws.send(JSON.stringify(subscribeMessage));
        console.log('📡 Subscribed to all market updates');
    }

    private handleMessage(data: string) {
        try {
            const message: PolymarketWSMessage = JSON.parse(data);

            switch (message.type) {
                case 'market_update':
                    this.handleMarketUpdate(message.data);
                    break;
                case 'market_batch':
                    this.handleMarketBatch(message.data);
                    break;
                case 'heartbeat':
                    // Keep connection alive
                    break;
                default:
                    console.log('📨 Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
        }
    }

    private handleMarketUpdate(marketData: any) {
        const market: MarketUpdate = {
            id: marketData.id,
            question: marketData.question,
            outcomes: this.parseStringArray(marketData.outcomes),
            outcomePrices: this.parseStringArray(marketData.outcomePrices),
            volume: marketData.volume || '0',
            liquidity: marketData.liquidity || '0',
            active: marketData.active !== false,
            closed: marketData.closed || false,
            archived: marketData.archived || false,
            endDate: marketData.endDate,
            lastUpdate: Date.now()
        };

        this.markets.set(market.id, market);
        this.notifySubscribers();
    }

    private handleMarketBatch(markets: any[]) {
        console.log(`📊 Received batch of ${markets.length} markets`);

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

    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    private notifySubscribers() {
        const marketArray = Array.from(this.markets.values())
            .filter(market => market.active && !market.archived)
            .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume));

        this.subscribers.forEach(callback => {
            try {
                callback(marketArray);
            } catch (error) {
                console.error('❌ Error in subscriber callback:', error);
            }
        });
    }

    // Public API
    public onMarketUpdate(callback: (markets: MarketUpdate[]) => void) {
        this.subscribers.add(callback);

        // Immediately send current data if available
        if (this.markets.size > 0) {
            this.notifySubscribers();
        }

        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
        };
    }

    public getAllMarkets(): MarketUpdate[] {
        return Array.from(this.markets.values())
            .filter(market => market.active && !market.archived)
            .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume));
    }

    public getMarketCount(): number {
        return Array.from(this.markets.values())
            .filter(market => market.active && !market.archived).length;
    }

    public isConnectedToWS(): boolean {
        return this.isConnected;
    }

    public disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.markets.clear();
        this.subscribers.clear();
        this.isConnected = false;
    }
}

// Global WebSocket client instance
let globalWSClient: PolymarketWebSocketClient | null = null;

export function getPolymarketWSClient(): PolymarketWebSocketClient {
    if (!globalWSClient) {
        globalWSClient = new PolymarketWebSocketClient();
    }
    return globalWSClient;
}

export { PolymarketWebSocketClient, type MarketUpdate };
