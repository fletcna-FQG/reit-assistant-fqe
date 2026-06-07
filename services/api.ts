import type { AnalysisInput, AnalysisResult } from '@/types/analysis';
import type { ActivityItem, CapRateDistribution, PortfolioKPIs } from '@/types/api';
import type {
  AttomMonthlySpend,
  PortfolioHoldingsResponse,
  PortfolioImportRow,
} from '@/types/portfolio';
import type { DealStatus } from '@/types/index';
import type { Deal, DealDocument, DealDetail } from '@/types/deal';
import type { InvestmentRule } from '@/types/rule';
import { toDealPropertyType } from '@/utils/dealPropertyType';
import { parseShareRecipients } from '@/utils/shareRecipients';
import type { Task } from '@/types/task';
import type { GeocodeDetailsResponse, GeocodeReverseResponse, GeocodeSearchResponse } from '@/types/geocode';
import type { AttomMarketDataResponse, AttomMarketSnapshot } from '@/types/attom';
import axios, { isAxiosError, type AxiosError } from 'axios';
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
  addDealDocumentToStore,
  updateDealStatusInStore,
} from './mockData';

let authToken: string | null = null;

let authExpiredHandler: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function setOnAuthExpired(handler: (() => void) | null) {
  authExpiredHandler = handler;
}

function notifyAuthExpired() {
  authExpiredHandler?.();
}

export const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ||
    'https://p01--reit-assistant-v2--99vpsnwm46h4.code.run',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** Share generates a PDF on the server (Puppeteer + upload) before email/SMS delivery. */
const SHARE_REQUEST_TIMEOUT_MS = 120_000;

api.interceptors.request.use(async (config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
    return config;
  }

  const { getCurrentUser } = await import('./auth');
  const session = await getCurrentUser();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/refresh') &&
      !originalRequest.url?.includes('/api/auth/login')
    ) {
      const { refreshBackendSession, clearAuthSession } = await import('./auth');
      originalRequest._retry = true;
      const refreshed = await refreshBackendSession();
      if (refreshed?.accessToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return api(originalRequest);
      }
      await clearAuthSession();
      notifyAuthExpired();
      return Promise.reject(new Error('Your session expired. Please sign in again.'));
    }

    const message =
      (error.response?.data as { message?: string })?.message ??
      error.message ??
      'Network error';
    return Promise.reject(new Error(message));
  },
);

/** Live API for dashboard/deals/tasks when EXPO_PUBLIC_USE_LIVE_API=true. */
const useMock = () => process.env.EXPO_PUBLIC_USE_LIVE_API !== 'true';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || /timeout exceeded/i.test(error.message)) {
      return 'Report generation is taking longer than expected. Please wait a moment and try again.';
    }
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? error.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function buildShareRecipientPayload(recipients?: string | string[]): {
  recipient?: string;
  recipients?: string[];
} {
  if (Array.isArray(recipients)) {
    const list = recipients.map((value) => value.trim()).filter(Boolean);
    if (!list.length) return {};
    return { recipients: list, recipient: list.join(', ') };
  }

  if (typeof recipients === 'string' && recipients.trim()) {
    const list = parseShareRecipients(recipients);
    if (list.length) {
      return { recipients: list, recipient: list.join(', ') };
    }
    return { recipient: recipients.trim() };
  }

  return {};
}

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data as {
      message: string;
      user: {
        id: string;
        email: string;
        full_name: string;
        role: string;
        tenant_id: string;
      };
      token: string;
      refresh_token?: string;
    };
  },
  refresh: async (refreshToken: string) => {
    const response = await api.post('/api/auth/refresh', { refresh_token: refreshToken });
    return response.data as { token: string; refresh_token?: string };
  },
  register: async (email: string, password: string, fullName: string, tenantId: string) => {
    const response = await api.post('/api/auth/register', {
      email,
      password,
      full_name: fullName,
      tenant_id: tenantId,
      role: 'analyst',
    });
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data as { message: string };
  },
  getProfile: async () => {
    const response = await api.get('/api/user/me');
    return response.data;
  },
};

export type PropertyRecord = {
  id: string;
  tenant_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  gross_rental_income: number;
  other_income: number;
  vacancy_percent: number;
  egi: number;
  property_taxes: number;
  insurance: number;
  utilities: number;
  repairs_maintenance: number;
  property_management: number;
  other_operating_expenses: number;
  total_operating_expenses: number;
  noi: number;
  cap_rate: number;
  indicated_value: number | null;
  created_at: string;
};

