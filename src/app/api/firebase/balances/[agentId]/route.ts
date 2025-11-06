/**
 * Firebase Agent Balance Management API - Reset/Adjust individual agent balance
 */

import { getAgentBalance, resetAgentBalance } from '@/lib/firebase-agent-balances';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;

        console.log(`📊 Fetching balance for agent: ${agentId}`);

        const balance = await getAgentBalance(agentId);

        if (!balance) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Agent balance not found'
                },
                { status: 404 }
            );
        }

        console.log(`✅ Retrieved balance for ${balance.agent_name}: $${balance.current_balance}`);

        return NextResponse.json({
            success: true,
            balance
        });

    } catch (error: any) {
        console.error(`❌ Failed to fetch agent balance:`, error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const { action } = await request.json();

        console.log(`🔧 Admin action for agent ${agentId}: ${action}`);

        if (action === 'reset') {
            const success = await resetAgentBalance(agentId);

            if (!success) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Failed to reset agent balance'
                    },
                    { status: 400 }
                );
            }

            const updatedBalance = await getAgentBalance(agentId);

            console.log(`✅ Reset balance for agent ${agentId}`);

            return NextResponse.json({
                success: true,
                message: 'Agent balance reset successfully',
                balance: updatedBalance
            });
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Invalid action. Supported actions: reset'
            },
            { status: 400 }
        );

    } catch (error: any) {
        console.error(`❌ Failed to process admin action for agent:`, error);
        return NextResponse.json(
            {
                success: false,
                error: error.message
            },
            { status: 500 }
        );
    }
}