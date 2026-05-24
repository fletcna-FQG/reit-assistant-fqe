/** User-facing labels: full name first, acronym in parentheses where applicable. */
export const FINANCIAL_LABELS = {
  grossRentalIncome: 'Gross Rental Income',
  otherIncome: 'Other Income',
  vacancy: 'Vacancy Rate',
  egi: 'Effective Gross Income (EGI)',
  totalExpenses: 'Total Operating Expenses',
  noi: 'Net Operating Income (NOI)',
  capRate: 'Capitalization Rate (Cap Rate)',
  indicatedValue: 'Indicated Value',
  yearBuilt: 'Year Built',
  lotSize: 'Lot Size',
  pricePerSqFt: 'Price per Square Foot',
  hoaDues: 'Homeowners Association (HOA) Dues',
  parking: 'Parking',
  mlsGridNumber: 'Multiple Listing Service (MLS) Grid Number',
  dataSource: 'Data Source',
  price: 'List Price',
  loanDetails: 'Loan Details',
} as const;

export const RULES_ENGINE_MESSAGES = {
  running: 'The REIT Rules Engine is evaluating this property against your active rules.',
  eta: 'Results are typically available within a few seconds.',
  ready: 'REIT Rules Engine results are ready to view.',
  viewResults: 'View REIT Rules Engine Results',
  runAgain: 'Run REIT Rules Engine Again',
} as const;
