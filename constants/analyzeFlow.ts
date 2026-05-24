/** Six-step property analyze flow — steps 4–6 continue on stack screens after save. */
export const ANALYZE_FLOW_STEPS = [
  'Property Search',
  'Financials',
  'Property Details',
  'REIT Rules Engine',
  'Valuation Summary',
  'Rule Engine Results',
] as const;

export const ANALYZE_FLOW_STEP_SHORT = [
  'Search',
  'Finance',
  'Details',
  'Rules',
  'Value',
  'Results',
] as const;

export type AnalyzeFlowStep = 1 | 2 | 3 | 4 | 5 | 6;
