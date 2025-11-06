/**
 * Firebase Agent Balance Initialization API - Initialize all agent balances
 */

import { initializeAgentBalances } from '@/lib/firebase-agent-balances';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        console.log('🔧 Initializing all agent balances...');

        await initializeAgentBalances();

        console.log('✅ Agent balances initialized successfully');

        return NextResponse.json({
            success: true,
            message: 'All agent balances initialized successfully'
        });

    } catch (error: any) {
        console.error('❌ Failed to initialize agent balances:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}