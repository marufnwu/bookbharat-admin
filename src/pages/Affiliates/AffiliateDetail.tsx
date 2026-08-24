import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  LinkIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { affiliatesApi, downloadCsv, sanitizeCsvCell } from '@/api/affiliates';
import {
  Card,
  CardContent,
  Button,
  Input,
  Modal,
  PageSkeleton,
  Badge,
  StatCard,
  EmptyState,
  CopyableText,
  Banner,
  Timeline,
  type TimelineItem,
} from '@/components';
import { Textarea } from '@/components/Input';
import Table from '@/components/Table';
import { CommissionStatusBadge, AffiliateStatusBadge, PayoutStatusBadge } from './StatBadge';
import { ReasonModal } from './ReasonModal';
import { EmailComposerModal } from './EmailComposerModal';
import { EditCouponModal } from './EditCouponModal';
import { useCan } from '@/hooks/useCan';
import { toast } from '@/utils/toast';
import { cn } from '@/utils/cn';
import type { Affiliate, AffiliatePerformanceRow, AffiliateCoupon } from '@/types/affiliate';

const fmt = (n: unknown): string => {
  const num = Number(n);
  return Number.isFinite(num) ? 'INR ' + num.toLocaleString('en-IN') : 'INR —';
};

const fmtInt = (n: unknown): string => {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString('en-IN') : '—';
};

const fmtDate = (s?: string | null): string =>
  s ? new Date(s).toLocaleDateString('en-IN') : '—';

const fmtDateTime = (s?: string | null): string => {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d.toLocaleString('en-IN') : '—';
};

const maskUpi = (s?: string | null): string => {
  if (!s || s.length < 6) return s ?? '—';
  return `${s.slice(0, 3)}***${s.slice(-2)}`;
};

