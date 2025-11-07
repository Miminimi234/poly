import { getServerPolymarketWS } from '@/lib/server-polymarket-ws';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        console.log('🚀 Initializing Polymarket WebSocket connection...');

        const wsClient = getServerPolymarketWS();

        // Check if WebSocket is connected (connection is automatic in constructor)
        const connected = wsClient.isConnectedToWS();

        if (connected) {
            console.log('✅ WebSocket connection established');

            return NextResponse.json({
                success: true,
                message: 'WebSocket connection established',
                status: {
                    connected: wsClient.isConnectedToWS(),
                    marketCount: wsClient.getMarketCount()
                },
                timestamp: new Date().toISOString()
            });
        } else {
            console.log('⏳ WebSocket connection in progress...');

            return NextResponse.json({
                success: true,
                message: 'WebSocket connection in progress',
                status: {
                    connected: false,
                    marketCount: wsClient.getMarketCount()
                }
            });
        }

    } catch (error: any) {
        console.error('❌ WebSocket initialization error:', error);

        return NextResponse.json({
            success: false,
            error: 'WebSocket initialization failed',
            message: error.message
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const wsClient = getServerPolymarketWS();

        return NextResponse.json({
            success: true,
            status: {
                connected: wsClient.isConnectedToWS(),
                marketCount: wsClient.getMarketCount()
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ WebSocket status error:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to get WebSocket status',
            message: error.message
        }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        console.log('🔌 Disconnecting Polymarket WebSocket...');

        const wsClient = getServerPolymarketWS();
        wsClient.disconnect();

        return NextResponse.json({
            success: true,
            message: 'WebSocket disconnected',
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('❌ WebSocket disconnect error:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to disconnect WebSocket',
            message: error.message
        }, { status: 500 });
    }
}