import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SelectedPropertyLocation } from '@/types/geocode';

const STORAGE_KEY = 'reit_recent_geocode_searches';
const MAX_RECENT = 5;

export async function getRecentGeocodeSearches(): Promise<SelectedPropertyLocation[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SelectedPropertyLocation[];
  } catch {
    return [];
  }
}

export async function addRecentGeocodeSearch(location: SelectedPropertyLocation): Promise<void> {
  const existing = await getRecentGeocodeSearches();
  const deduped = [
    location,
    ...existing.filter(
      (item) =>
        item.display_name !== location.display_name ||
        item.lat !== location.lat ||
        item.lon !== location.lon,
    ),
  ].slice(0, MAX_RECENT);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
}
