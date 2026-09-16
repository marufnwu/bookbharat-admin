import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { affiliatesApi } from '@/api/affiliates';
import { Card, Button, Input, Badge, LoadingSpinner, EmptyState, TablePagination } from '@/components';
import Table from '@/components/Table';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { cn } from '@/utils/cn';

const SOURCE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'coupon', label: 'Coupon' },
  { key: 'link', label: 'Link' },
];

const fmt = (n: unknown): string => {
  const num = Number(n);
  return Number.isFinite(num) ? 'INR ' + num.toLocaleString('en-IN') : 'INR —';
};

export default function AffiliateOrders() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [blockedOnly, setBlockedOnly] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['affiliate-orders', tab, search, page, startDate, endDate, blockedOnly],
    queryFn: () => affiliatesApi.listAffiliateOrders({
      attribution_source: tab === 'all' ? undefined : tab,
      q: search || undefined,
      page,
      per_page: 25,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      self_referral_blocked: blockedOnly || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const rows = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Affiliate Orders</h1>
        <p className="mt-1 text-sm text-gray-600">
          Orders attributed to affiliate referrals
          {meta && (
            <span className="ml-2 text-gray-500">
              · {meta.total?.toLocaleString() ?? '—'} matching current filters
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {SOURCE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {t.label}
          </button>
        ))}
        <label className="flex items-center gap-2 ml-4 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={blockedOnly}
            onChange={(e) => { setBlockedOnly(e.target.checked); setPage(1); }}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          Self-referral blocked only
        </label>
      </div>

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartChange={(v) => { setStartDate(v); setPage(1); }}
        onEndChange={(v) => { setEndDate(v); setPage(1); }}
        onClear={() => { setStartDate(''); setEndDate(''); setSearch(''); setBlockedOnly(false); setPage(1); }}
        extra={
          <div className="flex-1 max-w-md">
            <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>
            <Input
              placeholder="Search by order # or ref code..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <Card className="p-6">
          <p className="text-sm text-error-600 font-medium mb-2">Failed to load affiliate orders.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState title="No affiliate orders found" description="Try clearing filters to see all attributed orders." />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            data={rows}
            columns={[
              { key: 'order_number', title: 'Order #', render: (_: any, r: any) => (
                <button onClick={() => navigate(`/orders/${r.id}`)} className="font-mono text-xs text-primary-600 hover:underline">{r.order_number}</button>
              )},
              { key: 'affiliate_name', title: 'Affiliate', render: (_: any, r: any) => <span className="font-medium text-gray-900">{r.affiliate_name ?? `#${r.affiliate_id}`}</span> },
              { key: 'attribution_source', title: 'Source', render: (_: any, r: any) => <Badge variant={r.attribution_source === 'coupon' ? 'info' : 'success'} size="sm">{r.attribution_source ?? '—'}</Badge> },
              { key: 'attribution_ref_code', title: 'Ref Code', render: (_: any, r: any) => r.attribution_ref_code ? <span className="font-mono text-xs">{r.attribution_ref_code}</span> : '—' },
              { key: 'total_amount', title: 'Amount', render: (_: any, r: any) => fmt(r.total_amount), align: 'right' as const },
              { key: 'commission_total', title: 'Commission', render: (_: any, r: any) => r.commission_total ? fmt(r.commission_total) : '—', align: 'right' as const },
              { key: 'status', title: 'Status', render: (_: any, r: any) => <Badge variant={r.status === 'delivered' ? 'success' : r.status === 'cancelled' ? 'error' : 'default'} size="sm">{r.status}</Badge> },
              { key: 'is_self_referral_blocked', title: 'Blocked', render: (_: any, r: any) => r.is_self_referral_blocked ? <Badge variant="error" size="sm">Blocked</Badge> : null },
              { key: 'created_at', title: 'Date', render: (_: any, r: any) => new Date(r.created_at).toLocaleDateString('en-IN') },
            ]}
          />
        </div>
      )}

      <TablePagination meta={meta} page={page} onPageChange={setPage} />
    </div>
  );
}
