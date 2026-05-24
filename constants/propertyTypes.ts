export const PROPERTY_TYPES = [
  'Homes',
  'Condos',
  'Multifamily',
  'Retail',
  'Industrial',
  'Mixed-Use',
  'Land',
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type PropertyEntryMode = 'manual' | 'automated';
