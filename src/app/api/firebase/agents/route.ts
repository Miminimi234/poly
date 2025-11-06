import { CELEBRITY_AGENTS } from '@/lib/celebrity-agents';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Return celebrity agents in the same format as the Supabase agents API
        const agents = CELEBRITY_AGENTS.map(agent => ({
            id: agent.id,
            name: agent.name,
            strategy_type: agent.strategy_type,
            generation: 1, // Celebrity agents are generation 1
            avatar: agent.avatar,
            color: agent.color
        }));

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