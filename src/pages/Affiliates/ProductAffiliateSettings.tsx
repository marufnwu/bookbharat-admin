import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '@/api/axios';
import { affiliatesApi } from '@/api/affiliates';
import { Card, Button, Input, Badge } from '@/components';
import Table from '@/components/Table';
import { toast } from '@/utils/toast';

function unwrap<T>(res: { data: any }): T {
  const body = res.data;
  if (body?.success === false) throw new Error(body.message || 'API error');
  return body?.data as T;
}

/**
 * Transparency layer: shows the EFFECTIVE commission rate per product and
 * WHICH source won the resolution hierarchy. Inputs (toggle, custom rate)
 * can be silently overridden by higher-priority rules — this column makes
 * that visible so admins don't leak margin unknowingly.
 */
const SOURCE_META: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary' }> = {
  product_rule:            { label: 'Product rule',      variant: 'info' },
  custom_product:          { label: 'Custom rate',       variant: 'primary' },
  category_rule:           { label: 'Category rule',     variant: 'success' },
  default_rule:            { label: 'Default rule',      variant: 'default' },
  no_rule:                 { label: 'No rule — 0%',      variant: 'error' },
  disabled:                { label: 'Disabled',          variant: 'error' },
  affiliate_override_coupon: { label: 'Override (coupon)', variant: 'primary' },
  affiliate_override_link:   { label: 'Override (link)',   variant: 'primary' },
  global_default_coupon:     { label: 'Default (coupon)',  variant: 'info' },
  global_default_link:       { label: 'Default (link)',    variant: 'info' },
};

export default function ProductAffiliateSettings() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['product-affiliate-settings', search, page],
    queryFn: () => api.get('/products', { params: { search: search || undefined, page, per_page: 25 } })
      .then((res) => ({
        items: (res.data?.data?.data ?? res.data?.data ?? []) as any[],
        meta: res.data?.data ?? res.data?.meta,
      })),
    placeholderData: keepPreviousData,
  });

  const rows = data?.items ?? [];

  // Resolve effective rates for the current page's products
  const [rates, setRates] = useState<Record<number, { rate: number; rate_source: string }>>({});
  useEffect(() => {
    const ids = rows.map((r: any) => r.id).filter(Boolean);
    if (ids.length === 0) return;
    let cancelled = false;
    affiliatesApi.resolveRates(ids)
      .then((res) => {
        if (cancelled) return;
        const map: Record<number, { rate: number; rate_source: string }> = {};
        res.resolutions.forEach((r) => { map[r.product_id] = { rate: r.rate, rate_source: r.rate_source }; });
        setRates(map);
      })
      .catch(() => { /* column falls back to '—' on failure */ });
    return () => { cancelled = true; };
  }, [JSON.stringify(rows.map((r: any) => r.id))]);

  async function toggleAffiliate(productId: number, enabled: boolean) {
    try {
      await api.put(`/products/${productId}`, { affiliate_enabled: enabled });
      toast.success(enabled ? 'Affiliate enabled' : 'Affiliate disabled');
      refetch();
    } catch (e: any) {
      toast.error('Failed to update');
    }
  }

  function renderEffective(r: any) {
    const info = rates[r.id];
    if (!info) return <span className="text-gray-400 text-xs">…</span>;
    const meta = SOURCE_META[info.rate_source] ?? { label: info.rate_source, variant: 'default' as const };
    const danger = info.rate_source === 'disabled' || info.rate <= 0;
    return (
      <div className="flex items-center justify-end gap-2">
        <span className={danger ? 'font-semibold text-red-600' : 'font-semibold text-gray-900'}>
          {info.rate}%
        </span>
        <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Product Affiliate Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Effective rates show what affiliates actually earn after rule priority:
          product rule → custom rate → category rule → default rule → settings.
        </p>
      </div>

      <Card className="p-4 border-l-4 border-l-error-500 bg-error-50/40">
        <p className="text-sm text-error-700">
          <strong>Earning is opt-in:</strong> products show{' '}
          <Badge variant="error" size="sm">No rule — 0%</Badge>{' '}
          until you create a product/category/default rule or set a custom rate. There is no silent fallback —
          nothing earns commission unless configured here.
        </p>
      </Card>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <Table
            data={rows}
            columns={[
              { key: 'id', title: 'ID', render: (_: any, r: any) => <span className="font-mono text-xs">#{r.id}</span> },
              { key: 'name', title: 'Product', render: (_: any, r: any) => <span className="font-medium text-gray-900">{r.name ?? r.title}</span> },
              { key: 'sku', title: 'SKU', render: (_: any, r: any) => <span className="font-mono text-xs">{r.sku ?? '—'}</span> },
              { key: 'affiliate_enabled', title: 'Affiliate', render: (_: any, r: any) => (
                <button
                  onClick={() => toggleAffiliate(r.id, !r.affiliate_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${r.affiliate_enabled ? 'bg-primary-600' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${r.affiliate_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              )},
              { key: 'commission_type', title: 'Type', render: (_: any, r: any) => r.commission_type ?? 'default' },
              { key: 'custom_commission_rate', title: 'Custom Rate Input', render: (_: any, r: any) => r.custom_commission_rate != null ? r.custom_commission_rate + '%' : '—', align: 'right' as const },
              { key: '_effective', title: 'Effective Rate', align: 'right' as const, render: renderEffective },
            ]}
          />
        </div>
      )}
    </div>
  );
}
