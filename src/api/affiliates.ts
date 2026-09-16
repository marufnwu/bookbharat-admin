import api from './axios';
import {
  Affiliate,
  AffiliateCommission,
  AffiliateLiability,
  AffiliatePayout,
  AffiliatePerformanceRow,
  CommissionRule,
  CommissionStatus,
  PayoutStatus,
  AdminPaymentDetails,
} from '@/types/affiliate';

/**
 * Affiliate admin API. Canonical envelope unwrap per contract §1.5.
 * Errors throw — callers handle via try/catch + toast.
 */

/**
 * Thrown when the admin affiliate API returns `{success:false}`.
 * Carries per-field errors so callers can surface them under inputs.
 */
export class AffiliateApiError extends Error {
  public errors?: Record<string, string[]>;
  public status?: number;
  constructor(message: string, errors?: Record<string, string[]>, status?: number) {
    super(message);
    this.name = 'AffiliateApiError';
    this.errors = errors;
    this.status = status;
  }
}

export interface AffiliateCouponUpdate {
  discount_value: number;
  is_active?: boolean;
  expires_at?: string | null;
  starts_at?: string | null;
  minimum_order_amount?: number;
  maximum_discount_amount?: number | null;
  usage_limit?: number | null;
  usage_limit_per_customer?: number | null;
  first_order_only?: boolean;
  applicable_categories?: number[];
  excluded_categories?: number[];
}

export interface AffiliateCouponDetail extends AffiliateCouponUpdate {
  id: number;
  code: string;
  discount_value: number;
  is_active: boolean;
  expires_at: string | null;
  starts_at: string | null;
  minimum_order_amount: number;
  maximum_discount_amount: number | null;
  usage_limit: number | null;
  usage_limit_per_customer: number | null;
  usage_count: number;
  first_order_only: boolean;
  applicable_categories: number[];
  excluded_categories: number[];
}

/**
 * Per contract §2.3, financial mutations must send an Idempotency-Key.
 * Generate once per user action; reuse the same key on retry.
 * 40-char hex (20 random bytes).
 */
