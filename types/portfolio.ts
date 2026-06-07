import type { DealStatus, Recommendation } from './index';

export type PortfolioHolding = {
  dealId: string;
  propertyId: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  value: number;
  noi: number;
  capRate: number;
  status: DealStatus;
  dealState: string | null;
  score?: number;
  recommendation?: Recommendation;
  inPortfolio: boolean;
};

export type PortfolioHoldingsResponse = {
  holdings: PortfolioHolding[];
  summary: {
    count: number;
    totalAum: number;
    totalNoi: number;
    avgCapRate: number;
  };
};

export type PortfolioImportRow = {
  address: string;
  city: string;
  state: string;
  zip: string;
  gross_rental_income: number;
  other_income?: number;
  vacancy_percent?: number;
  property_taxes?: number;
  insurance?: number;
  utilities?: number;
  repairs_maintenance?: number;
  property_management?: number;
  other_operating_expenses?: number;
  cap_rate: number;
  property_type?: 'Multifamily' | 'Retail' | 'Office' | 'Industrial' | 'Land';
};

export type AttomMonthlySpend = {
  callCount: number;
  estimatedCost: number;
  budget: number;
  budgetRemaining: number;
  percentUsed: number;
};
