import { NextResponse } from 'next/server';
import { getAllAgents, getCelebrityAgents } from '@/lib/db/agents';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const celebritiesOnly = searchParams.get('celebrities') === 'true';
    
    let agents;
    if (celebritiesOnly) {
      agents = getCelebrityAgents();
    } else {
      agents = getAllAgents();
    }
    
    // Parse traits JSON string back to object
    const formattedAgents = agents.map(agent => ({
      ...agent,
      traits: agent.traits ? JSON.parse(agent.traits) : null,
      is_celebrity: agent.is_celebrity === 1,
      is_active: true,
      is_bankrupt: false
    }));
    
    return NextResponse.json({
      success: true,
      agents: formattedAgents
    });
    
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
