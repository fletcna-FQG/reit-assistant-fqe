import { isBackendConfigured } from '@/config/env';
import { TEST_USER } from '@/constants/testUser';
import type { AuthSession, AuthUser } from '@/types/auth';
import { AuthError } from '@/types/auth';
import { isValidEmail, isValidPassword } from '@/utils/validation';
import {
  deletePersistentItem,
  getPersistentItem,
  setPersistentItem,
} from '@/utils/persistentStorage';
import { isAxiosError } from 'axios';
import { authApi, setAuthToken } from './api';
import { isSupabaseConfigured, supabase } from './supabase';

const DEMO_SESSION_KEY = 'reit_demo_auth_session';
const BACKEND_SESSION_KEY = 'reit_backend_auth_session';

function mapBackendUser(user: {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  tenant_id?: string;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    tenantId: user.tenant_id,
  };
}

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

async function saveBackendSession(session: AuthSession): Promise<void> {
  setAuthToken(session.accessToken);
  await setPersistentItem(BACKEND_SESSION_KEY, JSON.stringify(session));
}

export async function clearAuthSession(): Promise<void> {
  if (isBackendConfigured) {
    await clearBackendSession();
    return;
  }
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
    return;
  }
  await clearDemoSession();
  setAuthToken(null);
}

export async function refreshBackendSession(): Promise<AuthSession | null> {
  if (!isBackendConfigured) return null;

  const session = await readBackendSessionRaw();
  if (!session?.refreshToken) return null;

  try {
    const data = await authApi.refresh(session.refreshToken);
    const next: AuthSession = {
      ...session,
      accessToken: data.token,
      refreshToken: data.refresh_token ?? session.refreshToken,
    };
    await saveBackendSession(next);
    return next;
  } catch {
    return null;
  }
}

async function validateBackendSession(session: AuthSession): Promise<AuthSession | null> {
  try {
    await authApi.getProfile();
    return session;
  } catch (error) {
    const isUnauthorized =
      isAxiosError(error) &&
      (error.response?.status === 401 ||
        String(error.response?.data?.message ?? error.message).toLowerCase().includes('token'));
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    const unauthorizedMessage =
      message.includes('session expired') || message.includes('invalid or expired token');

    if (!isUnauthorized && !unauthorizedMessage) {
      return session;
    }

    const refreshed = await refreshBackendSession();
    if (refreshed) {
      try {
        await authApi.getProfile();
        return refreshed;
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function readBackendSessionRaw(): Promise<AuthSession | null> {
  const raw = await getPersistentItem(BACKEND_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

async function loadBackendSession(): Promise<AuthSession | null> {
  const session = await readBackendSessionRaw();
  if (!session) return null;

  setAuthToken(session.accessToken);
  const valid = await validateBackendSession(session);
  if (!valid) {
    await clearBackendSession();
    return null;
  }
  if (valid.accessToken !== session.accessToken || valid.refreshToken !== session.refreshToken) {
    await saveBackendSession(valid);
  }
  return valid;
}

async function clearBackendSession(): Promise<void> {
  setAuthToken(null);
  await deletePersistentItem(BACKEND_SESSION_KEY);
}

async function saveDemoSession(session: AuthSession): Promise<void> {
  setAuthToken(session.accessToken);
  await setPersistentItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

async function loadDemoSession(): Promise<AuthSession | null> {
  const raw = await getPersistentItem(DEMO_SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    setAuthToken(session.accessToken);
    return session;
  } catch {
    return null;
  }
}

async function clearDemoSession(): Promise<void> {
  setAuthToken(null);
  await deletePersistentItem(DEMO_SESSION_KEY);
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

function toAuthError(error: unknown, fallback: string): AuthError {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message ?? error.message ?? fallback;
    if (error.response?.status === 401) {
      return new AuthError(message, 'invalid_credentials');
    }
    return new AuthError(message, 'network_error');
  }
  if (error instanceof Error) {
    return new AuthError(error.message, 'unknown');
  }
  return new AuthError(fallback, 'unknown');
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!isValidEmail(trimmedEmail)) {
    throw new AuthError('Please enter a valid email address', 'invalid_email');
  }
  if (!isValidPassword(password)) {
    throw new AuthError('Password must be at least 6 characters', 'weak_password');
  }

  if (isBackendConfigured) {
    try {
      const data = await authApi.login(trimmedEmail, password);
      const session: AuthSession = {
        user: mapBackendUser(data.user),
        accessToken: data.token,
        refreshToken: data.refresh_token,
      };
      await saveBackendSession(session);
      return session;
    } catch (error) {
      throw toAuthError(error, 'Invalid email or password');
    }
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

  if (isBackendConfigured) {
    try {
      await authApi.register(
        trimmedEmail,
        password,
        fullName ?? 'New Analyst',
        TEST_USER.tenantId,
      );
      return signIn(trimmedEmail, password);
    } catch (error) {
      throw toAuthError(error, 'Registration failed');
    }
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
  if (isBackendConfigured) {
    await clearBackendSession();
    return;
  }

  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signOut();
    if (error) throw new AuthError(error.message, 'unknown');
    return;
  }

  await clearDemoSession();
}

export async function getCurrentUser(): Promise<AuthSession | null> {
  if (isBackendConfigured) {
    return loadBackendSession();
  }

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
  if (isBackendConfigured) {
    throw new AuthError('Social sign-in is not available with backend auth yet.', 'unknown');
  }

  if (!isSupabaseConfigured) {
    const session = createDemoSession(`analyst+${provider}@fletcherquill.com`);
    await saveDemoSession(session);
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({ provider });
  if (error) throw new AuthError(error.message, 'unknown');
}
