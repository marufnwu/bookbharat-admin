import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { affiliatesApi } from '@/api/affiliates';
import { Card, Button, Badge, LoadingSpinner, EmptyState, TablePagination } from '@/components';
import Table from '@/components/Table';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

const ENTITY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'affiliate', label: 'Affiliates' },
  { key: 'commission', label: 'Commissions' },
  { key: 'payout', label: 'Payouts' },
  { key: 'commission_rule', label: 'Rules' },
];

const ACTION_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  created: 'success',
  updated: 'info',
  deleted: 'error',
  approved: 'success',
  rejected: 'error',
  suspended: 'warning',
  blocked: 'error',
};

export default function AffiliateAuditLog() {
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['affiliate-audit-log', tab, page, startDate, endDate],
    queryFn: () => affiliatesApi.listAuditLog({
      entity_type: tab === 'all' ? undefined : tab,
      page,
      per_page: 25,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const rows = data?.items ?? [];
  const meta = data?.meta;

  function getEntityType(subjectType: string): string {
    if (subjectType.includes('Affiliate')) return 'Affiliate';
    if (subjectType.includes('Commission') && subjectType.includes('Rule')) return 'Rule';
    if (subjectType.includes('Commission')) return 'Commission';
    if (subjectType.includes('Payout')) return 'Payout';
    return 'Unknown';
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-600">Track all affiliate-related admin actions</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {ENTITY_TABS.map((t) => (
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
          <p className="text-sm text-error-600 font-medium mb-2">Failed to load audit log.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState icon={<ClipboardDocumentListIcon className="h-12 w-12" />} title="No audit entries" description="No admin actions match the current filters." />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            data={rows}
            columns={[
              { key: 'created_at', title: 'Timestamp', render: (_: any, r: any) => <span className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString('en-IN')}</span> },
              { key: 'causer', title: 'User', render: (_: any, r: any) => <span className="font-medium text-gray-900">{r.causer?.name ?? 'System'}</span> },
              { key: 'subject_type', title: 'Entity', render: (_: any, r: any) => <Badge variant="default" size="sm">{getEntityType(r.subject_type)}</Badge> },
              { key: 'subject_id', title: 'ID', render: (_: any, r: any) => <span className="font-mono text-xs">#{r.subject_id}</span> },
              { key: 'event', title: 'Action', render: (_: any, r: any) => <Badge variant={ACTION_VARIANT[r.event] ?? 'default'} size="sm">{r.event}</Badge> },
              { key: 'properties', title: 'Changes', render: (_: any, r: any) => {
                const props = r.properties;
                if (!props || typeof props !== 'object') return '—';
                const keys = Object.keys(props).filter(k => k !== 'old' && k !== 'attributes');
                if (keys.length === 0 && props.old) {
                  const changed = Object.keys(props.old).filter(k => JSON.stringify(props.old[k]) !== JSON.stringify(props.attributes?.[k]));
                  if (changed.length === 0) return '—';
                  return <span className="text-xs text-gray-500">{changed.join(', ')}</span>;
                }
                return <span className="text-xs text-gray-500 max-w-[200px] truncate block">{keys.slice(0, 3).join(', ')}</span>;
              }},
            ]}
          />
        </div>
      )}

      <TablePagination meta={meta} page={page} onPageChange={setPage} />
    </div>
  );
}
