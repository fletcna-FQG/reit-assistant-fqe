// User roles in the system
export type UserRole = 'admin' | 'analyst' | 'viewer';

// Analysis recommendations
export type AnalysisRecommendation = 'buy' | 'hold' | 'sell';

// Export document formats
export type ExportFormat = 'pdf' | 'doc' | 'ppt';

// Export job status
export type ExportStatus = 'pending' | 'completed' | 'failed';

// Profile interface (matches Supabase profiles table)
export interface Profile {
  id: string;
  tenant_id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  phone?: string;
  aa_member_id?: string;
  created_at: string;
}

// Tenant interface (matches Supabase tenants table)
export interface Tenant {
  id: string;
  name: string;
  display_name: string;
  owner_entity: string;
  plan: string;
  attom_enabled: boolean;
  aa_community_id?: string;
  created_at: string;
}

// Property interface (matches Supabase properties table)
export interface Property {
  id: string;
  tenant_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude?: number;
  longitude?: number;
  attom_data_snapshot?: any;
  created_at: string;
}

// Analysis Result interface (matches Supabase analysis_results table)
export interface AnalysisResult {
  id: string;
  tenant_id: string;
  property_id: string;
  score: number;
  recommendation: AnalysisRecommendation;
  triggered_rules: any[];
  created_at: string;
}

// Export interface (matches Supabase exports table)
export interface Export {
  id: string;
  tenant_id: string;
  analysis_id: string;
  format: ExportFormat;
  file_url: string;
  status: ExportStatus;
  created_by: string;
  created_at: string;
}

// Audit Log interface (matches Supabase audit_logs table)
export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  metadata: any;
  timestamp: string;
}

// Request/Response types for Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  tenant_id: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name?: string;
    role: UserRole;
    tenant_id: string;
  };
  token: string;
}
