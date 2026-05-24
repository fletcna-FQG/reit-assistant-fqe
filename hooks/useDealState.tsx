import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DealStatus } from '@/types/index';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'reit_assistant_deal_state';

type DealStateContextValue = {
  dealState: DealStatus;
  setDealState: (status: DealStatus) => void;
};

const DealStateContext = createContext<DealStateContextValue | null>(null);

export function DealStateProvider({ children }: { children: React.ReactNode }) {
  const [dealState, setDealStateInternal] = useState<DealStatus>('pipeline');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw === 'pipeline' || raw === 'review' || raw === 'approved' || raw === 'closed') {
        setDealStateInternal(raw);
      }
    });
  }, []);

  const setDealState = useCallback((status: DealStatus) => {
    setDealStateInternal(status);
    void AsyncStorage.setItem(STORAGE_KEY, status);
  }, []);

  const value = useMemo(() => ({ dealState, setDealState }), [dealState, setDealState]);

  return <DealStateContext.Provider value={value}>{children}</DealStateContext.Provider>;
}

export function useDealState() {
  const ctx = useContext(DealStateContext);
  if (!ctx) {
    throw new Error('useDealState must be used within DealStateProvider');
  }
  return ctx;
}
