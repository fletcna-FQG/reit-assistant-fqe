import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

/** Use LAN IP instead of 127.0.0.1 when testing on a physical device. */
export const API_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ??
  (extra.apiUrl as string | undefined) ??
  'http://127.0.0.1:3000';
