import { resetAgentBalance } from '@/lib/firebase-agent-balances';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Agent ID is required' },
                { status: 400 }
            );
        }

        // Reset the agent balance
        const success = await resetAgentBalance(id);

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Agent not found or reset failed' },
                { status: 404 }
            );
        }

        console.log(`✅ Reset balance for agent ${id}`);

        return NextResponse.json({
            success: true,
            message: `Agent ${id} balance reset to initial amount`,
            agent_id: id
        });

    } catch (error: any) {
        console.error('❌ Failed to reset agent balance:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}