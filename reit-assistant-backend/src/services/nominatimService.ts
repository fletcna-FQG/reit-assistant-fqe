import { redis } from '../config/redis';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'FletcherQuillGroupREITAssistant/1.0 (contact@fletcherquillgroup.com)';
const REFERER = 'https://reit.fletcherquillgroup.com';
const CACHE_TTL_SECONDS = 90 * 24 * 60 * 60;
const MIN_INTERVAL_MS = 1100;

export type NominatimAddressParts = {
  house_number?: string;
  road?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  state?: string;
  postcode?: string;
  country?: string;
};

export type NominatimSearchHit = {
  display_name: string;
  lat: number;
  lon: number;
  address: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  osm_id: number;
  osm_type: string;
};

export type NominatimReverseResult = {
  display_name: string;
  lat: number;
  lon: number;
  address: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  osm_id?: number;
  osm_type?: string;
};

type NominatimRawResult = {
  display_name: string;
  lat: string;
  lon: string;
  osm_id?: number;
  osm_type?: string;
  address?: NominatimAddressParts;
};

let lastCallAt = 0;
let callChain: Promise<unknown> = Promise.resolve();

export function normalizeSearchQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function roundCoord(value: number): string {
  return value.toFixed(4);
}

function parseStructuredAddress(parts?: NominatimAddressParts) {
  const house = parts?.house_number ?? '';
  const road = parts?.road ?? '';
  const street = [house, road].filter(Boolean).join(' ').trim();

  return {
    address: street || parts?.road || '',
    city:
      parts?.city ||
      parts?.town ||
      parts?.village ||
      parts?.hamlet ||
      '',
    state: parts?.state || '',
    zip: parts?.postcode || '',
  };
}

function mapSearchHit(raw: NominatimRawResult): NominatimSearchHit {
  return {
    display_name: raw.display_name,
    lat: parseFloat(raw.lat),
    lon: parseFloat(raw.lon),
    address: parseStructuredAddress(raw.address),
    osm_id: raw.osm_id ?? 0,
    osm_type: raw.osm_type ?? 'unknown',
  };
}

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('Nominatim cache read failed:', error);
    return null;
  }
}

async function writeCache(key: string, value: unknown): Promise<void> {
  try {
    await redis.setex(key, CACHE_TTL_SECONDS, JSON.stringify(value));
  } catch (error) {
    console.warn('Nominatim cache write failed:', error);
  }
}

async function throttledNominatimFetch(url: string): Promise<NominatimRawResult | NominatimRawResult[]> {
  const run = async () => {
    const now = Date.now();
    const waitMs = Math.max(0, MIN_INTERVAL_MS - (now - lastCallAt));
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    lastCallAt = Date.now();

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Referer: REFERER,
        'Accept-Language': 'en',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim request failed (${response.status})`);
    }

    return (await response.json()) as NominatimRawResult | NominatimRawResult[];
  };

  callChain = callChain.then(run, run);
  return callChain as Promise<NominatimRawResult | NominatimRawResult[]>;
}

export async function searchAddress(query: string): Promise<{ results: NominatimSearchHit[]; cached: boolean }> {
  const cacheKey = `nominatim:search:${normalizeSearchQuery(query)}`;
  const cached = await readCache<NominatimSearchHit[]>(cacheKey);
  if (cached) {
    return { results: cached, cached: true };
  }

  const params = new URLSearchParams({
    q: query.trim(),
    format: 'json',
    limit: '5',
    addressdetails: '1',
    extratags: '1',
  });

  const raw = await throttledNominatimFetch(`${NOMINATIM_BASE}/search?${params.toString()}`);
  const list = Array.isArray(raw) ? raw : [raw];
  const results = list.map(mapSearchHit);

  await writeCache(cacheKey, results);
  return { results, cached: false };
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<{ result: NominatimReverseResult; cached: boolean }> {
  const cacheKey = `nominatim:reverse:${roundCoord(lat)}:${roundCoord(lon)}`;
  const cached = await readCache<NominatimReverseResult>(cacheKey);
  if (cached) {
    return { result: cached, cached: true };
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    addressdetails: '1',
  });

  const raw = (await throttledNominatimFetch(
    `${NOMINATIM_BASE}/reverse?${params.toString()}`,
  )) as NominatimRawResult;

  const result: NominatimReverseResult = {
    display_name: raw.display_name,
    lat: parseFloat(raw.lat),
    lon: parseFloat(raw.lon),
    address: parseStructuredAddress(raw.address),
    osm_id: raw.osm_id,
    osm_type: raw.osm_type,
  };

  await writeCache(cacheKey, result);
  return { result, cached: false };
}

export type NominatimPlaceDetails = {
  osm_id: number;
  osm_type: string;
  display_name: string;
  lat: number;
  lon: number;
  address: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  category?: string;
  type?: string;
  boundingbox?: [string, string, string, string];
  geometry?: unknown;
};

function mapOsmTypeToNominatimParam(osmType: string): string {
  const normalized = osmType.toLowerCase();
  if (normalized === 'node' || normalized === 'n') return 'N';
  if (normalized === 'relation' || normalized === 'r') return 'R';
  return 'W';
}

export async function getPlaceDetails(
  osmType: string,
  osmId: number,
): Promise<{ details: NominatimPlaceDetails; cached: boolean }> {
  const typeParam = mapOsmTypeToNominatimParam(osmType);
  const cacheKey = `nominatim:detail:${typeParam}:${osmId}`;
  const cached = await readCache<NominatimPlaceDetails>(cacheKey);
  if (cached) {
    return { details: cached, cached: true };
  }

  const params = new URLSearchParams({
    osmtype: typeParam,
    osmid: String(osmId),
    format: 'json',
    addressdetails: '1',
    polygon_geojson: '1',
  });

  const raw = (await throttledNominatimFetch(
    `${NOMINATIM_BASE}/details?${params.toString()}`,
  )) as Record<string, unknown> & {
    place_id?: number;
    osm_type?: string;
    display_name?: string;
    lat?: string;
    lon?: string;
    category?: string;
    type?: string;
    boundingbox?: string[];
    address?: NominatimAddressParts;
    geometry?: unknown;
  };

  const lat = parseFloat(String(raw.lat ?? (raw as { calculated_lat?: string }).calculated_lat ?? 0));
  const lon = parseFloat(String(raw.lon ?? (raw as { calculated_lon?: string }).calculated_lon ?? 0));

  const details: NominatimPlaceDetails = {
    osm_id: osmId,
    osm_type: osmType,
    display_name: String(raw.display_name ?? raw.localname ?? ''),
    lat,
    lon,
    address: parseStructuredAddress(raw.address),
    category: raw.category ? String(raw.category) : undefined,
    type: raw.type ? String(raw.type) : undefined,
    boundingbox:
      raw.boundingbox && raw.boundingbox.length === 4
        ? [raw.boundingbox[0], raw.boundingbox[1], raw.boundingbox[2], raw.boundingbox[3]]
        : undefined,
    geometry: raw.geometry,
  };

  await writeCache(cacheKey, details);
  return { details, cached: false };
}
