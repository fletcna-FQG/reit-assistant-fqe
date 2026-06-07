import { createClient } from '@supabase/supabase-js';
import { config } from './env';
import ws from 'ws';

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
  realtime: {
    transport: ws as any,
  },
};

function createServiceClient() {
  return createClient(config.supabase.url, config.supabase.serviceRoleKey, clientOptions);
}

/**
 * Database-only client (PostgREST). Never call .auth on this instance —
 * signIn/getUser on a shared client replaces the service-role JWT and breaks inserts.
 */
export const supabaseDb = createServiceClient();

/** Auth admin operations (signIn, getUser, createUser, etc.) */
export const supabaseAuth = createServiceClient();

/** @deprecated Use supabaseDb for queries and supabaseAuth for auth */
export const supabaseAdmin = supabaseDb;

export const supabaseClient = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  clientOptions,
);
