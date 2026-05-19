import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useNetwork } from './useNetwork';

const QUEUE_KEY = 'reit_offline_write_queue';

export type QueuedWrite = {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  createdAt: string;
};

export function useOfflineQueue() {
  const { isOffline } = useNetwork();
  const [queue, setQueue] = useState<QueuedWrite[]>([]);

  const loadQueue = useCallback(async () => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    setQueue(raw ? (JSON.parse(raw) as QueuedWrite[]) : []);
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const enqueue = useCallback(
    async (write: Omit<QueuedWrite, 'id' | 'createdAt'>) => {
      const item: QueuedWrite = {
        ...write,
        id: `q_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const next = [...queue, item];
      setQueue(next);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
      return item;
    },
    [queue],
  );

  const flushQueue = useCallback(async () => {
    if (isOffline || queue.length === 0) return;
    await AsyncStorage.removeItem(QUEUE_KEY);
    setQueue([]);
  }, [isOffline, queue]);

  return { queue, isOffline, enqueue, flushQueue, pendingCount: queue.length };
}
