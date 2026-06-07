export type RuleOperator = ">=" | "<=" | "==" | "!=" | ">" | "<";

export type RuleCondition = {
  field: string;
  operator: RuleOperator;
  value: string;
};

export type InvestmentRule = {
  id: string;
  name: string;
  category: 'financial' | 'risk' | 'market';
  description: string;
  conditions: RuleCondition[];
  scoreImpact: number;
  active: boolean;
  priority: number;
  isSystem?: boolean;
};

/** Fletcher Quill out-of-box REIT Rules Engine rules (shipped with product). */
export const SYSTEM_RULES: InvestmentRule[] = [
  {
    id: 'r1',
    name: 'Minimum Cap Rate',
    category: 'financial',
    description: 'Cap rate must be at least 6.0%',
    conditions: [{ field: 'capRate', operator: '>=', value: '6.0' }],
    scoreImpact: 15,
    active: true,
    priority: 1,
    isSystem: true,
  },
  {
    id: 'r2',
    name: 'Occupancy Threshold',
    category: 'risk',
    description: 'Occupancy must be at least 90%',
    conditions: [{ field: 'occupancy', operator: '>=', value: '90' }],
    scoreImpact: 10,
    active: true,
    priority: 2,
    isSystem: true,
  },
  {
    id: 'r3',
    name: 'DSCR Minimum',
    category: 'financial',
    description: 'Debt service coverage ratio >= 1.25',
    conditions: [{ field: 'dscr', operator: '>=', value: '1.25' }],
    scoreImpact: 20,
    active: true,
    priority: 3,
    isSystem: true,
  },
  {
    id: 'r4',
    name: 'Market Tier Verification',
    category: 'market',
    description: 'Property in approved market tier',
    conditions: [{ field: 'marketTier', operator: '==', value: 'approved' }],
    scoreImpact: 8,
    active: true,
    priority: 4,
    isSystem: true,
  },
  {
    id: 'r5',
    name: 'Environmental Compliance',
    category: 'risk',
    description: 'No environmental violations',
    conditions: [{ field: 'environmental', operator: '==', value: 'clear' }],
    scoreImpact: 12,
    active: false,
    priority: 5,
    isSystem: true,
  },
];

export function cloneSystemRules(): InvestmentRule[] {
  return SYSTEM_RULES.map((rule) => ({
    ...rule,
    conditions: rule.conditions.map((condition) => ({ ...condition })),
  }));
}
