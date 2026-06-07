const DEAL_PROPERTY_TYPES = ['Multifamily', 'Retail', 'Office', 'Industrial', 'Land'] as const;

export type DealPropertyType = (typeof DEAL_PROPERTY_TYPES)[number];

export function toDealPropertyType(value: string | undefined): DealPropertyType {
  const normalized = value?.trim();
  if (normalized && DEAL_PROPERTY_TYPES.includes(normalized as DealPropertyType)) {
    return normalized as DealPropertyType;
  }

  switch (normalized) {
    case 'Homes':
    case 'Condos':
    case 'Mixed-Use':
    case 'Property':
      return 'Multifamily';
    case 'Industrial':
      return 'Industrial';
    case 'Land':
      return 'Land';
    case 'Retail':
      return 'Retail';
    default:
      return 'Multifamily';
  }
}
