import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, Button } from '@/components';
import Table from '@/components/Table';
import { affiliatesApi, downloadCsv } from '@/api/affiliates';
import { useCan } from '@/hooks/useCan';
import { toast } from '@/utils/toast';

const fmt = (n: unknown): string => {
  const num = Number(n);
  if (!Number.isFinite(num)) return 'INR —';
  return 'INR ' + num.toLocaleString('en-IN');
};

export default function AffiliateReports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('sales_total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const canView = useCan('affiliate_reports.view');

  const { data: liability, isLoading: loadingLiability, isError: errLiability, refetch: refetchLiability } = useQuery({
    queryKey: ['affiliate-liability'],
    queryFn: () => affiliatesApi.liability(),
    enabled: canView,
  });

  const { data: performance, isLoading: loadingPerf, isError: errPerf, refetch: refetchPerf } = useQuery({
    queryKey: ['affiliate-perf', startDate, endDate, sortBy, sortDir],
    queryFn: () => affiliatesApi.performanceReport({ start_date: startDate || undefined, end_date: endDate || undefined, sort_by: sortBy, sort_direction: sortDir }),
    enabled: canView,
  });

  const { data: products, isLoading: loadingProducts, isError: errProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['affiliate-products'],
    queryFn: () => affiliatesApi.productsReport(),
    enabled: canView,
  });

  function exportCsv() {
    const rows = performance?.rows ?? [];
    if (!rows.length) return;
    const headers = ['Affiliate', 'Code', 'Clicks', 'Orders', 'Sales', 'Earned', 'Paid', 'Conversion %'];
    downloadCsv('affiliate-performance-' + Date.now() + '.csv', headers, rows.map((r) => [
      r.full_name, r.code, r.clicks_count, r.orders_count, r.sales_total, r.commission_earned, r.commission_paid,
      r.clicks_count > 0 ? ((r.orders_count / r.clicks_count) * 100).toFixed(2) : '0.00',
    ]));
  }

  function exportProductsCsv() {
    const rows = products?.rows ?? [];
    if (!rows.length) { toast.error('No product data to export'); return; }
    downloadCsv(
      'affiliate-products-' + Date.now() + '.csv',
      ['Product', 'Units sold', 'Affiliates', 'Commission cost'],
      rows.map((r) => [r.name, r.units_sold, r.affiliate_count, r.commission_cost])
    );
  }

  async function loadPayoutsReport() {
    try {
      const data = await affiliatesApi.payoutsReport();
      const rows = data?.payouts ?? [];
      if (!rows.length) { toast.error('No payout data to export'); return; }
      downloadCsv(
        'affiliate-payouts-' + Date.now() + '.csv',
        ['Request #', 'Affiliate', 'Amount requested', 'TDS', 'Net', 'Status', 'Requested at', 'Processed at'],
        rows.map((p) => [p.request_number, p.affiliate_name ?? p.affiliate_id, p.amount_requested, p.tds_amount, p.amount_net, p.status, p.requested_at, p.processed_at])
      );
    } catch (e) { console.error(e); toast.error('Failed to export payouts'); }
  }

  if (!canView) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Access denied</h2>
        <p className="text-sm text-gray-500">
          You need the <code className="font-mono text-xs">affiliate_reports.view</code> permission to view reports. Ask an admin to grant it.
        </p>
      </Card>
    );
  }

  const rows = performance?.rows ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Affiliate Reports</h1>
          <p className="mt-1 text-sm text-gray-600">Performance metrics and financial reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> Performance CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportProductsCsv}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> Products CSV
          </Button>
          <Button variant="outline" size="sm" onClick={loadPayoutsReport}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> Payouts CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => affiliatesApi.downloadPerformancePdf({ start_date: startDate || undefined, end_date: endDate || undefined })}>
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" /> PDF Report
          </Button>
        </div>
      </div>

      {loadingLiability ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : errLiability ? (
        <Card className="p-6">
          <p className="text-sm text-error-600 font-medium mb-2">Failed to load liability.</p>
          <Button variant="outline" size="sm" onClick={() => refetchLiability()}>Retry</Button>
        </Card>
      ) : liability ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 border-l-4 border-l-primary-500">
            <p className="text-xs text-gray-500 mb-1">Outstanding liability</p>
            <p className="text-2xl font-bold text-primary-600">{fmt(liability.outstanding_liability)}</p>
            <p className="text-xs text-gray-400 mt-1">Approved, not yet paid</p>
          </Card>
          <Card className="p-6">
            <p className="text-xs text-gray-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(liability.pending)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-xs text-gray-500 mb-1">Paid</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(liability.paid)}</p>
          </Card>
          <Card className="p-6">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(liability.total)}</p>
          </Card>
        </div>
      ) : null}

      <Card className="p-4">
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear</Button>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="sales_total">Sales</option>
              <option value="orders_count">Orders</option>
              <option value="commission_earned">Commission Earned</option>
              <option value="clicks_count">Clicks</option>
              <option value="full_name">Name</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="desc">Highest first</option>
              <option value="asc">Lowest first</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Affiliate Performance</h2>
        </div>
        <CardContent>
          {loadingPerf ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
          ) : errPerf ? (
            <div>
              <p className="text-sm text-error-600 font-medium mb-2">Failed to load performance.</p>
              <Button variant="outline" size="sm" onClick={() => refetchPerf()}>Retry</Button>
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500">No data.</p>
          ) : (
            <Table
              data={rows}
              columns={[
                { key: 'rank', title: '#', render: (_: any, r: any) => <span className="font-bold text-gray-900">{r.rank ?? '—'}</span>, align: 'right' as const },
                { key: 'full_name', title: 'Affiliate', render: (_: any, r: any) => <span className="font-medium text-gray-900">{r.full_name}</span> },
                { key: 'code', title: 'Code', render: (_: any, r: any) => <span className="font-mono text-xs">{r.code}</span> },
                { key: 'clicks_count', title: 'Clicks', render: (_: any, r: any) => r.clicks_count, align: 'right' as const },
                { key: 'orders_count', title: 'Orders', render: (_: any, r: any) => r.orders_count, align: 'right' as const },
                { key: 'sales_total', title: 'Sales', render: (_: any, r: any) => fmt(r.sales_total), align: 'right' as const },
                { key: 'commission_earned', title: 'Earned', render: (_: any, r: any) => fmt(r.commission_earned), align: 'right' as const },
                { key: 'commission_paid', title: 'Paid', render: (_: any, r: any) => fmt(r.commission_paid), align: 'right' as const },
                { key: '_conv', title: 'Conv %', render: (_: any, r: any) => (r.clicks_count > 0 ? ((r.orders_count / r.clicks_count) * 100).toFixed(2) : '0.00') + '%', align: 'right' as const },
              ]}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Product Performance</h2>
        </div>
        <CardContent>
          {loadingProducts ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
          ) : errProducts ? (
            <div>
              <p className="text-sm text-error-600 font-medium mb-2">Failed to load product performance.</p>
              <Button variant="outline" size="sm" onClick={() => refetchProducts()}>Retry</Button>
            </div>
          ) : (
            <Table
              data={products?.rows ?? []}
              columns={[
                { key: 'name', title: 'Product', render: (_: any, r: any) => <span className="font-medium text-gray-900">{r.name}</span> },
                { key: 'units_sold', title: 'Units', render: (_: any, r: any) => r.units_sold, align: 'right' as const },
                { key: 'affiliate_count', title: 'Affiliates', render: (_: any, r: any) => r.affiliate_count, align: 'right' as const },
                { key: 'commission_cost', title: 'Commission cost', render: (_: any, r: any) => fmt(r.commission_cost), align: 'right' as const },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
