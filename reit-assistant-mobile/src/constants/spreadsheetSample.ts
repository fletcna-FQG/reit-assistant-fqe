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

export const SPREADSHEET_EXPECTED = {
  egi: 172618.8,
  total_operating_expenses: 47543,
  noi: 125075.8,
  indicated_value: 2007637.24,
} as const;
