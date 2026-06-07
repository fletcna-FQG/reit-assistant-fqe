/** Production Northflank API (reit-assistant-v2). Override with EXPO_PUBLIC_API_URL for local dev. */
export const PRODUCTION_API_URL = 'https://p01--reit-assistant-v2--99vpsnwm46h4.code.run';

/** Resolved at Metro/Expo startup from EXPO_PUBLIC_API_URL or production fallback. */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || PRODUCTION_API_URL;
