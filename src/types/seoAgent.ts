export type SeoRunStatus = 'running' | 'completed' | 'failed' | 'halted';
export type SeoTier = 1 | 2 | 3;
export type SeoSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SeoRun {
  id: number;
  run_id: string;
  mode: 'dry_run' | 'live';
  trigger: 'scheduled' | 'manual';
  started_at: string | null;
  ended_at: string | null;
  status: SeoRunStatus;
  issues_found: number;
  fixed: number;
  proposed: number;
  skipped: number;
  alerts: number;
  cost_usd: number;
  summary_json: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeoIssueGroup {
  group_key: string;
  label: string;
  actionability: 'auto_fix' | 'needs_approval' | 'manual' | 'false_positive';
  issues: number;
  products: number;
  severity: string;
}

/**
 * What the strategist concluded about an issue.
 *
 * `no_change` and `insufficient_evidence` mean the page was left alone;
 * `build_hub_page` means the demand belongs on a different page and a proposal
 * was raised instead. Anything else is a recommendation the planner still had to
 * route through the gateway.
 */
export interface SeoStrategyAssessment {
  recommendation:
    | 'rewrite_snippet'
    | 'improve_page_content'
    | 'build_hub_page'
    | 'strengthen_internal_links'
    | 'fix_technical'
    | 'no_change'
    | 'insufficient_evidence';
  confidence: 'low' | 'medium' | 'high';
  search_intent: string;
  reason: string;
  better_target: string;
  content_gaps: string[];
  suggested_focus: string;
  assessed_at: string;
}

export interface SeoStrategyAssessmentRow {
  issue_id: number;
  type: string;
  url: string | null;
  entity_type: string;
  entity_id: number | null;
  status: string;
  last_seen: string | null;
  recommendation: SeoStrategyAssessment['recommendation'] | null;
  confidence: SeoStrategyAssessment['confidence'] | null;
  search_intent: string | null;
  reason: string | null;
  content_gaps: string[];
  better_target: string | null;
  suggested_focus: string | null;
  assessed_at: string | null;
}

export interface SeoStrategyAssessmentFeed {
  assessments: SeoStrategyAssessmentRow[];
  by_recommendation: Array<{
    recommendation: string;
    count: number;
  }>;
}

export interface SeoIssue {
  id: number;
  fingerprint: string;
  type: string;
  group_key?: string | null;
  actionability?: 'auto_fix' | 'needs_approval' | 'manual' | 'false_positive' | null;
  entity_type: string;
  entity_id: number | null;
  url: string | null;
  severity: SeoSeverity;
  tier: SeoTier;
  status: 'open' | 'ignored' | 'fixed' | 'regressed' | 'deferred';
  first_seen: string | null;
  last_seen: string | null;
  occurrences: number;
  evidence_json: Record<string, unknown> | null;
  priority_score: number;
  /** Present when the strategist assessed this issue. */
  strategy?: SeoStrategyAssessment | null;
}

export interface SeoChange {
  id: number;
  change_id: string;
  run_id: string | null;
  entity_type: string;
  entity_id: number;
  field: string;
  old_value: string | null;
  new_value: string | null;
  tier: SeoTier;
  reason: string | null;
  // needs_review: measured worse, flagged for a human rather than reverted
  // automatically (automatic rollback is off by default).
  status: 'pending' | 'applied' | 'needs_review' | 'verified' | 'rolled_back' | 'failed';
  applied_at: string | null;
  verify_14_at: string | null;
  verify_28_at: string | null;
  baseline_json: Record<string, any> | null;
  control_entity_ids_json: number[] | null;
  verdict: 'improved' | 'neutral' | 'worse' | null;
  rolled_back_at: string | null;
  rollback_reason: string | null;
  created_at: string;
}

export interface SeoProposal {
  id: number;
  proposal_id: string;
  run_id: string | null;
  type: string;
  entity_type: string;
  entity_id: number;
  payload_json: Record<string, unknown> | null;
  risk: 'low' | 'medium' | 'high' | 'needs_data';
  evidence_json: Record<string, unknown> | null;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  reviewed_by: number | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  current_values?: Record<string, unknown>;
  entity_url?: string | null;
}

export interface SeoProtectedEntity {
  id: number;
  entity_type: string;
  entity_id: number;
  reason: string | null;
  source: 'manual' | 'revenue' | 'traffic';
  added_by: number | null;
  added_at: string | null;
  created_at: string;
}

export interface SeoSettingField {
  value: string | number | boolean | null;
  label?: string;
  description?: string;
  type?: string;
  input_type?: string;
  is_editable?: boolean;
}

export interface SeoAgentSettings {
  values: Record<string, string | number | boolean | null>;
  fields: Record<string, SeoSettingField>;
}

export interface SeoIntegrationHealth {
  search_console: { configured: boolean };
  ga4: { configured: boolean };
  pagespeed: { configured: boolean };
}

export interface GrowthExperiment {
  id: number;
  name: string;
  hypothesis: string;
  metric: string;
  variant_key: string;
  control_key: string;
  traffic_split: number;
  status: 'draft' | 'running' | 'paused' | 'stopped';
  started_at: string | null;
  ended_at: string | null;
  minimum_sample: number;
  baseline_rate: number | null;
  variant_rate: number | null;
  control_rate: number | null;
  lift: number | null;
  verdict: string | null;
  analysis_json: Record<string, unknown> | null;
}

export interface GrowthFinding {
  id: number;
  type: string;
  group_key: string;
  actionability: 'auto_fix' | 'needs_approval' | 'manual' | 'false_positive';
  entity_type: string;
  entity_id: number | null;
  url: string | null;
  severity: string;
  status: 'open' | 'ignored' | 'fixed' | 'regressed';
  occurrences: number;
  evidence_json: Record<string, unknown> | null;
  priority_score: number;
  impact_score: number | null;
  first_seen: string | null;
  last_seen: string | null;
}

export interface GrowthFindingGroup {
  group_key: string;
  actionability: string;
  findings: number;
  entities: number;
  severity: string;
}

export interface GrowthHealth {
  healthy: boolean;
  blockers: string[];
  warnings: string[];
  facts: {
    environment?: string;
    database?: string;
    database_host?: string;
    is_production?: boolean;
    last_event_at: string | null;
    last_order_at: string | null;
    events_24h: number;
    orders_24h: number;
    paid_orders_24h: number;
    missing_events: string[];
    event_counts_7d: Record<string, number>;
  };
  ga4?: {
    configured: boolean;
    property_id: string;
    measurement_id: string | null;
    events: Record<string, number>;
    missing_events: string[];
    platforms: Record<string, number>;
    likely_app_property: boolean;
    blockers: string[];
    warnings: string[];
  };
}

export interface GrowthTrendPoint {
  date: string;
  sessions: number;
  product_views: number;
  add_to_cart: number;
  checkout_started: number;
  purchases: number;
  revenue: number;
}

export interface GrowthProductRow {
  product_id: number;
  views: number;
  cart_adds: number;
  purchases: number;
  revenue: number;
  add_to_cart_rate: number | null;
}

export interface SearchGap {
  query: string;
  searches: number;
  zero_results: number;
  zero_result_rate: number | null;
  click_rate: number | null;
  last_seen: string | null;
}

export interface GrowthSummary {
  days: number;
  totals: {
    sessions: number;
    product_views: number;
    add_to_cart: number;
    checkout_started: number;
    purchases: number;
    revenue: number;
    conversion_rate: number | null;
    add_to_cart_rate: number | null;
    checkout_completion_rate: number | null;
    revenue_per_session: number | null;
  };
  daily: Array<Record<string, unknown>>;
  data_quality: GrowthHealth;
  conversion_metrics_trusted: boolean;
}

export interface SeoAgentIntegrations {
  values: {
    site_url: string;
    google_search_console_site: string;
    ga4_property_id: string;
    merchant_center_id: string;
    merchant_registration_account_id: string;
    merchant_developer_email: string;
    merchant_gcp_project_id: string;
    google_oauth_client_id: string;
    alert_email: string;
  };
  masked: {
    pagespeed_api_key: string | null;
    alert_slack_webhook: string | null;
    google_oauth_client_secret: string | null;
    service_account_email: string | null;
  };
  oauth: {
    redirect_uri: string;
    registered_at: string | null;
    status: string | null;
    error: string | null;
  };
  configured: {
    search_console: boolean;
    ga4: boolean;
    merchant_center: boolean;
    pagespeed: boolean;
    service_account: boolean;
    slack: boolean;
    email: boolean;
  };
}

export interface SeoAgentIntegrationUpdate {
  site_url?: string | null;
  google_search_console_site?: string | null;
  ga4_property_id?: string | null;
  merchant_center_id?: string | null;
  merchant_registration_account_id?: string | null;
  merchant_developer_email?: string | null;
  merchant_gcp_project_id?: string | null;
  google_oauth_client_id?: string | null;
  google_oauth_client_secret?: string | null;
  pagespeed_api_key?: string | null;
  google_service_account_json?: string | null;
  alert_email?: string | null;
  alert_slack_webhook?: string | null;
  clear_pagespeed_api_key?: boolean;
  clear_alert_slack_webhook?: boolean;
  clear_google_service_account?: boolean;
  clear_google_oauth_client_secret?: boolean;
}

export interface SeoAgentIntegrationTestResult {
  ok: boolean;
  rows?: number;
  result?: Record<string, unknown>;
}

export interface SeoAgentDashboard {
  last_run: SeoRun | null;
  recent_runs: SeoRun[];
  issues: {
    open_total: number;
    by_severity: Record<string, number>;
    by_tier: Record<string, number>;
  };
  changes: {
    applied: number;
    pending_verification: number;
    rolled_back: number;
  };
  proposals: {
    pending: number;
  };
  protected_entities: number;
  budget: {
    monthly_spend: number;
    monthly_budget: number;
    exceeded: boolean;
  };
  integrations: SeoIntegrationHealth;
  settings?: {
    enabled: boolean;
    dry_run: boolean;
    kill_switch: boolean;
    tier_1_enabled: boolean;
  };
  preflight?: {
    ready: boolean;
    blockers: string[];
    warnings: string[];
    facts: {
      environment: string;
      products: number;
      auto_fix_issues: number;
      mapped_auto_fix_issues: number;
      enabled: boolean;
      dry_run: boolean;
      tier_1_enabled: boolean;
      kill_switch: boolean;
    };
  };
  alerts?: Array<{
    id: number;
    decision: string;
    reason: string | null;
    input_json: Record<string, unknown> | null;
    created_at: string;
  }>;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface SeoCohortSummary {
  id: number;
  name: string;
  status: 'draft' | 'approved' | 'retired';
  window_from: string | null;
  window_to: string | null;
  target_size: number | null;
  members_count: number;
  approved_at: string | null;
}

export interface SeoCohortMember {
  entity_id: number;
  url: string;
  product_type: string;
  bucket: string;
  impressions: number;
  clicks: number;
  position: number;
  upside_clicks: number;
  rationale: string;
}

export interface SeoCohortDetail {
  cohort: SeoCohortSummary & {
    criteria: Record<string, unknown> | null;
    notes: string | null;
  };
  members: SeoCohortMember[];
}

export interface SeoCohortSideTotals {
  baseline_impressions: number;
  baseline_clicks: number;
  baseline_ctr: number;
  current_impressions: number;
  current_clicks: number;
  current_ctr: number;
  ctr_change: number;
}

export interface SeoCohortMeasurement {
  change_type: string;
  page_type: string;
  window_days: number;
  members: number;
  treated: SeoCohortSideTotals;
  control: SeoCohortSideTotals;
  net_effect: number;
  verdict: 'improved' | 'neutral' | 'worse' | 'insufficient_data';
  sufficient_volume: boolean;
  minimum_volume_impressions: number;
  effect_threshold: number;
  seasonality_note: string;
  member_sample: Array<{
    change_id: string;
    entity_id: number;
    field: string;
    baseline_impressions: number;
    current_impressions: number;
    control_entity_ids: number[];
  }>;
}

export interface SeoRolloutGate {
  gate: string;
  open: boolean;
  reasons: string[];
  [key: string]: unknown;
}

export interface SeoRolloutGates {
  gates: {
    drafts: SeoRolloutGate;
    automation: SeoRolloutGate;
    widen: SeoRolloutGate;
    stop: SeoRolloutGate;
  };
  must_halt: boolean;
}

export interface SeoWeeklyMetric {
  value: number | null;
  previous?: number | null;
  change_pct?: number | null;
  available: boolean;
  label?: string;
  reason?: string;
  improvement_direction?: 'lower_is_better';
}

export interface SeoWeeklyReport {
  window_days: number;
  from: string;
  to: string;
  metrics: {
    non_brand_clicks: SeoWeeklyMetric;
    non_brand_impressions: SeoWeeklyMetric;
    average_position: SeoWeeklyMetric;
    indexed_pages: SeoWeeklyMetric;
    revenue_per_organic_session: SeoWeeklyMetric;
  };
  data_quality: {
    has_query_data: boolean;
    note: string | null;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}
