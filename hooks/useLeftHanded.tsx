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

const STORAGE_KEY = 'reit_left_handed_mode';

type LeftHandedContextValue = {
  isLeftHanded: boolean;
  isReady: boolean;
  toggleLeftHanded: () => void;
  setLeftHanded: (value: boolean) => void;
};

const LeftHandedContext = createContext<LeftHandedContextValue | null>(null);

export function LeftHandedProvider({ children }: { children: ReactNode }) {
  const [isLeftHanded, setIsLeftHanded] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getPersistentItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'true') setIsLeftHanded(true);
      })
      .finally(() => setIsReady(true));
  }, []);

  const persist = useCallback(async (value: boolean) => {
    setIsLeftHanded(value);
    await setPersistentItem(STORAGE_KEY, value ? 'true' : 'false');
  }, []);

  const toggleLeftHanded = useCallback(() => {
    persist(!isLeftHanded);
  }, [isLeftHanded, persist]);

  const value = useMemo(
    () => ({
      isLeftHanded,
      isReady,
      toggleLeftHanded,
      setLeftHanded: persist,
    }),
    [isLeftHanded, isReady, toggleLeftHanded, persist],
  );

  return (
    <LeftHandedContext.Provider value={value}>{children}</LeftHandedContext.Provider>
  );
}

export function useLeftHanded() {
  const context = useContext(LeftHandedContext);
  if (!context) {
    throw new Error('useLeftHanded must be used within LeftHandedProvider');
  }
  return context;
}
