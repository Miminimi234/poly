import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateAgentRequest {
  name: string;
  description?: string;
  strategy_type: string;
  initial_balance: number;
  user_id?: string;
}

export async function POST(request: Request) {
  try {
    const body: CreateAgentRequest = await request.json();
    const { name, description, strategy_type, initial_balance, user_id } = body;
    
    // Validate required fields
    if (!name || !strategy_type || !initial_balance) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate strategy type
    const validStrategies = [
      'conservative',
      'aggressive',
      'speed_demon',
      'academic',
      'balanced',
      'data_driven',
      'news_junkie',
      'expert_network'
    ];
    
    if (!validStrategies.includes(strategy_type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Invalid strategy type' },
        { status: 400 }
      );
    }
    
    // Validate initial balance (min $10, max $10,000)
    if (initial_balance < 10 || initial_balance > 10000) {
      return NextResponse.json(
        { success: false, error: 'Initial balance must be between $10 and $10,000' },
        { status: 400 }
      );
    }
    
    // Generate BSC wallet for agent
    const wallet = ethers.Wallet.createRandom();
    const walletAddress = wallet.address;
    const privateKey = wallet.privateKey;
    
    // Insert agent into database
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        name: name.trim(),
        description: description?.trim() || `${strategy_type} strategy agent`,
        strategy_type: strategy_type.toLowerCase(),
        wallet_address: walletAddress,
        wallet_private_key_encrypted: privateKey, // Store encrypted in production!
        current_balance_usdt: initial_balance,
        initial_balance_usdt: initial_balance,
        total_spent_usdt: 0,
        total_earned_usdt: 0,
        accuracy: 0,
        total_predictions: 0,
        total_profit_loss: 0,
        roi: 0,
        is_active: true,
        is_bankrupt: false,
        user_id: user_id || null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Log creation
    console.log(`Created agent: ${agent.name} (${agent.id}) - ${strategy_type} - $${initial_balance}`);
    
    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        strategy_type: agent.strategy_type,
        wallet_address: agent.wallet_address,
        balance: agent.current_balance_usdt
      },
      message: 'Agent created successfully'
    });
    
  } catch (error: any) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create agent' },
      { status: 500 }
    );
  }
}

