import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

/** Production Northflank API (reit-assistant-v2). Override with EXPO_PUBLIC_API_URL for local dev. */
export const PRODUCTION_API_URL = 'https://p01--reit-assistant-v2--99vpsnwm46h4.code.run';

/** Resolved at Metro/Expo startup from EXPO_PUBLIC_API_URL, app.json extra, or production fallback. */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  (extra.apiUrl as string | undefined)?.trim() ||
  PRODUCTION_API_URL;

export const isBackendConfigured = Boolean(API_URL);
