import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WalletIcon,
  ReceiptPercentIcon,
  ClockIcon,
  CursorArrowRaysIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { affiliatesApi } from '@/api/affiliates';
import {
  Card,
  CardContent,
  Button,
  Badge,
  StatCard,
  LoadingSpinner,
} from '@/components';
import Table from '@/components/Table';
import { CommissionStatusBadge } from './StatBadge';
import { cn } from '@/utils/cn';

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

export default function AffiliateOverview() {
  const [days, setDays] = useState(30);

  const { data: liability } = useQuery({
    queryKey: ['overview-liability'],
    queryFn: () => affiliatesApi.liability(),
  });

  const { data: clicksData } = useQuery({
    queryKey: ['overview-clicks', days],
    queryFn: () => affiliatesApi.analyticsClicks({ days }),
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: ['overview-pending-approvals'],
    queryFn: () => affiliatesApi.list({ status: 'pending', per_page: 1 }),
  });

  const { data: requestedPayouts } = useQuery({
    queryKey: ['overview-requested-payouts'],
    queryFn: () => affiliatesApi.listPayouts({ status: 'requested', per_page: 1 }),
  });

  const { data: holds } = useQuery({
    queryKey: ['overview-holds'],
    queryFn: () => affiliatesApi.listHolds({ per_page: 1 }),
  });

  const { data: clawbacks } = useQuery({
    queryKey: ['overview-clawbacks'],
    queryFn: () => affiliatesApi.listPendingClawbacks({ per_page: 1 }),
  });

  const { data: performance } = useQuery({
    queryKey: ['overview-performance'],
    queryFn: () =>
      affiliatesApi.performanceReport({
        sort_by: 'sales_total',
        sort_direction: 'desc',
      }),
  });

  const { data: commissions } = useQuery({
    queryKey: ['overview-recent-commissions'],
    queryFn: () => affiliatesApi.listCommissions({ per_page: 8 }),
  });

  const trendData = useMemo(() => {
    const dailyClicks = clicksData?.daily_clicks ?? [];
    const dailyOrders = clicksData?.daily_orders ?? [];
    return dailyClicks.map((c: any) => {
      const order = dailyOrders.find((o: any) => o.date === c.date);
      return {
        date: c.date,
        clicks: Number(c.clicks),
        orders: order ? Number(order.orders) : 0,
        sales: order ? Number(order.sales) : 0,
      };
    });
  }, [clicksData]);

  const topAffiliates = (performance?.rows ?? []).slice(0, 5);
  const recentCommissions = commissions?.items ?? [];

  const pendingApprovalsCount = pendingApprovals?.meta?.total ?? 0;
  const requestedPayoutsCount = requestedPayouts?.meta?.total ?? 0;
  const holdsCount = holds?.meta?.total ?? 0;
  const clawbacksAmount = Number(clawbacks?.total_pending ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
          <p className="mt-1 text-sm text-gray-600">
            Affiliate program health, payouts, and trending activity
          </p>
        </div>
        <div className="flex items-center gap-1 self-start rounded-lg border border-gray-200 bg-white p-1 sm:self-auto">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                days === d
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* MONEY ROW */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Outstanding liability"
          value={fmt(liability?.outstanding_liability)}
          icon={<WalletIcon className="h-6 w-6" />}
          iconBgColor="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Pending commissions"
          value={fmt(liability?.pending)}
          icon={<ClockIcon className="h-6 w-6" />}
          iconBgColor="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Paid to date"
          value={fmt(liability?.paid)}
          icon={<CheckCircleIcon className="h-6 w-6" />}
          iconBgColor="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Lifetime commission"
          value={fmt(liability?.total)}
          icon={<CurrencyRupeeIcon className="h-6 w-6" />}
          iconBgColor="bg-violet-100 text-violet-600"
        />
      </div>

      {/* OPS ROW */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <OpsTile
          to="/affiliates"
          label="Pending approvals"
          value={fmtInt(pendingApprovalsCount)}
          tone={pendingApprovalsCount > 0 ? 'warning' : 'muted'}
          icon={<ExclamationTriangleIcon className="h-4 w-4" />}
        />
        <OpsTile
          to="/affiliates/payouts"
          label="Requested payouts"
          value={fmtInt(requestedPayoutsCount)}
          tone={requestedPayoutsCount > 0 ? 'warning' : 'muted'}
          icon={<WalletIcon className="h-4 w-4" />}
        />
        <OpsTile
          to="/affiliates/commission-holds"
          label="Unresolved holds"
          value={fmtInt(holdsCount)}
          tone={holdsCount > 0 ? 'danger' : 'muted'}
          icon={<ExclamationTriangleIcon className="h-4 w-4" />}
        />
        <OpsTile
          to="/affiliates/clawbacks"
          label="Pending clawbacks"
          value={fmt(clawbacksAmount)}
          tone={clawbacksAmount > 0 ? 'danger' : 'muted'}
          icon={<ReceiptPercentIcon className="h-4 w-4" />}
        />
      </div>

      {/* TREND CARD */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Click & order trend</h2>
            <p className="text-xs text-gray-500">Last {days} days across all affiliates</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <TrendChip
              label="Clicks"
              value={fmtInt(clicksData?.total_clicks)}
              tone="blue"
            />
            <TrendChip
              label="Orders"
              value={fmtInt(clicksData?.total_orders)}
              tone="emerald"
            />
            <TrendChip
              label="Conversion"
              value={clicksData?.conversion_rate != null ? `${clicksData.conversion_rate}%` : '—'}
              tone="indigo"
            />
            <TrendChip
              label="AOV"
              value={fmt(clicksData?.avg_order_value)}
              tone="amber"
            />
          </div>
        </div>
        <CardContent className="h-72">
          {trendData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="overviewClicksArea" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#overviewClicksArea)"
                  name="Clicks"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="Orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* BOTTOM GRID */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Top affiliates</h2>
              <p className="text-xs text-gray-500">Sorted by lifetime sales</p>
            </div>
            <Link
              to="/affiliates/reports"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
            >
              All reports
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </Link>
          </div>
          <CardContent className="p-0">
            <Table
              data={topAffiliates}
              emptyMessage="No performance data yet."
              columns={[
                {
                  key: 'full_name',
                  title: 'Affiliate',
                  render: (_: any, r: any) => (
                    <Link to={`/affiliates/${r.id}`} className="font-medium text-primary-600 hover:underline">
                      {r.full_name}
                    </Link>
                  ),
                },
                {
                  key: 'code',
                  title: 'Code',
                  render: (_: any, r: any) => <span className="font-mono text-xs">{r.code}</span>,
                },
                {
                  key: 'orders_count',
                  title: 'Orders',
                  render: (_: any, r: any) => fmtInt(r.orders_count),
                  align: 'right' as const,
                },
                {
                  key: 'sales_total',
                  title: 'Sales',
                  render: (_: any, r: any) => fmt(r.sales_total),
                  align: 'right' as const,
                },
                {
                  key: 'commission_earned',
                  title: 'Earned',
                  render: (_: any, r: any) => fmt(r.commission_earned),
                  align: 'right' as const,
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent commissions</h2>
              <p className="text-xs text-gray-500">Latest across all affiliates</p>
            </div>
            <Link
              to="/affiliates/commissions"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
            >
              View all
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </Link>
          </div>
          <CardContent className="p-0">
            <Table
              data={recentCommissions}
              emptyMessage="No commissions yet."
              columns={[
                {
                  key: 'order_number',
                  title: 'Order #',
                  render: (_: any, c: any) => <span className="font-mono text-xs">{c.order_number}</span>,
                },
                {
                  key: 'affiliate_name',
                  title: 'Affiliate',
                  render: (_: any, c: any) => (
                    <Link to={`/affiliates/${c.affiliate_id}`} className="font-medium text-gray-900 hover:underline">
                      {c.affiliate_name ?? `#${c.affiliate_id}`}
                    </Link>
                  ),
                },
                {
                  key: 'amount',
                  title: 'Amount',
                  render: (_: any, c: any) => fmt(c.amount),
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OpsTile({
  to,
  label,
  value,
  tone,
  icon,
}: {
  to: string;
  label: string;
  value: string;
  tone: 'warning' | 'danger' | 'muted';
  icon: React.ReactNode;
}) {
  const toneClasses: Record<typeof tone, string> = {
    warning: 'border-amber-200 bg-amber-50 hover:bg-amber-100',
    danger: 'border-red-200 bg-red-50 hover:bg-red-100',
    muted: 'border-gray-200 bg-white hover:bg-gray-50',
  };
  const textClasses: Record<typeof tone, string> = {
    warning: 'text-amber-700',
    danger: 'text-red-700',
    muted: 'text-gray-500',
  };
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
        toneClasses[tone]
      )}
    >
      <div className={cn('flex-shrink-0', textClasses[tone])}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className={cn('text-lg font-semibold', tone === 'muted' ? 'text-gray-900' : textClasses[tone])}>
          {value}
        </p>
      </div>
      <ArrowTopRightOnSquareIcon className="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-gray-500" />
    </Link>
  );
}

function TrendChip({ label, value, tone }: { label: string; value: string; tone: 'blue' | 'emerald' | 'indigo' | 'amber' }) {
  const map: Record<typeof tone, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };
  return (
    <span className={cn('rounded-full border px-2 py-1', map[tone])}>
      {label} {value}
    </span>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <ChartBarIcon className="h-10 w-10 text-gray-300" />
      <p className="mt-2 text-sm text-gray-500">No click or order activity in this window.</p>
    </div>
  );
}