export type PropertySearchResult = {
  message: string;
  source: 'manual' | 'attom_pending' | 'attom' | 'nominatim' | 'nominatim_attom_pending';
  nominatim_verified?: boolean;
  attom_enabled: boolean;
  manual_entry_required: boolean;
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    lat?: number | null;
    lon?: number | null;
  };
  attom_data: AttomMarketSnapshot | null;
};

export const geocodeApi = {
  search: async (query: string, signal?: AbortSignal) => {
    const response = await api.get<GeocodeSearchResponse>('/api/geocode/search', {
      params: { q: query },
      signal,
    });
    return response.data;
  },
  reverse: async (lat: number, lon: number, signal?: AbortSignal) => {
    const response = await api.get<GeocodeReverseResponse>('/api/geocode/reverse', {
      params: { lat, lon },
      signal,
    });
    return response.data;
  },
  details: async (osmType: string, osmId: number, signal?: AbortSignal) => {
    const response = await api.get<GeocodeDetailsResponse>('/api/geocode/details', {
      params: { osm_type: osmType, osm_id: osmId },
      signal,
    });
    return response.data;
  },
};

export const propertyApi = {
  searchProperty: async (location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    lat?: number;
    lon?: number;
  }) => {
    const response = await api.post('/api/properties/search', location);
    return response.data as PropertySearchResult;
  },
  createProperty: async (propertyData: Record<string, unknown>) => {
    const response = await api.post('/api/properties', propertyData);
    return response.data as { message: string; property: PropertyRecord };
  },
  getProperties: async () => {
    const response = await api.get('/api/properties');
    return response.data as { properties: PropertyRecord[] };
  },
  getProperty: async (id: string) => {
    const response = await api.get(`/api/properties/${id}`);
    return response.data as { property: PropertyRecord };
  },
  updateProperty: async (id: string, propertyData: Record<string, unknown>) => {
    const response = await api.put(`/api/properties/${id}`, propertyData);
    return response.data;
  },
  deleteProperty: async (id: string) => {
    const response = await api.delete(`/api/properties/${id}`);
    return response.data;
  },
  getMarketData: async (id: string, lat: number, lon: number, refresh = false) => {
    const response = await api.get<AttomMarketDataResponse>(`/api/properties/${id}/market-data`, {
      params: { lat, lon, refresh: refresh ? 'true' : 'false' },
    });
    return response.data;
  },
  refreshMarketData: async (id: string, lat: number, lon: number) => {
    const response = await api.post<AttomMarketDataResponse>(`/api/properties/${id}/market-data`, {
      lat,
      lon,
      refresh: true,
    });
    return response.data;
  },
};

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

export async function getPortfolioHoldings(): Promise<PortfolioHoldingsResponse> {
  if (useMock()) {
    await delay(200);
    const approved = MOCK_DEALS.filter((d) => d.status === 'approved' || d.status === 'closed');
    const holdings = approved.map((d) => ({
      dealId: d.id,
      propertyId: d.propertyId ?? null,
      address: d.address,
      city: d.city,
      state: d.state,
      zip: d.zip,
      value: d.price,
      noi: d.price * (d.capRate / 100) * 0.65,
      capRate: d.capRate,
      status: d.status,
      dealState: d.status === 'approved' ? 'Under Contract' : 'Closed',
      score: d.score,
      recommendation: d.recommendation,
      inPortfolio: true,
    }));
    const totalAum = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalNoi = holdings.reduce((sum, h) => sum + h.noi, 0);
    const avgCapRate =
      holdings.length > 0
        ? holdings.reduce((sum, h) => sum + h.capRate, 0) / holdings.length
        : 0;
    return { holdings, summary: { count: holdings.length, totalAum, totalNoi, avgCapRate } };
  }
  const { data } = await api.get<PortfolioHoldingsResponse>('/api/portfolio/holdings');
  return data;
}

export async function addDealToPortfolio(dealId: string): Promise<void> {
  if (useMock()) {
    await delay(200);
    return;
  }
  await api.post(`/api/portfolio/holdings/${dealId}`);
}

