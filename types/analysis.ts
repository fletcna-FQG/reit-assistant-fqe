import type { Recommendation } from './index';
import type { TriggeredRule } from './rule';

export interface AnalysisInput {
  address: string;
  propertyType: string;
  yearBuilt: number;
  sqft: number;
  units: number;
  purchasePrice: number;
  estimatedValue: number;
  noi: number;
  occupancy: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
}

export interface RiskFactor {
  id: string;
  title: string;
  description: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
}

export interface AnalysisResult {
  id: string;
  input: AnalysisInput;
  score: number;
  recommendation: Recommendation;
  reasoning: string;
  capRate: number;
  dscr: number;
  triggeredRules: TriggeredRule[];
  passedRules: TriggeredRule[];
  risks: RiskFactor[];
  opportunities: Opportunity[];
  createdAt: string;
}
