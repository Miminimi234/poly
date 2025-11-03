import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { runAgentAnalysis } from '@/lib/polymarket-analysis';

// Trigger analysis for all agents
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, name')
      .eq('is_active', true)
      .eq('is_bankrupt', false);
    
    if (error) throw error;
    
    if (!agents || agents.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active agents to analyze' 
      });
    }
    
    console.log(`Triggering analysis for ${agents.length} agents`);
    
    // Run analysis asynchronously (don't wait)
    agents.forEach(agent => {
      runAgentAnalysis(agent.id).catch(err => 
        console.error(`Failed to analyze for agent ${agent.id} (${agent.name}):`, err)
      );
    });
    
    return NextResponse.json({
      success: true,
      message: `Triggered analysis for ${agents.length} agents`,
      agents: agents.map(a => ({ id: a.id, name: a.name }))
    });
    
  } catch (error: any) {
    console.error('Analysis trigger error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Optional GET endpoint for manual testing
export async function GET(request: Request) {
  return POST(request);
}

