import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'attom_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
}

/** Smart fetcher — check cache before API call (Phase 10) */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached) return cached;
  const data = await fetcher();
  await setCache(key, data);
  return data;
}

export async function getMarketTrends(zip: string) {
  return fetchWithCache(`market_${zip}`, async () => ({
    zip,
    medianCapRate: 6.4,
    trend: 'up' as const,
    changePercent: 0.8,
    updatedAt: new Date().toISOString(),
  }));
}
