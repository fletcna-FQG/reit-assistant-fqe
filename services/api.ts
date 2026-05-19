import type { AnalysisInput, AnalysisResult } from '@/types/analysis';
import type { ActivityItem, CapRateDistribution, PortfolioKPIs } from '@/types/api';
import type { Deal, DealDetail } from '@/types/deal';
import type { InvestmentRule } from '@/types/rule';
import type { Task } from '@/types/task';
import axios, { type AxiosError } from 'axios';
import { evaluateProperty } from './analysisEngine';
import {
  MOCK_ACTIVITY,
  MOCK_CAP_RATE_CHART,
  MOCK_DEALS,
  MOCK_KPIS,
  MOCK_RULES,
  MOCK_TASKS,
  getAnalysis,
  getDealDetail,
  saveAnalysis,
} from './mockData';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.fletcherquill.com';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const { getCurrentUser } = await import('./auth');
  const session = await getCurrentUser();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const message =
      (error.response?.data as { message?: string })?.message ??
      error.message ??
      'Network error';
    return Promise.reject(new Error(message));
  },
);

const useMock = () => !process.env.EXPO_PUBLIC_API_URL;

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export async function getPortfolioKPIs(): Promise<PortfolioKPIs> {
  if (useMock()) {
    await delay();
    return MOCK_KPIS;
  }
  const { data } = await api.get<PortfolioKPIs>('/api/portfolio/kpis');
  return data;
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  if (useMock()) {
    await delay(200);
    return MOCK_ACTIVITY;
  }
  const { data } = await api.get<ActivityItem[]>('/api/portfolio/activity');
  return data;
}

export async function getCapRateDistribution(): Promise<CapRateDistribution[]> {
  if (useMock()) {
    await delay(200);
    return MOCK_CAP_RATE_CHART;
  }
  const { data } = await api.get<CapRateDistribution[]>('/api/portfolio/cap-rate-chart');
  return data;
}

export async function getDeals(search?: string, filter?: string): Promise<Deal[]> {
  if (useMock()) {
    await delay();
    let deals = [...MOCK_DEALS];
    if (search) {
      const q = search.toLowerCase();
      deals = deals.filter(
        (d) =>
          d.address.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.state.toLowerCase().includes(q),
      );
    }
    if (filter && filter !== 'All') {
      deals = deals.filter((d) => d.propertyType === filter);
    }
    return deals;
  }
  const { data } = await api.get<Deal[]>('/api/deals', { params: { search, filter } });
  return data;
}

export async function getDeal(id: string): Promise<DealDetail> {
  if (useMock()) {
    await delay();
    return getDealDetail(id);
  }
  const { data } = await api.get<DealDetail>(`/api/deals/${id}`);
  return data;
}

export async function analyzeProperty(input: AnalysisInput): Promise<AnalysisResult> {
  if (useMock()) {
    await delay(1500);
    const result = evaluateProperty(input);
    return saveAnalysis(result);
  }
  const { data } = await api.post<AnalysisResult>('/api/analyze', input);
  return data;
}

export async function getAnalysisById(id: string): Promise<AnalysisResult | null> {
  if (useMock()) {
    await delay(300);
    return getAnalysis(id);
  }
  const { data } = await api.get<AnalysisResult>(`/api/analysis/${id}`);
  return data;
}

export async function getTasks(): Promise<Task[]> {
  if (useMock()) {
    await delay();
    return [...MOCK_TASKS];
  }
  const { data } = await api.get<Task[]>('/api/tasks');
  return data;
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
  if (useMock()) {
    await delay(200);
    const task = MOCK_TASKS.find((t) => t.id === id);
    if (task) task.status = status;
    return task!;
  }
  const { data } = await api.patch<Task>(`/api/tasks/${id}`, { status });
  return data;
}

export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  if (useMock()) {
    await delay(200);
    const newTask = { ...task, id: `t${Date.now()}` };
    MOCK_TASKS.push(newTask);
    return newTask;
  }
  const { data } = await api.post<Task>('/api/tasks', task);
  return data;
}

export async function getRules(): Promise<InvestmentRule[]> {
  if (useMock()) {
    await delay();
    return [...MOCK_RULES];
  }
  const { data } = await api.get<InvestmentRule[]>('/api/rules');
  return data;
}

export async function createRule(rule: Omit<InvestmentRule, 'id'>): Promise<InvestmentRule> {
  if (useMock()) {
    await delay(200);
    const newRule = { ...rule, id: `r${Date.now()}` };
    MOCK_RULES.push(newRule);
    return newRule;
  }
  const { data } = await api.post<InvestmentRule>('/api/rules', rule);
  return data;
}

export async function updateRule(id: string, updates: Partial<InvestmentRule>): Promise<InvestmentRule> {
  if (useMock()) {
    await delay(200);
    const idx = MOCK_RULES.findIndex((r) => r.id === id);
    if (idx >= 0) MOCK_RULES[idx] = { ...MOCK_RULES[idx], ...updates };
    return MOCK_RULES[idx];
  }
  const { data } = await api.put<InvestmentRule>(`/api/rules/${id}`, updates);
  return data;
}

export async function deleteRule(id: string): Promise<void> {
  if (useMock()) {
    await delay(200);
    const idx = MOCK_RULES.findIndex((r) => r.id === id);
    if (idx >= 0) MOCK_RULES.splice(idx, 1);
    return;
  }
  await api.delete(`/api/rules/${id}`);
}
