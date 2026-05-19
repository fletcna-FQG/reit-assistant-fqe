import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'reit_dark_mode';

type ThemeModeContextValue = {
  isDark: boolean;
  isReady: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((v) => {
        if (v === 'true') setIsDark(true);
      })
      .finally(() => setIsReady(true));
  }, []);

  const persist = useCallback(async (value: boolean) => {
    setIsDark(value);
    await SecureStore.setItemAsync(STORAGE_KEY, value ? 'true' : 'false');
  }, []);

  const value = useMemo(
    () => ({
      isDark,
      isReady,
      toggleDarkMode: () => persist(!isDark),
      setDarkMode: persist,
    }),
    [isDark, isReady, persist],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}
