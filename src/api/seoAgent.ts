import api from './axios';
import type {
  ApiResponse,
  PaginatedResponse,
  SeoAgentIntegrationTestResult,
  SeoIssueGroup,
  SeoAgentDashboard,
  SeoAgentIntegrationUpdate,
  SeoAgentIntegrations,
  SeoAgentSettings,
  SeoChange,
  SeoIntegrationHealth,
  SeoIssue,
  SeoProposal,
  SeoProtectedEntity,
  SeoRun,
} from '../types/seoAgent';

const BASE = '/seo-agent';

export interface SeoAgentListParams {
  page?: number;
  per_page?: number;
  status?: string;
  tier?: string;
  severity?: string;
  type?: string;
  risk?: string;
  mode?: string;
  search?: string;
  entity_type?: string;
  group?: string;
}

export const seoAgentApi = {
  dashboard: async (): Promise<SeoAgentDashboard> => {
    const response = await api.get<ApiResponse<SeoAgentDashboard>>(`${BASE}/dashboard`);
    return response.data.data;
  },

  runs: async (params: SeoAgentListParams = {}): Promise<PaginatedResponse<SeoRun>> => {
    const response = await api.get<PaginatedResponse<SeoRun>>(`${BASE}/runs`, { params });
    return response.data;
  },

  run: async (id: number): Promise<SeoRun> => {
    const response = await api.get<ApiResponse<SeoRun>>(`${BASE}/runs/${id}`);
    return response.data.data;
  },

  issues: async (params: SeoAgentListParams = {}): Promise<PaginatedResponse<SeoIssue>> => {
    const response = await api.get<PaginatedResponse<SeoIssue>>(`${BASE}/issues`, { params });
    return response.data;
  },

  updateIssue: async (id: number, status: 'open' | 'ignored' | 'fixed'): Promise<SeoIssue> => {
    const response = await api.patch<ApiResponse<SeoIssue>>(`${BASE}/issues/${id}`, { status });
    return response.data.data;
  },

  issueGroups: async (source?: 'merchant' | 'organic'): Promise<SeoIssueGroup[]> => {
    const response = await api.get<ApiResponse<SeoIssueGroup[]>>(`${BASE}/issues/groups`, {
      params: { source },
    });
    return response.data.data;
  },

  markGroupFalsePositive: async (group_key: string, source?: 'merchant' | 'organic') => {
    const response = await api.post<ApiResponse<{ updated: number }>>(
      `${BASE}/issues/false-positive`,
      { group_key, source }
    );
    return response.data.data;
  },

  exportIssuesUrl: (params: { source?: string; group?: string }): string => {
    const apiBase = process.env.REACT_APP_ADMIN_API_URL || '/api/v1/admin';
    const query = new URLSearchParams();
    if (params.source) query.set('source', params.source);
    if (params.group) query.set('group', params.group);
    return `${apiBase}/seo-agent/issues/export?${query.toString()}`;
  },

  runAudit: async (payload: { scope?: string; limit?: number; dry_run?: boolean } = {}) => {
    const response = await api.post<ApiResponse<{ output: string }>>(`${BASE}/run/audit`, payload);
    return response.data.data;
  },

  runMerchantDiagnostics: async () => {
    const response = await api.post<ApiResponse<{ output: string }>>(`${BASE}/run/merchant-diagnostics`);
    return response.data.data;
  },

  runContentProposals: async () => {
    const response = await api.post<ApiResponse<{ output: string }>>(`${BASE}/run/content-proposals`);
    return response.data.data;
  },

  changes: async (params: SeoAgentListParams = {}): Promise<PaginatedResponse<SeoChange>> => {
    const response = await api.get<PaginatedResponse<SeoChange>>(`${BASE}/changes`, { params });
    return response.data;
  },

  rollbackChange: async (id: number, reason: string): Promise<void> => {
    await api.post(`${BASE}/changes/${id}/rollback`, { reason });
  },

  proposals: async (params: SeoAgentListParams = {}): Promise<PaginatedResponse<SeoProposal>> => {
    const response = await api.get<PaginatedResponse<SeoProposal>>(`${BASE}/proposals`, { params });
    return response.data;
  },

  proposal: async (id: number): Promise<SeoProposal> => {
    const response = await api.get<ApiResponse<SeoProposal>>(`${BASE}/proposals/${id}`);
    return response.data.data;
  },

  approveProposal: async (id: number, note?: string): Promise<Record<string, unknown>> => {
    const response = await api.post<ApiResponse<Record<string, unknown>>>(
      `${BASE}/proposals/${id}/approve`,
      { note }
    );
    return response.data.data;
  },

  rejectProposal: async (id: number, note: string): Promise<SeoProposal> => {
    const response = await api.post<ApiResponse<SeoProposal>>(
      `${BASE}/proposals/${id}/reject`,
      { note }
    );
    return response.data.data;
  },

  protectedEntities: async (): Promise<SeoProtectedEntity[]> => {
    const response = await api.get<ApiResponse<SeoProtectedEntity[]>>(`${BASE}/protected-entities`);
    return response.data.data;
  },

  addProtectedEntity: async (payload: {
    entity_type: string;
    entity_id: number;
    reason?: string;
    source?: string;
  }): Promise<SeoProtectedEntity> => {
    const response = await api.post<ApiResponse<SeoProtectedEntity>>(`${BASE}/protected-entities`, payload);
    return response.data.data;
  },

  removeProtectedEntity: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/protected-entities/${id}`);
  },

  settings: async (): Promise<SeoAgentSettings> => {
    const response = await api.get<ApiResponse<SeoAgentSettings>>(`${BASE}/settings`);
    return response.data.data;
  },

  updateSettings: async (
    values: Record<string, string | number | boolean | null>
  ): Promise<SeoAgentSettings> => {
    const response = await api.put<ApiResponse<SeoAgentSettings>>(`${BASE}/settings`, values);
    return response.data.data;
  },

  integrationHealth: async (): Promise<SeoIntegrationHealth> => {
    const response = await api.get<ApiResponse<SeoIntegrationHealth>>(`${BASE}/integrations/health`);
    return response.data.data;
  },

  integrations: async (): Promise<SeoAgentIntegrations> => {
    const response = await api.get<ApiResponse<SeoAgentIntegrations>>(`${BASE}/integrations`);
    return response.data.data;
  },

  updateIntegrations: async (
    payload: SeoAgentIntegrationUpdate
  ): Promise<SeoAgentIntegrations> => {
    const response = await api.put<ApiResponse<SeoAgentIntegrations>>(`${BASE}/integrations`, payload);
    return response.data.data;
  },

  testIntegration: async (
    service: 'search-console' | 'ga4' | 'pagespeed' | 'merchant-center'
  ): Promise<SeoAgentIntegrationTestResult> => {
    const response = await api.post<ApiResponse<SeoAgentIntegrationTestResult>>(
      `${BASE}/integrations/test/${service}`
    );
    return response.data.data;
  },

  googleAuthorize: async (): Promise<{ url: string; redirect_uri: string }> => {
    const response = await api.post<ApiResponse<{ url: string; redirect_uri: string }>>(
      `${BASE}/integrations/google/authorize`
    );
    return response.data.data;
  },
};
