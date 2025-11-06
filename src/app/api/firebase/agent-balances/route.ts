import { getAllAgentBalances } from '@/lib/firebase-agent-balances';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Get all agent balances from Firebase
        const balances = await getAllAgentBalances();

        console.log('✅ Firebase agent balances retrieved:', balances.length);

        return NextResponse.json({
            success: true,
            balances,
            source: 'firebase',
            count: balances.length
        });

    } catch (error: any) {
        console.error('❌ Failed to get Firebase agent balances:', error);
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