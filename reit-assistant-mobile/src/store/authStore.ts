import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { setAuthToken } from '../services/api';

const STORAGE_KEY = 'reit_auth_session';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  tenant_id: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,

  login: async (user, token) => {
    setAuthToken(token);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }));
    set({ user, token, isHydrated: true });
  },

  logout: async () => {
    setAuthToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ user: null, token: null });
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as { user: User; token: string };
      setAuthToken(parsed.token);
      set({ user: parsed.user, token: parsed.token });
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
    } finally {
      set({ isHydrated: true });
    }
  },
}));
