import type { PropertyExtendedMeta } from '@/utils/propertyMetaStorage';
import { FINANCIAL_LABELS } from '@/constants/financialLabels';

export type PropertyFormInput = {
  address: string;
  city: string;
  state: string;
  zip: string;
  year_built: string;
  lot_size: string;
  price_per_sqft: string;
  hoa_dues: string;
  parking: string;
  mls_grid_number: string;
  data_source: string;
  price: string;
  loan_details: string;
  gross_rental_income: string;
  other_income: string;
  vacancy_percent: string;
  property_taxes: string;
  insurance: string;
  utilities: string;
  repairs_maintenance: string;
  property_management: string;
  other_operating_expenses: string;
  cap_rate: string;
};

export type PropertyRawPayload = {
  address: string;
  city: string;
  state: string;
  zip: string;
  gross_rental_income: number;
  other_income: number;
  vacancy_percent: number;
  property_taxes: number;
  insurance: number;
  utilities: number;
  repairs_maintenance: number;
  property_management: number;
  other_operating_expenses: number;
  cap_rate: number;
};

export type ValidationResult = {
  message: string | null;
  fieldErrors: Partial<Record<keyof PropertyFormInput, string>>;
};

export const PROPERTY_FIELD_LABELS: Record<keyof PropertyFormInput, string> = {
  address: 'Street Address',
  city: 'City',
  state: 'State',
  zip: 'ZIP Code',
  year_built: FINANCIAL_LABELS.yearBuilt,
  lot_size: FINANCIAL_LABELS.lotSize,
  price_per_sqft: FINANCIAL_LABELS.pricePerSqFt,
  hoa_dues: FINANCIAL_LABELS.hoaDues,
  parking: FINANCIAL_LABELS.parking,
  mls_grid_number: FINANCIAL_LABELS.mlsGridNumber,
  data_source: FINANCIAL_LABELS.dataSource,
  price: FINANCIAL_LABELS.price,
  loan_details: FINANCIAL_LABELS.loanDetails,
  gross_rental_income: FINANCIAL_LABELS.grossRentalIncome,
  other_income: FINANCIAL_LABELS.otherIncome,
  vacancy_percent: FINANCIAL_LABELS.vacancy,
  property_taxes: 'Property Taxes',
  insurance: 'Insurance',
  utilities: 'Utilities',
  repairs_maintenance: 'Repairs & Maintenance',
  property_management: 'Property Management',
  other_operating_expenses: 'Other Operating Expenses',
  cap_rate: FINANCIAL_LABELS.capRate,
};

function missingFieldMessage(field: keyof PropertyFormInput): string {
  return `Please enter ${PROPERTY_FIELD_LABELS[field]}.`;
}

function invalidNumberMessage(field: keyof PropertyFormInput): string {
  return `${PROPERTY_FIELD_LABELS[field]} must be a valid number (0 or greater).`;
}

function buildResult(fieldErrors: Partial<Record<keyof PropertyFormInput, string>>): ValidationResult {
  const keys = Object.keys(fieldErrors) as (keyof PropertyFormInput)[];
  if (keys.length === 0) {
    return { message: null, fieldErrors: {} };
  }
  const message =
    keys.length === 1
      ? fieldErrors[keys[0]]!
      : 'Please complete all required fields marked with * before continuing.';
  return { message, fieldErrors };
}

export function emptyPropertyForm(): PropertyFormInput {
  return {
    address: '',
    city: '',
    state: '',
    zip: '',
    year_built: '',
    lot_size: '',
    price_per_sqft: '',
    hoa_dues: '',
    parking: '',
    mls_grid_number: '',
    data_source: '',
    price: '',
    loan_details: '',
    gross_rental_income: '',
    other_income: '',
    vacancy_percent: '',
    property_taxes: '',
    insurance: '',
    utilities: '',
    repairs_maintenance: '',
    property_management: '',
    other_operating_expenses: '',
    cap_rate: '',
  };
}

export function validateSearchLocation(
  form: Pick<PropertyFormInput, 'address' | 'city' | 'state' | 'zip'>,
): ValidationResult {
  const fieldErrors: Partial<Record<keyof PropertyFormInput, string>> = {};
  const locationFields = ['address', 'city', 'state', 'zip'] as const;

  for (const field of locationFields) {
    if (!form[field].trim()) {
      fieldErrors[field] = missingFieldMessage(field);
    }
  }

  return buildResult(fieldErrors);
}

