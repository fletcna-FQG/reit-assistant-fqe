import { redis } from '../config/redis';
import { config } from '../config/env';
import { normalizeSearchQuery } from './nominatimService';

const DEFAULT_BASE_URL = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

export type AttomProfileRequest = {
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lon: number;
};

export type AttomFieldSources = Partial<
  Record<
    | 'gross_rental_income'
    | 'other_income'
    | 'vacancy_percent'
    | 'property_taxes'
    | 'insurance'
    | 'utilities'
    | 'repairs_maintenance'
    | 'property_management'
    | 'other_operating_expenses'
    | 'cap_rate'
    | 'year_built'
    | 'lot_size_sqft'
    | 'price'
    | 'avm',
    'attom' | 'estimated'
  >
>;

export type AttomProfileSnapshot = {
  gross_rental_income?: number;
  other_income?: number;
  vacancy_percent?: number;
  property_taxes?: number;
  insurance?: number;
  utilities?: number;
  repairs_maintenance?: number;
  property_management?: number;
  other_operating_expenses?: number;
  cap_rate?: number;
  year_built?: number;
  lot_size_sqft?: number;
  price?: number;
  avm?: number;
  attom_id?: number;
  property_type?: string;
  fetched_at: string;
  cached: boolean;
  field_sources: AttomFieldSources;
};

function attomCacheKey(request: AttomProfileRequest): string {
  const normalized = normalizeSearchQuery(`${request.address}-${request.city}-${request.state}-${request.zip}`);
  return `attom:profile:${normalized}`;
}

export function isAttomConfigured(): boolean {
  const key = config.services.attom.apiKey;
  return Boolean(key && !key.startsWith('your-'));
}

function attomHeaders(): Record<string, string> {
  return {
    Accept: 'application/json',
    apikey: config.services.attom.apiKey ?? '',
  };
}

function attomBaseUrl(): string {
  return config.services.attom.baseUrl || DEFAULT_BASE_URL;
}

function asNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(num) ? num : undefined;
}

function pickPropertyRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  const property = root.property;
  if (Array.isArray(property) && property[0] && typeof property[0] === 'object') {
    return property[0] as Record<string, unknown>;
  }
  if (property && typeof property === 'object') {
    return property as Record<string, unknown>;
  }
  return null;
}

function parseAttomProfile(profilePayload: unknown, avmPayload: unknown): AttomProfileSnapshot | null {
  const record = pickPropertyRecord(profilePayload);
  if (!record) return null;

  const field_sources: AttomFieldSources = {};
  const building = (record.building ?? {}) as Record<string, unknown>;
  const assessment = (record.assessment ?? {}) as Record<string, unknown>;
  const assessmentTax = (assessment.tax ?? {}) as Record<string, unknown>;
  const lot = (record.lot ?? {}) as Record<string, unknown>;
  const summary = (record.summary ?? {}) as Record<string, unknown>;
  const sale = (record.sale ?? {}) as Record<string, unknown>;
  const avmRecord = pickPropertyRecord(avmPayload);
  const avmBlock = (avmRecord?.avm ?? record.avm ?? {}) as Record<string, unknown>;
  const avmAmount = asNumber(avmBlock.amount ?? avmBlock.value);

  const propertyTaxes = asNumber(assessmentTax.taxAmt ?? assessmentTax.taxAmount);
  const yearBuilt = asNumber(building.yearbuilt ?? building.yearBuilt ?? summary.yearbuilt);
  const lotSizeSqft = asNumber(lot.lotsize2 ?? lot.lotSize2);
  const lastSale = asNumber(sale.amount ?? sale.saleAmt);
  const avm = avmAmount;

  let capRate: number | undefined;
  if (avm && propertyTaxes != null) {
    // Placeholder until rent roll arrives — cap rate left for user/market default.
    capRate = undefined;
  }

  const snapshot: AttomProfileSnapshot = {
    attom_id: asNumber(record.attomId ?? record.attomid),
    property_type: typeof summary.proptype === 'string' ? summary.proptype : undefined,
    property_taxes: propertyTaxes,
    year_built: yearBuilt,
    lot_size_sqft: lotSizeSqft,
    price: lastSale ?? avm,
    avm,
    cap_rate: capRate,
    vacancy_percent: 5,
    fetched_at: new Date().toISOString(),
    cached: false,
    field_sources,
  };

  if (propertyTaxes != null) field_sources.property_taxes = 'attom';
  if (yearBuilt != null) field_sources.year_built = 'attom';
  if (lotSizeSqft != null) field_sources.lot_size_sqft = 'attom';
  if (lastSale != null) field_sources.price = 'attom';
  if (avm != null) field_sources.avm = 'attom';
  if (snapshot.vacancy_percent != null) field_sources.vacancy_percent = 'estimated';

  return snapshot;
}

async function readAttomCache(key: string): Promise<AttomProfileSnapshot | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AttomProfileSnapshot;
    return { ...parsed, cached: true };
  } catch {
    return null;
  }
}

async function writeAttomCache(key: string, snapshot: AttomProfileSnapshot): Promise<void> {
  try {
    await redis.setex(key, CACHE_TTL_SECONDS, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('ATTOM cache write failed:', error);
  }
}

async function attomFetch(path: string, request: AttomProfileRequest): Promise<unknown> {
  const address1 = encodeURIComponent(request.address);
  const address2 = encodeURIComponent(`${request.city}, ${request.state} ${request.zip}`);
  const url = `${attomBaseUrl()}${path}?address1=${address1}&address2=${address2}`;

  const response = await fetch(url, { headers: attomHeaders() });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ATTOM request failed (${response.status}): ${body.slice(0, 200)}`);
  }
  return response.json();
}

export async function fetchAttomProfile(
  request: AttomProfileRequest,
  options?: { refresh?: boolean },
): Promise<AttomProfileSnapshot | null> {
  if (!isAttomConfigured()) {
    return null;
  }

  const cacheKey = attomCacheKey(request);
  if (!options?.refresh) {
    const cached = await readAttomCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const [profilePayload, avmPayload] = await Promise.all([
      attomFetch('/property/expandedprofile', request),
      attomFetch('/attomavm/detail', request).catch(() => null),
    ]);

    const snapshot = parseAttomProfile(profilePayload, avmPayload);
    if (!snapshot) return null;

    await writeAttomCache(cacheKey, snapshot);
    return snapshot;
  } catch (error) {
    console.error('ATTOM fetch error:', error);
    return null;
  }
}
