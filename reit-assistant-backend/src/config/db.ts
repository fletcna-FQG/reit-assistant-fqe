import { createClient } from '@supabase/supabase-js';
import { config } from './env';
import ws from 'ws';

// Provide ws transport to satisfy Supabase Realtime on Node.js 20
// We don't actually use Realtime — this just prevents the crash
const options = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
  realtime: {
    transport: ws,
  },
};

export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  options
);

export const supabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  options
);
