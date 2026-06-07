import { cloneSystemRules } from '../constants/systemRules';

export type AnalysisInput = {
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
};

export type Recommendation = 'BUY' | 'NEGOTIATE' | 'HOLD' | 'PASS';

export type AnalysisResult = {
  id: string;
  input: AnalysisInput;
  score: number;
  recommendation: Recommendation;
  reasoning: string;
  capRate: number;
  dscr: number;
  triggeredRules: {
    id: string;
    name: string;
    impact: number;
    triggered: boolean;
    detail: string;
  }[];
  passedRules: {
    id: string;
    name: string;
    impact: number;
    triggered: boolean;
    detail: string;
  }[];
  risks: { id: string; title: string; description: string }[];
  opportunities: { id: string; title: string; description: string }[];
  createdAt: string;
};

function calcCapRate(input: AnalysisInput) {
  return input.purchasePrice > 0 ? (input.noi / input.purchasePrice) * 100 : 0;
}

function calcDscr(input: AnalysisInput) {
  const annualDebt =
    input.loanAmount *
    (input.interestRate / 100) *
    (1 + input.interestRate / 100) ** input.loanTerm;
  const monthly = annualDebt / 12 / input.loanTerm || 1;
  const annualPayment = monthly * 12 || 1;
  return input.noi / annualPayment;
}

function scoreToRecommendation(score: number): Recommendation {
  if (score >= 70) return 'BUY';
  if (score >= 50) return 'NEGOTIATE';
  if (score >= 30) return 'HOLD';
  return 'PASS';
}

export function evaluateProperty(input: AnalysisInput): AnalysisResult {
  const capRate = calcCapRate(input);
  const dscr = calcDscr(input);
  const activeRules = cloneSystemRules().filter((rule) => rule.active);

  let score = 50;
  const triggeredRules: AnalysisResult['triggeredRules'] = [];
  const passedRules: AnalysisResult['passedRules'] = [];

  for (const rule of activeRules) {
    let triggered = false;
    let detail = '';

    if (rule.id === 'r1') {
      triggered = capRate >= 6.0;
      detail = `Cap Rate ${capRate.toFixed(1)}% ${triggered ? '≥' : '<'} 6.0%`;
    } else if (rule.id === 'r2') {
      triggered = input.occupancy >= 90;
      detail = `Occupancy ${input.occupancy}% ${triggered ? '≥' : '<'} 90%`;
    } else if (rule.id === 'r3') {
      triggered = dscr >= 1.25;
      detail = `DSCR ${dscr.toFixed(2)} ${triggered ? '≥' : '<'} 1.25`;
    } else {
      triggered = false;
      detail = 'Condition not met';
    }

    const entry = {
      id: rule.id,
      name: rule.name,
      impact: rule.scoreImpact,
      triggered,
      detail,
    };

    if (triggered) {
      score += rule.scoreImpact;
      triggeredRules.push(entry);
    } else {
      passedRules.push(entry);
    }
  }

  score = Math.max(0, Math.min(100, score));
  const recommendation = scoreToRecommendation(score);

  const reasoning =
    recommendation === 'BUY'
      ? `Strong investment opportunity with ${capRate.toFixed(1)}% cap rate and positive cash flow`
      : recommendation === 'NEGOTIATE'
        ? 'Moderate opportunity — consider renegotiating terms'
        : recommendation === 'HOLD'
          ? 'Defer decision — monitor market conditions'
          : 'Does not meet investment criteria';

  return {
    id: `analysis-${Date.now()}`,
    input,
    score,
    recommendation,
    reasoning,
    capRate,
    dscr,
    triggeredRules,
    passedRules,
    risks:
      input.occupancy < 95
        ? [
            {
              id: 'risk1',
              title: 'Occupancy Below 95%',
              description: `Current occupancy at ${input.occupancy}% is below optimal threshold.`,
            },
          ]
        : [],
    opportunities:
      input.estimatedValue > input.purchasePrice
        ? [
            {
              id: 'opp1',
              title: `Below Market Value by ${(((input.estimatedValue - input.purchasePrice) / input.purchasePrice) * 100).toFixed(0)}%`,
              description: `Immediate equity gain potential of $${((input.estimatedValue - input.purchasePrice) / 1000).toFixed(0)}K.`,
            },
          ]
        : [],
    createdAt: new Date().toISOString(),
  };
}

export function recommendationToDb(value: Recommendation): 'buy' | 'hold' | 'sell' {
  if (value === 'BUY') return 'buy';
  if (value === 'HOLD' || value === 'NEGOTIATE') return 'hold';
  return 'sell';
}

export function recommendationFromDb(value: string | null | undefined): Recommendation {
  switch (value) {
    case 'buy':
      return 'BUY';
    case 'hold':
      return 'HOLD';
    case 'sell':
      return 'PASS';
    default:
      return 'NEGOTIATE';
  }
}