export function makeIdempotencyKey(): string {
  const bytes = new Uint8Array(20);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Wrap an idempotency key as axios request config. */
const idem = (key: string) => ({ headers: { 'Idempotency-Key': key } });

function unwrap<T>(res: { data: any; status?: number }): T {
  const body = res.data;
  if (body?.success === false) {
    throw new AffiliateApiError(body.message || 'API error', body.errors, res.status);
  }
  return body?.data as T;
}

function unwrapList<T>(res: { data: any; status?: number }): T[] {
  const body = res.data;
  if (body?.success === false) {
    throw new AffiliateApiError(body.message || 'API error', body.errors, res.status);
  }
  return (body?.data ?? []) as T[];
}

export const affiliatesApi = {
  // Affiliates
  list: (params: { status?: string; q?: string; page?: number; per_page?: number } = {}) =>
    api.get('/affiliates', { params }).then((res) => ({
      items: unwrapList<Affiliate>(res),
      meta: res.data?.meta,
    })),

  get: (id: number) =>
    api.get(`/affiliates/${id}`).then(unwrap<{ affiliate: Affiliate }>),

  approve: (id: number, reason?: string) =>
    api.post(`/affiliates/${id}/approve`, { reason }).then(unwrap<null>),

  reject: (id: number, reason: string) =>
    api.post(`/affiliates/${id}/reject`, { reason }).then(unwrap<null>),

  suspend: (id: number, reason: string) =>
    api.post(`/affiliates/${id}/suspend`, { reason }).then(unwrap<null>),

  block: (id: number, reason: string) =>
    api.post(`/affiliates/${id}/block`, { reason }).then(unwrap<null>),

  reactivate: (id: number, idempotencyKey?: string) =>
    api.post(`/affiliates/${id}/reactivate`, {}, idempotencyKey ? idem(idempotencyKey) : undefined).then(unwrap<{ affiliate: Affiliate }>),

  getPaymentDetails: (id: number) =>
    api.get(`/affiliates/${id}/payment-details`).then(unwrap<{ payment_details: AdminPaymentDetails }>),

  updateAffiliate: (id: number, data: Partial<Affiliate>) =>
    api.put(`/affiliates/${id}`, data).then(unwrap<{ affiliate: Affiliate }>),

  updateNote: (id: number, admin_note: string) =>
    api.put(`/affiliates/${id}/admin-note`, { admin_note }).then(unwrap<null>),

  getTrends: (id: number) =>
    api.get(`/affiliates/${id}/trends`).then(unwrap<any>),

  sendEmail: (id: number, subject: string, body: string) =>
    api.post(`/affiliates/${id}/send-email`, { subject, body }).then(unwrap<null>),

  updateCoupon: (id: number, payload: AffiliateCouponUpdate) =>
    api.put(`/affiliates/${id}/coupon`, payload).then(unwrap<any>),

  // Commission rules
  listRules: (params: { rule_type?: string } = {}) =>
    api.get('/commission-rules', { params }).then((res) => unwrap<{ rules: CommissionRule[] }>(res)),

  createRule: (data: Omit<CommissionRule, 'id' | 'created_by' | 'created_at'>) =>
    api.post('/commission-rules', data).then(unwrap<{ rule: CommissionRule }>),

  updateRule: (id: number, data: Partial<CommissionRule>) =>
    api.put(`/commission-rules/${id}`, data).then(unwrap<{ rule: CommissionRule }>),

  deleteRule: (id: number) =>
    api.delete(`/commission-rules/${id}`).then(unwrap<null>),

  // Commissions
  listCommissions: (params: { status?: CommissionStatus; affiliate_id?: number; page?: number; per_page?: number; start_date?: string; end_date?: string; q?: string } = {}) =>
    api.get('/commissions', { params }).then((res) => ({
      items: unwrapList<AffiliateCommission>(res),
      meta: res.data?.meta,
    })),

  approveCommission: (id: number, idempotencyKey?: string) =>
    api.post(`/commissions/${id}/approve`, {}, idempotencyKey ? idem(idempotencyKey) : undefined).then(unwrap<null>),

  rejectCommission: (id: number, reason: string, idempotencyKey?: string) =>
    api.post(`/commissions/${id}/reject`, { reason }, idempotencyKey ? idem(idempotencyKey) : undefined).then(unwrap<null>),

  holdCommission: (id: number, reason: string, idempotencyKey?: string) =>
    api.post(`/commissions/${id}/hold`, { reason }, idempotencyKey ? idem(idempotencyKey) : undefined).then(unwrap<null>),

  bulkApproveCommissions: (ids: number[], idempotencyKey: string) =>
    api.post('/commissions/bulk-approve', { ids }, idem(idempotencyKey)).then(unwrap<{ count: number }>),

  bulkRejectCommissions: (ids: number[], reason: string, idempotencyKey: string) =>
    api.post('/commissions/bulk-reject', { ids, reason }, idem(idempotencyKey)).then(unwrap<{ count: number }>),

  // Payouts
  listPayouts: (params: { status?: PayoutStatus; affiliate_id?: number; page?: number; per_page?: number; start_date?: string; end_date?: string } = {}) =>
    api.get('/payouts', { params }).then((res) => ({
      items: unwrapList<AffiliatePayout>(res),
      meta: res.data?.meta,
    })),

  processPayout: (id: number, transaction_reference: string, amount?: number, idempotencyKey?: string) =>
    api.post(`/payouts/${id}/process`, { transaction_reference, amount }, idempotencyKey ? idem(idempotencyKey) : undefined).then(unwrap<null>),

  rejectPayout: (id: number, reason: string, idempotencyKey?: string) =>
    api.post(`/payouts/${id}/reject`, { reason }, idempotencyKey ? idem(idempotencyKey) : undefined).then(unwrap<null>),

  bulkRejectPayouts: (ids: number[], reason: string, idempotencyKey: string) =>
    api.post('/payouts/bulk-reject', { ids, reason }, idem(idempotencyKey)).then(unwrap<{ count: number }>),

  bulkProcessPayouts: (ids: number[], transaction_reference: string, idempotencyKey: string) =>
    api.post('/payouts/bulk-process', { ids, transaction_reference }, idem(idempotencyKey)).then(unwrap<{ count: number }>),

  // Reports
  performanceReport: (params: { start_date?: string; end_date?: string; sort_by?: string; sort_direction?: string } = {}) =>
    api.get('/reports/affiliates/performance', { params })
      .then(unwrap<{ rows: AffiliatePerformanceRow[] }>),

  productsReport: () =>
    api.get('/reports/affiliates/products')
      .then(unwrap<{ rows: any[] }>),

  payoutsReport: (params: { status?: PayoutStatus } = {}) =>
    api.get('/reports/affiliates/payouts', { params })
      .then(unwrap<{ payouts: AffiliatePayout[] }>),

  liability: () =>
    api.get('/reports/affiliates/liability').then(unwrap<AffiliateLiability>),

  // Commission holds (fraud review queue)
  listHolds: (params: { reason_code?: string; page?: number; per_page?: number } = {}) =>
    api.get('/commission-holds', { params }).then((res) => ({
      items: unwrapList<any>(res),
      meta: res.data?.meta,
    })),

  resolveHold: (id: number, action: 'approve' | 'reject', reason?: string) =>
    api.post(`/commission-holds/${id}/resolve`, { action, reason }).then(unwrap<null>),

  // Commission detail (metadata drill-down)
  getCommission: (id: number) =>
    api.get(`/commissions/${id}`).then(unwrap<{ commission: any }>),

  // Clawbacks
  listAdjustments: (params: { affiliate_id?: number; adjustment_type?: string; page?: number; per_page?: number } = {}) =>
    api.get('/clawbacks', { params }).then((res) => ({
      items: unwrapList<any>(res),
      meta: res.data?.meta,
    })),

  listPendingClawbacks: (params: { affiliate_id?: number; page?: number; per_page?: number } = {}) =>
    api.get('/clawbacks/pending', { params }).then((res) => ({
      items: unwrapList<any>(res),
      meta: res.data?.meta,
      total_pending: res.data?.total_pending ?? 0,
    })),

  // Affiliate links
  listLinks: (params: { affiliate_id?: number; q?: string; page?: number; per_page?: number } = {}) =>
    api.get('/affiliate-links', { params }).then((res) => ({
      items: unwrapList<any>(res),
      meta: res.data?.meta,
    })),

  // Affiliate orders
  listAffiliateOrders: (params: { affiliate_id?: number; attribution_source?: string; status?: string; self_referral_blocked?: boolean; start_date?: string; end_date?: string; q?: string; page?: number; per_page?: number } = {}) =>
    api.get('/affiliate-orders', { params }).then((res) => ({
      items: unwrapList<any>(res),
      meta: res.data?.meta,
    })),

  affiliateOrderSummary: (affiliateId: number) =>
    api.get('/affiliate-orders/summary', { params: { affiliate_id: affiliateId } }).then(unwrap<any>),

  // Analytics
  analyticsClicks: (params: { days?: number } = {}) =>
    api.get('/affiliate-analytics/clicks', { params }).then(unwrap<any>),

  analyticsTopLinks: (params: { limit?: number } = {}) =>
    api.get('/affiliate-analytics/top-links', { params }).then(unwrap<{ links: any[] }>),

  analyticsTopProducts: (params: { limit?: number } = {}) =>
    api.get('/affiliate-analytics/top-products', { params }).then(unwrap<{ products: any[] }>),

  // Audit log
  listAuditLog: (params: { entity_type?: string; action?: string; user_id?: number; start_date?: string; end_date?: string; page?: number; per_page?: number } = {}) =>
    api.get('/affiliate-audit-log', { params }).then((res) => ({
      items: unwrapList<any>(res),
      meta: res.data?.meta,
    })),

  // Scheduled job monitor
  listJobRuns: () =>
    api.get('/job-runs').then(unwrap<{ jobs: any[] }>),

  triggerJob: (command: string) =>
    api.post('/job-runs/trigger', { command }).then(unwrap<any>),

  // Commission rule simulator
  simulateRule: (params: { product_id?: number; category_id?: number }) =>
    api.get('/commission-rules/simulate', { params }).then(unwrap<any>),

  resolveRates: (product_ids: number[]) =>
    api.get('/commission-rules/resolve', { params: { product_ids: product_ids.join(',') } })
      .then(unwrap<{ resolutions: Array<{ product_id: number; rate: number; rate_source: string }> }>),

  // Pickers for the commission-rule builder
  searchProducts: (search: string) =>
    api.get('/products', { params: { search: search || undefined, per_page: 10 } })
      .then((res) => ((res.data?.products?.data ?? res.data?.data ?? []) as any[])),

  listCategories: () =>
    api.get('/categories', { params: { per_page: 300 } })
      .then((res) => ((res.data?.data?.data ?? res.data?.data ?? []) as any[])),

  // Bulk rule creation (product rules only)
  bulkCreateRules: (payload: { product_ids: number[]; rate: number; is_active: boolean }) =>
    api.post('/commission-rules/bulk', payload).then(unwrap<{
      created_count: number;
      created_rule_ids: number[];
      skipped_count: number;
      skipped: Array<{ product_id: number; reason: string; existing_rule_id: number }>;
    }>),

  // Coverage analytics for the transparency strip
  ruleCoverage: () =>
    api.get('/commission-rules/coverage').then(unwrap<{
      total_enabled_products: number;
      explicit_rules_covered: number;
      custom_rate_products: number;
      uncovered_products: number;
      disabled_products: number;
      has_default_rule: boolean;
    }>),

  // PDF Reports
  downloadPerformancePdf: (params: { start_date?: string; end_date?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);
    const url = `${api.defaults.baseURL}/reports/affiliates/performance/pdf?${query.toString()}`;
    window.open(url, '_blank');
  },

  downloadAffiliatePdf: (id: number) => {
    const url = `${api.defaults.baseURL}/reports/affiliates/${id}/pdf`;
    window.open(url, '_blank');
  },
};

/** CSV formula-injection sanitizer (z.ai E10). */
export function sanitizeCsvCell(val: unknown): string {
  const s = val === null || val === undefined ? '' : String(val);
  if (/^[=+\-@\t\r]/.test(s)) return `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  const lines = [
    headers.map(sanitizeCsvCell).join(','),
    ...rows.map((row) => row.map(sanitizeCsvCell).join(',')),
  ];
  // BOM for UTF-8 detection in Excel
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
