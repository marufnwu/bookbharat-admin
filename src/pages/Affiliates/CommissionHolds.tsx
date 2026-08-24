import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { affiliatesApi } from '@/api/affiliates';
import { Card, Button, Badge, LoadingSpinner, EmptyState, TablePagination } from '@/components';
import Table from '@/components/Table';
import { ReasonModal } from './ReasonModal';
import { cn } from '@/utils/cn';
import { toast } from '@/utils/toast';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const REASON_TABS = [
  { key: 'all', label: 'All' },
  { key: 'self_referral', label: 'Self Referral' },
  { key: 'refund_ratio', label: 'Refund Ratio' },
  { key: 'cap_exceeded', label: 'Cap Exceeded' },
  { key: 'admin_hold', label: 'Admin Hold' },
];

export default function CommissionHolds() {
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [resolving, setResolving] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['commission-holds', tab, page],
    queryFn: () => affiliatesApi.listHolds({
      reason_code: tab === 'all' ? undefined : tab,
      page,
      per_page: 25,
    }),
    placeholderData: keepPreviousData,
  });

  const rows = data?.items ?? [];
  const meta = data?.meta;

  async function handleResolve(reason: string) {
    if (!resolving) return;
    try {
      await affiliatesApi.resolveHold(resolving.id, resolving.action, reason);
      toast.success(`Commission ${resolving.action === 'approve' ? 'approved' : 'rejected'}`);
      setResolving(null);
      refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed');
      throw e;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Commission Holds</h1>
        <p className="mt-1 text-sm text-gray-600">Review and resolve fraud-flagged or manually held commissions</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {REASON_TABS.map((t) => (
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
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <Card className="p-6">
          <p className="text-sm text-error-600 font-medium mb-2">Failed to load holds.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ShieldExclamationIcon className="h-12 w-12" />}
          title="No unresolved holds"
          description="All clear. No commissions currently need review."
        />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            data={rows}
            columns={[
              { key: 'id', title: 'Hold #', render: (_: any, h: any) => <span className="font-mono text-xs">#{h.id}</span> },
              { key: 'affiliate_name', title: 'Affiliate', render: (_: any, h: any) => <span className="font-medium text-gray-900">{h.commission?.affiliate?.full_name ?? '—'}</span> },
              { key: 'order_number', title: 'Order #', render: (_: any, h: any) => <span className="font-mono text-xs">{h.commission?.order_number ?? '—'}</span> },
              { key: 'amount', title: 'Amount', render: (_: any, h: any) => { const n = Number(h.commission?.amount); return Number.isFinite(n) ? 'INR ' + n.toLocaleString('en-IN') : '—'; }, align: 'right' as const },
              { key: 'reason_code', title: 'Reason', render: (_: any, h: any) => <Badge variant={h.reason_code === 'self_referral' ? 'error' : h.reason_code === 'refund_ratio' ? 'warning' : 'info'} size="sm">{h.reason_code?.replace('_', ' ')}</Badge> },
              { key: 'reason_detail', title: 'Details', render: (_: any, h: any) => <span className="text-xs text-gray-500 max-w-[200px] truncate block" title={h.reason_detail}>{h.reason_detail ?? '—'}</span> },
              { key: 'created_at', title: 'Flagged', render: (_: any, h: any) => new Date(h.created_at).toLocaleDateString('en-IN') },
              {
                key: '_actions', title: 'Actions', render: (_: any, h: any) => (
                  <div className="flex items-center space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => setResolving({ id: h.id, action: 'approve' })} className="text-green-600 hover:text-green-700">Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => setResolving({ id: h.id, action: 'reject' })} className="text-red-600 hover:text-red-700">Reject</Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      <TablePagination meta={meta} page={page} onPageChange={setPage} />

      {resolving && (
        <ReasonModal
          open
          title={resolving.action === 'approve' ? 'Approve this commission?' : 'Reject this commission?'}
          description={resolving.action === 'approve' ? 'This will release the hold and approve the commission.' : 'This will reverse the commission permanently.'}
          reasonRequired={resolving.action === 'reject'}
          confirmLabel={resolving.action === 'approve' ? 'Approve' : 'Reject'}
          confirmVariant={resolving.action === 'reject' ? 'destructive' : 'default'}
          onClose={() => setResolving(null)}
          onConfirm={handleResolve}
        />
      )}
    </div>
  );
}
