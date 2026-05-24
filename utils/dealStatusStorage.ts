import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DealStatus } from '@/types/index';

const prefix = 'deal_status_';

const VALID_STATUSES: DealStatus[] = ['pipeline', 'review', 'approved', 'closed'];

function isDealStatus(value: string | null): value is DealStatus {
  return value != null && VALID_STATUSES.includes(value as DealStatus);
}

export async function getDealStatus(propertyId: string): Promise<DealStatus> {
  const raw = await AsyncStorage.getItem(`${prefix}${propertyId}`);
  return isDealStatus(raw) ? raw : 'pipeline';
}

export async function saveDealStatus(propertyId: string, status: DealStatus): Promise<void> {
  await AsyncStorage.setItem(`${prefix}${propertyId}`, status);
}

export async function loadDealStatuses(propertyIds: string[]): Promise<Record<string, DealStatus>> {
  if (propertyIds.length === 0) return {};

  const keys = propertyIds.map((id) => `${prefix}${id}`);
  const pairs = await AsyncStorage.multiGet(keys);
  const result: Record<string, DealStatus> = {};

  for (const [key, value] of pairs) {
    if (!isDealStatus(value)) continue;
    result[key.slice(prefix.length)] = value;
  }

  return result;
}
