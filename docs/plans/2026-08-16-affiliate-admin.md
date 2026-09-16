# BookBharat Admin Panel — Affiliate System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the admin panel pieces of the BookBharat Affiliate System: affiliate list + approval workflow, commission rules CRUD, commission review, payout processing, and affiliate performance reports — wired into existing patterns (Reviews, Coupons, OrderDetail, AnalyticsDashboard).

> **Binding contract:** This plan implements [`bookbharat-backend/docs/contracts/affiliate.md`](../../bookbharat-backend/docs/contracts/affiliate.md). When a step here and the contract disagree, the contract wins.

**Architecture:** New `AffiliateList`, `AffiliateDetail`, `CommissionRules`, `Commissions`, `Payouts`, `AffiliateReports` pages under `src/pages/Affiliates/`. New `affiliatesApi` module under `src/api/`. Touch points on `ProductEdit`, `Coupons`, `OrderSidebar` are **non-breaking additions** (new fields, not behavior changes). Reuses existing UI primitives, `useApiQuery`/`react-query`, recharts, and the dynamic-settings whitelist.

**Tech Stack:** React 19, TypeScript strict, CRA/CRACO, Tailwind, react-router-dom v7, react-query, zustand, recharts, axios, lucide-react icons.

**Companion docs:**
- PRD: [`bookbharat-backend/docs/affiliate.md`](../../bookbharat-backend/docs/affiliate.md)
- Backend plan: [`bookbharat-backend/docs/plans/2026-08-16-affiliate-backend.md`](../../bookbharat-backend/docs/plans/2026-08-16-affiliate-backend.md)
- Storefront plan: [`bookbharat-frontend/docs/plans/2026-08-16-affiliate-storefront.md`](../../bookbharat-frontend/docs/plans/2026-08-16-affiliate-storefront.md)

---

## Conventions Locked In (from existing codebase)

These are patterns already in use — every task below MUST follow them. No drift.

1. **API modules** live under `src/api/`. `axios.ts` exports the configured `api` instance with bearer interceptor. Per-entity CRUD lives in `extended.ts` or per-module files (`couponsApi`, `productsApi` etc.).
2. **Page organization**: `src/pages/<Entity>/<Page>.tsx` with sibling components in the same folder if needed. Index re-export from `index.ts`.
3. **Tables**: existing shadcn-style table components in `src/components/ui`. Reuse them.
4. **Forms**: react-hook-form + zod is the established pattern (look at `Publishers`, `Settings`).
5. **Confirm modals + reason input**: pattern in `Reviews/index.tsx` for approve/reject with reason.
6. **Sidebar nav**: single hardcoded array in `src/components/layout/Sidebar.tsx`. New items go in here.
7. **Routes**: registered in `src/App.tsx`. New pages mount under existing `AdminLayout`.
8. **Charts**: `recharts` already used in `AnalyticsDashboard.tsx`. Reuse the wrapper conventions there.
9. **Settings UI**: `DynamicSettings` component + `SETTINGS_GROUPS` whitelist in `src/constants/settings.ts`. To enable a new settings group, add its key to the whitelist.
10. **Timestamps / dates**: `Intl.DateTimeFormat('en-IN', ...)` or `date-fns`. Match what OrderDetail uses.

---

## File Structure

### New files
| Path | Responsibility |
|---|---|
| `src/api/affiliates.ts` | All admin-facing affiliate HTTP calls |
| `src/types/affiliate.ts` | Admin-facing TypeScript types (separate from storefront types) |
| `src/pages/Affiliates/AffiliateList.tsx` | Search/filter table + approve/reject/suspend/block modals |
| `src/pages/Affiliates/AffiliateDetail.tsx` | Profile + stats + tabs (orders/commissions/payouts/notes) |
| `src/pages/Affiliates/CommissionRules.tsx` | 3-tab CRUD: Default / Category / Product |
| `src/pages/Affiliates/Commissions.tsx` | Status tabs + row actions + bulk approve/reject |
| `src/pages/Affiliates/Payouts.tsx` | Process/reject modal + status tabs |
| `src/pages/Affiliates/AffiliateReports.tsx` | Performance table + product table + liability tile + CSV export |
| `src/pages/Affiliates/index.ts` | Re-exports for cleaner imports |
| `src/components/affiliate/StatBadge.tsx` | Status pill (affiliate + commission + payout variants) |
| `src/components/affiliate/ReasonModal.tsx` | Reusable confirm-with-reason modal (approve/reject/suspend/block) |
| `src/components/affiliate/ProcessPayoutModal.tsx` | Process payout modal: txn ref + amount |
| `src/components/affiliate/CommissionRuleModal.tsx` | Create/edit commission rule form |

### Modified files (NON-breaking additions only)
| Path | Change |
|---|---|
| `src/components/layout/Sidebar.tsx` | Add "Affiliates" nav group (5 items) |
| `src/App.tsx` | Register routes for new pages |
| `src/constants/settings.ts` | Add `'affiliate'` to `SETTINGS_GROUPS` whitelist |
| `src/api/index.ts` | Re-export `affiliatesApi` |
| `src/pages/Products/ProductEdit.tsx` | Add "Affiliate" section to product form |
| `src/pages/Coupons/index.tsx` | Show affiliate-linked badge on coupons with `affiliate_id` |
| `src/pages/Orders/OrderDetail/OrderSidebar.tsx` | Extend `ReferralCard` to show affiliate attribution |
| `src/types/index.ts` | Re-export from `affiliate.ts` |

---

# PHASE 1 — Foundation (types, API, badges, modal)

## Task 1.1: TypeScript types

**Files:**
- Create: `src/types/affiliate.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create affiliate types**

```typescript
// src/types/affiliate.ts

export type AffiliateStatus = 'pending' | 'active' | 'rejected' | 'suspended' | 'blocked';
export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'reversed' | 'on_hold';
// Payout states per contract §10.1: extended with under_review/processing/failed.
export type PayoutStatus = 'requested' | 'under_review' | 'processing' | 'paid' | 'failed' | 'rejected' | 'cancelled';
export type PayoutMethod = 'bank' | 'upi';
export type CommissionRuleType = 'default' | 'category' | 'product';
export type AttributionSource = 'coupon' | 'link';
export type EntityType = 'individual' | 'huf' | 'company' | 'firm';

export interface AffiliateBankDetails {
  account_number: string;
  ifsc: string;
  holder_name: string;
  bank_name: string;
}
export interface AffiliateUpiDetails { id: string }
export interface AffiliatePaymentDetails {
  bank?: AffiliateBankDetails;
  upi?: AffiliateUpiDetails;
  pan?: string;
  entity_type?: EntityType;
  gstin?: string;
}

