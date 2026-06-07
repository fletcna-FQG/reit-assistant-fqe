import {
  getPersistentItem,
  setPersistentItem,
} from '@/utils/persistentStorage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'reit_sidebar_collapsed';

type SidebarCollapsedContextValue = {
  isCollapsed: boolean;
  isReady: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
};

const SidebarCollapsedContext = createContext<SidebarCollapsedContextValue | null>(null);

export function SidebarCollapsedProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getPersistentItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'true') setIsCollapsed(true);
      })
      .finally(() => setIsReady(true));
  }, []);

  const persist = useCallback(async (value: boolean) => {
    setIsCollapsed(value);
    await setPersistentItem(STORAGE_KEY, value ? 'true' : 'false');
  }, []);

  const toggleCollapsed = useCallback(() => {
    persist(!isCollapsed);
  }, [isCollapsed, persist]);

  const value = useMemo(
    () => ({
      isCollapsed,
      isReady,
      toggleCollapsed,
      setCollapsed: persist,
    }),
    [isCollapsed, isReady, toggleCollapsed, persist],
  );

  return (
    <SidebarCollapsedContext.Provider value={value}>{children}</SidebarCollapsedContext.Provider>
  );
}

export function useSidebarCollapsed() {
  const context = useContext(SidebarCollapsedContext);
  if (!context) {
    throw new Error('useSidebarCollapsed must be used within SidebarCollapsedProvider');
  }
  return context;
}
