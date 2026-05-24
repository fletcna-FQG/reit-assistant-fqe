import AsyncStorage from '@react-native-async-storage/async-storage';

export type PropertyExtendedMeta = {
  propertyType?: string;
  entryMode?: 'manual' | 'automated';
  year_built?: string;
  lot_size?: string;
  price_per_sqft?: string;
  hoa_dues?: string;
  parking?: string;
  mls_grid_number?: string;
  data_source?: string;
  price?: string;
  loan_details?: string;
  lat?: number;
  lon?: number;
  geocode_source?: 'nominatim';
  attom_snapshot?: import('@/types/attom').AttomMarketSnapshot | null;
};

const prefix = 'property_meta_';

export async function savePropertyMeta(propertyId: string, meta: PropertyExtendedMeta): Promise<void> {
  await AsyncStorage.setItem(`${prefix}${propertyId}`, JSON.stringify(meta));
}

export async function getPropertyMeta(propertyId: string): Promise<PropertyExtendedMeta | null> {
  const raw = await AsyncStorage.getItem(`${prefix}${propertyId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PropertyExtendedMeta;
  } catch {
    return null;
  }
}
