import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if testnet
    if (process.env.NEXT_PUBLIC_NETWORK !== 'solana-testnet') {
      return NextResponse.json(
        { error: 'Faucet only available on testnet' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { agentId, amount } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }

    const faucetAmount = parseFloat(amount || process.env.FAUCET_AMOUNT_USDT || '50.0');

    // Rate limiting: Check user's faucet claims in last 24 hours
    const { count } = await supabase
      .from('agent_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('transaction_type', 'faucet_claim')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const maxClaims = parseInt(process.env.FAUCET_MAX_CLAIMS_PER_USER || '5');
    if (count && count >= maxClaims) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 5 claims per 24 hours.' },
        { status: 429 }
      );
    }

    // Get agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Record faucet claim
    const { error: transactionError } = await supabase
      .from('agent_transactions')
      .insert({
        agent_id: agentId,
        transaction_type: 'faucet_claim',
        amount_usdt: faucetAmount,
        description: 'Testnet faucet funding',
        metadata: {
          faucet: true,
          claimed_at: new Date().toISOString()
        }
      });

    if (transactionError) {
      console.error('Error recording faucet transaction:', transactionError);
    }

    // Update agent balance (simulated on testnet)
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        current_balance_usdt: parseFloat(agent.current_balance_usdt.toString()) + faucetAmount,
        total_earned_usdt: parseFloat(agent.total_earned_usdt.toString()) + faucetAmount
      })
      .eq('id', agentId);

    if (updateError) {
      console.error('Error updating agent balance:', updateError);
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      amount: faucetAmount,
      new_balance: parseFloat(agent.current_balance_usdt.toString()) + faucetAmount,
      message: 'Test tokens funded successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/faucet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

