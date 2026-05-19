import type { AuthSession, AuthUser } from '@/types/auth';
import { AuthError } from '@/types/auth';
import { isValidEmail, isValidPassword } from '@/utils/validation';
import * as SecureStore from 'expo-secure-store';
import { isSupabaseConfigured, supabase } from './supabase';

const DEMO_SESSION_KEY = 'reit_demo_auth_session';

function mapSupabaseUser(user: {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string };
}): AuthUser {
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: user.user_metadata?.full_name,
  };
}

async function saveDemoSession(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(DEMO_SESSION_KEY, JSON.stringify(session));
}

async function loadDemoSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(DEMO_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

async function clearDemoSession(): Promise<void> {
  await SecureStore.deleteItemAsync(DEMO_SESSION_KEY);
}

function createDemoSession(email: string): AuthSession {
  return {
    user: {
      id: `demo-${email}`,
      email,
      fullName: 'Nancy Fletcher',
    },
    accessToken: `demo-token-${Date.now()}`,
  };
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!isValidEmail(trimmedEmail)) {
    throw new AuthError('Please enter a valid email address', 'invalid_email');
  }
  if (!isValidPassword(password)) {
    throw new AuthError('Password must be at least 6 characters', 'weak_password');
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      throw new AuthError(error.message, 'invalid_credentials');
    }
    if (!data.session || !data.user) {
      throw new AuthError('Sign in failed', 'unknown');
    }

    return {
      user: mapSupabaseUser(data.user),
      accessToken: data.session.access_token,
    };
  }

  const session = createDemoSession(trimmedEmail);
  await saveDemoSession(session);
  return session;
}

export async function signUp(
  email: string,
  password: string,
  fullName?: string,
): Promise<AuthSession> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!isValidEmail(trimmedEmail)) {
    throw new AuthError('Please enter a valid email address', 'invalid_email');
  }
  if (!isValidPassword(password)) {
    throw new AuthError('Password must be at least 6 characters', 'weak_password');
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      throw new AuthError(error.message, 'unknown');
    }
    if (!data.session || !data.user) {
      throw new AuthError(
        'Account created. Check your email to confirm, then sign in.',
        'unknown',
      );
    }

    return {
      user: mapSupabaseUser(data.user),
      accessToken: data.session.access_token,
    };
  }

  const session = createDemoSession(trimmedEmail);
  session.user.fullName = fullName ?? 'New Analyst';
  await saveDemoSession(session);
  return session;
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signOut();
    if (error) throw new AuthError(error.message, 'unknown');
    return;
  }
  await clearDemoSession();
}

export async function getCurrentUser(): Promise<AuthSession | null> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) return null;

    return {
      user: mapSupabaseUser(data.session.user),
      accessToken: data.session.access_token,
    };
  }

  return loadDemoSession();
}

export async function signInWithOAuth(provider: 'google' | 'apple'): Promise<void> {
  if (!isSupabaseConfigured) {
    const session = createDemoSession(`analyst+${provider}@fletcherquill.com`);
    await saveDemoSession(session);
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({ provider });
  if (error) throw new AuthError(error.message, 'unknown');
}
