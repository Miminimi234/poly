import { CELEBRITY_AGENTS } from '@/lib/celebrity-agents';
import { getAllAgentBalances } from '@/lib/firebase-agent-balances';
import { NextResponse } from 'next/server';

export async function GET() {
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

        // Get agent balances from Firebase
        const balances = await getAllAgentBalances();

        // Get all predictions to calculate FROI
        const predictionsRef = ref(database as any, 'agent_predictions');
        const snapshot = await get(predictionsRef);
        const predictionsData = snapshot.exists() ? snapshot.val() : {};
        const predictions = Object.entries(predictionsData || {}).map(([id, pred]: [string, any]) => ({
            id,
            ...pred
        }));

        // Create a map for quick balance lookup
        const balanceMap = new Map();
        balances.forEach(balance => {
            balanceMap.set(balance.agent_id, balance);
        });

        // Return celebrity agents with proper FROI calculation
        const agents = CELEBRITY_AGENTS.map(agent => {
            const balance = balanceMap.get(agent.id);
            const initialBalance = balance?.initial_balance || 1000;

            // Calculate FROI same way as leaderboard
            const openPositions = predictions.filter(p => p.agent_id === agent.id && p.position_status === 'OPEN');
            let totalWagered = 0;
            let totalPositionValue = 0;

            openPositions.forEach(prediction => {
                const expectedPayout = prediction.expected_payout || 0;
                totalPositionValue += expectedPayout;
                totalWagered += prediction.bet_amount || 0;
            });

            const totalPnL = totalPositionValue - totalWagered;
            const roi = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

            return {
                id: agent.id,
                name: agent.name,
                strategy_type: agent.strategy_type,
                generation: 1, // Celebrity agents are generation 1
                avatar: agent.avatar,
                color: agent.color,
                balance: balance?.current_balance || 0,
                roi: parseFloat((roi || 0).toFixed(1)),
                accuracy: balance?.win_rate || 0,
                total_predictions: balance?.prediction_count || 0
            };
        });

        console.log('✅ Firebase agents retrieved:', agents.length);

        return NextResponse.json({
            success: true,
            agents,
            source: 'firebase'
        });

    } catch (error: any) {
        console.error('❌ Failed to get Firebase agents:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                source: 'firebase'
            },
            { status: 500 }
        );
    }
}