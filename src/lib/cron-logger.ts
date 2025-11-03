import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function logCronRun(
  job: string,
  status: 'success' | 'error',
  details: any
) {
  try {
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

