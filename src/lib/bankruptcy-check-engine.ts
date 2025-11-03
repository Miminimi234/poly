import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/utils/supabase/server';

function ensureServiceClient(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables for bankruptcy check');
    return null;
  }

  return createServiceClient();
}

export async function runBankruptcyCheck() {
  console.log('💀 Starting bankruptcy check...');
  
  try {
    const supabase = ensureServiceClient();
    if (!supabase) {
      return { success: false, error: 'Database not configured. Set SUPABASE environment variables.' };
    }

    // Find agents with balance <= 0 that aren't marked bankrupt
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, name, balance, is_bankrupt')
      .lte('balance', 0)
      .eq('is_bankrupt', false);
    
    if (error) throw error;
    
    if (!agents || agents.length === 0) {
      console.log('✅ No agents to bankrupt');
      return { success: true, bankrupted: 0 };
    }
    
    console.log(`💸 Found ${agents.length} agents with no balance`);
    
    let bankruptedCount = 0;
    
    for (const agent of agents) {
      try {
        // Mark as bankrupt
        await supabase
          .from('agents')
          .update({
            is_bankrupt: true,
            is_active: false,
            bankruptcy_date: new Date().toISOString()
          })
          .eq('id', agent.id);
        
        console.log(`💀 Bankrupted: ${agent.name} (balance: $${agent.balance})`);
        bankruptedCount++;
        
      } catch (error: any) {
        console.error(`❌ Error bankrupting ${agent.name}:`, error.message);
      }
    }
    
    console.log(`\n✅ Bankruptcy check complete! Bankrupted ${bankruptedCount} agents`);
    
    return {
      success: true,
      bankrupted: bankruptedCount
    };
    
  } catch (error: any) {
    console.error('❌ Fatal error in bankruptcy check:', error);
    return { success: false, error: error.message };
  }
}
