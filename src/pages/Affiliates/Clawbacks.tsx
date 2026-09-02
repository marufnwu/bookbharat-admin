import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { affiliatesApi } from '@/api/affiliates';
import { Card, Button, Badge, LoadingSpinner, EmptyState, TablePagination } from '@/components';
import Table from '@/components/Table';
import { cn } from '@/utils/cn';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'all', label: 'All Adjustments' },
];

const fmt = (n: unknown): string => {
  const num = Number(n);
  return Number.isFinite(num) ? 'INR ' + num.toLocaleString('en-IN') : 'INR —';
};

export default function Clawbacks() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [page, setPage] = useState(1);

  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ['clawbacks-pending', page],
    queryFn: () => affiliatesApi.listPendingClawbacks({ page, per_page: 25 }),
    placeholderData: keepPreviousData,
    enabled: tab === 'pending',
  });

  const { data: allData, isLoading: loadingAll } = useQuery({
    queryKey: ['clawbacks-all', page],
    queryFn: () => affiliatesApi.listAdjustments({ page, per_page: 25 }),
    placeholderData: keepPreviousData,
    enabled: tab === 'all',
  });

  const isLoading = tab === 'pending' ? loadingPending : loadingAll;
  const rows = tab === 'pending' ? (pendingData?.items ?? []) : (allData?.items ?? []);
  const meta = tab === 'pending' ? pendingData?.meta : allData?.meta;
  const totalPending = pendingData?.total_pending ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Clawbacks</h1>
        <p className="mt-1 text-sm text-gray-600">Commission adjustments from refunds and reversals</p>
      </div>

      {tab === 'pending' && (
        <Card className="p-6 border-l-4 border-l-warning-500">
          <p className="text-xs text-gray-500 mb-1">Total Pending Clawbacks</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(totalPending)}</p>
          <p className="text-xs text-gray-400 mt-1">Unsettled amounts that reduce affiliate payout balance</p>
        </Card>
      )}

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as any); setPage(1); }}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <EmptyState
          title={tab === 'pending' ? 'No pending clawbacks' : 'No adjustments found'}
          description="Nothing to reconcile right now."
        />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            data={rows}
            columns={tab === 'pending' ? [
              { key: 'affiliate_name', title: 'Affiliate', render: (_: any, r: any) => r.affiliate?.id ? <Link to={`/affiliates/${r.affiliate.id}`} className="font-medium text-primary-600 hover:underline">{r.affiliate?.full_name ?? '—'}</Link> : <span className="text-gray-500">—</span> },
              { key: 'amount', title: 'Amount', render: (_: any, r: any) => fmt(r.amount), align: 'right' as const },
              { key: 'created_at', title: 'Created', render: (_: any, r: any) => new Date(r.created_at).toLocaleDateString('en-IN') },
            ] : [
              { key: 'affiliate_name', title: 'Affiliate', render: (_: any, r: any) => {
                  const aff = r.commission?.affiliate;
                  return aff?.id ? <Link to={`/affiliates/${aff.id}`} className="font-medium text-primary-600 hover:underline">{aff.full_name ?? '—'}</Link> : <span className="text-gray-500">—</span>;
                }},
              { key: 'adjustment_type', title: 'Type', render: (_: any, r: any) => <Badge variant={r.adjustment_type?.includes('full') ? 'error' : 'warning'} size="sm">{r.adjustment_type?.replace('_', ' ')}</Badge> },
              { key: 'amount', title: 'Amount', render: (_: any, r: any) => fmt(r.amount), align: 'right' as const },
              { key: 'reason', title: 'Reason', render: (_: any, r: any) => <span className="text-xs text-gray-500 max-w-[200px] truncate block">{r.reason ?? '—'}</span> },
              { key: 'source_event', title: 'Source', render: (_: any, r: any) => r.source_event ?? '—' },
              { key: 'created_at', title: 'Created', render: (_: any, r: any) => new Date(r.created_at).toLocaleDateString('en-IN') },
            ]}
          />
        </div>
      )}

      <TablePagination meta={meta} page={page} onPageChange={setPage} />
    </div>
  );
}
