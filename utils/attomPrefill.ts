import type { AttomMarketSnapshot } from '@/types/attom';
import type { PropertyFormInput } from '@/utils/propertyValidation';

export function applyAttomPrefill(
  form: PropertyFormInput,
  attom: AttomMarketSnapshot | null | undefined,
): PropertyFormInput {
  if (!attom) return form;

  const next = { ...form };
  const setNumeric = (field: keyof PropertyFormInput, value?: number) => {
    if (value == null || Number.isNaN(value)) return;
    next[field] = String(value);
  };

  setNumeric('gross_rental_income', attom.gross_rental_income);
  setNumeric('other_income', attom.other_income);
  setNumeric('vacancy_percent', attom.vacancy_percent);
  setNumeric('property_taxes', attom.property_taxes);
  setNumeric('insurance', attom.insurance);
  setNumeric('utilities', attom.utilities);
  setNumeric('repairs_maintenance', attom.repairs_maintenance);
  setNumeric('property_management', attom.property_management);
  setNumeric('other_operating_expenses', attom.other_operating_expenses);
  setNumeric('cap_rate', attom.cap_rate);
  setNumeric('year_built', attom.year_built);
  setNumeric('lot_size', attom.lot_size_sqft);
  setNumeric('price', attom.price ?? attom.avm);

  if (!next.data_source.trim()) {
    next.data_source = 'ATTOM';
  }

  return next;
}

export function attomFieldSource(
  field: string,
  snapshot?: AttomMarketSnapshot | null,
): 'attom' | 'manual' | 'estimated' {
  const source = snapshot?.field_sources?.[field];
  if (source === 'attom') return 'attom';
  if (source === 'estimated') return 'estimated';
  return 'manual';
}