export function validateFinancials(form: PropertyFormInput): ValidationResult {
  const fieldErrors: Partial<Record<keyof PropertyFormInput, string>> = {};

  const requiredNumeric: (keyof PropertyFormInput)[] = [
    'gross_rental_income',
    'other_income',
    'property_taxes',
    'insurance',
    'utilities',
    'repairs_maintenance',
    'property_management',
    'other_operating_expenses',
  ];

  for (const field of requiredNumeric) {
    const raw = form[field].trim();
    if (!raw) {
      fieldErrors[field] = missingFieldMessage(field);
      continue;
    }
    const value = parseFloat(raw);
    if (Number.isNaN(value) || value < 0) {
      fieldErrors[field] = invalidNumberMessage(field);
    }
  }

  const vacancyRaw = form.vacancy_percent.trim();
  if (!vacancyRaw) {
    fieldErrors.vacancy_percent = missingFieldMessage('vacancy_percent');
  } else {
    const vacancy = parseFloat(vacancyRaw);
    if (Number.isNaN(vacancy) || vacancy < 0 || vacancy > 100) {
      fieldErrors.vacancy_percent = `${FINANCIAL_LABELS.vacancy} must be between 0 and 100.`;
    }
  }

  const capRateRaw = form.cap_rate.trim();
  if (!capRateRaw) {
    fieldErrors.cap_rate = missingFieldMessage('cap_rate');
  } else {
    const capRate = parseFloat(capRateRaw);
    if (Number.isNaN(capRate) || capRate <= 0) {
      fieldErrors.cap_rate = `${FINANCIAL_LABELS.capRate} must be greater than 0.`;
    }
  }

  return buildResult(fieldErrors);
}

export function validatePropertyInput(form: PropertyFormInput): ValidationResult {
  const locationResult = validateSearchLocation(form);
  const financialResult = validateFinancials(form);
  const fieldErrors = { ...locationResult.fieldErrors, ...financialResult.fieldErrors };

  const optionalNumeric: (keyof PropertyFormInput)[] = [
    'year_built',
    'lot_size',
    'price_per_sqft',
    'hoa_dues',
    'price',
  ];

  for (const field of optionalNumeric) {
    const raw = form[field].trim();
    if (raw && Number.isNaN(parseFloat(raw))) {
      fieldErrors[field] = `${PROPERTY_FIELD_LABELS[field]} must be a valid number when provided.`;
    }
  }

  return buildResult(fieldErrors);
}

/** @deprecated Use validateSearchLocation — returns first error message only. */
export function validateSearchLocationMessage(
  form: Pick<PropertyFormInput, 'address' | 'city' | 'state' | 'zip'>,
): string | null {
  return validateSearchLocation(form).message;
}

/** @deprecated Use validateFinancials — returns first error message only. */
export function validateFinancialsMessage(form: PropertyFormInput): string | null {
  return validateFinancials(form).message;
}

/** @deprecated Use validatePropertyInput — returns first error message only. */
export function validatePropertyInputMessage(form: PropertyFormInput): string | null {
  return validatePropertyInput(form).message;
}

/** Core financial fields for server-side EGI / NOI / value calculations. */
export function toPropertyPayload(form: PropertyFormInput): PropertyRawPayload {
  return {
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim().toUpperCase(),
    zip: form.zip.trim(),
    gross_rental_income: parseFloat(form.gross_rental_income) || 0,
    other_income: parseFloat(form.other_income) || 0,
    vacancy_percent: parseFloat(form.vacancy_percent) || 0,
    property_taxes: parseFloat(form.property_taxes) || 0,
    insurance: parseFloat(form.insurance) || 0,
    utilities: parseFloat(form.utilities) || 0,
    repairs_maintenance: parseFloat(form.repairs_maintenance) || 0,
    property_management: parseFloat(form.property_management) || 0,
    other_operating_expenses: parseFloat(form.other_operating_expenses) || 0,
    cap_rate: parseFloat(form.cap_rate) || 0,
  };
}

export function formToExtendedMeta(
  form: PropertyFormInput,
  meta?: {
    propertyType?: string;
    entryMode?: 'manual' | 'automated';
    lat?: number;
    lon?: number;
    geocode_source?: 'nominatim';
    attom_snapshot?: PropertyExtendedMeta['attom_snapshot'];
  },
): PropertyExtendedMeta {
  return {
    propertyType: meta?.propertyType,
    entryMode: meta?.entryMode,
    year_built: form.year_built.trim() || undefined,
    lot_size: form.lot_size.trim() || undefined,
    price_per_sqft: form.price_per_sqft.trim() || undefined,
    hoa_dues: form.hoa_dues.trim() || undefined,
    parking: form.parking.trim() || undefined,
    mls_grid_number: form.mls_grid_number.trim() || undefined,
    data_source: form.data_source.trim() || undefined,
    price: form.price.trim() || undefined,
    loan_details: form.loan_details.trim() || undefined,
    lat: meta?.lat,
    lon: meta?.lon,
    geocode_source: meta?.geocode_source,
    attom_snapshot: meta?.attom_snapshot,
  };
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `$${Math.round(value).toLocaleString()}`;
}
