'use client';

import { checkAdminStatus } from '@/lib/admin-auth';
import { useEffect, useState } from 'react';

export default function AdminControls() {
    const [running, setRunning] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [syncStats, setSyncStats] = useState<any>(null);
    const [firebaseStats, setFirebaseStats] = useState<any>(null);
    const [balanceStats, setBalanceStats] = useState<any>(null);
    const [oddsTrackerStatus, setOddsTrackerStatus] = useState<any>(null);
    const [positionManagementStatus, setPositionManagementStatus] = useState<any>(null);
    const [integratedTrackerStatus, setIntegratedTrackerStatus] = useState<any>(null);
    const [marketRefreshStatus, setMarketRefreshStatus] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    // Check admin status on component mount
    useEffect(() => {
        const verifyAdmin = async () => {
            try {
                const adminStatus = await checkAdminStatus();
                setIsAdmin(adminStatus);
            } catch (error) {
                console.error('[AdminControls] Failed to verify admin status:', error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        verifyAdmin();
    }, []);

    const runCron = async (endpoint: string, name: string) => {
        // Double-check admin status before running sensitive operations
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning(endpoint);
        setMessage('');
        try {
            const response = await fetch(`/api/admin/cron/${endpoint}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false); // Update admin status
                return;
            }

            if (data.success) {
                const details = endpoint === 'sync-markets'
                    ? `Added ${data.sync?.added || 0}, Updated ${data.sync?.updated || 0}`
                    : endpoint === 'run-agents'
                        ? `Made ${data.predictions || 0} predictions`
                        : endpoint === 'resolve-markets'
                            ? `Resolved ${data.resolved || 0} markets`
                            : `Bankrupted ${data.bankrupted || 0} agents`;
                setMessage(`✓ ${name.toUpperCase()} COMPLETED: ${details}`);

                // Store sync stats if available
                if (data.sync) {
                    setSyncStats(data.sync);
                }
            } else {
                setMessage(`✗ ${name.toUpperCase()} FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 8000);
        }
    };



    const refreshFirebase = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('refresh-firebase');
        setMessage('');
        try {
            const response = await fetch('/api/admin/firebase/refresh', {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false);
                return;
            }

            if (data.success) {
                setMessage(`✓ FIREBASE REFRESH COMPLETED: ${data.count} markets loaded to Firebase`);
                setFirebaseStats(data.firebaseStats);
            } else {
                setMessage(`✗ FIREBASE REFRESH FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const clearFirebase = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        if (!confirm('Are you sure you want to clear ALL Firebase data? This cannot be undone.')) {
            return;
        }

        setRunning('clear-firebase');
        setMessage('');
        try {
            const response = await fetch('/api/admin/firebase/clear', {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false);
                return;
            }

            if (data.success) {
                setMessage(`✓ FIREBASE CLEARED: ${data.stats.cleared} markets removed`);
                setFirebaseStats(data.stats.afterClear);
            } else {
                setMessage(`✗ FIREBASE CLEAR FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const clearAllFirebase = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        if (!confirm('⚠️ DANGER: This will DELETE ALL Firebase data including predictions, balances, markets, and metadata. This CANNOT be undone. Are you absolutely sure?')) {
            return;
        }

        if (!confirm('Last chance: This will PERMANENTLY DELETE EVERYTHING in Firebase. Continue?')) {
            return;
        }

        setRunning('clear-all-firebase');
        setMessage('');
        try {
            const response = await fetch('/api/admin/firebase/clear-all', {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false);
                return;
            }

            if (data.success) {
                setMessage(`✓ FIREBASE COMPLETELY CLEARED: ${data.stats.totalCleared} items deleted from ${data.stats.clearedPaths.length} paths`);
                setFirebaseStats({ totalMarkets: 0, lastUpdate: new Date().toISOString() });
            } else {
                setMessage(`✗ FIREBASE CLEAR ALL FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 8000); // Longer timeout for this important message
        }
    };

    const triggerFirebaseAnalysis = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('trigger-analysis');
        setMessage('');
        try {
            const response = await fetch('/api/admin/trigger-analysis', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ triggeredBy: 'admin_controls' })
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false);
                return;
            }

            if (data.success) {
                setMessage(`✓ AGENT ANALYSIS COMPLETED: ${data.session.totalPredictions} predictions made by ${data.session.totalAgents} agents`);
            } else {
                setMessage(`✗ AGENT ANALYSIS FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 8000);
        }
    };

    const testFirebaseWrite = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('test-firebase-write');
        setMessage('');
        try {
            const response = await fetch('/api/admin/firebase/test-write', {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false);
                return;
            }

            if (data.success) {
                setMessage(`✓ FIREBASE WRITE TEST PASSED: Prediction ID ${data.data.savedPredictionId} saved successfully`);
            } else {
                if (data.isPermissionError) {
                    setMessage(`✗ FIREBASE PERMISSION ERROR: ${data.suggestion}`);
                } else {
                    setMessage(`✗ FIREBASE WRITE TEST FAILED: ${data.error}`);
                }
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 10000); // Longer timeout for detailed message
        }
    };

    const resetAnalyzedStatus = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        if (!confirm('Reset analyzed status for ALL markets? This will allow agents to re-analyze all markets.')) {
            return;
        }

        setRunning('reset-analyzed');
        setMessage('');
        try {
            const response = await fetch('/api/admin/reset-analyzed', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ confirmedBy: 'admin_controls' })
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false);
                return;
            }

            if (data.success) {
                setMessage(`✓ RESET COMPLETE: Markets unanalyzed & all predictions cleared`);
            } else {
                setMessage(`✗ RESET FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const getFirebaseStats = async () => {
        try {
            const response = await fetch('/api/admin/firebase/stats', {
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                setFirebaseStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to get Firebase stats:', error);
        }
    };

    const initializeBalances = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('init-balances');
        try {
            const response = await fetch('/api/firebase/balances/initialize', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                setMessage('✓ AGENT BALANCES INITIALIZED SUCCESSFULLY');
                getBalanceStats(); // Refresh stats
            } else {
                setMessage(`✗ BALANCE INITIALIZATION FAILED: ${data.error}`);
            }
        } catch (error) {
            setMessage(`✗ BALANCE INITIALIZATION FAILED: ${error}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const getBalanceStats = async () => {
        try {
            const response = await fetch('/api/firebase/balances', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setBalanceStats(data.balances);
            }
        } catch (error) {
            console.error('Failed to fetch balance stats:', error);
        }
    };

    const resetAllBalances = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        if (!confirm('Are you sure you want to reset ALL agent balances? This cannot be undone.')) {
            return;
        }

        setRunning('reset-balances');
        try {
            // Reset each agent balance individually
            const agents = ['chatgpt-4', 'claude-sonnet', 'gemini-pro', 'gpt-35-turbo', 'llama-3-70b', 'mistral-large', 'perplexity-ai', 'grok-beta'];

            for (const agentId of agents) {
                await fetch(`/api/firebase/balances/${agentId}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'reset' })
                });
            }

            setMessage('✓ ALL AGENT BALANCES RESET TO $1000');
            getBalanceStats(); // Refresh stats
        } catch (error) {
            setMessage(`✗ BALANCE RESET FAILED: ${error}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const startOddsTracking = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('start-odds-tracking');
        try {
            const response = await fetch('/api/tracker/odds', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' })
            });

            const data = await response.json();
            if (data.success) {
                setMessage('✓ ENHANCED ODDS TRACKING STARTED: 5-second updates + agent balances!');
                getOddsTrackerStatus();
            } else {
                setMessage(`✗ ENHANCED ODDS TRACKING START FAILED: ${data.error}`);
            }
        } catch (error) {
            setMessage(`✗ ODDS TRACKING START FAILED: ${error}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const getOddsTrackerStatus = async () => {
        try {
            const response = await fetch('/api/tracker/odds', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setOddsTrackerStatus(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch enhanced tracker status:', error);
        }
    };

    // Position Management Functions
    const startPositionManagement = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('start-position-mgmt');
        try {
            const response = await fetch('/api/admin/position-management', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start', intervalMinutes: 5 })
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false);
                return;
            }

            if (data.success) {
                setMessage('✓ POSITION MANAGEMENT STARTED: Real-time P&L tracking active');
                setPositionManagementStatus(data.status);
            } else {
                setMessage(`✗ POSITION MANAGEMENT START FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const stopPositionManagement = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('stop-position-mgmt');
        try {
            const response = await fetch('/api/admin/position-management', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false);
                return;
            }

            if (data.success) {
                setMessage('✓ POSITION MANAGEMENT STOPPED');
                setPositionManagementStatus(data.status);
            } else {
                setMessage(`✗ POSITION MANAGEMENT STOP FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const getPositionManagementStatus = async () => {
        try {
            const response = await fetch('/api/admin/position-management', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setPositionManagementStatus({ status: data.status, report: data.report });
            }
        } catch (error) {
            console.error('Failed to fetch position management status:', error);
        }
    };

    // Integrated Tracker Functions
    const startIntegratedTracker = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('start-integrated-tracker');
        try {
            const response = await fetch('/api/tracker/odds', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' })
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false);
                return;
            }

            if (data.success) {
                setMessage('✓ ENHANCED TRACKER STARTED: Odds + Balance updates every 5 seconds!');
                setIntegratedTrackerStatus(data.status);
            } else {
                setMessage(`✗ ENHANCED TRACKER START FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const stopIntegratedTracker = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('stop-integrated-tracker');
        try {
            const response = await fetch('/api/tracker/odds', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false);
                return;
            }

            if (data.success) {
                setMessage('✓ ENHANCED TRACKER STOPPED');
                setIntegratedTrackerStatus(data.status);
            } else {
                setMessage(`✗ ENHANCED TRACKER STOP FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const getIntegratedTrackerStatus = async () => {
        try {
            const response = await fetch('/api/admin/integrated-tracker', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setIntegratedTrackerStatus(data.status);
            }
        } catch (error) {
            console.error('Failed to fetch integrated tracker status:', error);
        }
    };

    const testIntegratedTracker = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('test-integrated-tracker');
        try {
            const response = await fetch('/api/admin/integrated-tracker', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'test' })
            });

            const data = await response.json();

            if (data.success) {
                const result = data.testResult;
                setMessage(`✓ INTEGRATION TEST: Updated ${result.oddsUpdated} markets, ${result.positionsUpdated} positions (${result.timeElapsed}ms)`);
                setIntegratedTrackerStatus(data.status);
            } else {
                setMessage(`✗ INTEGRATION TEST FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    // Market Refresh Tracker Functions
    const startMarketRefreshTracker = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('start-market-refresh');
        try {
            const response = await fetch('/api/admin/market-refresh-tracker', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' })
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false);
                return;
            }

            if (data.success) {
                setMessage('✓ MARKET REFRESH TRACKER STARTED: Auto-updating markets every 7 seconds!');
                setMarketRefreshStatus(data.status);
            } else {
                setMessage(`✗ MARKET REFRESH START FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const stopMarketRefreshTracker = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('stop-market-refresh');
        try {
            const response = await fetch('/api/admin/market-refresh-tracker', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' })
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                setMessage('✗ ADMIN ACCESS DENIED');
                setIsAdmin(false);
                return;
            }

            if (data.success) {
                setMessage('✓ MARKET REFRESH TRACKER STOPPED');
                setMarketRefreshStatus(data.status);
            } else {
                setMessage(`✗ MARKET REFRESH STOP FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const getMarketRefreshStatus = async () => {
        try {
            const response = await fetch('/api/admin/market-refresh-tracker', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setMarketRefreshStatus(data.status);
            }
        } catch (error) {
            console.error('Failed to fetch market refresh status:', error);
        }
    };

    const forceMarketRefresh = async () => {
        const currentAdminStatus = await checkAdminStatus();
        if (!currentAdminStatus) {
            setMessage('✗ ADMIN PRIVILEGES REQUIRED');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        setRunning('force-market-refresh');
        try {
            const response = await fetch('/api/admin/market-refresh-tracker', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'force-refresh' })
            });

            const data = await response.json();

            if (data.success) {
                const stats = data.result;
                setMessage(`✓ MANUAL REFRESH: ${stats.totalMarkets} markets (${stats.added} new, ${stats.updated} updated, ${stats.skipped} unchanged)`);
                setMarketRefreshStatus(data.status);
            } else {
                setMessage(`✗ MANUAL REFRESH FAILED: ${data.error || 'Unknown error'}`);
            }
        } catch (error: any) {
            setMessage(`✗ ERROR: ${error.message}`);
        } finally {
            setRunning(null);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    // Load Firebase stats and balance data on mount
    useEffect(() => {
        if (isAdmin) {
            getFirebaseStats();
            getBalanceStats();
            getOddsTrackerStatus();
            getPositionManagementStatus();
            getMarketRefreshStatus();
        }
    }, [isAdmin]);

    // Don't show anything if loading or not admin - completely hidden
    if (loading || !isAdmin) {
        return null;
    }    // Show admin controls for authorized users
    return (
        <div className="border-4 border-black bg-background p-4 mb-6 text-foreground"
            style={{ boxShadow: '8px 8px 0px rgba(0,0,0,0.3)' }}>
            <div className="text-foreground font-bold mb-3 text-base">
                ▶ ADMIN_CONTROLS
            </div>

            <div className="space-y-2">
                <button
                    onClick={() => runCron('sync-markets', 'Market Sync')}
                    disabled={running === 'sync-markets'}
                    className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm"
                    style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                >
                    {running === 'sync-markets' ? '⟲ SYNCING...' : '▣ SYNC_MARKETS'}
                </button>

                <button
                    onClick={() => runCron('run-agents', 'Agent Analysis')}
                    disabled={running === 'run-agents'}
                    className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm"
                    style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                >
                    {running === 'run-agents' ? '⟲ RUNNING...' : '◎ RUN_AGENT_ANALYSIS'}
                </button>

                <button
                    onClick={() => runCron('resolve-markets', 'Market Resolution')}
                    disabled={running === 'resolve-markets'}
                    className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm"
                    style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                >
                    {running === 'resolve-markets' ? '⟲ RUNNING...' : '◆ RESOLVE_MARKETS'}
                </button>

                <button
                    onClick={() => runCron('check-bankruptcies', 'Bankruptcy Check')}
                    disabled={running === 'check-bankruptcies'}
                    className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm"
                    style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                >
                    {running === 'check-bankruptcies' ? '⟲ RUNNING...' : '✕ CHECK_BANKRUPTCIES'}
                </button>

                {/* Firebase Agent Analysis */}
                <div className="border-t border-black pt-2 mt-2">
                    <div className="text-xs text-foreground mb-2 font-bold">🤖 FIREBASE AGENT ANALYSIS:</div>

                    <button
                        onClick={triggerFirebaseAnalysis}
                        disabled={running === 'trigger-analysis'}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm mb-2"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        {running === 'trigger-analysis' ? '⟲ ANALYZING...' : '🎯 TRIGGER_AGENT_ANALYSIS'}
                    </button>

                    <button
                        onClick={resetAnalyzedStatus}
                        disabled={running === 'reset-analyzed'}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm mb-2"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                        title="Reset all market analyzed status and clear all agent predictions"
                    >
                        {running === 'reset-analyzed' ? '⟲ CLEARING...' : '�️ RESET & CLEAR PREDICTIONS'}
                    </button>
                </div>

                {/* Firebase Database Management */}
                <div className="border-t border-black pt-2 mt-2">
                    <div className="text-xs text-foreground mb-2 font-bold">🔥 FIREBASE DATABASE:</div>

                    <button
                        onClick={refreshFirebase}
                        disabled={running === 'refresh-firebase'}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm mb-2"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        {running === 'refresh-firebase' ? '⟲ REFRESHING...' : '� REFRESH_FIREBASE'}
                    </button>

                    <button
                        onClick={clearFirebase}
                        disabled={running === 'clear-firebase' || running === 'clear-all-firebase'}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm mb-2"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        {running === 'clear-firebase' ? '⟲ CLEARING...' : '🗑️ CLEAR_MARKETS_ONLY'}
                    </button>

                    <button
                        onClick={clearAllFirebase}
                        disabled={running === 'clear-all-firebase' || running === 'clear-firebase'}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background text-foreground disabled:opacity-50 text-sm mb-2"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                        title="⚠️ DANGER: Permanently deletes ALL Firebase data"
                    >
                        {running === 'clear-all-firebase' ? '⟲ DELETING ALL...' : '💥 CLEAR_ALL_FIREBASE'}
                    </button>

                    <button
                        onClick={testFirebaseWrite}
                        disabled={running !== null}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm mb-2"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                        title="Test if Firebase Admin SDK can write predictions to database"
                    >
                        {running === 'test-firebase-write' ? '⟲ TESTING...' : '🧪 TEST_FIREBASE_WRITE'}
                    </button>

                    <button
                        onClick={getFirebaseStats}
                        disabled={running !== null}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        📊 GET_FIREBASE_STATS
                    </button>
                </div>

                {/* Balance Management Controls */}
                <div className="mt-4 p-3 border-2 border-purple-500 bg-background text-foreground">
                    <div className="font-bold mb-2 text-foreground">💰 AGENT BALANCE MANAGEMENT</div>

                    <button
                        onClick={initializeBalances}
                        disabled={running !== null}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm mb-2"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        {running === 'init-balances' ? '⟲ INITIALIZING...' : '🚀 INITIALIZE_BALANCES'}
                    </button>

                    <button
                        onClick={getBalanceStats}
                        disabled={running !== null}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm mb-2"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        💰 GET_BALANCE_STATS
                    </button>

                    <button
                        onClick={resetAllBalances}
                        disabled={running !== null}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        {running === 'reset-balances' ? '⟲ RESETTING...' : '🔄 RESET_ALL_BALANCES'}
                    </button>
                </div>

                {/* Integrated Market & Position Tracker */}
                <div className="mt-4 p-3 border-2 border-teal-500 bg-background text-foreground">
                    <div className="font-bold mb-2 text-foreground">�💼 INTEGRATED TRACKER</div>
                    <div className="text-xs text-foreground mb-3">Real-time odds + position tracking together</div>

                    <button
                        onClick={getIntegratedTrackerStatus}
                        disabled={running !== null}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm mb-2"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        📊 GET_INTEGRATED_STATUS
                    </button>

                    <button
                        onClick={testIntegratedTracker}
                        disabled={running !== null}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm mb-2"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        {running === 'test-integrated-tracker' ? '⟲ TESTING...' : '🧪 TEST_INTEGRATION'}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={startIntegratedTracker}
                            disabled={running !== null}
                            className="border-2 border-black px-3 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-xs"
                            style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}
                        >
                            {running === 'start-integrated-tracker' ? '⟲ STARTING...' : '▶️ START_TRACKER'}
                        </button>

                        <button
                            onClick={stopIntegratedTracker}
                            disabled={running !== null}
                            className="border-2 border-black px-3 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-xs"
                            style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}
                        >
                            {running === 'stop-integrated-tracker' ? '⟲ STOPPING...' : '⏹️ STOP_TRACKER'}
                        </button>
                    </div>
                </div>

                {/* Market Refresh Tracker */}
                <div className="mt-4 p-3 border-2 border-green-500 bg-background text-foreground">
                    <div className="font-bold mb-2 text-foreground">🔄 MARKET REFRESH TRACKER</div>
                    <div className="text-xs text-foreground mb-3">Auto-refresh market data every 7 seconds with intelligent updates</div>

                    <button
                        onClick={getMarketRefreshStatus}
                        disabled={running !== null}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm mb-2"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        📊 GET_REFRESH_STATUS
                    </button>

                    <button
                        onClick={forceMarketRefresh}
                        disabled={running !== null}
                        className="w-full border-2 border-black px-4 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-sm mb-2"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}
                    >
                        {running === 'force-market-refresh' ? '⟲ REFRESHING...' : '🔄 FORCE_REFRESH'}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={startMarketRefreshTracker}
                            disabled={running !== null}
                            className="border-2 border-black px-3 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-xs"
                            style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}
                        >
                            {running === 'start-market-refresh' ? '⟲ STARTING...' : '▶️ START_AUTO'}
                        </button>

                        <button
                            onClick={stopMarketRefreshTracker}
                            disabled={running !== null}
                            className="border-2 border-black px-3 py-2 font-bold bg-background hover:bg-background disabled:opacity-50 text-foreground text-xs"
                            style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.3)' }}
                        >
                            {running === 'stop-market-refresh' ? '⟲ STOPPING...' : '⏹️ STOP_AUTO'}
                        </button>
                    </div>
                </div>

            </div>

            {message && (
                <div className="text-xs p-3 border-2 border-black mt-3 bg-background text-foreground">
                    {message}
                </div>
            )}

            {/* Firebase Stats Display */}
            {firebaseStats && (
                <div className="mt-3 p-3 border-2 border-black bg-background text-foreground text-xs">
                    <div className="font-bold mb-2">🔥 FIREBASE DATABASE STATUS:</div>
                    <div className="space-y-1">
                        <div>📊 TOTAL MARKETS: {firebaseStats.totalMarkets}</div>
                        <div>⏰ LAST UPDATE: {firebaseStats.lastUpdate ? new Date(firebaseStats.lastUpdate).toLocaleString() : 'Never'}</div>
                        <div>📡 SOURCE: {firebaseStats.source || 'Unknown'}</div>
                    </div>
                </div>
            )}

            {/* Balance Stats Display */}
            {balanceStats && (
                <div className="mt-3 p-3 border-2 border-purple-500 bg-background text-foreground text-xs">
                    <div className="font-bold mb-2 text-foreground">💰 AGENT BALANCE LEADERBOARD:</div>
                    <div className="space-y-1">
                        {balanceStats.map((balance: any, idx: number) => (
                            <div key={balance.agent_id} className="flex justify-between">
                                <span>{idx + 1}. {balance.agent_name}</span>
                                <span className="font-bold">${balance.current_balance.toFixed(2)} ({balance.roi > 0 ? '+' : ''}{balance.roi.toFixed(1)}% ROI)</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Integrated Tracker Status Display */}
            {integratedTrackerStatus && (
                <div className="mt-3 p-3 border-2 border-teal-500 bg-background text-foreground text-xs">
                    <div className="font-bold mb-2 text-foreground">�💼 INTEGRATED TRACKER STATUS:</div>
                    <div className="space-y-1">
                        <div>🔄 STATUS: {integratedTrackerStatus.isRunning ? '✅ RUNNING' : '❌ STOPPED'}</div>
                        <div>⏱️ UPDATE INTERVAL: {Math.round((integratedTrackerStatus.updateInterval || 300000) / 1000 / 60)} minutes</div>
                        {integratedTrackerStatus.nextUpdate && (
                            <div>⏰ NEXT UPDATE: {new Date(integratedTrackerStatus.nextUpdate).toLocaleTimeString()}</div>
                        )}

                        {/* Odds Tracker Sub-Status */}
                        {integratedTrackerStatus.oddsTracker && (
                            <div className="mt-2 pt-2 border-t border-teal-300">
                                <div className="font-semibold text-foreground">� ODDS TRACKING:</div>
                                <div>� MARKETS TRACKED: {integratedTrackerStatus.oddsTracker.marketsCount || 0}</div>
                                <div>⏰ LAST ODDS UPDATE: {integratedTrackerStatus.oddsTracker.lastUpdate ? new Date(integratedTrackerStatus.oddsTracker.lastUpdate).toLocaleTimeString() : 'Never'}</div>
                            </div>
                        )}


                    </div>
                </div>
            )}

            {/* Market Refresh Tracker Status Display */}
            {marketRefreshStatus && (
                <div className="mt-3 p-3 border-2 border-green-500 bg-background text-foreground text-xs">
                    <div className="font-bold mb-2 text-foreground">🔄 MARKET REFRESH TRACKER STATUS:</div>
                    <div className="space-y-1">
                        <div>🔄 STATUS: {marketRefreshStatus.isRunning ? '✅ RUNNING' : '❌ STOPPED'}</div>
                        <div>⏱️ REFRESH INTERVAL: {Math.round(marketRefreshStatus.refreshInterval / 1000)} seconds</div>
                        {marketRefreshStatus.nextRefresh && (
                            <div>⏰ NEXT REFRESH: {new Date(marketRefreshStatus.nextRefresh).toLocaleTimeString()}</div>
                        )}

                        {/* Refresh Stats */}
                        {marketRefreshStatus.stats && (
                            <div className="mt-2 pt-2 border-t border-green-300">
                                <div className="font-semibold text-foreground">📊 REFRESH STATISTICS:</div>
                                <div>📈 TOTAL MARKETS: {marketRefreshStatus.stats.totalMarkets}</div>
                                <div>➕ ADDED: {marketRefreshStatus.stats.added}</div>
                                <div>🔄 UPDATED: {marketRefreshStatus.stats.updated}</div>
                                <div>⏭️ SKIPPED: {marketRefreshStatus.stats.skipped}</div>
                                {marketRefreshStatus.stats.errors > 0 && (
                                    <div className="text-red-600">❌ ERRORS: {marketRefreshStatus.stats.errors}</div>
                                )}
                                {marketRefreshStatus.stats.lastRefresh && (
                                    <div>⏰ LAST REFRESH: {new Date(marketRefreshStatus.stats.lastRefresh).toLocaleTimeString()}</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sync Stats Display */}
            {syncStats && (
                <div className="mt-3 p-3 border-2 border-black bg-background text-foreground text-xs">
                    <div className="font-bold mb-2">LAST SYNC RESULTS:</div>
                    <div className="space-y-1">
                        <div>✓ ADDED: {syncStats.added}</div>
                        <div>⟲ UPDATED: {syncStats.updated}</div>
                        <div>⊳ SKIPPED: {syncStats.skipped}</div>
                        {syncStats.errors > 0 && <div className="text-red-600">✗ ERRORS: {syncStats.errors}</div>}
                    </div>
                </div>
            )}

            <div className="text-xs text-foreground mt-3 leading-relaxed">
                <div className="mb-1">🔥 NEW FIREBASE SYSTEM:</div>
                <div className="mb-1">▶ ADMIN TRIGGERS AGENT ANALYSIS</div>
                <div className="mb-1">▶ AI SELECTS UNANALYZED MARKETS</div>
                <div className="mb-1">▶ PREDICTIONS STORED IN FIREBASE</div>
                <div>▶ NO MORE UNRELIABLE CRON JOBS</div>
            </div>
        </div>
    );
}