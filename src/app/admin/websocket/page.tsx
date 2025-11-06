'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';


interface WebSocketStatus {
    connected: boolean;
    marketCount: number;
    lastUpdate?: string;
}

export default function WebSocketAdminPage() {
    const [status, setStatus] = useState<WebSocketStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = async () => {
        try {
            const response = await fetch('/api/polymarket/websocket');
            const data = await response.json();

            if (data.success) {
                setStatus(data.status);
                setError(null);
            } else {
                setError(data.error || 'Failed to fetch status');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const connectWebSocket = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/polymarket/websocket', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                setStatus(data.status);
                console.log('✅ WebSocket connected:', data.status);
            } else {
                setError(data.error || 'Failed to connect');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const disconnectWebSocket = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/polymarket/websocket', {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                await fetchStatus(); // Refresh status
                console.log('🔌 WebSocket disconnected');
            } else {
                setError(data.error || 'Failed to disconnect');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();

        // Auto-refresh status every 10 seconds
        const interval = setInterval(fetchStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">WebSocket Admin</h1>
                <p className="text-muted-foreground">
                    Manage Polymarket WebSocket connection for unlimited real-time market data
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Status Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Connection Status
                            {status?.connected ? (
                                <Badge variant="default" className="bg-green-500">Connected</Badge>
                            ) : (
                                <Badge variant="destructive">Disconnected</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {status && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Markets Cached:</span>
                                    <span className="font-medium">{status.marketCount.toLocaleString()}</span>
                                </div>

                                {status.lastUpdate && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Last Update:</span>
                                        <span className="font-medium text-xs">
                                            {new Date(status.lastUpdate).toLocaleTimeString()}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Controls Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Connection Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={connectWebSocket}
                                disabled={loading || status?.connected}
                                className="w-full"
                            >
                                {loading ? 'Connecting...' : 'Connect WebSocket'}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={disconnectWebSocket}
                                disabled={loading || !status?.connected}
                                className="w-full"
                            >
                                {loading ? 'Disconnecting...' : 'Disconnect WebSocket'}
                            </Button>

                            <div className="border-t my-4" />

                            <Button
                                variant="secondary"
                                onClick={fetchStatus}
                                disabled={loading}
                                className="w-full"
                            >
                                Refresh Status
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Benefits Section */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>WebSocket Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <h4 className="font-medium mb-2">🚀 Unlimited Market Access</h4>
                            <p className="text-sm text-muted-foreground">
                                Access ALL Polymarket markets without pagination limits (vs 33 markets via HTTP)
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">⚡ Real-time Updates</h4>
                            <p className="text-sm text-muted-foreground">
                                Live market data updates as they happen, no polling delays
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">🎯 Better Performance</h4>
                            <p className="text-sm text-muted-foreground">
                                Reduced server load and faster response times with persistent connection
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">📊 Rich Data</h4>
                            <p className="text-sm text-muted-foreground">
                                More detailed market information and real-time price movements
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}