import * as authService from '@/services/auth';
import { isSupabaseConfigured, supabase } from '@/services/supabase';
import type { AuthSession } from '@/types/auth';
import { AuthError } from '@/types/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrate = useCallback(async () => {
    const current = await authService.getCurrentUser();
    setSession(current);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    hydrate();

    if (!isSupabaseConfigured) return;

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, supabaseSession) => {
      if (supabaseSession?.user) {
        setSession({
          user: {
            id: supabaseSession.user.id,
            email: supabaseSession.user.email ?? '',
            fullName: supabaseSession.user.user_metadata?.full_name,
          },
          accessToken: supabaseSession.access_token,
        });
      } else {
        setSession(null);
      }
      setIsLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, [hydrate]);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = await authService.signIn(email, password);
    setSession(next);
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const next = await authService.signUp(email, password, fullName);
    setSession(next);
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple') => {
    await authService.signInWithOAuth(provider);
    if (!isSupabaseConfigured) {
      const current = await authService.getCurrentUser();
      setSession(current);
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      isLoading,
      isAuthenticated: Boolean(session),
      isDemoMode: !isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      signInWithOAuth,
    }),
    [session, isLoading, signIn, signUp, signOut, signInWithOAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { AuthError };