export async function removeDealFromPortfolio(dealId: string): Promise<void> {
  if (useMock()) {
    await delay(200);
    return;
  }
  await api.delete(`/api/portfolio/holdings/${dealId}`);
}

export async function importPortfolioRows(
  rows: PortfolioImportRow[],
): Promise<{ message: string; created: { dealId: string; propertyId: string; address: string }[] }> {
  if (useMock()) {
    await delay(400);
    return { message: `Imported ${rows.length} holdings (demo)`, created: [] };
  }
  const { data } = await api.post<{ message: string; created: { dealId: string; propertyId: string; address: string }[] }>(
    '/api/portfolio/import',
    { rows },
  );
  return data;
}

export async function getAttomMonthlySpend(): Promise<AttomMonthlySpend> {
  const { data } = await api.get<AttomMonthlySpend>('/api/attom/monthly-spend');
  return data;
}

function filterDealsList(deals: Deal[], search?: string, filter?: string): Deal[] {
  let result = deals;
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (d) =>
        d.address.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.state.toLowerCase().includes(q),
    );
  }
  if (filter && filter !== 'All') {
    result = result.filter((d) => d.propertyType === filter);
  }
  return result;
}

export async function getDeals(search?: string, filter?: string): Promise<Deal[]> {
  if (useMock()) {
    await delay();
    return filterDealsList([...MOCK_DEALS], search, filter);
  }
  const { data } = await api.get<Deal[]>('/api/deals', { params: { search, filter } });
  return filterDealsList(Array.isArray(data) ? data : [], search, filter);
}

export async function getDeal(id: string): Promise<DealDetail> {
  if (useMock()) {
    await delay();
    return getDealDetail(id);
  }
  const { data } = await api.get<DealDetail>(`/api/deals/${id}`);
  return data;
}

export function findDealIdByAnalysisId(analysisId: string): string | null {
  return MOCK_DEALS.find((d) => d.analysisId === analysisId)?.id ?? null;
}

export async function findDealIdByAnalysisIdLive(analysisId: string): Promise<string | null> {
  const mockHit = findDealIdByAnalysisId(analysisId);
  if (mockHit) return mockHit;
  if (useMock()) return null;
  try {
    const deals = await getDeals();
    return deals.find((d) => d.analysisId === analysisId)?.id ?? null;
  } catch {
    return null;
  }
}

export async function findDealIdByPropertyIdLive(propertyId: string): Promise<string | null> {
  if (useMock()) {
    return MOCK_DEALS.find((d) => d.propertyId === propertyId)?.id ?? null;
  }
  try {
    const deals = await getDeals();
    return deals.find((d) => d.propertyId === propertyId)?.id ?? null;
  } catch {
    return null;
  }
}

/** Ensures a pipeline deal exists for this property/analysis (creates one if missing). */
export async function ensureDealForAnalysis(params: {
  analysis: AnalysisResult;
  propertyId?: string;
  propertyType?: string;
  dealId?: string | null;
}): Promise<Deal> {
  let resolvedId =
    params.dealId ??
    (await findDealIdByAnalysisIdLive(params.analysis.id)) ??
    (params.propertyId ? await findDealIdByPropertyIdLive(params.propertyId) : null);

  if (resolvedId) {
    if (useMock()) {
      const mock = MOCK_DEALS.find((d) => d.id === resolvedId);
      if (mock) {
        mock.analysisId = params.analysis.id;
        mock.recommendation = params.analysis.recommendation;
        mock.score = params.analysis.score;
        return mock;
      }
    }
    return getDeal(resolvedId);
  }

  if (!params.propertyId) {
    throw new Error('No property is linked to this analysis. Save the property from Analyze first.');
  }

  const { property } = await propertyApi.getProperty(params.propertyId);
  const created = await createDealForProperty({
    property_id: params.propertyId,
    property,
    property_type: params.propertyType ?? params.analysis.input.propertyType,
    entry_mode: 'rules_engine',
    status: 'pipeline',
  });

  if (!created) {
    throw new Error('Could not create a deal for this property.');
  }

  if (useMock()) {
    created.analysisId = params.analysis.id;
    created.recommendation = params.analysis.recommendation;
    created.score = params.analysis.score;
    const idx = MOCK_DEALS.findIndex((d) => d.id === created.id);
    if (idx >= 0) {
      MOCK_DEALS[idx] = { ...MOCK_DEALS[idx], ...created };
    }
  }

  return created;
}

