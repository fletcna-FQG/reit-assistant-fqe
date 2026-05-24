export type RuleOperator = '>=' | '<=' | '>' | '<' | '==' | '!=';

export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value: string;
}

export interface InvestmentRule {
  id: string;
  name: string;
  category: 'financial' | 'risk' | 'market';
  description: string;
  conditions: RuleCondition[];
  scoreImpact: number;
  active: boolean;
  priority: number;
  /** Out-of-box rules: toggle only — cannot delete */
  isSystem?: boolean;
}

export interface TriggeredRule {
  id: string;
  name: string;
  impact: number;
  triggered: boolean;
  detail: string;
}
