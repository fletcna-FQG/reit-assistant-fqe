import type { DealStatus, Recommendation } from './index';

export interface Deal {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  priceChange?: number;
  capRate: number;
  status: DealStatus;
  propertyType: string;
  units?: number;
  sqft?: number;
  yearBuilt?: number;
  imageUrl?: string;
  recommendation?: Recommendation;
  score?: number;
  analysisId?: string;
  createdAt: string;
}

export interface DealDocument {
  id: string;
  name: string;
  type: string;
  size: string;
}

export interface DealFinancial {
  month: string;
  noi: number;
  occupancy: number;
}

export interface DealDetail extends Deal {
  purchasePrice: number;
  estimatedValue: number;
  noi: number;
  occupancy: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  dscr: number;
  documents: DealDocument[];
  financials: DealFinancial[];
  timeline: { title: string; date: string; status: 'completed' | 'active' | 'pending' }[];
}