export interface Affiliate {
  id: number;
  user_id: number;
  code: string;
  status: AffiliateStatus;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  how_promote?: string | null;
  payout_method: PayoutMethod;
  payment_details?: AffiliatePaymentDetails | null;
  pan?: string | null;       // already masked server-side
  entity_type?: EntityType | null;
  coupon?: {
    id: number;
    code: string;
    discount_value: number;
  } | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  rejected_at?: string | null;
  admin_note?: string | null;
  terms_accepted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AffiliateCommission {
  id: number;
  affiliate_id: number;
  affiliate_name?: string;
  order_id: number;
  order_number: string;
  product_id?: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  rate: number;
  amount: number;
  status: CommissionStatus;
  reason?: string | null;
  payout_id?: number | null;
  approved_at?: string | null;
  reversed_at?: string | null;
  created_at: string;
}

export interface AffiliatePayout {
  id: number;
  affiliate_id: number;
  affiliate_name?: string;
  request_number: string;
  amount_requested: number;
  amount_paid?: number | null;
  tds_amount?: number | null;
  amount_net?: number | null;
  method: PayoutMethod;
  payment_details?: AffiliatePaymentDetails | null;
  status: PayoutStatus;
  admin_note?: string | null;
  rejection_reason?: string | null;
  transaction_reference?: string | null;
  requested_at: string;
  processed_at?: string | null;
}

export interface CommissionRule {
  id: number;
  rule_type: CommissionRuleType;
  category_id?: number | null;
  product_id?: number | null;
  rate: number;
  is_active: boolean;
  created_by?: number | null;
  created_at: string;
}

export interface AffiliateLiability {
  outstanding_liability: number;
  pending: number;
  paid: number;
  total: number;
}

export interface AffiliatePerformanceRow {
  id: number;
  full_name: string;
  code: string;
  commission_earned: number;
  commission_paid: number;
  orders_count: number;
  sales_total: number;
  clicks_count: number;
}

export interface ProductPerformanceRow {
  id: number;
  name: string;
  commission_cost: number;
  units_sold: number;
  affiliate_count: number;
}
```

- [ ] **Step 2: Re-export from index**

Open `src/types/index.ts` and append:

```typescript
export * from './affiliate';
```

- [ ] **Step 3: Verify compile**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
```
Expected: no errors.

- [ ] **Step 4: Verify every financial mutation caller passes and reuses the same `Idempotency-Key` on retry**

Do not generate a new key automatically inside a catch/retry path. A retry of the same user action must reuse the original key.

- [ ] **Step 5: Commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
git add src/types/affiliate.ts src/types/index.ts
git commit -m "feat(affiliate): TypeScript types for admin affiliate pages"
```

---

## Task 1.2: API module

**Files:**
- Create: `src/api/affiliates.ts`
- Modify: `src/api/index.ts`

- [ ] **Step 1: Implement affiliatesApi**

```typescript
// src/api/affiliates.ts

import api from './axios';
import {
  Affiliate,
  AffiliateCommission,
  AffiliatePerformanceRow,
  AffiliatePayout,
  AffiliateLiability,
  CommissionRule,
  CommissionStatus,
  PayoutStatus,
  ProductPerformanceRow,
} from '@/types/affiliate';

/**
 * Canonical envelope unwrapper (contract §1.5).
 * Backend returns { success, message, data, errors, meta? }.
 * On success: returns data (with `meta` merged for paginated calls).
 * On error: throws AffiliateApiError carrying message + errors.
 */
function unwrap<T>(res: { data: any }): T {
  const body = res.data;
  if (body?.success === false) {
    const err = new Error(body.message || 'API error') as Error & {
      errors?: Record<string, string[]>;
    };
    err.errors = body.errors;
    throw err;
  }
  if (body?.meta) {
    return { ...(body.data ?? {}), meta: body.meta } as T;
  }
  return body?.data as T;
}

export class AffiliateApiError extends Error {
  constructor(message: string, public errors?: Record<string, string[]>, public status?: number) {
    super(message);
    this.name = 'AffiliateApiError';
  }
}

export const affiliatesApi = {
  // Affiliates
  list: (params: { status?: string; q?: string; page?: number; per_page?: number } = {}) =>
    api.get('/api/v1/admin/affiliates', { params }).then(unwrap<{ affiliates: Affiliate[]; meta?: any }>),

  get: (id: number) =>
    api.get(`/api/v1/admin/affiliates/${id}`).then(unwrap<{ affiliate: Affiliate }>),

  approve: (id: number, reason?: string) =>
    api.post(`/api/v1/admin/affiliates/${id}/approve`, { reason }).then(unwrap<null>),

  reject: (id: number, reason: string) =>
    api.post(`/api/v1/admin/affiliates/${id}/reject`, { reason }).then(unwrap<null>),

  suspend: (id: number, reason: string) =>
    api.post(`/api/v1/admin/affiliates/${id}/suspend`, { reason }).then(unwrap<null>),

  block: (id: number, reason: string) =>
    api.post(`/api/v1/admin/affiliates/${id}/block`, { reason }).then(unwrap<null>),

  updateNote: (id: number, admin_note: string) =>
    api.put(`/api/v1/admin/affiliates/${id}/admin-note`, { admin_note }).then(unwrap<null>),

  // Commission rules
  listRules: () =>
    api.get('/api/v1/admin/commission-rules').then(unwrap<{ rules: CommissionRule[] }>()),

  createRule: (data: Omit<CommissionRule, 'id' | 'created_by' | 'created_at'>) =>
    api.post('/api/v1/admin/commission-rules', data).then(unwrap<{ rule: CommissionRule }>),

  updateRule: (id: number, data: Partial<CommissionRule>) =>
    api.put(`/api/v1/admin/commission-rules/${id}`, data).then(unwrap<{ rule: CommissionRule }>),

  deleteRule: (id: number) =>
    api.delete(`/api/v1/admin/commission-rules/${id}`).then(unwrap<null>),

  // Commissions — supports `affiliate_id` filter (fixes z.ai C5).
  listCommissions: (params: { status?: CommissionStatus; affiliate_id?: number; page?: number; per_page?: number } = {}) =>
    api.get('/api/v1/admin/commissions', { params }).then(unwrap<{ commissions: AffiliateCommission[]; meta?: any }>),

  // Convenience endpoint for the affiliate detail page tabs (backend plan Task 1.6k Step 3).
  listForAffiliate: (affiliateId: number, params: { status?: CommissionStatus; page?: number; per_page?: number } = {}) =>
    api.get('/api/v1/admin/affiliate-commissions', { params: { affiliate_id: affiliateId, ...params } })
      .then(unwrap<{ commissions: AffiliateCommission[]; meta?: any }>),

  approveCommission: (id: number) =>
    api.post(`/api/v1/admin/commissions/${id}/approve`).then(unwrap<null>),

  rejectCommission: (id: number, reason: string) =>
    api.post(`/api/v1/admin/commissions/${id}/reject`, { reason }).then(unwrap<null>),

  holdCommission: (id: number, reason: string) =>
    api.post(`/api/v1/admin/commissions/${id}/hold`, { reason }).then(unwrap<null>),

  bulkApproveCommissions: (ids: number[], idempotencyKey: string) =>
    api.post('/api/v1/admin/commissions/bulk-approve', { ids }, idem(idempotencyKey)).then(unwrap<{ count: number }>),

  bulkRejectCommissions: (ids: number[], reason: string, idempotencyKey: string) =>
    api.post('/api/v1/admin/commissions/bulk-reject', { ids, reason }, idem(idempotencyKey)).then(unwrap<{ count: number }>),

  // Payouts — supports `affiliate_id` filter.
  listPayouts: (params: { status?: PayoutStatus; affiliate_id?: number; page?: number; per_page?: number } = {}) =>
    api.get('/api/v1/admin/payouts', { params }).then(unwrap<{ payouts: AffiliatePayout[]; meta?: any }>),

  listPayoutsForAffiliate: (affiliateId: number, params: { status?: PayoutStatus; page?: number; per_page?: number } = {}) =>
    api.get('/api/v1/admin/affiliate-payouts', { params: { affiliate_id: affiliateId, ...params } })
      .then(unwrap<{ payouts: AffiliatePayout[]; meta?: any }>),

  processPayout: (id: number, transaction_reference: string, amount?: number) =>
    api.post(`/api/v1/admin/payouts/${id}/process`, { transaction_reference, amount }).then(unwrap<null>),

  rejectPayout: (id: number, reason: string) =>
    api.post(`/api/v1/admin/payouts/${id}/reject`, { reason }).then(unwrap<null>),

  // Reports
  performanceReport: (params: { start_date?: string; end_date?: string } = {}) =>
    api.get('/api/v1/admin/reports/affiliates/performance', { params }).then(unwrap<{ rows: AffiliatePerformanceRow[] }>()),

  productsReport: () =>
    api.get('/api/v1/admin/reports/affiliates/products').then(unwrap<{ rows: ProductPerformanceRow[] }>()),

  payoutsReport: (params: { status?: PayoutStatus } = {}) =>
    api.get('/api/v1/admin/reports/affiliates/payouts', { params }).then(unwrap<{ payouts: AffiliatePayout[] }>()),

  liability: () =>
    api.get('/api/v1/admin/reports/affiliates/liability').then(unwrap<AffiliateLiability>()),
};

/**
 * Financial mutations MUST send the same Idempotency-Key when a request is retried.
 * The key is generated by the UI action and passed into the axios request headers.
 */
export function makeIdempotencyKey(): string {
  const bytes = new Uint8Array(20);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

const idem = (key: string) => ({ headers: { 'Idempotency-Key': key } });

// Every financial mutation below accepts an explicit key. Callers persist/reuse the key
// for retries instead of silently generating a new key after a failed request.
- [ ] **Step 2: Re-export from `src/api/index.ts`**

Open `src/api/index.ts`. Append:

```typescript
export { affiliatesApi } from './affiliates';
```

- [ ] **Step 3: Verify compile**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
git add src/api/affiliates.ts src/api/index.ts
git commit -m "feat(affiliate): admin API module"
```

---

## Task 1.3: Status badges

**Files:**
- Create: `src/components/affiliate/StatBadge.tsx`

- [ ] **Step 1: Implement StatBadge**

```tsx
// src/components/affiliate/StatBadge.tsx

import { cn } from '@/lib/utils';
import { AffiliateStatus, CommissionStatus, PayoutStatus } from '@/types/affiliate';

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'outline';

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  default: 'bg-primary text-primary-foreground',
  success: 'bg-green-600 text-white',
  warning: 'bg-amber-500 text-white',
  destructive: 'bg-red-600 text-white',
  outline: 'border border-border text-foreground bg-background',
};

function Pill({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        VARIANT_CLASS[variant]
      )}
    >
      {children}
    </span>
  );
}

function affiliateStatusVariant(s: AffiliateStatus): BadgeVariant {
  switch (s) {
    case 'active': return 'success';
    case 'pending': return 'warning';
    case 'rejected':
    case 'suspended':
    case 'blocked': return 'destructive';
    default: return 'outline';
  }
}

function commissionStatusVariant(s: CommissionStatus): BadgeVariant {
  switch (s) {
    case 'approved': return 'success';
    case 'paid': return 'default';
    case 'pending':
    case 'on_hold': return 'warning';
    case 'reversed': return 'destructive';
    default: return 'outline';
  }
}

function payoutStatusVariant(s: PayoutStatus): BadgeVariant {
  switch (s) {
    case 'paid': return 'success';
    case 'requested':
    case 'under_review':
    case 'processing': return 'warning';
    case 'failed':
    case 'rejected':
    case 'cancelled': return 'destructive';
    default: return 'outline';
  }
}

export function AffiliateStatusBadge({ status }: { status: AffiliateStatus }) {
  return <Pill variant={affiliateStatusVariant(status)}>{status}</Pill>;
}

export function CommissionStatusBadge({ status }: { status: CommissionStatus }) {
  return <Pill variant={commissionStatusVariant(status)}>{status.replace('_', ' ')}</Pill>;
}

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return <Pill variant={payoutStatusVariant(status)}>{status}</Pill>;
}
```

- [ ] **Step 2: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/components/affiliate/StatBadge.tsx
git commit -m "feat(affiliate): status badge components"
```

---

## Task 1.4: ReasonModal (reusable confirm-with-reason)

