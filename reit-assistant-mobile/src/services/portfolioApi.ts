import api from './api';

export type PortfolioKpis = {
  totalPortfolioValue: number;
  totalNoi: number;
  avgCapRate: number;
  dealCountByState: Record<string, number>;
  totalAum: number;
  aumChange: number;
  capRateChange: number;
  activeDeals: number;
  dealsChange: number;
  pendingTasks: number;
  tasksChange: number;
};

export type ActivityItem = {
  id: string;
  icon: 'deal' | 'analysis' | 'rule' | 'task' | 'closed';
  message: string;
  timestamp: string;
};

export type CapRateBucket = {
  label: string;
  value: number;
};

export const portfolioApi = {
  fetchKpis: async () => {
    const response = await api.get<PortfolioKpis>('/api/portfolio/kpis');
    return response.data;
  },
  fetchActivity: async () => {
    const response = await api.get<ActivityItem[]>('/api/portfolio/activity');
    return response.data;
  },
  fetchCapRateChart: async () => {
    const response = await api.get<CapRateBucket[]>('/api/portfolio/cap-rate-chart');
    return response.data;
  },
};
