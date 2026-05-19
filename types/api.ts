export interface PortfolioKPIs {
  totalAum: number;
  aumChange: number;
  avgCapRate: number;
  capRateChange: number;
  activeDeals: number;
  dealsChange: number;
  pendingTasks: number;
  tasksChange: number;
}

export interface ActivityItem {
  id: string;
  icon: 'deal' | 'analysis' | 'rule' | 'task' | 'closed';
  message: string;
  timestamp: string;
}

export interface CapRateDistribution {
  label: string;
  value: number;
}
