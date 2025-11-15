/**
 * React component for managing the integrated market odds tracker
 * Add this to your dashboard to control the tracking system
 */

'use client';

import { checkAdminStatus } from '@/lib/admin-auth';
import { useEffect, useState } from 'react';

interface TrackerStats {
    isActive: boolean;
    totalPredictions: number;
    uniqueMarkets: number;
    lastUpdate: string;
}

export default function TrackerController() {
    const [stats, setStats] = useState<TrackerStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [adminLoading, setAdminLoading] = useState(true);

    // Check admin status on component mount
    useEffect(() => {
        const verifyAdmin = async () => {
            try {
                const adminStatus = await checkAdminStatus();
                setIsAdmin(adminStatus);
            } catch (error) {
                console.error('[TrackerController] Failed to verify admin status:', error);
                setIsAdmin(false);
            } finally {
                setAdminLoading(false);
            }
        };

        verifyAdmin();
    }, []);

    // Check status on component mount and setup auto-refresh (only if admin)
    useEffect(() => {
        if (!isAdmin) return;

        checkStatus();

        // Auto-refresh status every 10 seconds
        const interval = setInterval(checkStatus, 10000);
        return () => clearInterval(interval);
    }, [isAdmin]);

    const checkStatus = async () => {
        try {
            const response = await fetch('/api/tracker/odds');
            const result = await response.json();

            if (result.success) {
                setStats(result.stats);
                setError(null);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to get tracker status');
        }
    };

    const handleAction = async (action: 'start' | 'stop') => {
        setLoading(true);
        try {
            const response = await fetch('/api/tracker/odds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });

            const result = await response.json();

            if (result.success) {
                await checkStatus(); // Refresh status
                setError(null);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(`Failed to ${action} tracker`);
        } finally {
            setLoading(false);
        }
    };

    const formatLastUpdate = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);

        if (diffSeconds < 60) return `${diffSeconds}s ago`;
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
        return date.toLocaleTimeString();
    };

    // Don't show anything if loading or not admin - completely hidden
    if (adminLoading || !isAdmin) {
        return null;
    }

    return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white-900 dark:text-white">
                    📊 Market Odds Tracker
                </h3>

                <div className={`px-3 py-1 rounded-full text-sm font-medium ${stats?.isActive
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-white-800 dark:text-white-200'
                    }`}>
                    {stats?.isActive ? '🟢 Active' : '🔴 Inactive'}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 border border-red-300 text-red-700 rounded-lg">
                    ❌ {error}
                </div>
            )}

            {stats && (
                <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-white-600 dark:text-white-400">Predictions:</span>
                            <span className="ml-2 font-medium text-white-900 dark:text-white">
                                {stats.totalPredictions}
                            </span>
                        </div>
                        <div>
                            <span className="text-white-600 dark:text-white-400">Markets:</span>
                            <span className="ml-2 font-medium text-white-900 dark:text-white">
                                {stats.uniqueMarkets}
                            </span>
                        </div>
                    </div>

                    <div className="text-sm">
                        <span className="text-white-600 dark:text-white-400">Last Update:</span>
                        <span className="ml-2 font-medium text-white-900 dark:text-white">
                            {formatLastUpdate(stats.lastUpdate)}
                        </span>
                    </div>
                </div>
            )}

            <div className="flex space-x-3">
                <button
                    onClick={() => handleAction('start')}
                    disabled={loading || stats?.isActive}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${stats?.isActive || loading
                        ? 'text-white-400 cursor-not-allowed'
                        : 'text-white'
                        }`}
                >
                    {loading ? 'Starting...' : '▶️ Start Tracker'}
                </button>

                <button
                    onClick={() => handleAction('stop')}
                    disabled={loading || !stats?.isActive}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!stats?.isActive || loading
                        ? 'text-white-400 cursor-not-allowed'
                        : 'text-white'
                        }`}
                >
                    {loading ? 'Stopping...' : '⏹️ Stop Tracker'}
                </button>

                <button
                    onClick={checkStatus}
                    disabled={loading}
                    className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    🔄 Refresh
                </button>
            </div>

            <div className="mt-4 p-3 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>📋 What this does:</strong> Updates the <code>current_market_odds</code> field
                    in all agent predictions every 5 seconds with live Polymarket data, and calculates
                    unrealized P&L based on price movements.
                </p>
            </div>
        </div>
    );
}