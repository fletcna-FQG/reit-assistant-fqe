import type { AnalysisResult } from '@/types/analysis';
import type { PortfolioKPIs, ActivityItem, CapRateDistribution } from '@/types/api';
import type { Deal, DealDetail } from '@/types/deal';
import type { InvestmentRule } from '@/types/rule';
import type { Task } from '@/types/task';

export const MOCK_KPIS: PortfolioKPIs = {
  totalAum: 128_500_000,
  aumChange: 4.2,
  avgCapRate: 6.8,
  capRateChange: 0.3,
  activeDeals: 24,
  dealsChange: 3,
  pendingTasks: 12,
  tasksChange: -2,
};

export const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', icon: 'deal', message: 'Deal submitted: 1420 Market St, Tacoma', timestamp: '2h ago' },
  { id: '2', icon: 'analysis', message: 'Analysis complete: 8800 Wyoming Ave scored 78', timestamp: '4h ago' },
  { id: '3', icon: 'rule', message: 'Rule triggered: Low occupancy alert on 4500 Main St', timestamp: '6h ago' },
  { id: '4', icon: 'task', message: 'Task assigned: Review Q2 financials', timestamp: '1d ago' },
  { id: '5', icon: 'closed', message: 'Deal closed: 1200 Pine St for $3.2M', timestamp: '2d ago' },
];

export const MOCK_CAP_RATE_CHART: CapRateDistribution[] = [
  { label: '<5%', value: 2 },
  { label: '5-6%', value: 5 },
  { label: '6-7%', value: 8 },
  { label: '7-8%', value: 6 },
  { label: '>8%', value: 3 },
];

export const MOCK_DEALS: Deal[] = [
  {
    id: '1',
    address: '8800 Wyoming Ave',
    city: 'Cheyenne',
    state: 'WY',
    zip: '82001',
    price: 5_200_000,
    priceChange: 2.4,
    capRate: 6.8,
    status: 'review',
    propertyType: 'Multifamily',
    units: 48,
    score: 78,
    createdAt: '2026-05-17',
  },
  {
    id: '2',
    address: '1420 Market St',
    city: 'Tacoma',
    state: 'WA',
    zip: '98402',
    price: 3_800_000,
    priceChange: -1.2,
    capRate: 5.9,
    status: 'pipeline',
    propertyType: 'Multifamily',
    units: 32,
    createdAt: '2026-05-16',
  },
  {
    id: '3',
    address: '4500 Main St',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    price: 8_100_000,
    priceChange: 0.8,
    capRate: 7.2,
    status: 'approved',
    propertyType: 'Commercial',
    createdAt: '2026-05-15',
  },
  {
    id: '4',
    address: '1200 Pine St',
    city: 'Seattle',
    state: 'WA',
    zip: '98101',
    price: 3_200_000,
    capRate: 6.1,
    status: 'closed',
    propertyType: 'Retail',
    createdAt: '2026-05-10',
  },
];

export const MOCK_DEAL_DETAIL: DealDetail = {
  ...MOCK_DEALS[0],
  purchasePrice: 5_200_000,
  estimatedValue: 5_800_000,
  noi: 353_600,
  occupancy: 94,
  loanAmount: 3_640_000,
  interestRate: 5.75,
  loanTerm: 30,
  dscr: 1.35,
  recommendation: 'BUY',
  documents: [
    { id: 'd1', name: 'Purchase Agreement.pdf', type: 'pdf', size: '2.4 MB' },
    { id: 'd2', name: 'Financial Pro Forma.xlsx', type: 'xlsx', size: '890 KB' },
    { id: 'd3', name: 'Inspection Report.pdf', type: 'pdf', size: '5.1 MB' },
    { id: 'd4', name: 'Property Photos.zip', type: 'zip', size: '24 MB' },
  ],
  financials: [
    { month: 'Jan', noi: 28000, occupancy: 92 },
    { month: 'Feb', noi: 29000, occupancy: 93 },
    { month: 'Mar', noi: 29500, occupancy: 94 },
    { month: 'Apr', noi: 30000, occupancy: 94 },
    { month: 'May', noi: 30500, occupancy: 95 },
    { month: 'Jun', noi: 31000, occupancy: 95 },
  ],
  timeline: [
    { title: 'Deal Submitted', date: 'May 10, 2026', status: 'completed' },
    { title: 'Initial Review', date: 'May 12, 2026', status: 'completed' },
    { title: 'Financial Analysis', date: 'May 15, 2026', status: 'active' },
    { title: 'Committee Approval', date: 'Pending', status: 'pending' },
    { title: 'Closing', date: 'Pending', status: 'pending' },
  ],
};

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Review lease agreements',
    assignee: 'Nancy Fletcher',
    assigneeInitials: 'NF',
    dueDate: '2026-05-20',
    priority: 'high',
    status: 'pending',
    dealId: '1',
  },
  {
    id: 't2',
    title: 'Schedule property inspection',
    assignee: 'John Smith',
    assigneeInitials: 'JS',
    dueDate: '2026-05-22',
    priority: 'medium',
    status: 'in_progress',
    dealId: '1',
  },
  {
    id: 't3',
    title: 'Q2 financial review',
    assignee: 'Nancy Fletcher',
    assigneeInitials: 'NF',
    dueDate: '2026-05-18',
    priority: 'high',
    status: 'pending',
  },
  {
    id: 't4',
    title: 'Update cap rate model',
    assignee: 'Sarah Chen',
    assigneeInitials: 'SC',
    dueDate: '2026-05-15',
    priority: 'low',
    status: 'completed',
  },
  {
    id: 't5',
    title: 'Environmental compliance check',
    assignee: 'Mike Davis',
    assigneeInitials: 'MD',
    dueDate: '2026-05-12',
    priority: 'medium',
    status: 'cancelled',
  },
];

export const MOCK_RULES: InvestmentRule[] = [
  {
    id: 'r1',
    name: 'Minimum Cap Rate',
    category: 'financial',
    description: 'Cap rate must be at least 6.0%',
    conditions: [{ field: 'capRate', operator: '>=', value: '6.0' }],
    scoreImpact: 15,
    active: true,
    priority: 1,
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
  },
];

let analysisStore: AnalysisResult[] = [];

export function saveAnalysis(result: AnalysisResult) {
  analysisStore = [result, ...analysisStore.filter((a) => a.id !== result.id)];
  return result;
}

export function getAnalysis(id: string) {
  return analysisStore.find((a) => a.id === id) ?? null;
}

export function getDealDetail(id: string): DealDetail {
  if (id === '1') return MOCK_DEAL_DETAIL;
  const deal = MOCK_DEALS.find((d) => d.id === id) ?? MOCK_DEALS[0];
  return { ...MOCK_DEAL_DETAIL, ...deal, id };
}
