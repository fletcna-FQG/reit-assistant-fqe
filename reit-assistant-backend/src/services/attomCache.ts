import { redis } from '../config/redis';
import { config } from '../config/env';
import { supabaseDb } from '../config/db';

export const CACHE_TTL = {
  PROFILE: 7 * 24 * 60 * 60,
  AVM: 7 * 24 * 60 * 60,
  EQUITY: 7 * 24 * 60 * 60,
  COMPS: 30 * 24 * 60 * 60,
  TRENDS: 30 * 24 * 60 * 60,
  TRANSACTIONS: 90 * 24 * 60 * 60,
} as const;

export type AttomEndpointType = keyof typeof CACHE_TTL;

export type AttomAddressParts = {
  address: string;
  city: string;
  state: string;
  zip?: string;
};

export type CacheOptions = {
  bypassCache?: boolean;
  userId?: string;
  tenantId?: string;
};

export type AttomCacheResult<T> = {
  data: T;
  source: 'cache' | 'live';
  cachedAt?: string;
};

type CacheEnvelope<T> = {
  data: T;
  cachedAt: string;
};

type GetCachedOrFetchOptions = CacheOptions & {
  endpoint?: string;
};

const COST_PER_CALL = 0.1;
const MONTHLY_BUDGET = 500;
const MAX_CALLS_PER_HOUR = 30;
const REFRESH_LIMIT_SECONDS = 3600;

