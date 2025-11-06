/**
 * Firebase Agent Balances API - List all agent balances
 */

import { getAgentLeaderboard, getAllAgentBalances } from '@/lib/firebase-agent-balances';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sortBy = searchParams.get('sortBy') || 'balance';

        console.log('📊 Fetching agent balances with sort:', sortBy);

        let balances;

        if (sortBy === 'balance' || sortBy === 'roi' || sortBy === 'winRate' || sortBy === 'totalWinnings') {
            balances = await getAgentLeaderboard(sortBy as any);
        } else {
            balances = await getAllAgentBalances();
        }

        console.log(`✅ Retrieved ${balances.length} agent balances`);

        return NextResponse.json({
            success: true,
            balances,
            count: balances.length
        });

    } catch (error: any) {
        console.error('❌ Failed to fetch agent balances:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                balances: []
            },
            { status: 500 }
        );
    }
}