import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** SecureStore is native-only; use AsyncStorage on web. */
const useSecureStore = Platform.OS !== 'web';

export async function getPersistentItem(key: string): Promise<string | null> {
  if (useSecureStore) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

export async function setPersistentItem(key: string, value: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

export async function deletePersistentItem(key: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}
