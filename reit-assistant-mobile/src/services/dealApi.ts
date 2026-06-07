import api from './api';

export type DealStatus = 'pipeline' | 'review' | 'approved' | 'closed';

export type DealRecord = {
  id: string;
  propertyId?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  capRate: number;
  status: DealStatus;
  dealState?: string;
  propertyType: string;
  entryMode?: string | null;
  score?: number;
  recommendation?: string;
  analysisId?: string;
  createdAt: string;
};

export type CreateDealInput = {
  property_id: string;
  deal_state?: string;
  status?: DealStatus;
  property_type?: string;
  entry_mode?: string;
};

export type UpdateDealInput = {
  deal_state?: string;
  status?: DealStatus;
  property_type?: string;
  entry_mode?: string;
};

export const dealApi = {
  fetchDeals: async (search?: string, filter?: string) => {
    const response = await api.get<DealRecord[]>('/api/deals', {
      params: { search, filter },
    });
    return response.data;
  },
  fetchDeal: async (id: string) => {
    const response = await api.get<DealRecord>(`/api/deals/${id}`);
    return response.data;
  },
  createDeal: async (input: CreateDealInput) => {
    const response = await api.post<DealRecord>('/api/deals', input);
    return response.data;
  },
  updateDeal: async (id: string, input: UpdateDealInput) => {
    const response = await api.patch<DealRecord>(`/api/deals/${id}`, input);
    return response.data;
  },
  archiveDeal: async (id: string) => {
    const response = await api.delete<{ message: string; id: string }>(`/api/deals/${id}`);
    return response.data;
  },
};
