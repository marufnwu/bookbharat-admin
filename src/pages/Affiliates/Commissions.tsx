import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { affiliatesApi, makeIdempotencyKey, downloadCsv, sanitizeCsvCell } from '@/api/affiliates';
import { Card, Button, Badge, LoadingSpinner, EmptyState, TablePagination } from '@/components';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import Table from '@/components/Table';
import { CommissionStatusBadge } from './StatBadge';
import { ReasonModal } from './ReasonModal';
import { CommissionDetailModal } from './CommissionDetailModal';
import { cn } from '@/utils/cn';
import { useCan } from '@/hooks/useCan';
import { toast } from '@/utils/toast';
import type { CommissionStatus, AffiliateCommission } from '@/types/affiliate';

const TABS: { key: CommissionStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid', label: 'Paid' },
  { key: 'reversed', label: 'Reversed' },
  { key: 'on_hold', label: 'On Hold' },
];

export default function Commissions() {
  const [tab, setTab] = useState<CommissionStatus | 'all'>('pending');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<{ kind: 'reject' | 'hold'; singleId?: number } | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const canManage = useCan('commissions.manage');
  const [debouncedOrder, setDebouncedOrder] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedOrder(orderSearch.trim()), 250);
    return () => clearTimeout(t);
  }, [orderSearch]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-commissions', tab, page, startDate, endDate, debouncedOrder],
    queryFn: () => affiliatesApi.listCommissions({
      status: tab === 'all' ? undefined : (tab as CommissionStatus),
      page,
      per_page: 25,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      q: debouncedOrder || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const rows: AffiliateCommission[] = data?.items ?? [];
  const meta = (data as any)?.meta;
  const allSelected = rows.length > 0 && rows.every((r: any) => selected.has(r.id));

  function toggle(id: number, on: boolean) {
    setSelected((p) => { const n = new Set(p); on ? n.add(id) : n.delete(id); return n; });
  }
  function toggleAll(on: boolean) {
    setSelected(on ? new Set(rows.map((r: any) => r.id)) : new Set());
  }

  async function bulkApprove() {
    if (selected.size === 0) return;
    const idempotencyKey = makeIdempotencyKey();
    try {
      const r = await affiliatesApi.bulkApproveCommissions(Array.from(selected), idempotencyKey);
      toast.success('Approved ' + (r?.count ?? selected.size));
      setSelected(new Set());
      refetch();
    } catch (e) { console.error(e); toast.error('Bulk approve failed'); }
  }

  async function handleModalConfirm(reason: string) {
    if (!modal) return;
    const idempotencyKey = makeIdempotencyKey();
    try {
      if (modal.kind === 'reject' && modal.singleId) {
        await affiliatesApi.rejectCommission(modal.singleId, reason, idempotencyKey);
      } else if (modal.kind === 'reject') {
        await affiliatesApi.bulkRejectCommissions(Array.from(selected), reason, idempotencyKey);
        setSelected(new Set());
      } else if (modal.kind === 'hold' && modal.singleId) {
        await affiliatesApi.holdCommission(modal.singleId, reason, idempotencyKey);
      }
      toast.success('Done');
      refetch();
    } catch (e) { console.error(e); toast.error('Failed'); throw e; }
  }

  function exportCsv() {
    const headers = ['Affiliate', 'Order #', 'Product', 'Amount', 'Rate', 'Status', 'Approved', 'Date'];
    const csvRows = rows.map((c) => [
      c.affiliate_name ?? ('#' + c.affiliate_id),
      c.order_number,
      c.product_name,
      c.amount,
      c.rate + '%',
      c.status,
      c.approved_at ?? '',
      c.created_at,
    ]);
    downloadCsv(`commissions-${Date.now()}.csv`, headers, csvRows);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Commissions</h1>
          <p className="mt-1 text-sm text-gray-600">Review and manage affiliate commissions</p>
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && canManage && (
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          {selected.size > 0 && canManage && (
            <>
              <Button onClick={bulkApprove} size="sm">Approve ({selected.size})</Button>
              <Button onClick={() => setModal({ kind: 'reject' })} variant="danger" size="sm">Reject ({selected.size})</Button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); setSelected(new Set()); }}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartChange={(v) => { setStartDate(v); setPage(1); }}
        onEndChange={(v) => { setEndDate(v); setPage(1); }}
        onClear={() => { setStartDate(''); setEndDate(''); setPage(1); }}
        extra={
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Order #</label>
            <input
              type="search"
              placeholder="Search by order number"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm w-56 focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <Card className="p-6">
          <p className="text-sm text-error-600 font-medium mb-2">Failed to load commissions.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState title="No commissions" description="Try clearing filters to see all commissions." />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            data={rows}
            columns={[
              {
                key: '_select',
                title: (
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                ),
                render: (_: any, c: any) => (
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={(e) => toggle(c.id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    aria-label={'Select ' + c.id}
                  />
                ),
              },
              { key: 'affiliate_name', title: 'Affiliate', render: (_: any, c: any) => <span className="font-medium text-gray-900">{c.affiliate_name ?? '#' + c.affiliate_id}</span> },
              { key: 'order_number', title: 'Order #', render: (_: any, c: any) => <span className="font-mono text-xs">{c.order_number}</span> },
              { key: 'product_name', title: 'Product', render: (_: any, c: any) => c.product_id ? <a href={`/products/${c.product_id}`} className="text-primary-600 hover:underline">{c.product_name}</a> : c.product_name },
              { key: 'amount', title: 'Amount', render: (_: any, c: any) => { const n = Number(c.amount); return Number.isFinite(n) ? 'INR ' + n.toLocaleString('en-IN') : 'INR —'; }, align: 'right' as const },
              { key: 'rate', title: 'Rate', render: (_: any, c: any) => c.rate + '%', align: 'right' as const },
              { key: 'reason', title: 'Reason', render: (_: any, c: any) => (c.status === 'on_hold' || c.status === 'reversed') && c.reason ? <span className="text-xs text-gray-500" title={c.reason}>{(c.reason.length > 60 ? c.reason.slice(0, 60) + '…' : c.reason)}</span> : null },
              { key: 'status', title: 'Status', render: (_: any, c: any) => <CommissionStatusBadge status={c.status} /> },
              { key: 'approved_at', title: 'Approved', render: (_: any, c: any) => c.approved_at ? new Date(c.approved_at).toLocaleDateString('en-IN') : '—' },
              { key: 'reversed_at', title: 'Reversed', render: (_: any, c: any) => c.reversed_at ? new Date(c.reversed_at).toLocaleDateString('en-IN') : '—' },
              { key: 'created_at', title: 'Date', render: (_: any, c: any) => new Date(c.created_at).toLocaleDateString('en-IN') },
              {
                key: '_actions',
                title: 'Actions',
                render: (_: any, c: any) => (
                  <div className="flex items-center space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => setDetailId(c.id)}>View</Button>
                    {canManage && (c.status === 'pending' || c.status === 'on_hold') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await affiliatesApi.approveCommission(c.id, makeIdempotencyKey());
                            toast.success('Approved');
                            refetch();
                          } catch { toast.error('Failed'); }
                        }}
                      >
                        Approve
                      </Button>
                    )}
                    {canManage && c.status === 'pending' && (
                      <Button size="sm" variant="ghost" onClick={() => setModal({ kind: 'hold', singleId: c.id })}>Hold</Button>
                    )}
                    {canManage && c.status !== 'reversed' && (
                      <Button size="sm" variant="ghost" onClick={() => setModal({ kind: 'reject', singleId: c.id })}>
                        {c.status === 'paid' ? 'Clawback' : 'Reject'}
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
          <TablePagination
            meta={meta}
            page={page}
            onPageChange={setPage}
            leftSlot={
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Select all
              </label>
            }
          />
        </div>
      )}

      {modal && (
        <ReasonModal
          open
          title={modal.kind === 'reject' ? 'Reject commission(s)' : 'Hold commission for review'}
          description={modal.singleId ? 'Rejecting/holding this single commission.' : 'Bulk action on ' + selected.size + ' commissions.'}
          reasonRequired
          confirmLabel={modal.kind === 'reject' ? 'Reject' : 'Hold'}
          confirmVariant="destructive"
          onClose={() => setModal(null)}
          onConfirm={handleModalConfirm}
        />
      )}
      {detailId !== null && (
        <CommissionDetailModal open commissionId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