**Files:**
- Create: `src/components/affiliate/ReasonModal.tsx`

- [ ] **Step 1: Implement ReasonModal**

```tsx
// src/components/affiliate/ReasonModal.tsx

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  reasonLabel?: string;
  reasonRequired?: boolean;
  confirmLabel: string;
  confirmVariant?: 'default' | 'destructive';
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

export function ReasonModal({
  open, title, description,
  reasonLabel = 'Reason', reasonRequired = false,
  confirmLabel, confirmVariant = 'default',
  onClose, onConfirm,
}: Props) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (reasonRequired && !reason.trim()) {
      setError('Reason is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <div>
          <label className="text-sm font-medium">{reasonLabel}{reasonRequired && ' *'}</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={reasonRequired ? 'Required' : 'Optional'}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/components/affiliate/ReasonModal.tsx
git commit -m "feat(affiliate): reusable ReasonModal for admin actions"
```

---

# PHASE 2 — Affiliate list + detail

## Task 2.1: AffiliateList page

**Files:**
- Create: `src/pages/Affiliates/AffiliateList.tsx`
- Create: `src/pages/Affiliates/index.ts`

- [ ] **Step 1: Implement AffiliateList**

```tsx
// src/pages/Affiliates/AffiliateList.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { affiliatesApi } from '@/api/affiliates';
import { Affiliate, AffiliateStatus } from '@/types/affiliate';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AffiliateStatusBadge } from '@/components/affiliate/StatBadge';
import { ReasonModal } from '@/components/affiliate/ReasonModal';
import { Search, CheckCircle, XCircle, Pause, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_TABS: { key: AffiliateStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'blocked', label: 'Blocked' },
];

export function AffiliateList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AffiliateStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<
    | { kind: 'reject' | 'suspend' | 'block'; affiliate: Affiliate }
    | null
  >(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['affiliates', tab, search, page],
    queryFn: () =>
      affiliatesApi.list({
        status: tab === 'all' ? undefined : tab,
        q: search || undefined,
        page,
        per_page: 20,
      }),
  });

  async function handleApprove(a: Affiliate) {
    try {
      await affiliatesApi.approve(a.id);
      toast.success('Affiliate approved');
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed');
    }
  }

  async function handleModalConfirm(reason: string) {
    if (!modal) return;
    try {
      if (modal.kind === 'reject') await affiliatesApi.reject(modal.affiliate.id, reason);
      if (modal.kind === 'suspend') await affiliatesApi.suspend(modal.affiliate.id, reason);
      if (modal.kind === 'block') await affiliatesApi.block(modal.affiliate.id, reason);
      toast.success('Action completed');
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed');
      throw e;     // keep modal open on error
    }
  }

  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Affiliates</h1>
      </header>

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, code..."
            className="pl-8"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-48"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Loading…</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">No affiliates in this view.</TableCell>
              </TableRow>
            ) : (
              rows.map((a) => (
                <TableRow
                  key={a.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/affiliates/${a.id}`)}
                >
                  <TableCell className="font-medium">{a.full_name}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell className="font-mono text-xs">{a.code}</TableCell>
                  <TableCell><AffiliateStatusBadge status={a.status} /></TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {a.status === 'pending' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleApprove(a)} aria-label="Approve">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setModal({ kind: 'reject', affiliate: a })} aria-label="Reject">
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {a.status === 'active' && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setModal({ kind: 'suspend', affiliate: a })} aria-label="Suspend">
                            <Pause className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setModal({ kind: 'block', affiliate: a })} aria-label="Block">
                            <Ban className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {meta && meta.last_page > 1 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline" size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <Button
            variant="outline" size="sm"
            disabled={page >= meta.last_page}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {modal && (
        <ReasonModal
          open
          title={
            modal.kind === 'reject' ? `Reject ${modal.affiliate.full_name}?` :
            modal.kind === 'suspend' ? `Suspend ${modal.affiliate.full_name}?` :
            `Block ${modal.affiliate.full_name}?`
          }
          description={
            modal.kind === 'reject'
              ? 'They can reapply 30 days after rejection.'
              : 'You can change this from the affiliate detail page.'
          }
          reasonRequired
          confirmLabel={
            modal.kind === 'reject' ? 'Reject' :
            modal.kind === 'suspend' ? 'Suspend' :
            'Block'
          }
          confirmVariant="destructive"
          onClose={() => setModal(null)}
          onConfirm={handleModalConfirm}
        />
      )}
    </div>
  );
}

export default AffiliateList;
```

- [ ] **Step 2: Implement index re-export**

```typescript
// src/pages/Affiliates/index.ts
export { default as AffiliateList } from './AffiliateList';
export { default as AffiliateDetail } from './AffiliateDetail';
export { default as CommissionRules } from './CommissionRules';
export { default as Commissions } from './Commissions';
export { default as Payouts } from './Payouts';
export { default as AffiliateReports } from './AffiliateReports';
```

(Note: Other components are referenced here for forward compatibility — they'll be created in following tasks.)

- [ ] **Step 3: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/pages/Affiliates/AffiliateList.tsx src/pages/Affiliates/index.ts
git commit -m "feat(affiliate): AffiliateList with status tabs, search, and approval actions"
```

---

## Task 2.2: AffiliateDetail page

**Files:**
- Create: `src/pages/Affiliates/AffiliateDetail.tsx`

- [ ] **Step 1: Implement AffiliateDetail**

```tsx
// src/pages/Affiliates/AffiliateDetail.tsx

'use client';

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { affiliatesApi } from '@/api/affiliates';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AffiliateStatusBadge, CommissionStatusBadge, PayoutStatusBadge } from '@/components/affiliate/StatBadge';
import { ReasonModal } from '@/components/affiliate/ReasonModal';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';          // adjust if your util is elsewhere
import { ArrowLeft } from 'lucide-react';

type ModalKind = 'reject' | 'suspend' | 'block';

export function AffiliateDetail() {
  const { id } = useParams<{ id: string }>();
  const affiliateId = Number(id);

  const [note, setNote] = useState('');
  const [modal, setModal] = useState<{ kind: ModalKind } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['affiliate', affiliateId],
    queryFn: () => affiliatesApi.get(affiliateId),
    enabled: !!affiliateId,
  });

  const { data: commissions } = useQuery({
    queryKey: ['affiliate-commissions', affiliateId],
    // Filter by affiliate_id to prevent showing all affiliates' commissions (z.ai C5 fix).
    queryFn: () => affiliatesApi.listForAffiliate(affiliateId, { per_page: 50 }),
    enabled: !!affiliateId,
  });

  const { data: payouts } = useQuery({
    queryKey: ['affiliate-payouts', affiliateId],
    // Filter by affiliate_id to prevent showing all affiliates' payouts (z.ai C5 fix).
    queryFn: () => affiliatesApi.listPayoutsForAffiliate(affiliateId),
    enabled: !!affiliateId,
  });

  async function saveNote() {
    try {
      await affiliatesApi.updateNote(affiliateId, note);
      toast.success('Note saved');
      refetch();
    } catch (e: any) {
      toast.error('Failed to save note');
    }
  }

  async function handleModal(reason: string) {
    if (!modal) return;
    try {
      if (modal.kind === 'reject') await affiliatesApi.reject(affiliateId, reason);
      if (modal.kind === 'suspend') await affiliatesApi.suspend(affiliateId, reason);
      if (modal.kind === 'block') await affiliatesApi.block(affiliateId, reason);
      toast.success('Action completed');
      refetch();
    } catch (e: any) {
      toast.error('Action failed');
      throw e;
    }
  }

  if (isLoading || !data) return <p className="text-sm text-muted-foreground p-6">Loading…</p>;
  const a = data.affiliate;

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <Link to="/affiliates"><Button variant="ghost" size="icon" aria-label="Back"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{a.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {a.email} · Code <span className="font-mono">{a.code}</span> ·{' '}
            <AffiliateStatusBadge status={a.status} />
          </p>
        </div>
        <div className="flex gap-2">
          {a.status === 'pending' && (
            <>
              <Button onClick={async () => { await affiliatesApi.approve(affiliateId); toast.success('Approved'); refetch(); }}>Approve</Button>
              <Button variant="destructive" onClick={() => setModal({ kind: 'reject' })}>Reject</Button>
            </>
          )}
          {a.status === 'active' && (
            <>
              <Button variant="outline" onClick={() => setModal({ kind: 'suspend' })}>Suspend</Button>
              <Button variant="destructive" onClick={() => setModal({ kind: 'block' })}>Block</Button>
            </>
          )}
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-3">
        <Card className="p-4 md:col-span-2">
          <h3 className="font-medium mb-3">Profile</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Phone</dt><dd>{a.phone}</dd></div>
            <div><dt className="text-muted-foreground">Joined</dt><dd>{new Date(a.created_at).toLocaleDateString('en-IN')}</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">Address</dt><dd>{a.address}</dd></div>
            <div><dt className="text-muted-foreground">Payout method</dt><dd>{a.payout_method.toUpperCase()}</dd></div>
            <div><dt className="text-muted-foreground">PAN</dt><dd>{a.pan ?? '—'}</dd></div>
            <div><dt className="text-muted-foreground">Entity type</dt><dd>{a.entity_type ?? '—'}</dd></div>
            <div><dt className="text-muted-foreground">Coupon</dt><dd>{a.coupon ? <code className="font-mono">{a.coupon.code}</code> : '—'}</dd></div>
          </dl>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-3">Admin notes</h3>
          <Textarea
            value={note || a.admin_note || ''}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            placeholder="Internal notes (not visible to affiliate)"
          />
          <Button onClick={saveNote} className="mt-2" size="sm">Save note</Button>
        </Card>
      </div>

      <Tabs defaultValue="commissions">
        <TabsList>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="commissions">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(commissions?.data ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.order_number}</TableCell>
                    <TableCell>{c.product_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.amount)}</TableCell>
                    <TableCell>{c.rate}%</TableCell>
                    <TableCell><CommissionStatusBadge status={c.status} /></TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="payouts">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">TDS</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payouts?.data ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.request_number}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.amount_requested)}</TableCell>
                    <TableCell className="text-right">{p.tds_amount != null ? formatCurrency(p.tds_amount) : '—'}</TableCell>
                    <TableCell className="text-right">{p.amount_net != null ? formatCurrency(p.amount_net) : '—'}</TableCell>
                    <TableCell><PayoutStatusBadge status={p.status} /></TableCell>
                    <TableCell>{new Date(p.requested_at).toLocaleDateString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {modal && (
        <ReasonModal
          open
          title={
            modal.kind === 'reject' ? 'Reject application' :
            modal.kind === 'suspend' ? 'Suspend affiliate' :
            'Block affiliate'
          }
          reasonRequired
          confirmLabel={modal.kind[0].toUpperCase() + modal.kind.slice(1)}
          confirmVariant="destructive"
          onClose={() => setModal(null)}
          onConfirm={handleModal}
        />
      )}
    </div>
  );
}

export default AffiliateDetail;
```

