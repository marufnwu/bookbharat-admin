import api from './axios';
import type {
  ApiResponse,
  GrowthExperiment,
  GrowthFinding,
  GrowthFindingGroup,
  GrowthHealth,
  GrowthProductRow,
  GrowthSummary,
  GrowthTrendPoint,
  SearchGap,
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
  SeoCohortSummary,
  SeoCohortDetail,
  SeoCohortMeasurement,
  SeoRolloutGates,
  SeoWeeklyReport,
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

  growthHealth: async (): Promise<GrowthHealth> => {
    const response = await api.get<ApiResponse<GrowthHealth>>(`${BASE}/growth/health`);
    return response.data.data;
  },

  growthSummary: async (days = 28): Promise<GrowthSummary> => {
    const response = await api.get<ApiResponse<GrowthSummary>>(`${BASE}/growth/summary`, {
      params: { days },
    });
    return response.data.data;
  },

  aggregateGrowth: async () => {
    const response = await api.post<ApiResponse<{ output: string }>>(`${BASE}/growth/aggregate`);
    return response.data.data;
  },

  growthTrend: async (days = 28): Promise<GrowthTrendPoint[]> => {
    const response = await api.get<ApiResponse<GrowthTrendPoint[]>>(`${BASE}/growth/trend`, {
      params: { days },
    });
    return response.data.data;
  },

  growthProducts: async (days = 28, sort: 'views' | 'revenue' = 'views'): Promise<GrowthProductRow[]> => {
    const response = await api.get<ApiResponse<GrowthProductRow[]>>(`${BASE}/growth/products`, {
      params: { days, sort },
    });
    return response.data.data;
  },

  checkoutFunnel: async (days = 28): Promise<{
    checkout_started: number;
    steps: Array<{ step: string; sessions: number; drop_off_from_previous: number | null }>;
  }> => {
    const response = await api.get<ApiResponse<any>>(`${BASE}/growth/checkout-funnel`, {
      params: { days },
    });
    return response.data.data;
  },

  growthExperiments: async (): Promise<GrowthExperiment[]> => {
    const response = await api.get<ApiResponse<GrowthExperiment[]>>(`${BASE}/growth/experiments`);
    return response.data.data;
  },

  createGrowthExperiment: async (payload: {
    name: string;
    hypothesis: string;
    minimum_sample?: number;
    traffic_split?: number;
  }): Promise<GrowthExperiment> => {
    const response = await api.post<ApiResponse<GrowthExperiment>>(`${BASE}/growth/experiments`, payload);
    return response.data.data;
  },

  startGrowthExperiment: async (id: number): Promise<GrowthExperiment> => {
    const response = await api.post<ApiResponse<GrowthExperiment>>(`${BASE}/growth/experiments/${id}/start`);
    return response.data.data;
  },

  stopGrowthExperiment: async (id: number): Promise<GrowthExperiment> => {
    const response = await api.post<ApiResponse<GrowthExperiment>>(`${BASE}/growth/experiments/${id}/stop`);
    return response.data.data;
  },

  analyzeGrowthExperiment: async (id: number): Promise<Record<string, unknown>> => {
    const response = await api.post<ApiResponse<Record<string, unknown>>>(`${BASE}/growth/experiments/${id}/analyze`);
    return response.data.data;
  },

  growthFindings: async (params: {
    status?: string;
    group?: string;
    actionability?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<{ data: GrowthFinding[]; meta: any }> => {
    const response = await api.get<{ data: GrowthFinding[]; meta: any }>(`${BASE}/growth/findings`, {
      params,
    });
    return response.data;
  },

  growthFindingGroups: async (): Promise<GrowthFindingGroup[]> => {
    const response = await api.get<ApiResponse<GrowthFindingGroup[]>>(`${BASE}/growth/findings/groups`);
    return response.data.data;
  },

  updateGrowthFinding: async (id: number, status: 'open' | 'ignored' | 'fixed'): Promise<GrowthFinding> => {
    const response = await api.patch<ApiResponse<GrowthFinding>>(`${BASE}/growth/findings/${id}`, { status });
    return response.data.data;
  },

  detectGrowthFindings: async (dryRun = true) => {
    const response = await api.post<ApiResponse<{ output: string }>>(`${BASE}/growth/detect`, {
      dry_run: dryRun,
    });
    return response.data.data;
  },

  searchGaps: async (days = 90, limit = 20): Promise<SearchGap[]> => {
    const response = await api.get<ApiResponse<SearchGap[]>>(`${BASE}/growth/search-gaps`, {
      params: { days, limit },
    });
    return response.data.data;
  },

  runMerchantBatch: async (kind: 'titles' | 'images', limit = 100) => {
    const response = await api.post<ApiResponse<{ output: string }>>(`${BASE}/run/merchant-batch`, {
      kind,
      limit,
    });
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

  // R1.3 / R7.1 / R8.1 — Tier A cohort, its measured performance, and the
  // rollout gates that decide whether automation may run.
  cohorts: async (): Promise<SeoCohortSummary[]> => {
    const response = await api.get<ApiResponse<SeoCohortSummary[]>>(`${BASE}/cohorts`);
    return response.data.data;
  },

  cohort: async (id: number): Promise<SeoCohortDetail> => {
    const response = await api.get<ApiResponse<SeoCohortDetail>>(`${BASE}/cohorts/${id}`);
    return response.data.data;
  },

  approveCohort: async (id: number, notes?: string): Promise<SeoCohortSummary> => {
    const response = await api.post<ApiResponse<SeoCohortSummary>>(
      `${BASE}/cohorts/${id}/approve`,
      { notes }
    );
    return response.data.data;
  },

  retireCohort: async (id: number, notes?: string): Promise<SeoCohortSummary> => {
    const response = await api.post<ApiResponse<SeoCohortSummary>>(
      `${BASE}/cohorts/${id}/retire`,
      { notes }
    );
    return response.data.data;
  },

  cohortMeasurement: async (days: 14 | 28 | 42 = 28): Promise<{
    window_days: number;
    cohorts: SeoCohortMeasurement[];
  }> => {
    const response = await api.get<ApiResponse<{ window_days: number; cohorts: SeoCohortMeasurement[] }>>(
      `${BASE}/cohort-measurement`,
      { params: { days } }
    );
    return response.data.data;
  },

  gates: async (): Promise<SeoRolloutGates> => {
    const response = await api.get<ApiResponse<SeoRolloutGates>>(`${BASE}/gates`);
    return response.data.data;
  },

  weeklyReport: async (days = 7): Promise<SeoWeeklyReport> => {
    const response = await api.get<ApiResponse<SeoWeeklyReport>>(`${BASE}/weekly-report`, {
      params: { days },
    });
    return response.data.data;
  },
};
