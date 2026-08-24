import { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  PauseIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { affiliatesApi, downloadCsv, sanitizeCsvCell } from '@/api/affiliates';
import { Card, CardContent, Button, Input, Badge, LoadingSpinner, EmptyState, TablePagination } from '@/components';
import Table from '@/components/Table';
import { AffiliateStatusBadge } from './StatBadge';
import { ReasonModal } from './ReasonModal';
import { useCan } from '@/hooks/useCan';
import { cn } from '@/utils/cn';
import { toast } from '@/utils/toast';
import type { Affiliate, AffiliateStatus } from '@/types/affiliate';

const STATUS_TABS: { key: AffiliateStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'blocked', label: 'Blocked' },
];

export default function AffiliateList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AffiliateStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<
    | { kind: 'reject' | 'suspend' | 'block'; affiliate: Affiliate }
    | null
  >(null);
  const canManage = useCan('affiliates.manage');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['affiliates', tab, debouncedSearch, page],
    queryFn: () => affiliatesApi.list({
      status: tab === 'all' ? undefined : tab,
      q: debouncedSearch || undefined,
      page,
      per_page: 20,
    }),
    placeholderData: keepPreviousData,
  });

  const { data: pendingCount } = useQuery({
    queryKey: ['affiliates-pending-count'],
    queryFn: () => affiliatesApi.list({ status: 'pending', per_page: 1 }),
    placeholderData: keepPreviousData,
    enabled: tab !== 'pending',
    refetchInterval: 60_000,
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

  async function handleReactivate(a: Affiliate) {
    try {
      await affiliatesApi.reactivate(a.id);
      toast.success('Affiliate reactivated');
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
      throw e;
    }
  }

  function exportCsv() {
    const headers = ['Name', 'Email', 'Code', 'Status', 'Joined', 'PAN', 'GSTIN'];
    const rows = items.map((a) => [
      a.full_name,
      a.email,
      a.code,
      a.status,
      a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '',
      a.pan ?? '',
      a.gstin ?? '',
    ]);
    downloadCsv(`affiliates-${Date.now()}.csv`, headers, rows);
    if (meta && meta.last_page > 1) {
      toast(`Exported current page (1 of ${meta.last_page}). Use Reports → Performance for full export.`, { icon: 'ℹ️' });
    }
  }

  const items = data?.items ?? [];
  const meta = data?.meta;

  const columns = [
    { key: 'full_name', title: 'Name', render: (_: any, a: Affiliate) => <span className="font-medium text-gray-900">{a.full_name}</span> },
    { key: 'email', title: 'Email' },
    { key: 'code', title: 'Code', render: (_: any, a: Affiliate) => <span className="font-mono text-xs">{a.code}</span> },
    { key: 'status', title: 'Status', render: (_: any, a: Affiliate) => <AffiliateStatusBadge status={a.status} /> },
    {
      key: 'created_at',
      title: 'Joined',
      render: (_: any, a: Affiliate) => new Date(a.created_at).toLocaleDateString('en-IN'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Affiliates</h1>
          <p className="mt-1 text-sm text-gray-600">Manage affiliate partners and their performance</p>
        </div>
        {items.length > 0 && canManage && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((t) => {
          const showPendingBadge = t.key === 'pending' && tab !== 'pending' && pendingCount?.meta?.total;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1); }}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              )}
            >
              {t.label}
              {showPendingBadge && (
                <span className={cn(
                  'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold',
                  tab === t.key ? 'bg-white text-primary-700' : 'bg-warning-100 text-warning-700'
                )}>
                  {pendingCount!.meta!.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by name, email, code..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <Card className="p-6">
          <p className="text-sm text-error-600 font-medium mb-2">Failed to load affiliates.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-12 w-12" />}
          title="No affiliates in this view"
          description="Try a different status filter or clear the search."
        />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            data={items}
            columns={[
              ...columns,
              {
                key: '_actions',
                title: 'Actions',
                render: (_: any, a: Affiliate) => (
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    {a.status === 'pending' && canManage && (
                      <>
                        <Button size="icon-sm" variant="ghost" onClick={() => handleApprove(a)} title="Approve" aria-label={`Approve ${a.full_name}`}>
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" onClick={() => setModal({ kind: 'reject', affiliate: a })} title="Reject" aria-label={`Reject ${a.full_name}`}>
                          <XCircleIcon className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                    {a.status === 'active' && canManage && (
                      <>
                        <Button size="icon-sm" variant="ghost" onClick={() => setModal({ kind: 'suspend', affiliate: a })} title="Suspend" aria-label={`Suspend ${a.full_name}`}>
                          <PauseIcon className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" onClick={() => setModal({ kind: 'block', affiliate: a })} title="Block" aria-label={`Block ${a.full_name}`}>
                          <NoSymbolIcon className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                    {a.status === 'suspended' && canManage && (
                      <Button size="icon-sm" variant="ghost" onClick={() => handleReactivate(a)} title="Re-activate" aria-label={`Re-activate ${a.full_name}`}>
                        <ArrowPathIcon className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            onRowClick={(a: Affiliate) => navigate(`/affiliates/${a.id}`)}
          />
        </div>
      )}

      <TablePagination meta={meta} page={page} onPageChange={setPage} />

      {modal && (
        <ReasonModal
          open
          title={
            modal.kind === 'reject' ? `Reject ${modal.affiliate.full_name}?` :
              modal.kind === 'suspend' ? `Suspend ${modal.affiliate.full_name}?` :
                `Block ${modal.affiliate.full_name}?`
          }
          description={
            modal.kind === 'reject' ? 'They can reapply 30 days after rejection.' : 'You can change this from the affiliate detail page.'
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