- [ ] **Step 2: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/pages/Affiliates/AffiliateDetail.tsx
git commit -m "feat(affiliate): AffiliateDetail with tabs, actions, and admin notes"
```

---

# PHASE 3 — Commission rules

## Task 3.1: CommissionRuleModal

**Files:**
- Create: `src/components/affiliate/CommissionRuleModal.tsx`

- [ ] **Step 1: Implement CommissionRuleModal**

```tsx
// src/components/affiliate/CommissionRuleModal.tsx

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { affiliatesApi } from '@/api/affiliates';
import { CommissionRule, CommissionRuleType } from '@/types/affiliate';
import { toast } from 'sonner';

const schema = z.object({
  rule_type: z.enum(['default', 'category', 'product']),
  category_id: z.string().optional(),
  product_id: z.string().optional(),
  rate: z.coerce.number().min(0).max(100),
  is_active: z.boolean(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  rule?: CommissionRule | null;
  categories: Array<{ id: number; name: string }>;
  products: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSaved: () => void;
}

export function CommissionRuleModal({ open, rule, categories, products, onClose, onSaved }: Props) {
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        rule_type: 'default',
        rate: 4,
        is_active: true,
      },
    });

  useEffect(() => {
    if (rule) {
      reset({
        rule_type: rule.rule_type,
        category_id: rule.category_id?.toString() ?? '',
        product_id: rule.product_id?.toString() ?? '',
        rate: rule.rate,
        is_active: rule.is_active,
      });
    } else {
      reset({ rule_type: 'default', rate: 4, is_active: true, category_id: '', product_id: '' });
    }
  }, [rule, reset]);

  const ruleType = watch('rule_type');

  async function onSubmit(values: FormData) {
    try {
      const payload = {
        rule_type: values.rule_type,
        rate: values.rate,
        is_active: values.is_active,
        category_id: values.rule_type === 'category' && values.category_id ? Number(values.category_id) : null,
        product_id: values.rule_type === 'product' && values.product_id ? Number(values.product_id) : null,
      };
      if (rule) {
        await affiliatesApi.updateRule(rule.id, payload);
        toast.success('Rule updated');
      } else {
        await affiliatesApi.createRule(payload as any);
        toast.success('Rule created');
      }
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit' : 'New'} Commission Rule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Rule type</label>
            <select {...register('rule_type')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="default">Default (applies to all products)</option>
              <option value="category">Category</option>
              <option value="product">Product</option>
            </select>
          </div>

          {ruleType === 'category' && (
            <div>
              <label className="text-sm font-medium">Category</label>
              <select {...register('category_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="">Select category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category_id && <p className="text-xs text-red-500">Required</p>}
            </div>
          )}

          {ruleType === 'product' && (
            <div>
              <label className="text-sm font-medium">Product</label>
              <select {...register('product_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="">Select product…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.product_id && <p className="text-xs text-red-500">Required</p>}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Commission rate (%)</label>
            <Input type="number" step="0.01" {...register('rate')} />
            <p className="text-xs text-muted-foreground mt-1">0% means the product is excluded.</p>
            {errors.rate && <p className="text-xs text-red-500">0–100 required</p>}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('is_active')} />
            <span>Active</span>
          </label>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : rule ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/components/affiliate/CommissionRuleModal.tsx
git commit -m "feat(affiliate): CommissionRuleModal form"
```

---

## Task 3.2: CommissionRules page

**Files:**
- Create: `src/pages/Affiliates/CommissionRules.tsx`

- [ ] **Step 1: Implement CommissionRules**

```tsx
// src/pages/Affiliates/CommissionRules.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { affiliatesApi } from '@/api/affiliates';
import { categoriesApi } from '@/api/categories';     // existing module — verify path in your codebase
import { productsApi } from '@/api/products';         // existing module — verify path
import { CommissionRule, CommissionRuleType } from '@/types/affiliate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { CommissionRuleModal } from '@/components/affiliate/CommissionRuleModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TABS: { key: CommissionRuleType; label: string }[] = [
  { key: 'default', label: 'Default' },
  { key: 'category', label: 'Category' },
  { key: 'product', label: 'Product' },
];

export function CommissionRules() {
  const [tab, setTab] = useState<CommissionRuleType>('default');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CommissionRule | null>(null);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['commission-rules'],
    queryFn: () => affiliatesApi.listRules(),
  });

  // Use existing admin API modules (NOT raw fetch — kimi Conflict D, z.ai S1).
  // Replace these import paths with the actual module names from your admin src/api/.
  const { data: catsResp } = useQuery({
    queryKey: ['categories-list'],
    queryFn: () => categoriesApi.list({ per_page: 200 }),
  });
  const { data: prodsResp } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsApi.list({ per_page: 200 }),
  });

  const categories = (catsResp?.data ?? []) as Array<{ id: number; name: string }>;
  const products = (prodsResp?.data ?? []) as Array<{ id: number; name: string }>;

  const filtered = (data?.rules ?? []).filter((r) => r.rule_type === tab);

  async function handleDelete(id: number) {
    if (!confirm('Delete this rule?')) return;
    try {
      await affiliatesApi.deleteRule(id);
      toast.success('Rule deleted');
      refetch();
    } catch {
      toast.error('Failed');
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Commission Rules</h1>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New rule
        </Button>
      </header>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No {tab} rules. Click "New rule" to add one.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.rule_type === 'default' && 'All products (default)'}
                    {r.rule_type === 'category' && `Category #${r.category_id}`}
                    {r.rule_type === 'product' && `Product #${r.product_id}`}
                  </TableCell>
                  <TableCell className="text-right">{r.rate}%</TableCell>
                  <TableCell>{r.is_active ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setModalOpen(true); }} aria-label="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CommissionRuleModal
        open={modalOpen}
        rule={editing}
        categories={categories}
        products={products}
        onClose={() => setModalOpen(false)}
        onSaved={refetch}
      />
    </div>
  );
}

export default CommissionRules;
```

> **Import paths:** `categoriesApi` and `productsApi` must come from existing admin modules under `src/api/`. If they don't exist yet, create them following the same shape as `affiliatesApi` (object exporting `list`/CRUD methods, using `api` axios instance). NEVER use raw `fetch()` here — it bypasses the auth interceptor.

- [ ] **Step 2: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/pages/Affiliates/CommissionRules.tsx
git commit -m "feat(affiliate): CommissionRules page with tabs and CRUD modal"
```

---

# PHASE 4 — Commissions

## Task 4.1: Commissions page with bulk actions

**Files:**
- Create: `src/pages/Affiliates/Commissions.tsx`

- [ ] **Step 1: Implement Commissions**

```tsx
// src/pages/Affiliates/Commissions.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { affiliatesApi } from '@/api/affiliates';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { CommissionStatusBadge } from '@/components/affiliate/StatBadge';
import { ReasonModal } from '@/components/affiliate/ReasonModal';
import { CommissionStatus } from '@/types/affiliate';
import { CheckCircle, XCircle, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

const TABS: { key: CommissionStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
  { key: 'on_hold', label: 'On Hold' },
  { key: 'reversed', label: 'Reversed' },
];

export function Commissions() {
  const [tab, setTab] = useState<CommissionStatus | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<{ kind: 'reject' | 'hold'; singleId?: number } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-commissions', tab, page],
    queryFn: () =>
      affiliatesApi.listCommissions({
        status: tab === 'all' ? undefined : tab,
        page,
        per_page: 25,
      }),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggle(id: number, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }

  function toggleAll(on: boolean) {
    setSelected(on ? new Set(rows.map((r) => r.id)) : new Set());
  }

  async function bulkApprove() {
    if (selected.size === 0) return;
    try {
      const res = await affiliatesApi.bulkApproveCommissions([...selected]);
      toast.success(`${res?.data?.count ?? selected.size} approved`);
      setSelected(new Set());
      refetch();
    } catch {
      toast.error('Bulk approve failed');
    }
  }

  async function handleModalConfirm(reason: string) {
    if (!modal) return;
    try {
      if (modal.kind === 'reject') {
        if (modal.singleId) {
          await affiliatesApi.rejectCommission(modal.singleId, reason);
        } else {
          await affiliatesApi.bulkRejectCommissions([...selected], reason);
          setSelected(new Set());
        }
      } else if (modal.kind === 'hold' && modal.singleId) {
        await affiliatesApi.holdCommission(modal.singleId, reason);
      }
      toast.success('Action completed');
      refetch();
    } catch {
      toast.error('Failed');
      throw e;
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Commissions</h1>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <>
              <Button onClick={bulkApprove} size="sm">
                <CheckCircle className="h-4 w-4 mr-1" /> Approve ({selected.size})
              </Button>
              <Button onClick={() => setModal({ kind: 'reject' })} variant="destructive" size="sm">
                <XCircle className="h-4 w-4 mr-1" /> Reject ({selected.size})
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); setSelected(new Set()); }}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(v) => toggleAll(!!v)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Affiliate</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-6 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-6 text-sm text-muted-foreground">No commissions.</TableCell></TableRow>
            ) : (
              rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(c.id)}
                      onCheckedChange={(v) => toggle(c.id, !!v)}
                      aria-label={`Select commission ${c.id}`}
                    />
                  </TableCell>
                  <TableCell>{c.affiliate_name ?? `#${c.affiliate_id}`}</TableCell>
                  <TableCell className="font-mono text-xs">{c.order_number}</TableCell>
                  <TableCell>{c.product_name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.amount)}</TableCell>
                  <TableCell>{c.rate}%</TableCell>
                  <TableCell><CommissionStatusBadge status={c.status} /></TableCell>
                  <TableCell>{new Date(c.created_at).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      {(c.status === 'pending' || c.status === 'on_hold') && (
                        <>
                          <Button
                            size="icon" variant="ghost"
                            aria-label="Approve"
                            onClick={async () => { try { await affiliatesApi.approveCommission(c.id); toast.success('Approved'); refetch(); } catch { toast.error('Failed'); } }}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          {c.status === 'pending' && (
                            <Button
                              size="icon" variant="ghost" aria-label="Hold"
                              onClick={() => setModal({ kind: 'hold', singleId: c.id })}
                            >
                              <Flag className="h-4 w-4 text-amber-600" />
                            </Button>
                          )}
                        </>
                      )}
                      {(c.status === 'pending' || c.status === 'on_hold' || c.status === 'approved') && (
                        <Button
                          size="icon" variant="ghost" aria-label="Reject"
                          onClick={() => setModal({ kind: 'reject', singleId: c.id })}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {meta && meta.last_page > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">Page {meta.current_page} of {meta.last_page}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {modal && (
        <ReasonModal
          open
          title={modal.kind === 'hold' ? 'Hold commission for review' : 'Reject commission(s)'}
          description={modal.singleId ? 'Rejecting this single commission.' : `Rejecting ${selected.size} commissions in bulk.`}
          reasonRequired
          confirmLabel={modal.kind === 'hold' ? 'Hold' : 'Reject'}
          confirmVariant="destructive"
          onClose={() => setModal(null)}
          onConfirm={handleModalConfirm}
        />
      )}
    </div>
  );
}

export default Commissions;
```

- [ ] **Step 2: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/pages/Affiliates/Commissions.tsx
git commit -m "feat(affiliate): Commissions page with bulk approve/reject"
```

---

# PHASE 5 — Payouts

## Task 5.1: ProcessPayoutModal

**Files:**
- Create: `src/components/affiliate/ProcessPayoutModal.tsx`

- [ ] **Step 1: Implement ProcessPayoutModal**

```tsx
// src/components/affiliate/ProcessPayoutModal.tsx

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { affiliatesApi } from '@/api/affiliates';
import { AffiliatePayout } from '@/types/affiliate';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  payout: AffiliatePayout;
  onClose: () => void;
  onProcessed: () => void;
}

export function ProcessPayoutModal({ open, payout, onClose, onProcessed }: Props) {
  const [txnRef, setTxnRef] = useState('');
  const [amount, setAmount] = useState(payout.amount_requested.toString());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!txnRef.trim()) {
      setError('Transaction reference is required');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await affiliatesApi.processPayout(payout.id, txnRef, parseFloat(amount) || undefined);
      toast.success('Payout processed');
      onProcessed();
      onClose();
      setTxnRef('');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Payout {payout.request_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Requested:</span>
            <span>{formatCurrency(payout.amount_requested)}</span>
          </div>
          {payout.tds_amount != null && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TDS:</span>
                <span>{formatCurrency(payout.tds_amount)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Net payable:</span>
                <span>{formatCurrency(payout.amount_net ?? 0)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Method:</span>
            <span>{payout.method.toUpperCase()}</span>
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <div>
            <label className="text-sm font-medium">Transaction reference *</label>
            <Input
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
              placeholder="UPI ref / bank transaction ID"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Amount paid (gross)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Defaults to the requested amount. Adjust if you paid a different amount.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Processing…' : 'Mark as paid'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/components/affiliate/ProcessPayoutModal.tsx
git commit -m "feat(affiliate): ProcessPayoutModal with TDS breakdown"
```

---

## Task 5.2: Payouts page

**Files:**
- Create: `src/pages/Affiliates/Payouts.tsx`

- [ ] **Step 1: Implement Payouts**

```tsx
// src/pages/Affiliates/Payouts.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { affiliatesApi } from '@/api/affiliates';
import { AffiliatePayout, PayoutStatus } from '@/types/affiliate';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PayoutStatusBadge } from '@/components/affiliate/StatBadge';
import { ProcessPayoutModal } from '@/components/affiliate/ProcessPayoutModal';
import { ReasonModal } from '@/components/affiliate/ReasonModal';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';

const TABS: { key: PayoutStatus | 'all'; label: string }[] = [
  { key: 'requested', label: 'Pending' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'processing', label: 'Processing' },
  { key: 'paid', label: 'Processed' },
  { key: 'failed', label: 'Failed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
];

export function Payouts() {
  const [tab, setTab] = useState<PayoutStatus | 'all'>('requested');
  const [page, setPage] = useState(1);
  const [processing, setProcessing] = useState<AffiliatePayout | null>(null);
  const [rejecting, setRejecting] = useState<AffiliatePayout | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-payouts', tab, page],
    queryFn: () =>
      affiliatesApi.listPayouts({
        status: tab === 'all' ? undefined : tab,
        page,
        per_page: 25,
      }),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;

  async function handleReject(reason: string) {
    if (!rejecting) return;
    try {
      await affiliatesApi.rejectPayout(rejecting.id, reason);
      toast.success('Payout rejected');
      refetch();
    } catch {
      toast.error('Failed');
      throw e;
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Payouts</h1>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request #</TableHead>
              <TableHead>Affiliate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">TDS</TableHead>
              <TableHead className="text-right">Net</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-6 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-6 text-sm text-muted-foreground">No payouts.</TableCell></TableRow>
            ) : (
              rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.request_number}</TableCell>
                  <TableCell>{p.affiliate_name ?? `#${p.affiliate_id}`}</TableCell>
                  <TableCell className="text-right">{formatCurrency(p.amount_requested)}</TableCell>
                  <TableCell className="text-right">{p.tds_amount != null ? formatCurrency(p.tds_amount) : '—'}</TableCell>
                  <TableCell className="text-right">{p.amount_net != null ? formatCurrency(p.amount_net) : '—'}</TableCell>
                  <TableCell>{p.method.toUpperCase()}</TableCell>
                  <TableCell><PayoutStatusBadge status={p.status} /></TableCell>
                  <TableCell>{new Date(p.requested_at).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>
                    {p.status === 'requested' && (
                      <div className="flex gap-1">
                        <Button
                          size="icon" variant="ghost" aria-label="Process"
                          onClick={() => setProcessing(p)}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" aria-label="Reject"
                          onClick={() => setRejecting(p)}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {meta && meta.last_page > 1 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground self-center">Page {meta.current_page} of {meta.last_page}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {processing && (
        <ProcessPayoutModal
          payout={processing}
          open
          onClose={() => setProcessing(null)}
          onProcessed={refetch}
        />
      )}

      {rejecting && (
        <ReasonModal
          open
          title={`Reject payout ${rejecting.request_number}?`}
          reasonRequired
          confirmLabel="Reject"
          confirmVariant="destructive"
          onClose={() => setRejecting(null)}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}

export default Payouts;
```

- [ ] **Step 2: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/pages/Affiliates/Payouts.tsx
git commit -m "feat(affiliate): Payouts page with process/reject modals and TDS breakdown"
```

---

# PHASE 6 — Reports

## Task 6.1: AffiliateReports page

**Files:**
- Create: `src/pages/Affiliates/AffiliateReports.tsx`

- [ ] **Step 1: Implement AffiliateReports**

```tsx
// src/pages/Affiliates/AffiliateReports.tsx

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { affiliatesApi } from '@/api/affiliates';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/format';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export function AffiliateReports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: perf, isLoading } = useQuery({
    queryKey: ['affiliate-perf', startDate, endDate],
    queryFn: () => affiliatesApi.performanceReport({ start_date: startDate || undefined, end_date: endDate || undefined }),
  });

  const { data: products } = useQuery({
    queryKey: ['affiliate-products'],
    queryFn: () => affiliatesApi.productsReport(),
  });

  const { data: liability } = useQuery({
    queryKey: ['affiliate-liability'],
    queryFn: () => affiliatesApi.liability(),
  });

  function exportCsv() {
    if (!perf?.rows?.length) {
      toast.error('No data to export');
      return;
    }

    // CSV formula-injection sanitizer (z.ai E10, contract §17.x).
    // Cells starting with =, +, -, @, TAB, or CR can execute formulas in Excel.
    // Prefix dangerous cells with a single quote.
    const sanitize = (val: unknown): string => {
      const s = val === null || val === undefined ? '' : String(val);
      if (/^[=+\-@\t\r]/.test(s)) return `'${s}`;
      // Also escape quotes
      return `"${s.replace(/"/g, '""')}"`;
    };

    const headers = ['Affiliate', 'Code', 'Clicks', 'Orders', 'Sales', 'Earned', 'Paid', 'Conversion %'];
    const lines = [headers.map(sanitize).join(',')];
    perf.rows.forEach((r: any) => {
      const conv = r.clicks_count > 0 ? ((r.orders_count / r.clicks_count) * 100).toFixed(2) : '0.00';
      lines.push([
        sanitize(r.full_name),
        sanitize(r.code),
        sanitize(r.clicks_count),
        sanitize(r.orders_count),
        sanitize(r.sales_total),
        sanitize(r.commission_earned),
        sanitize(r.commission_paid),
        sanitize(conv),
      ].join(','));
    });

    // Prepend BOM so Excel detects UTF-8
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `affiliate-performance-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  }

  const rows = perf?.rows ?? [];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Affiliate Reports</h1>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </header>

      {/* Liability tile — the most important metric */}
      {liability && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="p-4 border-primary/50">
            <div className="text-xs text-muted-foreground mb-1">Outstanding liability</div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(liability.outstanding_liability)}</div>
            <div className="text-xs text-muted-foreground mt-1">Approved, not yet paid</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Pending commission</div>
            <div className="text-2xl font-bold">{formatCurrency(liability.pending)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Paid (all-time)</div>
            <div className="text-2xl font-bold">{formatCurrency(liability.paid)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total commission</div>
            <div className="text-2xl font-bold">{formatCurrency(liability.total)}</div>
          </Card>
        </div>
      )}

      {/* Date filter */}
      <Card className="p-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-sm font-medium">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button variant="outline" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear</Button>
        </div>
      </Card>

      {/* Performance table */}
      <Card>
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Affiliate Performance</h2>
          <p className="text-xs text-muted-foreground">Per-affiliate clicks, orders, sales, and commission.</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Affiliate</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">Earned</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Conv %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-6 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-6 text-sm text-muted-foreground">No data.</TableCell></TableRow>
            ) : (
              rows.map((r: any) => {
                const conv = r.clicks_count > 0 ? ((r.orders_count / r.clicks_count) * 100).toFixed(2) : '0.00';
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.full_name}</TableCell>
                    <TableCell className="font-mono text-xs">{r.code}</TableCell>
                    <TableCell className="text-right">{r.clicks_count}</TableCell>
                    <TableCell className="text-right">{r.orders_count}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.sales_total)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.commission_earned)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.commission_paid)}</TableCell>
                    <TableCell className="text-right">{conv}%</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Products table */}
      <Card>
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Product Performance</h2>
          <p className="text-xs text-muted-foreground">Which products drive the most affiliate revenue.</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Units sold</TableHead>
              <TableHead className="text-right">Affiliates</TableHead>
              <TableHead className="text-right">Commission cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(products?.rows ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell className="text-right">{r.units_sold}</TableCell>
                <TableCell className="text-right">{r.affiliate_count}</TableCell>
                <TableCell className="text-right">{formatCurrency(r.commission_cost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default AffiliateReports;
```

- [ ] **Step 2: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/pages/Affiliates/AffiliateReports.tsx
git commit -m "feat(affiliate): AffiliateReports with liability tile + CSV export"
```

---

# PHASE 7 — Sidebar nav + routes

## Task 7.1: Add Affiliate section to Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Locate the nav array**

```bash
grep -n "name: 'Marketing'\|name: 'Sales'\|name: 'Dashboard'" d:/bookbharat-v2/bookbharat-admin/src/components/layout/Sidebar.tsx | head -5
```

- [ ] **Step 2: Add the Affiliates nav group**

Insert after the Marketing section (or wherever fits — choose a logical location; "Sales" is most appropriate):

```tsx
// Affiliates
{
  name: 'Affiliates',
  href: '/affiliates',
  icon: Users,                  // or Affiliate/Handshake — pick what fits your icon set
},
```

Then for sub-routes, your nav supports children only if the current pattern supports nesting. If not, add them as flat items under an "Affiliates" group:

```tsx
{
  name: 'Affiliates',
  children: [
    { name: 'All Affiliates', href: '/affiliates', icon: Users },
    { name: 'Commission Rules', href: '/affiliates/commission-rules', icon: Percent },
    { name: 'Commissions', href: '/affiliates/commissions', icon: Receipt },
    { name: 'Payouts', href: '/affiliates/payouts', icon: Wallet },
    { name: 'Reports', href: '/affiliates/reports', icon: BarChart3 },
  ],
},
```

(Adjust icon imports to match what's already imported at the top of `Sidebar.tsx`.)

- [ ] **Step 3: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/components/layout/Sidebar.tsx
git commit -m "feat(affiliate): add Affiliates section to admin sidebar"
```

---

## Task 7.2: Register routes

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Find AdminLayout route group**

```bash
grep -n "AdminLayout\|/coupons\|/orders\|Route path" d:/bookbharat-v2/bookbharat-admin/src/App.tsx | head -30
```

- [ ] **Step 2: Add affiliate routes inside the AdminLayout group**

```tsx
import { AffiliateList, AffiliateDetail, CommissionRules, Commissions, Payouts, AffiliateReports } from '@/pages/Affiliates';

// Inside AdminLayout group:
<Route path="/affiliates" element={<AffiliateList />} />
<Route path="/affiliates/:id" element={<AffiliateDetail />} />
<Route path="/affiliates/commission-rules" element={<CommissionRules />} />
<Route path="/affiliates/commissions" element={<Commissions />} />
<Route path="/affiliates/payouts" element={<Payouts />} />
<Route path="/affiliates/reports" element={<AffiliateReports />} />
```

- [ ] **Step 3: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/App.tsx
git commit -m "feat(affiliate): register admin routes for 6 new pages"
```

---

# PHASE 8 — Settings whitelist

## Task 8.1: Add `affiliate` to settings whitelist

**Files:**
- Modify: `src/constants/settings.ts`

- [ ] **Step 1: Find the SETTINGS_GROUPS constant**

```bash
grep -n "SETTINGS_GROUPS\|'affiliate'" d:/bookbharat-v2/bookbharat-admin/src/constants/settings.ts
```

- [ ] **Step 2: Add `'affiliate'` to the list**

Find the array literal that defines `SETTINGS_GROUPS` (likely has keys like `'general'`, `'payment'`, etc.). Add:

```typescript
'affiliate',
```

- [ ] **Step 3: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/constants/settings.ts
git commit -m "feat(affiliate): whitelist affiliate settings group"
```

After deploy, the **Settings** admin page will render the new `affiliate` group from the backend's `config/settings/affiliate.php` (see backend plan Phase 1.2). No additional code is needed — the dynamic settings renderer picks it up automatically.

---

# PHASE 9 — Touch existing pages (non-breaking)

## Task 9.1: ProductEdit — add Affiliate section

**Files:**
- Modify: `src/pages/Products/ProductEdit.tsx`

- [ ] **Step 1: Find the product form**

```bash
grep -n "is_active\|commission\|affiliate" d:/bookbharat-v2/bookbharat-admin/src/pages/Products/ProductEdit.tsx | head -10
```

- [ ] **Step 2: Add an Affiliate section to the form**

Insert a new section card near the form's pricing/inventory area:

```tsx
<Card className="p-4">
  <h3 className="font-medium mb-3">Affiliate</h3>
  <div className="space-y-3">
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        {...register('affiliate_enabled')}
        defaultChecked={product?.affiliate_enabled ?? true}
      />
      <span>Affiliate enabled</span>
      <span className="text-xs text-muted-foreground">(off = excluded from commission)</span>
    </label>

    <div>
      <label className="text-sm font-medium">Commission type</label>
      <select
        {...register('commission_type')}
        defaultValue={product?.commission_type ?? 'default'}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      >
        <option value="default">Use default/category rules</option>
        <option value="custom">Custom rate</option>
      </select>
    </div>

    <div>
      <label className="text-sm font-medium">Custom commission rate (%)</label>
      <Input
        type="number" step="0.01"
        {...register('custom_commission_rate')}
        defaultValue={product?.custom_commission_rate ?? ''}
        placeholder="Only used when commission_type = custom"
      />
    </div>
  </div>
</Card>
```

- [ ] **Step 3: Make sure the form payload includes these fields**

Find the form's submit handler / mutation. Add the three new fields to the payload sent to the backend:

```tsx
affiliate_enabled: data.affiliate_enabled ?? true,
commission_type: data.commission_type ?? 'default',
custom_commission_rate: data.commission_type === 'custom' ? Number(data.custom_commission_rate) : null,
```

- [ ] **Step 4: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/pages/Products/ProductEdit.tsx
git commit -m "feat(affiliate): add affiliate section to product edit form"
```

---

## Task 9.2: Coupons — show affiliate-linked badge

**Files:**
- Modify: `src/pages/Coupons/index.tsx`

- [ ] **Step 1: Find the coupons table**

```bash
grep -n "TableRow\|TableCell\|coupon.code\|coupon.id" d:/bookbharat-v2/bookbharat-admin/src/pages/Coupons/index.tsx | head -20
```

- [ ] **Step 2: Add an affiliate column**

In the table header, add a new `<TableHead>Affiliate</TableHead>` column.

In the table body row, add:

```tsx
<TableCell>
  {coupon.affiliate_id ? (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500 text-white">
      Affiliate
    </span>
  ) : (
    <span className="text-muted-foreground text-xs">—</span>
  )}
</TableCell>
```

- [ ] **Step 3: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/pages/Coupons/index.tsx
git commit -m "feat(affiliate): badge affiliate-linked coupons"
```

---

## Task 9.3: OrderSidebar — show affiliate attribution

**Files:**
- Modify: `src/pages/Orders/OrderDetail/OrderSidebar.tsx`

- [ ] **Step 1: Find the ReferralCard component**

```bash
grep -n "ReferralCard\|referral_details\|attribution" d:/bookbharat-v2/bookbharat-admin/src/pages/Orders/OrderDetail/OrderSidebar.tsx | head -10
```

- [ ] **Step 2: Extend ReferralCard to show affiliate attribution**

Inside the ReferralCard (or whatever renders referral details), append:

```tsx
{order.affiliate_id && (
  <div className="mt-3 pt-3 border-t border-border text-sm">
    <div className="text-xs text-muted-foreground mb-1">Affiliate attribution</div>
    <div className="flex justify-between">
      <span>Affiliate</span>
      <span>#{order.affiliate_id}</span>
    </div>
    <div className="flex justify-between">
      <span>Source</span>
      <span className="capitalize">{order.attribution_source}</span>
    </div>
    <div className="flex justify-between">
      <span>Ref code</span>
      <span className="font-mono text-xs">{order.attribution_ref_code}</span>
    </div>
    {order.is_self_referral_blocked && (
      <div className="mt-2 text-xs text-red-600 font-medium">
        ⚠ Self-referral blocked
      </div>
    )}
  </div>
)}
```

- [ ] **Step 3: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/pages/Orders/OrderDetail/OrderSidebar.tsx
git commit -m "feat(affiliate): extend ReferralCard with attribution + self-referral flag"
```

---

# PHASE 10 — Verification

## Task 10.1: TypeScript + lint

- [ ] **Step 1: Full TS check**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -20
```
Expected: no errors.

- [ ] **Step 2: Lint**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npm run lint 2>&1 | tail -30
```
Expected: no new errors on changed files.

## Task 10.2: Manual smoke test

End-to-end against a backend with all affiliate endpoints live.

- [ ] **Step 1: Approve flow**
  1. Visit `/affiliates` → see pending list.
  2. Click a row → goes to `/affiliates/{id}` detail page.
  3. Click "Approve" → status updates to `active`, button row changes.

- [ ] **Step 2: Commission rules**
  1. Visit `/affiliates/commission-rules`.
  2. Click "New rule" → fill form for category `Bengali Books` at 5%.
  3. Confirm row appears.

- [ ] **Step 3: Commissions bulk action**
  1. Visit `/affiliates/commissions` → tab "Pending".
  2. Select 3 rows → click "Approve (3)".
  3. Confirm count decremented; rows move to "Approved" tab.

- [ ] **Step 4: Payout processing**
  1. Visit `/affiliates/payouts` → tab "Pending".
  2. Click check icon → ProcessPayoutModal opens with TDS breakdown.
  3. Enter UPI transaction ref → click "Mark as paid".
  4. Confirm row moves to "Processed" tab.

- [ ] **Step 5: Reports**
  1. Visit `/affiliates/reports`.
  2. Confirm outstanding-liability tile shows a value.
  3. Click "Export CSV" → CSV downloads.

- [ ] **Step 6: Settings**
  1. Visit `/settings` → confirm "Affiliate" group appears.
  2. Change "Default commission rate" → save → confirm persists.

- [ ] **Step 7: Product affiliate section**
  1. Edit any product → confirm "Affiliate" section appears.
  2. Toggle "Affiliate enabled" off → save.
  3. Place a test order for that product with `?ref=CODE` → confirm NO commission row is created.

- [ ] **Step 8: Coupon badge**
  1. Visit `/coupons` → confirm affiliate-linked coupons show the badge.

- [ ] **Step 9: Order attribution**
  1. View any order with `affiliate_id` set → confirm "Affiliate attribution" block appears in sidebar with self-referral flag if applicable.

---

# Risks & gotchas

1. **Route-group detection** — Sidebar nav shape may be flat or nested. If nested, use the children pattern in Task 7.1; if flat, use plain top-level entries. Match whatever exists.
2. **`formatCurrency` import** — the plan assumes `src/lib/format.ts` exists. If not, use `Intl.NumberFormat('en-IN', ...)` inline or check `src/lib/utils.ts` for an existing helper.
3. **API endpoint base** — the plan assumes `/api/admin/...`. If your admin uses `/api/v1/admin/...` (no `/api` prefix), update the axios paths.
4. **`api/index.ts`** may already have specific exports. Re-export affiliatesApi without removing anything.
5. **Settings whitelist** — some admin versions have the whitelist commented out. If so, this task becomes a no-op (settings still render); just note it.
6. **ProductEdit form may use a custom form library** — match the existing pattern. If it uses `react-hook-form`, use `register` as shown; if a custom hook, integrate the three new fields into the existing payload structure.
7. **Recharts** is already used in `AnalyticsDashboard.tsx`. The reports page in this plan is intentionally table-only; charts can be added in a future iteration.
8. **Affiliate stats endpoint on detail page** — backend's `/api/v1/admin/affiliates/{id}` returns the affiliate, not stats. The current detail page uses commissions/payouts lists directly; add a stats card as future work or call `/api/v1/admin/reports/affiliates/performance` and filter by id.
9. **Permissions** — backend admin endpoints use Spatie permissions (`affiliates.manage`, `payouts.process`, etc.). The admin UI doesn't currently check these — they're enforced server-side. Add frontend guards in a future iteration.

---

# PHASE 11 — Contract compliance additions

These tasks were added after the contract review (Aug 2026) and resolve the cross-doc gaps.

## Task 11.1: `useCan` hook for frontend permission gating (contract §18.1)

Per contract §18.1, hide admin action buttons the current user can't perform. The backend still enforces, but defense in depth + UX requires UI gating.

**Files:**
- Create: `src/hooks/useCan.ts`
- Modify: `src/components/affiliate/ReasonModal.tsx` (no change needed — callers check `can()`)
- Modify: pages that render mutating buttons (Affiliates, Commissions, Payouts)

- [ ] **Step 1: Implement `useCan`**

```typescript
// src/hooks/useCan.ts
import { useAuth } from './useAuth';           // adjust path to your auth hook
import { useMemo } from 'react';

export function useCan(permission: string): boolean {
  const { user } = useAuth();
  return useMemo(() => {
    if (!user) return false;
    if (user.roles?.includes('super-admin') || user.roles?.includes('admin')) return true;
    return (user.permissions ?? []).includes(permission);
  }, [user, permission]);
}
```

If your admin user shape differs (e.g. `user.perms` instead of `user.permissions`), adjust. Verify against your existing auth implementation.

- [ ] **Step 2: Gate action buttons in pages**

Example — in `AffiliateList.tsx`, replace each approve/reject/suspend/block button render:

```tsx
{can('affiliates.manage') && (
  <Button size="sm" variant="ghost" onClick={() => handleApprove(a)} aria-label="Approve">
    <CheckCircle className="h-4 w-4 text-green-600" />
  </Button>
)}
```

At the top of each page:

```tsx
import { useCan } from '@/hooks/useCan';
const can = {
  manageAffiliates: useCan('affiliates.manage'),
  manageCommissions: useCan('commissions.manage'),
  processPayouts: useCan('payouts.process'),
};
```

Apply to:
- `AffiliateList` — approve/reject/suspend/block (requires `affiliates.manage`)
- `AffiliateDetail` — same + admin-note edit
- `Commissions` — approve/reject/hold rows + bulk (requires `commissions.manage`)
- `Payouts` — process/reject (requires `payouts.process`)
- `CommissionRules` — new/edit/delete (requires `commission_rules.manage`)

- [ ] **Step 3: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/hooks/useCan.ts src/pages/Affiliates/ src/components/affiliate/
git commit -m "feat(affiliate): useCan hook for frontend permission gating"
```

---

## Task 11.2: Confirm axios baseURL is `/api/v1`

Per contract §19.1, all admin affiliate routes are under `/api/v1/admin/...`. Verify your admin `src/api/axios.ts` baseURL includes `/api/v1`.

**Files:**
- Verify: `src/api/axios.ts`

- [ ] **Step 1: Inspect**

```bash
grep -n "baseURL\|api/v1" d:/bookbharat-v2/bookbharat-admin/src/api/axios.ts | head -5
```

- [ ] **Step 2: If baseURL is `/api` or empty**

Edit `src/api/axios.ts` and ensure:

```typescript
baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://bookbharat.com/api/v1',
```

If the env var already includes `/api/v1`, no change needed.

- [ ] **Step 3: Smoke test**

```bash
cd d:/bookbharat-v2/bookbharat-admin
# Hit the backend (after it's deployed) and verify
curl -s https://your-staging.com/api/v1/admin/affiliates -H "Authorization: Bearer $TOKEN" | head -5
```

Expected: returns `{success, data: [], meta: ...}`.

- [ ] **Step 4: Commit (if changed)**

```bash
git add src/api/axios.ts
git diff --cached --quiet || git commit -m "fix(affiliate): confirm admin axios baseURL uses /api/v1"
```

---

## Task 11.3: Add affiliate settings `depends_on` support

The backend `config/settings/affiliate.php` uses `depends_on` for TDS fields. Verify the admin dynamic settings renderer supports it.

**Files:**
- Verify: `src/pages/Settings/DynamicSettings.tsx` (or equivalent)

- [ ] **Step 1: Inspect**

```bash
grep -n "depends_on\|conditional" d:/bookbharat-v2/bookbharat-admin/src/pages/Settings/*.tsx 2>/dev/null
```

- [ ] **Step 2: If not supported**

Add minimal conditional rendering: fields with `depends_on: <field_key>` should only render when the depended field is `true`/non-empty.

This is a low-priority polish; if not implemented yet, hide the TDS sub-fields by default until your settings renderer is updated.

- [ ] **Step 3: Commit (if changed)**

```bash
git add src/pages/Settings/
git diff --cached --quiet || git commit -m "feat(settings): support depends_on in dynamic settings renderer"
```

---

# PHASE 12 — Deferred patches (post-review follow-ups)

These tasks implement the remaining items from the AI review that were not blockers but were explicitly called out.

## Task 12.1: `useCan` gating on `CommissionRules` page (admin A2)

Task 11.1 covered permission gating on AffiliateList/Detail/Commissions/Payouts. `CommissionRules` was missed.

**Files:**
- Modify: `src/pages/Affiliates/CommissionRules.tsx`

- [ ] **Step 1: Add useCan**

At the top of the file:

```tsx
import { useCan } from '@/hooks/useCan';

export function CommissionRules() {
  const canManage = useCan('commission_rules.manage');
  // ... existing state
```

- [ ] **Step 2: Gate the "New rule" button**

```tsx
{canManage && (
  <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
    <Plus className="h-4 w-4 mr-1" /> New rule
  </Button>
)}
```

- [ ] **Step 3: Gate row actions**

Inside the Edit/Delete cell:

```tsx
{canManage && (
  <div className="flex gap-1">
    <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setModalOpen(true); }} aria-label="Edit">
      <Edit className="h-4 w-4" />
    </Button>
    <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)} aria-label="Delete">
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  </div>
)}
```

- [ ] **Step 4: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/pages/Affiliates/CommissionRules.tsx
git commit -m "feat(affiliate): useCan gating on CommissionRules actions"
```

---

## Task 12.2: ProductEdit affiliate section help text (admin A3)

Inline help text explaining the impact of each affiliate setting on ProductEdit.

**Files:**
- Modify: `src/pages/Products/ProductEdit.tsx`

- [ ] **Step 1: Add help text below each control**

In the Affiliate section card (Phase 9 of this plan):

```tsx
<label className="flex items-center gap-2 text-sm">
  <input type="checkbox" {...register('affiliate_enabled')} defaultChecked={product?.affiliate_enabled ?? true} />
  <span>Affiliate enabled</span>
</label>
<p className="text-xs text-muted-foreground -mt-2 ml-6">
  When OFF, no affiliate commission is ever generated for this product. Coupon owners still get discounts.
</p>

<div>
  <label className="text-sm font-medium">Commission type</label>
  <select {...register('commission_type')} defaultValue={product?.commission_type ?? 'default'}
    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
    <option value="default">Use default/category rules</option>
    <option value="custom">Custom rate</option>
  </select>
  <p className="text-xs text-muted-foreground mt-1">
    "Custom rate" overrides category and default rules for this product. Admins can still set
    a higher-priority product rule via Commission Rules that will beat this custom rate.
  </p>
</div>

<div>
  <label className="text-sm font-medium">Custom commission rate (%)</label>
  <Input type="number" step="0.01" {...register('custom_commission_rate')}
    defaultValue={product?.custom_commission_rate ?? ''}
    placeholder="Only used when commission_type = custom" />
  <p className="text-xs text-muted-foreground mt-1">
    Set to 0% to exclude this product while keeping affiliate_enabled = true. Set between 0–100.
  </p>
</div>
```

- [ ] **Step 2: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/pages/Products/ProductEdit.tsx
git commit -m "feat(affiliate): inline help text on ProductEdit affiliate section"
```

---

## Task 12.3: Replace `confirm()` with proper modal for bulk actions (admin A4)

Native `window.confirm()` is jarring and not stylable. Replace with a confirmation modal in `Commissions.tsx`.

**Files:**
- Create: `src/components/affiliate/ConfirmModal.tsx`
- Modify: `src/pages/Affiliates/Commissions.tsx`

- [ ] **Step 1: Implement ConfirmModal**

```tsx
// src/components/affiliate/ConfirmModal.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'default' | 'destructive';
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export function ConfirmModal({ open, title, description, confirmLabel, confirmVariant = 'default', onClose, onConfirm }: Props) {
  async function handle() {
    try { await onConfirm(); onClose(); } catch { /* keep modal open on error */ }
  }
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={confirmVariant} onClick={handle}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Replace `window.confirm()` in Commissions**

In `src/pages/Affiliates/Commissions.tsx`, replace the `handleDelete`-style `confirm()` call with a state-driven modal:

```tsx
const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

async function bulkApproveWithConfirm() {
  // ... existing bulkApprove logic
  setBulkConfirmOpen(false);
}

// In the JSX:
<ConfirmModal
  open={bulkConfirmOpen}
  title={`Approve ${selected.size} commissions?`}
  description="This action cannot be undone individually — commissions will move to approved and become payable."
  confirmLabel={`Approve ${selected.size}`}
  onClose={() => setBulkConfirmOpen(false)}
  onConfirm={bulkApproveWithConfirm}
/>
```

- [ ] **Step 3: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/components/affiliate/ConfirmModal.tsx src/pages/Affiliates/Commissions.tsx
git commit -m "feat(affiliate): proper confirmation modal for bulk actions"
```

---

## Task 12.4: CSV sanitization for products + payouts reports (admin A5)

Per A5: only performance report was sanitized. Apply the same `sanitize()` helper to the products and payouts report exports.

**Files:**
- Modify: `src/pages/Affiliates/AffiliateReports.tsx` (refactor sanitize into shared util)
- Create: `src/lib/csv.ts` (shared sanitizer)

- [ ] **Step 1: Extract the sanitize helper**

```typescript
// src/lib/csv.ts
/**
 * CSV formula-injection sanitizer.
 * Prefixes cells starting with =, +, -, @, TAB, or CR with a single quote
 * to neutralize Excel formula execution.
 */
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
```

- [ ] **Step 2: Refactor `AffiliateReports.tsx`**

Replace the inline `sanitize` and `exportCsv` logic with the shared helper. Add export buttons for products + payouts:

```tsx
import { downloadCsv } from '@/lib/csv';

// In the Products table section:
<Button variant="outline" onClick={() => downloadCsv(
  `affiliate-products-${Date.now()}.csv`,
  ['Product', 'Units sold', 'Affiliates', 'Commission cost'],
  (products?.rows ?? []).map((r: any) => [r.name, r.units_sold, r.affiliate_count, r.commission_cost])
)}>
  Export products CSV
</Button>
```

- [ ] **Step 3: Verify and commit**

```bash
cd d:/bookbharat-v2/bookbharat-admin
npx tsc --noEmit 2>&1 | tail -10
git add src/lib/csv.ts src/pages/Affiliates/AffiliateReports.tsx
git commit -m "feat(affiliate): shared CSV sanitizer + exports for products/payouts reports"
```

---

## Task 12.5: Admin `/status` client uses new `valid_format` field (admin A1 ↔ backend 1.7i)

Per backend Task 1.7i, the status endpoint now returns `{valid_format}`. If the admin uses this for any code validation, update.

**Files:**
- Search: `grep -rn "affiliateApi.validateCode\|/affiliate/status" d:/bookbharat-v2/bookbharat-admin/src/`

If no admin callsite exists, no change needed (only the storefront uses it). Document this in the plan.

- [ ] **Step 1: Verify no callsite**

```bash
grep -rn "validateCode\|affiliate.status" d:/bookbharat-v2/bookbharat-admin/src/ 2>/dev/null
```

Expected: no results. Admin doesn't use the status endpoint.

- [ ] **Step 2: Skip (no change)**

---

## Task 12.6: Bulk-action keyboard accessibility (admin A4 supplementary)

Bulk-select checkboxes should be keyboard-navigable; tab order should reach them logically.

**Files:**
- Modify: `src/pages/Affiliates/Commissions.tsx`

- [ ] **Step 1: Verify Checkbox component supports `aria-label`**

```bash
grep -n "aria-label\|Checkbox" d:/bookbharat-v2/bookbharat-admin/src/components/ui/checkbox.tsx | head -10
```

If the existing Checkbox supports `aria-label` (it does in shadcn-style), the existing markup already passes accessibility for bulk actions. The selection button row at the top has `aria-label`s. **Verify only.**

---

*End of plan — covers all admin panel work for the BookBharat Affiliate System, including Phases 11 and 12 deferred patches. Backend plan at [bookbharat-backend/docs/plans/2026-08-16-affiliate-backend.md](../../bookbharat-backend/docs/plans/2026-08-16-affiliate-backend.md). Storefront plan at [bookbharat-frontend/docs/plans/2026-08-16-affiliate-storefront.md](../../bookbharat-frontend/docs/plans/2026-08-16-affiliate-storefront.md). Contract at [bookbharat-backend/docs/contracts/affiliate.md](../../bookbharat-backend/docs/contracts/affiliate.md).*