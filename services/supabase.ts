import { createClient } from '@supabase/supabase-js';
import {
  deletePersistentItem,
  getPersistentItem,
  setPersistentItem,
} from '@/utils/persistentStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const persistentStorageAdapter = {
  getItem: (key: string) => getPersistentItem(key),
  setItem: (key: string, value: string) => setPersistentItem(key, value),
  removeItem: (key: string) => deletePersistentItem(key),
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: persistentStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