export async function updateDealStatus(id: string, status: DealStatus): Promise<DealDetail> {
  if (useMock()) {
    await delay(200);
    updateDealStatusInStore(id, status);
    return getDealDetail(id);
  }
  const { data } = await api.patch<DealDetail>(`/api/deals/${id}`, { status });
  return data;
}

export async function addDealDocument(
  dealId: string,
  file: { name: string; type: string; size: string },
): Promise<DealDetail> {
  const doc: DealDocument = {
    id: `doc_${Date.now()}`,
    name: file.name,
    type: file.type,
    size: file.size,
  };
  if (useMock()) {
    await delay(300);
    addDealDocumentToStore(dealId, doc);
    return getDealDetail(dealId);
  }
  try {
    const { data } = await api.post<DealDetail>(`/api/deals/${dealId}/documents`, doc);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      addDealDocumentToStore(dealId, doc);
      return getDealDetail(dealId);
    }
    throw error;
  }
}

export async function analyzeProperty(
  input: AnalysisInput,
  options?: { propertyId?: string },
): Promise<AnalysisResult> {
  if (useMock()) {
    await delay(1500);
    const result = evaluateProperty(input);
    return saveAnalysis(result);
  }
  try {
    const { data } = await api.post<AnalysisResult>('/api/analyze', {
      ...input,
      property_id: options?.propertyId,
    });
    saveAnalysis(data);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      await delay(800);
      const result = evaluateProperty(input);
      return saveAnalysis(result);
    }
    throw error;
  }
}

export async function getAnalysisById(id: string): Promise<AnalysisResult | null> {
  if (useMock()) {
    await delay(300);
    return getAnalysis(id);
  }
  const cached = getAnalysis(id);
  if (cached) return cached;
  try {
    const { data } = await api.get<AnalysisResult>(`/api/analysis/${id}`);
    saveAnalysis(data);
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return getAnalysis(id);
    }
    throw error;
  }
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
  const { data } = await api.post<Task>('/api/tasks', {
    deal_id: task.dealId,
    title: task.title,
    status: task.status,
    priority: task.priority,
    assignee_name: task.assignee,
    assignee_initials: task.assigneeInitials,
    due_date: task.dueDate,
  });
  return data;
}

export async function createDealForProperty(params: {
  property_id: string;
  property?: PropertyRecord;
  property_type?: string;
  entry_mode?: string;
  status?: DealStatus;
}): Promise<Deal | null> {
  const status = params.status ?? 'pipeline';

  if (useMock()) {
    await delay(200);
    const property =
      params.property ?? (await propertyApi.getProperty(params.property_id)).property;
    const newDeal: Deal = {
      id: `deal_${Date.now()}`,
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      price: property.indicated_value ?? 0,
      capRate: property.cap_rate ?? 0,
      status,
      propertyType: params.property_type ?? 'Property',
      createdAt: property.created_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    };
    MOCK_DEALS.unshift(newDeal);
    return newDeal;
  }

  try {
    const { data } = await api.post<Deal>('/api/deals', {
      property_id: params.property_id,
      status,
      property_type: toDealPropertyType(params.property_type),
      entry_mode: params.entry_mode ?? 'manual',
    });
    return data;
  } catch (error) {
    console.warn('createDealForProperty failed:', getApiErrorMessage(error));
    return null;
  }
}

