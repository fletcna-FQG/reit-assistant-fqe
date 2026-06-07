import { createClient } from '@supabase/supabase-js';
import { config } from '../src/config/env';

async function main() {
  const client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email: 'webtest2@fletcherquillestates.com',
    password: 'Test123!',
  });

  if (error || !data.session?.access_token) {
    console.error(error?.message ?? 'no token');
    process.exit(1);
  }

  console.log(data.session.access_token);
}

main();
