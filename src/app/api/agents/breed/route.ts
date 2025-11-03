import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { breedAgents, createDNAFromStrategy, AgentDNA } from '@/lib/gamification/agent-breeding';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { parentAId, parentBId, mutationRate = 0.1 } = body;

    if (!parentAId || !parentBId) {
      return NextResponse.json(
        { error: 'Both parent IDs are required' },
        { status: 400 }
      );
    }

    // Get parent agents
    const { data: parentA, error: errorA } = await supabase
      .from('agents')
      .select('*')
      .eq('id', parentAId)
      .eq('user_id', user.id)
      .single();

    const { data: parentB, error: errorB } = await supabase
      .from('agents')
      .select('*')
      .eq('id', parentBId)
      .eq('user_id', user.id)
      .single();

    if (errorA || !parentA) {
      return NextResponse.json({ error: 'Parent A not found' }, { status: 404 });
    }

    if (errorB || !parentB) {
      return NextResponse.json({ error: 'Parent B not found' }, { status: 404 });
    }

    // Extract DNA from parents
    const parentADNA = createDNAFromStrategy(
      parentA.strategy_config as any,
      parentA.id,
      undefined,
      0
    );

    const parentBDNA = createDNAFromStrategy(
      parentB.strategy_config as any,
      parentB.id,
      undefined,
      0
    );

    // Breed agents
    const breedingResult = breedAgents(parentADNA, parentBDNA, mutationRate);

    // Create child agent
    const childAgentData = {
      user_id: user.id,
      name: `Child of ${parentA.name} & ${parentB.name}`,
      description: `Generation ${breedingResult.childDNA.generation} hybrid`,
      strategy_type: 'hybrid',
      wallet_address: `child_${parentAId}_${parentBId}_${Date.now()}`,
      wallet_private_key_encrypted: '', // Generate new wallet
      initial_balance_usdt: ((parentA.current_balance_usdt + parentB.current_balance_usdt) / 4).toFixed(2),
      current_balance_usdt: ((parentA.current_balance_usdt + parentB.current_balance_usdt) / 4).toFixed(2),
      strategy_config: breedingResult.childStrategy,
      is_active: true,
      is_bankrupt: false
    };

    const { data: childAgent, error: insertError } = await supabase
      .from('agents')
      .insert(childAgentData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating child agent:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      childAgent,
      breedingResult: {
        expectedPerformance: breedingResult.expectedPerformance,
        mutationCount: breedingResult.mutationCount,
        dna: breedingResult.childDNA
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/agents/breed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