export async function getRules(): Promise<InvestmentRule[]> {
  if (useMock()) {
    await delay();
    return [...MOCK_RULES];
  }
  try {
    const { data } = await api.get<InvestmentRule[]>('/api/rules');
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (error) {
    if (!isAxiosError(error) || error.response?.status !== 404) {
      console.warn('getRules live API failed, using out-of-box defaults:', getApiErrorMessage(error));
    }
  }
  return [...MOCK_RULES];
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

export async function updateRule(
  id: string,
  updates: Partial<InvestmentRule>,
): Promise<InvestmentRule> {
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
    const rule = MOCK_RULES.find((r) => r.id === id);
    if (rule?.isSystem) {
      throw new Error('Out-of-box rules cannot be deleted. Disable them instead.');
    }
    const idx = MOCK_RULES.findIndex((r) => r.id === id);
    if (idx >= 0) MOCK_RULES.splice(idx, 1);
    return;
  }
  await api.delete(`/api/rules/${id}`);
}

/** Map a saved property record to analysis input for the REIT Rules Engine. */
export function propertyRecordToAnalysisInput(
  property: PropertyRecord,
  propertyType: string,
  meta?: {
    year_built?: string;
    price?: string;
    loan_details?: string;
  },
): AnalysisInput {
  const indicatedValue = property.indicated_value ?? property.noi / (property.cap_rate / 100);
  const purchasePrice = meta?.price ? parseFloat(meta.price) || indicatedValue : indicatedValue;
  const yearBuilt = meta?.year_built ? parseInt(meta.year_built, 10) || 2000 : 2000;
  const vacancy = property.vacancy_percent;
  return {
    address: `${property.address}, ${property.city}, ${property.state} ${property.zip}`,
    propertyType,
    yearBuilt,
    sqft: 0,
    units: 0,
    purchasePrice,
    estimatedValue: indicatedValue,
    noi: property.noi,
    occupancy: Math.max(0, 100 - vacancy),
    loanAmount: purchasePrice * 0.65,
    interestRate: 5.75,
    loanTerm: 30,
  };
}

function parseAddressFromInput(addressLine: string) {
  const match = addressLine.match(/^(.+),\s*(.+),\s*(\w{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (match) {
    return { address: match[1], city: match[2], state: match[3], zip: match[4] };
  }
  return { address: addressLine, city: '', state: '', zip: '' };
}

export async function addAnalysisToPortfolio(
  analysis: AnalysisResult,
  propertyType: string,
): Promise<Deal> {
  const location = parseAddressFromInput(analysis.input.address);
  const newDeal: Deal = {
    id: `deal_${Date.now()}`,
    address: location.address,
    city: location.city,
    state: location.state,
    zip: location.zip,
    price: analysis.input.estimatedValue,
    capRate: analysis.capRate,
    status: 'pipeline',
    propertyType,
    recommendation: analysis.recommendation,
    score: analysis.score,
    analysisId: analysis.id,
    yearBuilt: analysis.input.yearBuilt,
    sqft: analysis.input.sqft || undefined,
    units: analysis.input.units || undefined,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  if (useMock()) {
    await delay(300);
    MOCK_DEALS.unshift(newDeal);
    return newDeal;
  }
  const { data } = await api.post<Deal>('/api/deals', newDeal);
  return data;
}

export async function createAnalysisFollowUp(
  analysis: AnalysisResult,
  options?: { dealId?: string | null; propertyId?: string; propertyType?: string },
): Promise<{ task: Task; deal: Deal }> {
  const location = parseAddressFromInput(analysis.input.address);
  const deal = await ensureDealForAnalysis({
    analysis,
    propertyId: options?.propertyId,
    propertyType: options?.propertyType,
    dealId: options?.dealId,
  });

  const task = await createTask({
    title: `Follow up: ${location.address}`,
    assignee: 'Unassigned',
    assigneeInitials: 'UA',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    priority: 'medium',
    status: 'pending',
    dealId: deal.id,
  });

  return { task, deal };
}

/** @deprecated Use createAnalysisFollowUp */
export const requestAnalysisInfo = createAnalysisFollowUp;

export type SharePropertyResponse = {
  success: boolean;
  url?: string;
  messageId?: string;
  error?: string;
  sentCount?: number;
  failedRecipients?: string[];
};

export async function shareProperty(
  propertyId: string,
  type: 'link' | 'sms' | 'email',
  recipients?: string | string[],
): Promise<SharePropertyResponse> {
  const { data } = await api.post<SharePropertyResponse>(
    '/api/reit/share',
    {
      propertyId,
      type,
      ...buildShareRecipientPayload(recipients),
    },
    { timeout: SHARE_REQUEST_TIMEOUT_MS },
  );
  return data;
}

export async function subscribeSmsUpdates(payload: {
  phone: string;
  email?: string;
  source?: 'website' | 'qr' | 'keyword';
}): Promise<{ success: boolean; message?: string }> {
  const { data } = await api.post<{ success: boolean; message?: string }>('/api/sms/subscribe', {
    phone: payload.phone,
    email: payload.email,
    consent: true,
    source: payload.source ?? 'website',
  });
  return data;
}

export default api;
