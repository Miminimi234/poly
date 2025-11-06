import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    // Import Firebase modules for server-side use
    const { getApps, initializeApp } = await import('firebase/app');
    const { getDatabase, ref, get } = await import('firebase/database');

    // Firebase config
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    // Initialize Firebase for server-side
    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    const database = getDatabase(app);

    // Get all predictions from Firebase
    const predictionsRef = ref(database, 'agent_predictions');
    const snapshot = await get(predictionsRef);

    if (!snapshot.exists()) {
      return NextResponse.json({
        success: true,
        leaderboard: [],
        message: 'No predictions found in Firebase'
      });
    }

    const predictionsData = snapshot.val();
    const predictions = Object.entries(predictionsData || {}).map(([id, pred]: [string, any]) => ({
      id,
      ...pred
    }));

    // If no predictions, return empty leaderboard
    if (predictions.length === 0) {
      return NextResponse.json({
        success: true,
        leaderboard: [],
        total_agents: 0,
        message: 'No predictions found',
        source: 'firebase'
      });
    }

    // Get agent balances to calculate ROI properly
    const balancesRef = ref(database, 'agent_balances');
    const balancesSnapshot = await get(balancesRef);
    const balancesData = balancesSnapshot.exists() ? balancesSnapshot.val() : {};
    const balances = Object.entries(balancesData).map(([id, balance]: [string, any]) => ({
      id,
      ...balance
    }));

    // Group predictions by agent
    const agentStats = new Map();

    predictions.forEach((pred: any) => {
      const agentId = pred.agent_id;
      const agentName = pred.agent_name || 'Unknown Agent';
      const strategyType = pred.agent_strategy || 'UNKNOWN';

      if (!agentStats.has(agentId)) {
        agentStats.set(agentId, {
          id: agentId,
          name: agentName,
          strategy_type: strategyType,
          total_predictions: 0,
          resolved_predictions: 0,
          correct_predictions: 0,
          total_profit_loss: 0,
          total_bet_amount: 0,
          total_position_value: 0,
          win_rate: 0,
          roi: 0
        });
      }

      const stats = agentStats.get(agentId);
      stats.total_predictions++;
      stats.total_bet_amount += pred.bet_amount || 0;

      // Handle open positions (expected payouts)
      if (pred.position_status === 'OPEN' && pred.expected_payout) {
        stats.total_position_value += pred.expected_payout;
      }

      // Only count resolved predictions
      if (pred.outcome !== null && pred.outcome !== undefined) {
        stats.resolved_predictions++;
        stats.total_profit_loss += pred.profit_loss || 0;

        if (pred.correct === true) {
          stats.correct_predictions++;
        }
      }
    });

    // Calculate final stats using FROI method from agent page
    const leaderboardEntries = Array.from(agentStats.values()).map((stats: any) => {
      const balance = balances.find((b: any) => b.agent_id === stats.id);
      const initialBalance = balance?.initial_balance || 1000;

      // Calculate floating P&L (same as agent page)
      const openPositions = predictions.filter(p => p.agent_id === stats.id && p.position_status === 'OPEN');
      let totalWagered = 0;
      let totalPositionValue = 0;

      openPositions.forEach(prediction => {
        const expectedPayout = prediction.expected_payout || 0;
        totalPositionValue += expectedPayout;
        totalWagered += prediction.bet_amount || 0;
      });

      const totalPnL = totalPositionValue - totalWagered;

      // FROI = (totalPnL / initialBalance) * 100 (same as agent page)
      const roi = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

      // Calculate win rate with proper null checks
      const win_rate = stats.resolved_predictions > 0
        ? (stats.correct_predictions / stats.resolved_predictions) * 100
        : 0;

      return {
        id: stats.id || '',
        name: stats.name || 'Unknown Agent',
        strategy_type: stats.strategy_type || 'UNKNOWN',
        roi: parseFloat((roi || 0).toFixed(1)),
        total_profit_loss: parseFloat((totalPnL || 0).toFixed(2)),
        resolved_predictions: parseInt(stats.resolved_predictions) || 0,
        correct_predictions: parseInt(stats.correct_predictions) || 0,
        win_rate: parseFloat((win_rate || 0).toFixed(1))
      };
    });

    // Filter out agents with no data (keep all since we're showing ROI-based ranking)
    const filteredEntries = leaderboardEntries;

    // Always sort by ROI (descending)
    const sortedEntries = filteredEntries.sort((a, b) => b.roi - a.roi);

    // Limit results
    const leaderboard = sortedEntries.slice(0, limit);

    return NextResponse.json({
      success: true,
      leaderboard,
      total_agents: filteredEntries.length,
      source: 'firebase'
    });

  } catch (error: any) {
    console.error('Firebase leaderboard error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch Firebase leaderboard',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}