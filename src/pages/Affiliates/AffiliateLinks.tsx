import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { affiliatesApi } from '@/api/affiliates';
import { Card, Button, Input, LoadingSpinner, EmptyState, TablePagination } from '@/components';
import Table from '@/components/Table';
import { LinkIcon } from '@heroicons/react/24/outline';

export default function AffiliateLinks() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['affiliate-links', search, page],
    queryFn: () => affiliatesApi.listLinks({ q: search || undefined, page, per_page: 25 }),
    placeholderData: keepPreviousData,
  });

  const rows = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Affiliate Links</h1>
        <p className="mt-1 text-sm text-gray-600">All referral links across affiliates</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search by code or affiliate name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <Card className="p-6">
          <p className="text-sm text-error-600 font-medium mb-2">Failed to load links.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : rows.length === 0 ? (
        <EmptyState icon={<LinkIcon className="h-12 w-12" />} title="No affiliate links" description="Affiliate links are created automatically when affiliates generate share links for products." />
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            data={rows}
            columns={[
              { key: 'affiliate_name', title: 'Affiliate', render: (_: any, r: any) => <span className="font-medium text-gray-900">{r.affiliate?.full_name ?? '—'}</span> },
              { key: 'code', title: 'Code', render: (_: any, r: any) => <span className="font-mono text-xs">{r.code}</span> },
              { key: 'product_name', title: 'Product', render: (_: any, r: any) => r.product?.name ?? `Product #${r.product_id}` },
              { key: 'clicks_count', title: 'Clicks', render: (_: any, r: any) => r.clicks_count ?? 0, align: 'right' as const },
              { key: 'orders_count', title: 'Orders', render: (_: any, r: any) => r.orders_count ?? 0, align: 'right' as const },
              { key: '_conv', title: 'Conv %', render: (_: any, r: any) => { const c = r.clicks_count ?? 0; const o = r.orders_count ?? 0; return c > 0 ? ((o / c) * 100).toFixed(2) + '%' : '0.00%'; }, align: 'right' as const },
              { key: 'url', title: 'URL', render: (_: any, r: any) => r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs truncate max-w-[200px] block">{r.url}</a> : '—' },
            ]}
          />
        </div>
      )}

      <TablePagination meta={meta} page={page} onPageChange={setPage} />
    </div>
  );
}
