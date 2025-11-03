import { NextResponse } from 'next/server';
import { breedAgents } from '@/lib/agent-breeding';
import { createServiceClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const { parent1Id, parent2Id, offspringName } = await request.json();
    
    if (!parent1Id || !parent2Id) {
      return NextResponse.json(
        { success: false, error: 'Both parent IDs required' },
        { status: 400 }
      );
    }
    
    const result = await breedAgents(supabase, parent1Id, parent2Id, offspringName);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

