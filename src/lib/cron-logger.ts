import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/utils/supabase/server';

let cachedSupabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables for cron logging');
    return null;
  }

  if (!cachedSupabase) {
    cachedSupabase = createServiceClient();
  }

  return cachedSupabase;
}

export async function logCronRun(
  job: string,
  status: 'success' | 'error',
  details: any
) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return;
    }

    await supabase
      .from('cron_logs')
      .insert({
        job_name: job,
        status,
        details: details,
        executed_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log cron run:', error);
  }
}
