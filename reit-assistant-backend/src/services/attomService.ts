import {
  attomCache,
  buildAddressIdentifier,
  isAttomConfigured,
  type AttomAddressParts,
  type CacheOptions,
} from './attomCache';

export type AttomProfileRequest = AttomAddressParts & {
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

export type AttomFetchOptions = {
  refresh?: boolean;
  tenantId?: string;
  userId?: string;
};

export { isAttomConfigured };

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

  const snapshot: AttomProfileSnapshot = {
    attom_id: asNumber(record.attomId ?? record.attomid),
    property_type: typeof summary.proptype === 'string' ? summary.proptype : undefined,
    property_taxes: propertyTaxes,
    year_built: yearBuilt,
    lot_size_sqft: lotSizeSqft,
    price: lastSale ?? avm,
    avm,
    cap_rate: undefined,
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

export async function fetchAttomProfile(
  request: AttomProfileRequest,
  options?: AttomFetchOptions,
): Promise<AttomProfileSnapshot | null> {
  if (!isAttomConfigured()) {
    return null;
  }

  const identifier = buildAddressIdentifier(request);
  const cacheOptions: CacheOptions = {
    bypassCache: options?.refresh,
    tenantId: options?.tenantId,
    userId: options?.userId,
  };

  try {
    const profileResult = await attomCache.getPropertyProfile(identifier, cacheOptions);

    let avmPayload: unknown = null;
    let avmCached = true;
    try {
      const avmResult = await attomCache.getAVMDetail(identifier, cacheOptions);
      avmPayload = avmResult.data;
      avmCached = avmResult.source === 'cache';
    } catch {
      avmPayload = null;
    }

    const snapshot = parseAttomProfile(profileResult.data, avmPayload);
    if (!snapshot) return null;

    return {
      ...snapshot,
      cached: profileResult.source === 'cache' && avmCached,
      fetched_at: profileResult.cachedAt ?? new Date().toISOString(),
    };
  } catch (error) {
    console.error('ATTOM fetch error:', error);
    return null;
  }
}
