/** CRE_Valuation_NOI_CapRate spreadsheet reference sample (manual entry E2E). */
export const SPREADSHEET_SAMPLE = {
  address: '123 Main St',
  city: 'Seattle',
  state: 'WA',
  zip: '98101',
  gross_rental_income: 177204,
  other_income: 4500,
  vacancy_percent: 5,
  property_taxes: 12879,
  insurance: 0,
  utilities: 0,
  repairs_maintenance: 0,
  property_management: 0,
  other_operating_expenses: 34664,
  cap_rate: 6.23,
} as const;

/** Expected server-side results for SPREADSHEET_SAMPLE (tolerance applied in tests). */
export const SPREADSHEET_EXPECTED = {
  egi: 172618.8,
  total_operating_expenses: 47543,
  noi: 125075.8,
  indicated_value: 2007637.24,
} as const;

export type PropertyFormInput = {
  address: string;
  city: string;
  state: string;
  zip: string;
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

export function validateSearchLocation(form: Pick<PropertyFormInput, 'address' | 'city' | 'state' | 'zip'>): string | null {
  if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !form.zip.trim()) {
    return 'Enter Address, City, State, and ZIP to run a property search.';
  }
  return null;
}

export function validatePropertyInput(form: PropertyFormInput): string | null {
  const locationError = validateSearchLocation(form);
  if (locationError) return locationError;
  const vacancy = parseFloat(form.vacancy_percent);
  if (Number.isNaN(vacancy) || vacancy < 0 || vacancy > 100) {
    return 'Vacancy % must be between 0 and 100.';
  }

  const capRate = parseFloat(form.cap_rate);
  if (Number.isNaN(capRate) || capRate <= 0) {
    return 'Cap Rate must be greater than 0.';
  }

  const numericFields: (keyof PropertyFormInput)[] = [
    'gross_rental_income',
    'other_income',
    'property_taxes',
    'insurance',
    'utilities',
    'repairs_maintenance',
    'property_management',
    'other_operating_expenses',
  ];

  for (const field of numericFields) {
    const value = parseFloat(form[field]);
    if (Number.isNaN(value) || value < 0) {
      return `${field.replace(/_/g, ' ')} must be a valid number ≥ 0.`;
    }
  }

  return null;
}

/** Raw inputs only — backend calculates EGI, expenses, NOI, and indicated value. */
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

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `$${Math.round(value).toLocaleString()}`;
}
