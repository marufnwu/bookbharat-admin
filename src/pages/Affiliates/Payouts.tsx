import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { affiliatesApi, downloadCsv, makeIdempotencyKey, sanitizeCsvCell } from '@/api/affiliates';
import { Card, Button, Badge, LoadingSpinner, EmptyState, TablePagination } from '@/components';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import Table from '@/components/Table';
import { PayoutStatusBadge } from './StatBadge';
import { ProcessPayoutModal } from './ProcessPayoutModal';
import { BulkProcessPayoutModal } from './BulkProcessPayoutModal';
import { ReasonModal } from './ReasonModal';
import { cn } from '@/utils/cn';
import { useCan } from '@/hooks/useCan';
import { toast } from '@/utils/toast';
import type { AffiliatePayout, PayoutStatus } from '@/types/affiliate';

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

const fmt = (n: unknown): string => {
  const num = Number(n);
  if (!Number.isFinite(num)) return 'INR —';
  return 'INR ' + num.toLocaleString('en-IN');
};

export default function Payouts() {
  const [tab, setTab] = useState<PayoutStatus | 'all'>('requested');
  const [page, setPage] = useState(1);
  const [processing, setProcessing] = useState<AffiliatePayout | null>(null);
  const [rejecting, setRejecting] = useState<AffiliatePayout | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkProcessOpen, setBulkProcessOpen] = useState(false);
  const canProcess = useCan('payouts.process');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-payouts', tab, page, startDate, endDate],
    queryFn: () => affiliatesApi.listPayouts({ status: tab === 'all' ? undefined : tab, page, per_page: 25, start_date: startDate || undefined, end_date: endDate || undefined }),
    placeholderData: keepPreviousData,
  });

  const rows = data?.items ?? [];
  const meta = data?.meta;

  async function handleReject(reason: string) {
    if (!rejecting) return;
    try {
      await affiliatesApi.rejectPayout(rejecting.id, reason, makeIdempotencyKey());
      toast.success('Rejected'); refetch();
    }
    catch (e) { console.error(e); toast.error('Failed'); throw e; }
  }

  async function handleBulkReject(reason: string) {
    if (selected.size === 0) return;
    const key = makeIdempotencyKey();
    try {
      const r = await affiliatesApi.bulkRejectPayouts(Array.from(selected), reason, key);
      toast.success('Rejected ' + (r?.count ?? selected.size));
      setSelected(new Set());
      refetch();
    } catch (e) { console.error(e); toast.error('Bulk reject failed'); throw e; }
  }

  function exportCsv() {
    if (!rows.length) return;
    const headers = ['Request #', 'Affiliate', 'Amount', 'TDS', 'Net', 'Method', 'Status', 'Requested'];
    downloadCsv('payouts-' + Date.now() + '.csv', headers, rows.map((p) => [
      p.request_number,
      p.affiliate_name ?? '#' + p.affiliate_id,
      fmt(p.amount_requested),
      p.tds_amount != null ? fmt(p.tds_amount) : '—',
      p.amount_net != null ? fmt(p.amount_net) : '—',
      p.method.toUpperCase(),
      p.status,
      p.requested_at ? new Date(p.requested_at).toLocaleDateString('en-IN') : '—',
    ]));
  }

  function toggle(id: number, on: boolean) {
    setSelected((p) => { const n = new Set(p); on ? n.add(id) : n.delete(id); return n; });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payouts</h1>
          <p className="mt-1 text-sm text-gray-600">Process and manage affiliate payout requests</p>
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          )}
          {canProcess && selected.size > 0 && (
            <>
              <Button size="sm" onClick={() => setBulkProcessOpen(true)}>Process ({selected.size})</Button>
              <Button variant="danger" size="sm" onClick={() => setBulkRejectOpen(true)}>Reject ({selected.size})</Button>
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
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <Card className="p-6">
          <p className="text-sm text-error-600 font-medium mb-2">Failed to load payouts.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState title="No payouts" description="No payouts match the current filters." />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow">
            <Table
              data={rows}
              columns={[
                {
                  key: '_select',
                  title: (
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && rows.every((p) => selected.has(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected(new Set(rows.map((p) => p.id)));
                        } else {
                          setSelected(new Set());
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  ),
                  render: (_: any, p: any) => (
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={(e) => toggle(p.id, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      aria-label={`Select payout ${p.id}`}
                    />
                  ),
                },
                { key: 'request_number', title: 'Request #', render: (_: any, p: any) => <span className="font-mono text-xs">{p.request_number}</span> },
                { key: 'affiliate_name', title: 'Affiliate', render: (_: any, p: any) => <span className="font-medium text-gray-900">{p.affiliate_name ?? '#' + p.affiliate_id}</span> },
                { key: 'amount_requested', title: 'Amount', render: (_: any, p: any) => fmt(p.amount_requested), align: 'right' as const },
                { key: 'tds_amount', title: 'TDS', render: (_: any, p: any) => p.tds_amount != null ? fmt(p.tds_amount) : '—', align: 'right' as const },
                { key: 'amount_net', title: 'Net', render: (_: any, p: any) => p.amount_net != null ? fmt(p.amount_net) : '—', align: 'right' as const },
                { key: 'commission_count', title: '# Comm.', render: (_: any, p: any) => p.commission_count != null ? p.commission_count : '—', align: 'right' as const },
                { key: 'transaction_reference', title: 'Txn Ref', render: (_: any, p: any) => p.transaction_reference ? <span className="font-mono text-xs" title={p.transaction_reference}>{p.transaction_reference.length > 16 ? p.transaction_reference.slice(0, 16) + '…' : p.transaction_reference}</span> : '—' },
                { key: 'status', title: 'Status', render: (_: any, p: any) => <span title={p.status === 'rejected' ? (p.rejection_reason ?? '') : undefined}><PayoutStatusBadge status={p.status} /></span> },
                { key: 'requested_at', title: 'Requested', render: (_: any, p: any) => new Date(p.requested_at).toLocaleDateString('en-IN') },
                { key: 'processed_at', title: 'Processed', render: (_: any, p: any) => p.processed_at ? new Date(p.processed_at).toLocaleDateString('en-IN') : '—' },
                {
                  key: '_actions', title: 'Actions', render: (_: any, p: any) => (
                    <div className="flex items-center space-x-1">
                      {canProcess && p.status === 'requested' && (
                        <Button size="sm" variant="ghost" onClick={() => setProcessing(p)}>Process</Button>
                      )}
                      {canProcess && p.status === 'requested' && (
                        <Button size="sm" variant="ghost" onClick={() => setRejecting(p)}>Reject</Button>
                      )}
                    </div>
                  )
                },
              ]}
            />
          </div>
          <TablePagination
            meta={meta}
            page={page}
            onPageChange={setPage}
          />
        </>
      )}

      {processing && <ProcessPayoutModal payout={processing} open onClose={() => setProcessing(null)} onProcessed={refetch} />}
      {rejecting && (
        <ReasonModal open title={'Reject payout ' + rejecting.request_number + '?'} reasonRequired confirmLabel="Reject" confirmVariant="destructive" onClose={() => setRejecting(null)} onConfirm={handleReject} />
      )}
      {bulkRejectOpen && (
        <ReasonModal open title={`Reject ${selected.size} payouts?`} description="Bulk reject action cannot be undone individually." reasonRequired confirmLabel={`Reject ${selected.size}`} confirmVariant="destructive" onClose={() => setBulkRejectOpen(false)} onConfirm={handleBulkReject} />
      )}
      {bulkProcessOpen && (
        <BulkProcessPayoutModal
          open
          payouts={rows.filter((p) => selected.has(p.id))}
          onClose={() => setBulkProcessOpen(false)}
          onProcessed={() => { setSelected(new Set()); refetch(); }}
        />
      )}
    </div>
  );
}
