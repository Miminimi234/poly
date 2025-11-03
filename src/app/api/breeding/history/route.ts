import { NextResponse } from 'next/server';
import { getBreedingHistory } from '@/lib/agent-breeding';
import { createServiceClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables for /api/breeding/history');
      return NextResponse.json(
        { success: false, error: 'Database not configured. Set SUPABASE environment variables.' },
        { status: 500 }
      );
    }

    const supabase = createServiceClient();
    const result = await getBreedingHistory(supabase, limit);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