/** Lowercase, trim, hyphenate spaces, strip # . , and other non-alphanumeric chars. */
export function normalizeAttomIdentifier(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[#.,]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildAddressIdentifier(parts: AttomAddressParts): string {
  const segments = [parts.address, parts.city, parts.state, parts.zip].filter(Boolean);
  return normalizeAttomIdentifier(segments.join(' '));
}

export function buildTrendsIdentifier(city: string, state: string): string {
  return normalizeAttomIdentifier(`${city} ${state}`);
}

export function buildAttomCacheKey(endpointType: AttomEndpointType, identifier: string): string {
  const normalized = normalizeAttomIdentifier(identifier);
  return `attom:${endpointType.toLowerCase()}:${normalized}`;
}

export function isAttomConfigured(): boolean {
  const key = config.services.attom.apiKey;
  return Boolean(key && !key.startsWith('your-'));
}

function monthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function checkAndIncrementUserRateLimit(userId: string): Promise<void> {
  const key = `attom:ratelimit:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, REFRESH_LIMIT_SECONDS);
  }
  if (count > MAX_CALLS_PER_HOUR) {
    throw new Error('ATTOM API rate limit exceeded. Please try again later.');
  }
}

async function logAttomApiCall(
  tenantId: string | undefined,
  userId: string | undefined,
  cacheKey: string,
  endpoint: string | undefined,
): Promise<void> {
  if (!tenantId || !userId) {
    return;
  }

  try {
    await supabaseDb.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      action: 'ATTOM_API_CALL',
      metadata: {
        endpoint,
        address: cacheKey.split(':').pop(),
        cache_hit: false,
        cost_estimate: COST_PER_CALL,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('ATTOM audit log write failed:', error);
  }
}

async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number,
  options?: GetCachedOrFetchOptions,
): Promise<AttomCacheResult<T>> {
  const userId = options?.userId;

  if (options?.bypassCache) {
    if (userId) {
      const refreshKey = `attom:ratelimit:refresh:${userId}:${cacheKey}`;
      const blocked = await redis.get(refreshKey);
      if (blocked) {
        throw new Error('Refresh limit reached. Please wait 1 hour.');
      }
    }
  } else {
    const cachedRaw = await redis.get(cacheKey);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw) as CacheEnvelope<T> | T;
      if (parsed && typeof parsed === 'object' && 'data' in parsed) {
        const envelope = parsed as CacheEnvelope<T>;
        return {
          data: envelope.data,
          source: 'cache',
          cachedAt: envelope.cachedAt,
        };
      }
      return {
        data: parsed as T,
        source: 'cache',
      };
    }
  }

  if (userId) {
    await checkAndIncrementUserRateLimit(userId);
  }

  const data = await fetchFn();
  const cachedAt = new Date().toISOString();
  const envelope: CacheEnvelope<T> = { data, cachedAt };
  await redis.setex(cacheKey, ttl, JSON.stringify(envelope));

  await logAttomApiCall(options?.tenantId, options?.userId, cacheKey, options?.endpoint);

  if (options?.bypassCache && userId) {
    await redis.setex(`attom:ratelimit:refresh:${userId}:${cacheKey}`, REFRESH_LIMIT_SECONDS, '1');
  }

  return { data, source: 'live' };
}

// --- Placeholder fetchers (real ATTOM HTTP client not implemented yet) ---

function mockPropertyProfile(address: string) {
  return {
    property: [
      {
        attomId: 100000 + address.length,
        building: { yearbuilt: 1998 },
        assessment: { tax: { taxAmt: 12500 } },
        lot: { lotsize2: 7200 },
        summary: { proptype: 'Multifamily' },
        sale: { amount: 1850000 },
      },
    ],
    address,
    source: 'mock',
  };
}

function mockAVMDetail(address: string) {
  return {
    property: [{ avm: { amount: 1925000, confidence: 85 } }],
    address,
    source: 'mock',
  };
}

function mockHomeEquity(address: string) {
  return {
    address,
    estimatedEquity: 640000,
    loanBalance: 1285000,
    ltv: 66.8,
    source: 'mock',
  };
}

function mockSaleComparables(address: string) {
  return {
    address,
    comparables: [
      { address: '118 Main St', salePrice: 1780000, saleDate: '2025-11-12', distanceMiles: 0.3 },
      { address: '140 Oak Ave', salePrice: 1950000, saleDate: '2026-01-08', distanceMiles: 0.6 },
      { address: '90 Pine Rd', salePrice: 1695000, saleDate: '2025-09-22', distanceMiles: 0.8 },
    ],
    source: 'mock',
  };
}

function mockSalesTrends(geography: string) {
  return {
    geography,
    medianSalePrice: 1825000,
    medianPriceChangePercent: 2.4,
    salesCount: 47,
    period: 'last_12_months',
    source: 'mock',
  };
}

function mockTransactionHistory(address: string) {
  return {
    address,
    transactions: [
      { date: '2021-06-15', price: 1520000, type: 'sale' },
      { date: '2016-03-02', price: 1180000, type: 'sale' },
    ],
    source: 'mock',
  };
}

function cacheOptionsWithEndpoint(endpoint: string, options?: CacheOptions): GetCachedOrFetchOptions {
  return { ...options, endpoint };
}

export const attomCache = {
  getPropertyProfile: (address: string, options?: CacheOptions) =>
    getCachedOrFetch(
      buildAttomCacheKey('PROFILE', address),
      () => Promise.resolve(mockPropertyProfile(address)),
      CACHE_TTL.PROFILE,
      cacheOptionsWithEndpoint('profile', options),
    ),

  getAVMDetail: (address: string, options?: CacheOptions) =>
    getCachedOrFetch(
      buildAttomCacheKey('AVM', address),
      () => Promise.resolve(mockAVMDetail(address)),
      CACHE_TTL.AVM,
      cacheOptionsWithEndpoint('valuation', options),
    ),

  getHomeEquity: (address: string, options?: CacheOptions) =>
    getCachedOrFetch(
      buildAttomCacheKey('EQUITY', address),
      () => Promise.resolve(mockHomeEquity(address)),
      CACHE_TTL.EQUITY,
      cacheOptionsWithEndpoint('equity', options),
    ),

  getSaleComparables: (address: string, options?: CacheOptions) =>
    getCachedOrFetch(
      buildAttomCacheKey('COMPS', address),
      () => Promise.resolve(mockSaleComparables(address)),
      CACHE_TTL.COMPS,
      cacheOptionsWithEndpoint('comparables', options),
    ),

  getSalesTrends: (geography: string, options?: CacheOptions) =>
    getCachedOrFetch(
      buildAttomCacheKey('TRENDS', geography),
      () => Promise.resolve(mockSalesTrends(geography)),
      CACHE_TTL.TRENDS,
      cacheOptionsWithEndpoint('trends', options),
    ),

  getTransactionHistory: (address: string, options?: CacheOptions) =>
    getCachedOrFetch(
      buildAttomCacheKey('TRANSACTIONS', address),
      () => Promise.resolve(mockTransactionHistory(address)),
      CACHE_TTL.TRANSACTIONS,
      cacheOptionsWithEndpoint('transactions', options),
    ),
};

export const attomCacheHealth = {
  getCacheStats: async (tenantId: string) => {
    void tenantId;

    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, batch] = await redis.scan(
        cursor,
        'MATCH',
        'attom:*',
        'COUNT',
        100,
      );
      cursor = nextCursor;
      for (const key of batch) {
        if (key.includes(':ratelimit:')) continue;
        keys.push(key);
      }
    } while (cursor !== '0');

    let oldest: string | null = null;
    let newest: string | null = null;

    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as CacheEnvelope<unknown>;
        const cachedAt = parsed?.cachedAt;
        if (!cachedAt) continue;
        if (!oldest || cachedAt < oldest) oldest = cachedAt;
        if (!newest || cachedAt > newest) newest = cachedAt;
      } catch {
        continue;
      }
    }

    return {
      tenantId,
      keyCount: keys.length,
      oldestCachedAt: oldest,
      newestCachedAt: newest,
    };
  },

  getMonthlySpend: async (tenantId: string) => {
    const { count, error } = await supabaseDb
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('action', 'ATTOM_API_CALL')
      .gte('timestamp', monthStartIso());

    if (error) {
      console.warn('ATTOM monthly spend query failed:', error.message);
      return {
        callCount: 0,
        estimatedCost: 0,
        budget: MONTHLY_BUDGET,
        budgetRemaining: MONTHLY_BUDGET,
        percentUsed: 0,
      };
    }

    const callCount = count ?? 0;
    const estimatedCost = Number((callCount * COST_PER_CALL).toFixed(2));
    const budget = MONTHLY_BUDGET;
    const budgetRemaining = Number(Math.max(0, budget - estimatedCost).toFixed(2));
    const percentUsed = Number(Math.min(100, (estimatedCost / budget) * 100).toFixed(2));

    return {
      callCount,
      estimatedCost,
      budget,
      budgetRemaining,
      percentUsed,
    };
  },
};