const maskAccount = (s?: string | null): string => {
  if (!s || s.length < 5) return s ?? '—';
  return `****${s.slice(-4)}`;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

function referralLink(productSlug: string | null | undefined, refCode: string): string {
  const slug = productSlug && productSlug.length > 0 ? productSlug : '';
  return `/products/${slug}?ref=${encodeURIComponent(refCode)}`;
}

type TabId = 'commissions' | 'orders' | 'links' | 'payouts' | 'activity';

export default function AffiliateDetail() {
  const { id } = useParams();
  const affiliateId = Number(id);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [modal, setModal] = useState<{ kind: 'reject' | 'suspend' | 'block' } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('commissions');
  const [emailOpen, setEmailOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const canManage = useCan('affiliates.manage');
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['affiliate', affiliateId],
    queryFn: () => affiliatesApi.get(affiliateId),
    enabled: !!affiliateId,
  });
  const { data: commissions } = useQuery({
    queryKey: ['affiliate-commissions', affiliateId],
    queryFn: () => affiliatesApi.listCommissions({ affiliate_id: affiliateId, per_page: 50 }),
    enabled: !!affiliateId,
  });
  const { data: payouts } = useQuery({
    queryKey: ['affiliate-payouts', affiliateId],
    queryFn: () => affiliatesApi.listPayouts({ affiliate_id: affiliateId, per_page: 50 }),
    enabled: !!affiliateId,
  });
  const { data: orders } = useQuery({
    queryKey: ['affiliate-detail-orders', affiliateId],
    queryFn: () => affiliatesApi.listAffiliateOrders({ affiliate_id: affiliateId, per_page: 25 }),
    enabled: !!affiliateId && activeTab === 'orders',
  });
  const { data: links } = useQuery({
    queryKey: ['affiliate-links', affiliateId],
    queryFn: () => affiliatesApi.listLinks({ affiliate_id: affiliateId, per_page: 50 }),
    enabled: !!affiliateId && activeTab === 'links',
  });
  const { data: activity } = useQuery({
    queryKey: ['affiliate-audit', affiliateId],
    queryFn: () => affiliatesApi.listAuditLog({ entity_type: 'affiliate', per_page: 100 }),
    enabled: !!affiliateId && activeTab === 'activity',
  });
  const { data: orderSummary } = useQuery({
    queryKey: ['affiliate-order-summary', affiliateId],
    queryFn: () => affiliatesApi.affiliateOrderSummary(affiliateId),
    enabled: !!affiliateId,
  });
  const { data: perfReport } = useQuery({
    queryKey: ['affiliate-perf'],
    queryFn: () => affiliatesApi.performanceReport(),
    enabled: !!affiliateId,
  });
  const perfRow: AffiliatePerformanceRow | undefined = perfReport?.rows?.find(
    (r) => r.id === affiliateId,
  );

  const { data: trends } = useQuery({
    queryKey: ['affiliate-trends', affiliateId],
    queryFn: () => affiliatesApi.getTrends(affiliateId),
    enabled: !!affiliateId,
  });

  useEffect(() => {
    if (data?.affiliate?.admin_note) setNote(data.affiliate.admin_note);
  }, [data]);

  async function saveNote() {
    setSavingNote(true);
    try {
      await affiliatesApi.updateNote(affiliateId, note);
      toast.success('Note saved');
      refetch();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  }

  async function handleReactivate() {
    try {
      await affiliatesApi.reactivate(affiliateId);
      toast.success('Affiliate reactivated');
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed');
    }
  }

  async function handleModalConfirm(reason: string) {
    if (!modal) return;
    try {
      if (modal.kind === 'reject') await affiliatesApi.reject(affiliateId, reason);
      if (modal.kind === 'suspend') await affiliatesApi.suspend(affiliateId, reason);
      if (modal.kind === 'block') await affiliatesApi.block(affiliateId, reason);
      toast.success('Done');
      refetch();
    } catch (e) {
      toast.error('Failed');
      throw e;
    }
  }

  function exportCsv() {
    const headers = ['Order #', 'Product', 'Amount', 'Rate', 'Status', 'Approved', 'Date'];
    const rows = (commissions?.items ?? []).map((c: any) => [
      c.order_number,
      c.product_name,
      c.amount,
      c.rate + '%',
      c.status,
      c.approved_at ?? '',
      c.created_at,
    ]);
    downloadCsv(
      `commissions-affiliate-${affiliateId}-${Date.now()}.csv`,
      headers,
      rows,
    );
  }

  const [editForm, setEditForm] = useState<Partial<Affiliate>>({});
  async function handleEditSave() {
    setEditLoading(true);
    try {
      await affiliatesApi.updateAffiliate(affiliateId, editForm);
      toast.success('Affiliate updated');
      queryClient.invalidateQueries({ queryKey: ['affiliate', affiliateId] });
      setEditOpen(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update');
    } finally {
      setEditLoading(false);
    }
  }

  const trendData = useMemo(() => {
    if (!trends) return [];
    return (trends.daily_clicks ?? []).map((c: any) => {
      const order = (trends.daily_orders ?? []).find((o: any) => o.date === c.date);
      return {
        date: c.date,
        clicks: Number(c.clicks),
        orders: order ? Number(order.orders) : 0,
        sales: order ? Number(order.sales) : 0,
      };
    });
  }, [trends]);

  const activityItems: TimelineItem[] = useMemo(() => {
    const rows = (activity?.items ?? []) as any[];
    return rows
      .filter((row) => row.subject_id === affiliateId)
      .map((row) => {
        const tone =
          row.event?.includes('blocked') || row.event?.includes('rejected')
            ? 'danger'
            : row.event?.includes('suspended') || row.event?.includes('hold')
              ? 'warning'
              : row.event?.includes('approved') || row.event?.includes('paid')
                ? 'success'
                : 'info';
        return {
          id: row.id,
          tone: tone as TimelineItem['tone'],
          title: row.description ?? row.event ?? 'Event',
          meta: row.causer?.name
            ? `${row.causer.name} · ${fmtDateTime(row.created_at)}`
            : fmtDateTime(row.created_at),
        };
      });
  }, [activity, affiliateId]);

  if (isLoading || !data) return <PageSkeleton type="detail" />;
  if (!data.affiliate) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-500">Affiliate not found.</p>
      </Card>
    );
  }
  const a = data.affiliate;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'commissions', label: 'Commissions' },
    { id: 'orders', label: 'Orders' },
    { id: 'links', label: 'Links' },
    { id: 'payouts', label: 'Payouts' },
    { id: 'activity', label: 'Activity' },
  ];

  const coupon: AffiliateCoupon | null | undefined = a.coupon;
  const couponExpired = coupon?.expires_at && new Date(coupon.expires_at) < new Date();
  const couponStatus: 'active' | 'inactive' | 'expired' | 'none' = !coupon
    ? 'none'
    : !coupon.is_active
      ? 'inactive'
      : couponExpired
        ? 'expired'
        : 'active';

  const conversionPct =
    trends && Number(trends.total_clicks) > 0
      ? ((Number(trends.total_orders) / Number(trends.total_clicks)) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link to="/affiliates" className="mt-1">
            <Button variant="ghost" size="icon" aria-label="Back to affiliates">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
              {initials(a.full_name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-gray-900">{a.full_name}</h1>
                <AffiliateStatusBadge status={a.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                <span>{a.email}</span>
                <span className="text-gray-300">·</span>
                <span>{a.phone}</span>
                <span className="text-gray-300">·</span>
                <span>Joined {fmtDate(a.created_at)}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs">
                  <span className="text-gray-500">Code</span>
                  <CopyableText value={a.code} label="Copy code" />
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {a.status === 'pending' && canManage && (
            <>
              <Button
                onClick={async () => {
                  try {
                    await affiliatesApi.approve(affiliateId);
                    toast.success('Approved');
                    refetch();
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || 'Failed to approve');
                  }
                }}
              >
                Approve
              </Button>
              <Button variant="danger" onClick={() => setModal({ kind: 'reject' })}>
                Reject
              </Button>
            </>
          )}
          {a.status === 'active' && canManage && (
            <>
              <Button variant="outline" onClick={() => setModal({ kind: 'suspend' })}>
                Suspend
              </Button>
              <Button variant="danger" onClick={() => setModal({ kind: 'block' })}>
                Block
              </Button>
            </>
          )}
          {a.status === 'suspended' && canManage && (
            <Button variant="outline" onClick={handleReactivate}>
              <ArrowPathIcon className="mr-2 h-4 w-4" />
              Re-activate
            </Button>
          )}
          {canManage && (
            <div className="ml-1 flex items-center gap-1 border-l border-gray-200 pl-2">
              <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => affiliatesApi.downloadAffiliatePdf(affiliateId)}
              >
                PDF
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setEditForm({});
                  setEditOpen(true);
                }}
                title="Edit affiliate"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* REASON BANNERS */}
      {a.rejection_reason && (
        <Banner tone="danger">
          <strong>Rejected:</strong> {a.rejection_reason}
        </Banner>
      )}
      {a.suspended_reason && (
        <Banner tone="warning">
          <strong>Suspended at {fmtDateTime(a.suspended_at)}:</strong> {a.suspended_reason}
        </Banner>
      )}
      {a.status === 'blocked' && a.blocked_at && (
        <Banner tone="danger">
          <strong>Blocked at {fmtDateTime(a.blocked_at)}.</strong>
        </Banner>
      )}

      {/* STATS — Money row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total commission"
          value={fmt(orderSummary?.total_commission ?? 0)}
          icon={<CurrencyRupeeIcon className="h-6 w-6" />}
          iconBgColor="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Attributed revenue"
          value={fmt(orderSummary?.total_revenue ?? 0)}
          icon={<ChartBarIcon className="h-6 w-6" />}
          iconBgColor="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Attributed orders"
          value={fmtInt(orderSummary?.total_orders ?? 0)}
          icon={<ShoppingBagIcon className="h-6 w-6" />}
          iconBgColor="bg-violet-100 text-violet-600"
        />
        <Card variant="default" className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="mb-1 text-sm font-medium text-gray-500">Lifetime earned</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(perfRow?.commission_earned ?? 0)}</p>
              {Number(orderSummary?.blocked_orders ?? 0) > 0 && (
                <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                  {fmtInt(orderSummary?.blocked_orders)} self-referral blocked
                </p>
              )}
            </div>
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <CurrencyRupeeIcon className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* STATS — Funnel row (compact) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Lifetime clicks', value: perfRow?.clicks_count },
          { label: 'Lifetime orders', value: perfRow?.orders_count },
          { label: 'Lifetime sales', value: perfRow?.sales_total != null ? fmt(perfRow.sales_total) : null },
          { label: '30-day clicks', value: trends?.total_clicks != null ? fmtInt(trends.total_clicks) : null },
          { label: '30-day orders', value: trends?.total_orders != null ? fmtInt(trends.total_orders) : null },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5"
          >
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p className="mt-0.5 text-base font-semibold text-gray-900">{s.value ?? '—'}</p>
          </div>
        ))}
      </div>

      {/* TREND CARD */}
      {trends && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">30-day trend</h2>
              <p className="text-xs text-gray-500">Daily clicks and orders</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-gray-200 bg-white px-2 py-1 text-gray-700">
                Clicks {fmtInt(trends.total_clicks)}
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-2 py-1 text-gray-700">
                Orders {fmtInt(trends.total_orders)}
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-2 py-1 text-gray-700">
                Sales {fmt(trends.total_sales)}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
                Earned {fmt(trends.total_earned)}
              </span>
              {conversionPct !== null && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700">
                  Conversion {conversionPct}%
                </span>
              )}
            </div>
          </div>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="affiliateClicksArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#affiliateClicksArea)"
                  name="Clicks"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* INFO CARDS — Profile / Coupon / Payout / Notes */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Profile</h3>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Contact
                </p>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Email</dt>
                    <dd className="mt-0.5 text-gray-900">{a.email}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="mt-0.5 text-gray-900">{a.phone}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-gray-500">Address</dt>
                    <dd className="mt-0.5 text-gray-900">{a.address}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tax (TDS)
                </p>
                <dl className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">PAN</dt>
                    <dd className="mt-0.5 font-mono text-gray-900">{a.pan ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Entity type</dt>
                    <dd className="mt-0.5 text-gray-900">{a.entity_type ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">GSTIN</dt>
                    <dd className="mt-0.5 font-mono text-gray-900">{a.gstin ?? '—'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Program
                </p>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Payout method</dt>
                    <dd className="mt-0.5 text-gray-900">{a.payout_method.toUpperCase()}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">How they promote</dt>
                    <dd className="mt-0.5 text-gray-900">{a.how_promote ?? '—'}</dd>
                  </div>
                  {a.terms_accepted_at && (
                    <div>
                      <dt className="text-gray-500">Terms accepted</dt>
                      <dd className="mt-0.5 text-gray-900">{fmtDateTime(a.terms_accepted_at)}</dd>
                    </div>
                  )}
                  {a.approved_at && (
                    <div>
                      <dt className="text-gray-500">Approved</dt>
                      <dd className="mt-0.5 text-gray-900">{fmtDateTime(a.approved_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Commission overrides
                </p>
                <dl className="space-y-3 text-sm">
                  {(['coupon', 'link'] as const).map((src) => {
                    const v = src === 'coupon' ? a.commission_rate_override_coupon : a.commission_rate_override_link;
                    return (
                      <div key={src} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <dt className="text-gray-500">
                            {src === 'coupon' ? 'Coupon orders' : 'Link orders'}
                          </dt>
                          {v !== null && v !== undefined ? (
                            <dd className="mt-0.5 flex items-center gap-2 text-gray-900">
                              <span className="font-medium">{Number(v).toFixed(2)}%</span>
                              <Badge variant="info" size="sm">Override ({src})</Badge>
                            </dd>
                          ) : (
                            <dd className="mt-0.5 text-gray-500">Catalog rules</dd>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Overrides catalog rules for this attribution source. Exclusions still give 0%.{' '}
                            <Link to="/affiliates/commission-rules" className="text-primary-600 hover:underline">
                              View catalog ladder →
                            </Link>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </dl>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Commission gates
                </p>
                <dl className="space-y-3 text-sm">
                  {([
                    {
                      src: 'coupon' as const,
                      label: 'Coupon orders',
                      min: a.min_order_override_coupon,
                      minSet: a.min_order_override_coupon,
                      firstOnly: a.first_order_only_override_coupon,
                      perCust: a.per_customer_limit_override_coupon,
                      total: a.total_limit_override_coupon,
                    },
                    {
                      src: 'link' as const,
                      label: 'Link orders',
                      min: a.min_order_override_link,
                      minSet: a.min_order_override_link,
                      firstOnly: a.first_order_only_override_link,
                      perCust: a.per_customer_limit_override_link,
                      total: a.total_limit_override_link,
                    },
                  ]).map((g) => {
                    const rows: Array<{ label: string; value: React.ReactNode }> = [];
                    rows.push({
                      label: 'Min order amount',
                      value: g.min !== null && g.min !== undefined
                        ? `INR ${Number(g.min).toLocaleString('en-IN')}`
                        : <span className="text-gray-500">No minimum</span>,
                    });
                    rows.push({
                      label: 'First-order-only',
                      value: g.firstOnly === true
                        ? <Badge variant="info" size="sm">Yes (override)</Badge>
                        : g.firstOnly === false
                          ? <span className="text-gray-500">No</span>
                          : <span className="text-gray-500">Platform default</span>,
                    });
                    rows.push({
                      label: 'Per-customer cap',
                      value: g.perCust !== null && g.perCust !== undefined
                        ? `${g.perCust} order${g.perCust === 1 ? '' : 's'}`
                        : <span className="text-gray-500">Unlimited</span>,
                    });
                    rows.push({
                      label: 'Total cap (lifetime)',
                      value: g.total !== null && g.total !== undefined
                        ? `${g.total} order${g.total === 1 ? '' : 's'}`
                        : <span className="text-gray-500">Unlimited</span>,
                    });
                    const hasOverride = [g.minSet, g.firstOnly, g.perCust, g.total].some(
                      (v) => v !== null && v !== undefined,
                    );
                    return (
                      <div key={g.src} className="rounded-md border border-gray-100 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">{g.label}</h4>
                          {hasOverride && <Badge variant="info" size="sm">Override ({g.src})</Badge>}
                        </div>
                        <dl className="grid grid-cols-2 gap-2 text-xs">
                          {rows.map((r) => (
                            <div key={r.label} className="flex justify-between gap-2">
                              <dt className="text-gray-500">{r.label}</dt>
                              <dd className="text-gray-900">{r.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    );
                  })}
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Coupon</h3>
              {couponStatus === 'active' && <Badge variant="success" size="sm">Active</Badge>}
              {couponStatus === 'inactive' && <Badge variant="destructive" size="sm">Inactive</Badge>}
              {couponStatus === 'expired' && <Badge variant="warning" size="sm">Expired</Badge>}
              {couponStatus === 'none' && <Badge variant="outline" size="sm">None</Badge>}
            </div>
            {coupon ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Code</span>
                  <CopyableText value={coupon.code} label="Copy code" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-medium text-gray-900">{coupon.discount_value}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Expires</span>
                  <span className="text-gray-900">{fmtDate(coupon.expires_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Used</span>
                  <span className="text-gray-900">{fmtInt(coupon.usage_count)}×</span>
                </div>
                {canManage && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => setCouponOpen(true)}
                  >
                    Edit coupon
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No coupon linked.</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Payout details</h3>
            {a.payment_details ? (
              a.payment_details.bank ? (
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <dt className="text-gray-500">Bank</dt>
                    <dd className="mt-0.5 text-gray-900">
                      {a.payment_details.bank.bank_name ?? '—'}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-gray-500">Holder</dt>
                    <dd className="mt-0.5 text-gray-900">
                      {a.payment_details.bank.holder_name ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">A/c</dt>
                    <dd className="mt-0.5 font-mono text-gray-900">
                      {maskAccount(a.payment_details.bank.account_number)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">IFSC</dt>
                    <dd className="mt-0.5 font-mono text-gray-900">
                      {a.payment_details.bank.ifsc ?? '—'}
                    </dd>
                  </div>
                </dl>
              ) : a.payment_details.upi ? (
                <dl className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500">UPI ID</dt>
                    <dd className="mt-0.5 font-mono text-gray-900">
                      {maskUpi(a.payment_details.upi.id)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">No payout details on file.</p>
              )
            ) : (
              <p className="text-sm text-gray-500">No payout details on file.</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Admin notes</h3>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={5}
              placeholder="Internal notes"
            />
            <Button
              onClick={saveNote}
              disabled={savingNote}
              className="mt-3"
              size="sm"
              loading={savingNote}
            >
              Save note
            </Button>
          </Card>
        </div>
      </div>

      {/* TABS */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'whitespace-nowrap border-b-2 px-6 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <CardContent>
          {activeTab === 'commissions' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Commissions</h3>
                {(commissions?.items?.length ?? 0) > 0 && canManage && (
                  <Button variant="outline" size="sm" onClick={exportCsv}>
                    <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                )}
              </div>
              <Table
                data={commissions?.items ?? []}
                emptyMessage="No commissions yet."
                columns={[
                  {
                    key: 'order_number',
                    title: 'Order #',
                    render: (_: any, c: any) => (
                      <span className="font-mono text-xs">{c.order_number}</span>
                    ),
                  },
                  { key: 'product_name', title: 'Product' },
                  {
                    key: 'amount',
                    title: 'Amount',
                    render: (_: any, c: any) => fmt(c.amount),
                    align: 'right' as const,
                  },
                  {
                    key: 'rate',
                    title: 'Rate',
                    render: (_: any, c: any) => c.rate + '%',
                    align: 'right' as const,
                  },
                  {
                    key: 'status',
                    title: 'Status',
                    render: (_: any, c: any) => <CommissionStatusBadge status={c.status} />,
                  },
                  {
                    key: 'created_at',
                    title: 'Date',
                    render: (_: any, c: any) => fmtDate(c.created_at),
                  },
                ]}
              />
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Attributed orders</h3>
              <Table
                data={orders?.items ?? []}
                emptyMessage="No attributed orders yet."
                columns={[
                  {
                    key: 'order_number',
                    title: 'Order #',
                    render: (_: any, r: any) => (
                      <span className="font-mono text-xs text-primary-600">{r.order_number}</span>
                    ),
                  },
                  {
                    key: 'attribution_source',
                    title: 'Source',
                    render: (_: any, r: any) => (
                      <Badge
                        variant={r.attribution_source === 'coupon' ? 'info' : 'success'}
                        size="sm"
                      >
                        {r.attribution_source ?? '—'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'attribution_ref_code',
                    title: 'Ref',
                    render: (_: any, r: any) =>
                      r.attribution_ref_code ? (
                        <span className="font-mono text-xs">{r.attribution_ref_code}</span>
                      ) : (
                        '—'
                      ),
                  },
                  {
                    key: 'total_amount',
                    title: 'Amount',
                    render: (_: any, r: any) => fmt(r.total_amount),
                    align: 'right' as const,
                  },
                  {
                    key: 'status',
                    title: 'Status',
                    render: (_: any, r: any) => {
                      const v = r.status;
                      const variant =
                        v === 'delivered'
                          ? 'success'
                          : v === 'cancelled' || v === 'refunded'
                            ? 'destructive'
                            : 'default';
                      return (
                        <Badge variant={variant} size="sm">
                          {v}
                        </Badge>
                      );
                    },
                  },
                  {
                    key: 'is_self_referral_blocked',
                    title: '',
                    render: (_: any, r: any) =>
                      r.is_self_referral_blocked ? (
                        <Badge variant="destructive" size="sm" title="Self-referral blocked">
                          Blocked
                        </Badge>
                      ) : null,
                  },
                  {
                    key: 'created_at',
                    title: 'Date',
                    render: (_: any, r: any) => fmtDate(r.created_at),
                  },
                ]}
              />
            </div>
          )}

          {activeTab === 'links' && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Referral links</h3>
              <Table
                data={links?.items ?? []}
                emptyMessage="No referral links yet."
                columns={[
                  {
                    key: 'product',
                    title: 'Product',
                    render: (_: any, r: any) => r.product?.name ?? <span className="text-gray-400">—</span>,
                  },
                  {
                    key: 'url',
                    title: 'Link',
                    render: (_: any, r: any) => {
                      const url = referralLink(r.product?.slug, a.code);
                      return (
                        <span className="inline-flex items-center gap-2">
                          <code className="max-w-[20ch] truncate font-mono text-xs text-gray-700">
                            {url}
                          </code>
                          <CopyableText value={url} label="Copy link" />
                        </span>
                      );
                    },
                  },
                  {
                    key: 'clicks_count',
                    title: 'Clicks',
                    render: (_: any, r: any) => fmtInt(r.clicks_count ?? 0),
                    align: 'right' as const,
                  },
                  {
                    key: 'orders_count',
                    title: 'Orders',
                    render: (_: any, r: any) => fmtInt(r.orders_count ?? 0),
                    align: 'right' as const,
                  },
                  {
                    key: 'created_at',
                    title: 'Created',
                    render: (_: any, r: any) => fmtDate(r.created_at),
                  },
                ]}
              />
            </div>
          )}

          {activeTab === 'payouts' && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Payouts</h3>
              <Table
                data={payouts?.items ?? []}
                emptyMessage="No payouts yet."
                columns={[
                  {
                    key: 'request_number',
                    title: 'Request #',
                    render: (_: any, p: any) => (
                      <span className="font-mono text-xs">{p.request_number}</span>
                    ),
                  },
                  {
                    key: 'amount_requested',
                    title: 'Amount',
                    render: (_: any, p: any) => fmt(p.amount_requested),
                    align: 'right' as const,
                  },
                  {
                    key: 'tds_amount',
                    title: 'TDS',
                    render: (_: any, p: any) =>
                      p.tds_amount != null ? fmt(p.tds_amount) : '—',
                    align: 'right' as const,
                  },
                  {
                    key: 'amount_net',
                    title: 'Net',
                    render: (_: any, p: any) =>
                      p.amount_net != null ? fmt(p.amount_net) : '—',
                    align: 'right' as const,
                  },
                  {
                    key: 'status',
                    title: 'Status',
                    render: (_: any, p: any) => <PayoutStatusBadge status={p.status} />,
                  },
                  {
                    key: 'requested_at',
                    title: 'Date',
                    render: (_: any, p: any) => fmtDate(p.requested_at),
                  },
                ]}
              />
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent activity</h3>
              </div>
              <Banner tone="info">
                Showing recent affiliate-type events (last 100). Older events are not paginated
                here.
              </Banner>
              <div className="mt-4">
                <Timeline
                  items={activityItems}
                  emptyState={
                    <EmptyState
                      icon={<ClockIcon className="h-12 w-12" />}
                      title="No activity recorded"
                      description="No admin or system events have been logged for this affiliate yet."
                    />
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODALS — unchanged functionally */}
      {modal && (
        <ReasonModal
          open
          title={
            modal.kind === 'reject'
              ? 'Reject application'
              : modal.kind === 'suspend'
                ? 'Suspend affiliate'
                : 'Block affiliate'
          }
          reasonRequired
          confirmLabel={modal.kind[0].toUpperCase() + modal.kind.slice(1)}
          confirmVariant="destructive"
          onClose={() => setModal(null)}
          onConfirm={handleModalConfirm}
        />
      )}

      {editOpen && canManage && (
        <Modal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title={`Edit Affiliate: ${a.full_name}`}
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>
                Cancel
              </Button>
              <Button onClick={handleEditSave} disabled={editLoading} loading={editLoading}>
                Save changes
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Full name"
              value={editForm.full_name ?? a.full_name ?? ''}
              onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
            />
            <Input
              label="Email"
              value={editForm.email ?? a.email ?? ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={editForm.phone ?? a.phone ?? ''}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
            <Input
              label="Address"
              value={editForm.address ?? a.address ?? ''}
              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            />
            <Textarea
              label="How they promote"
              value={editForm.how_promote ?? a.how_promote ?? ''}
              onChange={(e) => setEditForm({ ...editForm, how_promote: e.target.value })}
              rows={3}
            />
            <Textarea
              label="Admin note"
              value={editForm.admin_note ?? a.admin_note ?? ''}
              onChange={(e) => setEditForm({ ...editForm, admin_note: e.target.value })}
              rows={4}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Coupon commission override %"
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={editForm.commission_rate_override_coupon ?? a.commission_rate_override_coupon ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  setEditForm({
                    ...editForm,
                    commission_rate_override_coupon: raw === '' ? null : Number(raw),
                  });
                }}
                helper="Applies to this affiliate's orders attributed via coupon. Leave blank to use catalog rules."
              />
              <Input
                label="Link commission override %"
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={editForm.commission_rate_override_link ?? a.commission_rate_override_link ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  setEditForm({
                    ...editForm,
                    commission_rate_override_link: raw === '' ? null : Number(raw),
                  });
                }}
                helper="Applies to this affiliate's orders attributed via bare referral link."
              />
            </div>

            <fieldset className="rounded-md border border-gray-200 p-4">
              <legend className="px-2 text-sm font-medium text-gray-900">Commission gates</legend>
              <p className="mb-3 text-xs text-gray-500">Per-source eligibility gates. Leave blank to inherit platform default (or OFF if unset).</p>
              {(['coupon', 'link'] as const).map((src) => (
                <div key={src} className="mb-4 last:mb-0">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {src === 'coupon' ? 'Coupon gates' : 'Link gates'}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Min order (₹)"
                      type="number"
                      min={0}
                      step="0.01"
                      value={editForm[`min_order_override_${src}` as const] ?? (a as any)[`min_order_override_${src}`] ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setEditForm({ ...editForm, [`min_order_override_${src}`]: raw === '' ? null : Number(raw) });
                      }}
                    />
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        First-order-only
                      </label>
                      <select
                        value={
                          editForm[`first_order_only_override_${src}` as const] === true
                            ? 'yes'
                            : editForm[`first_order_only_override_${src}` as const] === false
                              ? 'no'
                              : 'inherit'
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          setEditForm({
                            ...editForm,
                            [`first_order_only_override_${src}`]: v === 'inherit' ? null : v === 'yes',
                          });
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
                      >
                        <option value="inherit">Inherit platform default</option>
                        <option value="yes">Yes — first order only</option>
                        <option value="no">No — any order</option>
                      </select>
                    </div>
                    <Input
                      label="Per-customer cap (orders)"
                      type="number"
                      min={0}
                      step="1"
                      value={editForm[`per_customer_limit_override_${src}` as const] ?? (a as any)[`per_customer_limit_override_${src}`] ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setEditForm({ ...editForm, [`per_customer_limit_override_${src}`]: raw === '' ? null : Number(raw) });
                      }}
                    />
                    <Input
                      label="Total cap (lifetime orders)"
                      type="number"
                      min={0}
                      step="1"
                      value={editForm[`total_limit_override_${src}` as const] ?? (a as any)[`total_limit_override_${src}`] ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setEditForm({ ...editForm, [`total_limit_override_${src}`]: raw === '' ? null : Number(raw) });
                      }}
                    />
                  </div>
                </div>
              ))}
            </fieldset>
          </div>
        </Modal>
      )}
      {emailOpen && (
        <EmailComposerModal
          open
          affiliateId={affiliateId}
          affiliateName={a.full_name}
          onClose={() => setEmailOpen(false)}
        />
      )}
      {couponOpen && a.coupon && (
        <EditCouponModal
          open
          affiliateId={affiliateId}
          coupon={a.coupon}
          onClose={() => setCouponOpen(false)}
          onUpdated={refetch}
        />
      )}
    </div>
  );
}