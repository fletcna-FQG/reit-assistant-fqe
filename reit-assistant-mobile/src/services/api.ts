import axios, { isAxiosError } from 'axios';

declare global {
  interface Window {
    authToken?: string | null;
  }
  // eslint-disable-next-line no-var
  var authToken: string | null | undefined;
}

function syncToken(token: string | null) {
  if (typeof globalThis !== 'undefined') {
    (globalThis as typeof globalThis & { authToken?: string | null }).authToken = token;
  }
  if (typeof window !== 'undefined') {
    window.authToken = token;
  }
}

/** Sync token for axios interceptor (window.authToken on web; globalThis on native). */
export function setAuthToken(token: string | null) {
  syncToken(token);
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined' && window.authToken) {
    return window.authToken;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as { authToken?: string | null }).authToken) {
    return (globalThis as { authToken?: string | null }).authToken ?? null;
  }
  return null;
}

const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_URL ||
    'https://p01--reit-assistant-v2--99vpsnwm46h4.code.run',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
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
    };
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
  source: 'manual' | 'attom_pending';
  attom_enabled: boolean;
  manual_entry_required: boolean;
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  attom_data: unknown | null;
};

export const propertyApi = {
  searchProperty: async (location: { address: string; city: string; state: string; zip: string }) => {
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
};

export default api;
