import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { affiliatesApi } from '@/api/affiliates';
import { Card, Button, Input, Modal, Badge } from '@/components';
import Table from '@/components/Table';
import { cn } from '@/utils/cn';
import { toast } from '@/utils/toast';
import type { CommissionRule, CommissionRuleType } from '@/types/affiliate';
import { useCan } from '@/hooks/useCan';
import { ConfirmModal } from './ConfirmModal';
import { AffiliatePageHelp } from './AffiliatePageHelp';
// Single source: rate labels/reasons from backend money-meta.
import { useMoneyMeta, rateSourceLabel, rateSourceWhy, inr } from './moneyTruth';

const TABS: { key: CommissionRuleType; label: string }[] = [
  { key: 'default', label: 'Default' },
  { key: 'category', label: 'Category' },
  { key: 'product', label: 'Product' },
];

export default function CommissionRules() {
  const [tab, setTab] = useState<CommissionRuleType>('default');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CommissionRule | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const canManage = useCan('commission_rules.manage');
  const [simProductId, setSimProductId] = useState('');
  const [simProductLabel, setSimProductLabel] = useState('');
  const [simSource, setSimSource] = useState<'coupon' | 'link'>('coupon');
  const [simAffiliate, setSimAffiliate] = useState('');
  const [simAffiliates, setSimAffiliates] = useState<{ id: number; full_name: string; code: string }[]>([]);
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    affiliatesApi.list({ per_page: 100 }).then((r) => {
      setSimAffiliates((r.items ?? []).map((a: any) => ({ id: a.id, full_name: a.full_name, code: a.code })));
    }).catch(() => {});
  }, []);

  const { data, refetch, isLoading, isError } = useQuery({
    queryKey: ['commission-rules', tab],
    queryFn: () => affiliatesApi.listRules({ rule_type: tab }),
  });

  const queryClient = useQueryClient();
  const refreshAll = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['rule-coverage'] });
  };

  // Coverage analytics — margin-risk visibility at a glance
  const { data: coverage } = useQuery({
    queryKey: ['rule-coverage'],
    queryFn: () => affiliatesApi.ruleCoverage(),
  });

  const rules = data?.rules ?? [];
  // Single source: program rates for the top card + rate labels.
  const { data: moneyMeta } = useMoneyMeta();
  const { data: programSettings } = useQuery({
    queryKey: ['affiliate-settings-program-rates'],
    queryFn: () => affiliatesApi.programRates(),
    staleTime: 5 * 60_000,
  });

  async function performDelete(id: number) {
    try { await affiliatesApi.deleteRule(id); toast.success('Rule deleted'); refreshAll(); }
    catch (e) { console.error(e); toast.error('Failed'); throw e; }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Earning Rules</h1>
          <p className="mt-1 text-sm text-gray-600">How much affiliates earn — standard rates live in Settings, special rates live here</p>
          <div className="mt-3">
            <AffiliatePageHelp page="earning-rules" />
          </div>
        </div>
        {canManage && (
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            <PlusIcon className="h-4 w-4 mr-2" /> New rule
          </Button>
        )}
      </div>

      {/* Program rates card: the two Settings defaults that BEAT the rules
          below them. Single source: values from settings, winner order from
          money-meta hierarchy. */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-900">Program rates (apply first)</h3>
        <p className="mt-1 text-xs text-gray-500">
          These two Settings rates beat every product, category and default rule below.
          A personal rate on an affiliate beats even these.
        </p>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          {(['coupon', 'link'] as const).map((src) => {
            const raw = src === 'coupon' ? programSettings?.coupon_default : programSettings?.link_default;
            const set = raw !== null && raw !== undefined && raw !== '';
            return (
              <div key={src} className="rounded-md bg-gray-50 px-3 py-2">
                <span className="text-gray-500">{src === 'coupon' ? 'Coupon' : 'Link'} orders pay </span>
                <strong className="text-gray-900">{set ? `${raw}%` : 'no fixed rate'}</strong>
                <span className="text-gray-500"> {set ? '(program rate)' : '— catalog rules decide'}</span>
              </div>
            );
          })}
        </div>
        <Link to="/affiliates/settings" className="mt-2 inline-block text-xs font-medium text-primary-600 hover:underline">
          Change in Settings →
        </Link>
      </Card>

      {coverage && (
        <Card className={cn('p-4 flex flex-wrap items-center justify-between gap-3', coverage.uncovered_products > 0 && 'border-l-4 border-l-error-500')}>
          <div className="text-sm text-gray-700">
            {coverage.uncovered_products > 0 ? (
              <span>
                <strong className="text-error-600">{coverage.uncovered_products} products earn nothing</strong>
                {' '}— no rate anywhere (no rule, no custom rate, no program rate). Set one above or add a rule below.
              </span>
            ) : (
              <span>Every enabled product has a rate — nothing earns 0 by accident.</span>
            )}
            <span className="text-gray-400 text-xs ml-2">
              ({coverage.total_enabled_products} enabled · {coverage.disabled_products} switched off)
            </span>
          </div>
          <Link to="/affiliates/product-settings">
            <Button variant="outline" size="sm">See per-product rates</Button>
          </Link>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Check a product's earning</h3>
        <p className="text-xs text-gray-500 mb-3">Pick a product, who sells it, and where the order came from — same answer the order system gives.</p>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 max-w-xs min-w-[220px]">
            <ProductSearchInput
              initialLabel=""
              onSelect={(id, label) => { setSimProductId(String(id)); setSimProductLabel(label); }}
            />
          </div>
          <div className="max-w-[180px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">Order came from</label>
            <select
              value={simSource}
              onChange={(e) => setSimSource(e.target.value as 'coupon' | 'link')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="coupon">Coupon order</option>
              <option value="link">Link order</option>
            </select>
          </div>
          <div className="max-w-[220px] flex-1 min-w-[180px]">
            <label className="mb-1 block text-sm font-medium text-gray-700">For affiliate (optional)</label>
            <select
              value={simAffiliate}
              onChange={(e) => setSimAffiliate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Program rates (no personal override)</option>
              {simAffiliates.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name} ({a.code})</option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!simProductId) return;
              setSimLoading(true);
              try {
                // resolveBulk = same engine the order system uses (defaults,
                // overrides, exclusions included). The old simulate endpoint
                // ignored all of those and showed wrong rates.
                const result = await affiliatesApi.resolveRates(
                  [Number(simProductId)],
                  simSource === 'coupon' ? 'coupon' : undefined,
                  simAffiliate ? Number(simAffiliate) : undefined,
                );
                setSimResult({ ...(result?.resolutions?.[0] ?? null), _affiliateName: simAffiliates.find((a) => String(a.id) === simAffiliate)?.full_name });
              } catch (e: any) {
                toast.error('Check failed');
              } finally {
                setSimLoading(false);
              }
            }}
            loading={simLoading}
            disabled={!simProductId}
          >
            <MagnifyingGlassIcon className="h-4 w-4 mr-1" /> Check
          </Button>
        </div>
        {simResult && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Earning:</span>
              <Badge variant={simResult.rate > 0 ? 'success' : 'default'} size="sm">{rateSourceLabel(moneyMeta, simResult.rate_source)}</Badge>
              <span className="font-semibold text-gray-900">{simResult.rate}%</span>
            </div>
            <p className="text-gray-600 mt-1">
              On a {inr(1000)} order{simProductLabel ? ` for ${simProductLabel}` : ''}{' '}
              {simResult._affiliateName ? `${simResult._affiliateName}` : 'the affiliate'} would earn{' '}
              {inr((1000 * Number(simResult.rate || 0)) / 100)} — because{' '}
              {rateSourceWhy(moneyMeta, simResult.rate_source, simResult._affiliateName ?? '')}
            </p>
            {Array.isArray(simResult.beaten_by) && simResult.beaten_by.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs text-gray-500">
                {simResult.beaten_by.map((b: any) => (
                  <li key={b.source}>
                    {b.rate}% ({b.label}) ignored — {b.why}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      ) : rules.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-gray-500">No {tab} rules. Click "New rule" to add one.</p>
        </Card>
      ) : (
        <div className="bg-white rounded-lg shadow">
            <Table
            data={rules}
            columns={[
              { key: '_target', title: 'Applies to', render: (_: any, r: any) => <span className="font-medium text-gray-900">{r.rule_type === 'default' ? 'Everything else (fallback)' : r.rule_type === 'category' ? (r.category?.name ?? 'Category') + ` (#${r.category_id})` : (r.product?.name ?? 'Product') + ` (#${r.product_id})`}</span> },
              { key: 'rate', title: 'Pays', render: (_: any, r: any) => (
                <span className={Number(r.rate) === 0 ? 'font-semibold text-red-600' : ''}>
                  {r.rate}%{Number(r.rate) === 0 ? ' (excluded)' : ''}
                </span>
              ), align: 'right' as const },
              { key: 'is_active', title: 'Status', render: (_: any, r: any) => r.is_active ? <Badge variant="success" size="sm">Active</Badge> : <Badge variant="default" size="sm">Inactive</Badge> },
              { key: '_actions', title: 'Actions', render: (_: any, r: any) => (
                canManage ? (
                  <div className="flex items-center space-x-1">
                    <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => { setEditing(r); setModalOpen(true); }}><PencilIcon className="h-4 w-4" /></Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={() => setDeletingId(r.id)}><TrashIcon className="h-4 w-4 text-red-600" /></Button>
                  </div>
                ) : null
              ) },
            ]}
          />
        </div>
      )}

      {modalOpen && (
        <RuleModal
          open={modalOpen}
          rule={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={refreshAll}
          onEditExisting={(existing) => setEditing(existing)}
        />
      )}
      {deletingId != null && (
        <ConfirmModal
          open
          title="Delete this commission rule?"
          description="This will remove the rule. Existing commissions are not affected."
          confirmLabel="Delete"
          confirmVariant="destructive"
          onClose={() => setDeletingId(null)}
          onConfirm={() => performDelete(deletingId)}
        />
      )}
    </div>
  );
}

function RuleModal({ open, rule, onClose, onSaved, onEditExisting }: {
  open: boolean;
  rule: CommissionRule | null;
  onClose: () => void;
  onSaved: () => void;
  onEditExisting: (existing: CommissionRule) => void;
}) {
  const [ruleType, setRuleType] = useState<CommissionRuleType>(rule?.rule_type ?? 'default');
  const [categoryId, setCategoryId] = useState(String(rule?.category_id ?? ''));
  const [productId, setProductId] = useState(String(rule?.product_id ?? ''));
  const [productLabel, setProductLabel] = useState(
    rule?.product ? `${rule.product.name}` : ''
  );
  const [rate, setRate] = useState(String(rule?.rate ?? '4'));
  const [isActive, setIsActive] = useState(rule?.is_active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Server rejects duplicate active rules with 409 + existing rule payload.
  const [conflict, setConflict] = useState<{ id: number; rule: CommissionRule } | null>(null);
  // Live effective-rate preview (server-resolved truth, not client math)
  const [beforeRate, setBeforeRate] = useState<{ rate: number; rate_source: string } | null>(null);
  // Bulk mode (create only): apply one rate to many products at once
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [bulkIds, setBulkIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setRuleType(rule?.rule_type ?? 'default');
    setCategoryId(String(rule?.category_id ?? ''));
    setProductId(String(rule?.product_id ?? ''));
    setProductLabel(rule?.product?.name ?? '');
    setRate(String(rule?.rate ?? '4'));
    setIsActive(rule?.is_active ?? true);
    setConflict(null);
    setError(null);
  }, [rule?.id]);

  // Live preview: resolve the CURRENT effective rate from the server
  // whenever a product target is picked. Never client-side math — the
  // hierarchy (rules > custom > category > default > fallback) lives there.
  useEffect(() => {
    if (ruleType !== 'product' || !productId || Number(productId) <= 0) {
      setBeforeRate(null);
      return;
    }
    let cancelled = false;
    affiliatesApi.resolveRates([Number(productId)])
      .then((res) => {
        if (cancelled) return;
        const hit = res.resolutions.find((x) => x.product_id === Number(productId));
        if (hit) setBeforeRate({ rate: hit.rate, rate_source: hit.rate_source });
      })
      .catch(() => { if (!cancelled) setBeforeRate(null); });
    return () => { cancelled = true; };
  }, [ruleType, productId]);

  async function handleSubmit() {
    setSubmitting(true); setError(null); setConflict(null);
    try {
      const rateNum = parseFloat(rate);
      if (!Number.isFinite(rateNum) || rateNum < 0 || rateNum > 100) {
        setError('Rate must be a number between 0 and 100.');
        return;
      }
      const payload: any = { rule_type: ruleType, rate: rateNum, is_active: isActive };
      if (ruleType === 'category') {
        const cid = parseInt(categoryId, 10);
        if (!Number.isFinite(cid) || cid <= 0) { setError('Enter a valid category ID.'); return; }
        payload.category_id = cid;
      }
      if (ruleType === 'product') {
        const pid = parseInt(productId, 10);
        if (!Number.isFinite(pid) || pid <= 0) { setError('Enter a valid product ID.'); return; }
        payload.product_id = pid;
      }
      if (rule) { await affiliatesApi.updateRule(rule.id, payload); toast.success('Rule updated'); }
      else { await affiliatesApi.createRule(payload); toast.success('Rule created'); }
      onSaved(); onClose();
    } catch (e: any) {
      if (e?.response?.status === 409 && e?.response?.data?.errors?.existing_rule) {
        const existing = e.response.data.errors.existing_rule;
        setConflict({ id: existing.id, rule: existing });
        setError(e.response.data.message || 'An active rule already covers this target.');
      } else {
        setError(e?.response?.data?.message || e?.message || 'Failed');
      }
    } finally { setSubmitting(false); }
  }

  async function handleBulkSubmit() {
    setSubmitting(true); setError(null); setConflict(null);
    try {
      const rateNum = parseFloat(rate);
      if (!Number.isFinite(rateNum) || rateNum < 0 || rateNum > 100) {
        setError('Rate must be a number between 0 and 100.');
        return;
      }
      if (bulkIds.size === 0) {
        setError('Select at least one product.');
        return;
      }
      const r = await affiliatesApi.bulkCreateRules({
        product_ids: Array.from(bulkIds),
        rate: rateNum,
        is_active: isActive,
      });
      toast.success(
        r.skipped_count > 0
          ? `Created ${r.created_count}, skipped ${r.skipped_count} (already had active rules)`
          : `Created ${r.created_count} rules`
      );
      onSaved(); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Bulk create failed');
    } finally { setSubmitting(false); }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={(rule ? 'Edit' : mode === 'bulk' ? 'Bulk New' : 'New') + ' Commission Rule'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          {mode === 'bulk' && !rule ? (
            <Button onClick={handleBulkSubmit} disabled={submitting || bulkIds.size === 0} loading={submitting}>
              Create {bulkIds.size || ''} rule{bulkIds.size === 1 ? '' : 's'}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} loading={submitting}>
              {rule ? 'Update' : 'Create'}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {conflict && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              <strong>Rule #{conflict.id} already covers this target</strong> ({conflict.rule?.rate ?? '?'}%, active).
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => onEditExisting(conflict.rule)}
            >
              Edit existing rule instead
            </Button>
          </div>
        )}
        {error && !conflict && <p className="text-sm text-red-600">{error}</p>}

        {/* Mode toggle — creation only */}
        {!rule && (
          <div className="flex gap-2">
            {(['single', 'bulk'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); setConflict(null); }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  mode === m ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {m === 'single' ? 'Single product' : 'Multiple products (bulk)'}
              </button>
            ))}
          </div>
        )}

        {mode === 'single' && !rule && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rule type</label>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as CommissionRuleType)}
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="default">Default (applies to all products)</option>
              <option value="category">Category</option>
              <option value="product">Product</option>
            </select>
          </div>
        )}
        {!rule && mode === 'bulk' ? (
          <ProductMultiSelect
            selected={bulkIds}
            onToggle={(id) => {
              setBulkIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id); else next.add(id);
                return next;
              });
            }}
            onClear={() => setBulkIds(new Set())}
          />
        ) : (
          <>
            {ruleType === 'category' && (
              <CategorySelect value={categoryId} onChange={(id: string) => setCategoryId(id)} />
            )}
            {ruleType === 'product' && (
              <ProductSearchInput
                initialLabel={productLabel}
                onSelect={(id, label) => { setProductId(String(id)); setProductLabel(label); }}
              />
            )}
          </>
        )}
        <Input
          label="Commission rate (%)"
          type="number"
          step="0.01"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          helper="0% means the products are excluded."
        />
        {!rule && mode === 'bulk' && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
            Will apply <strong>{rate || 0}%</strong> to <strong>{bulkIds.size}</strong> selected product{bulkIds.size === 1 ? '' : 's'}.
            Products that already have an active rule are skipped (reported after save).
          </div>
        )}
        {ruleType === 'product' && beforeRate && (
          <RuleBeforeAfter beforeRate={beforeRate} rate={rate} />
        )}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span>Active</span>
        </label>
      </div>
    </Modal>
  );
}

function RuleBeforeAfter({ beforeRate, rate }: { beforeRate: { rate: number; rate_source: string }; rate: string }) {
  const { data: meta } = useMoneyMeta();
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
      <p>
        Currently:{' '}
        <strong className={beforeRate.rate <= 0 ? 'text-red-600' : 'text-gray-900'}>
          {beforeRate.rate}%
        </strong>{' '}
        <span className="text-gray-500">({rateSourceLabel(meta, beforeRate.rate_source)} — {rateSourceWhy(meta, beforeRate.rate_source)})</span>
      </p>
      <p>
        After saving:{' '}
        <strong className={parseFloat(rate) <= 0 ? 'text-red-600' : 'text-primary-700'}>
          {rate || 0}%
        </strong>{' '}
        <span className="text-gray-500">(your new product rule)</span>
      </p>
      {parseFloat(rate) === 0 && (
        <p className="text-xs text-red-600 mt-1">⚠ A 0% rule excludes this product from commissions.</p>
      )}
      {Number(beforeRate.rate) === parseFloat(rate) && (
        <p className="text-xs text-gray-400 mt-1">No change to the effective rate.</p>
      )}
      <p className="text-xs text-gray-400 mt-1.5">
        Rate is locked at order placement — later rule changes never rewrite past commissions.
      </p>
    </div>
  );
}

/**
 * Search-as-you-type product picker. Replaces manual numeric ID entry —
 * admins pick from real products (name + SKU + id) instead of guessing.
 */
function ProductSearchInput({ initialLabel, onSelect }: {
  initialLabel: string;
  onSelect: (id: number, label: string) => void;
}) {
  const [query, setQuery] = useState(initialLabel);
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2 || query === initialLabel) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      affiliatesApi.searchProducts(query.trim())
        .then((rows) => { setResults(rows); setOpen(true); })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="relative">
      <Input
        label="Product"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        placeholder={initialLabel ? initialLabel : 'Type to search by name or SKU…'}
        helper={initialLabel ? 'Currently targeting this product. Type to change.' : undefined}
      />
      {loading && <p className="text-xs text-gray-400 mt-1">Searching…</p>}
      {!loading && open && query.trim().length >= 2 && (
        results.length > 0 ? (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                onClick={() => { onSelect(p.id, p.name ?? `#${p.id}`); setQuery(p.name ?? `#${p.id}`); setOpen(false); }}
              >
                <span className="font-medium text-gray-900">{p.name}</span>
                <span className="text-xs text-gray-400 ml-2">#{p.id}{p.sku ? ` · ${p.sku}` : ''}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-1">No products match.</p>
        )
      )}
    </div>
  );
}

/** Category dropdown fed once from the admin categories endpoint. */
function CategorySelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    affiliatesApi.listCategories()
      .then((rows) => { if (!cancelled) setCats(rows); })
      .catch(() => { if (!cancelled) setCats([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500"
      >
        <option value="">{loading ? 'Loading categories…' : 'Select a category'}</option>
        {cats.map((c) => (
          <option key={c.id} value={String(c.id)}>{c.name} (#{c.id})</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Multi-select product picker for bulk rule creation. Same search endpoint
 * as the single picker; checkbox rows toggle membership in the selection.
 */
function ProductMultiSelect({ selected, onToggle, onClear }: {
  selected: Set<number>;
  onToggle: (id: number) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    const t = setTimeout(() => {
      affiliatesApi.searchProducts(query.trim())
        .then((rows) => { setResults(rows); setSearched(true); })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-gray-700">Products ({selected.size} selected)</label>
        {selected.size > 0 && (
          <button type="button" onClick={onClear} className="text-xs text-primary-600 hover:underline">
            Clear selection
          </button>
        )}
      </div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products by name or SKU…"
      />
      {loading && <p className="text-xs text-gray-400 mt-1">Searching…</p>}
      {!loading && searched && query.trim().length >= 2 && (
        results.length > 0 ? (
          <div className="mt-1 bg-white border border-gray-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-gray-100">
            {results.map((p) => {
              const checked = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onToggle(p.id)}
                  className={cn('w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50', checked && 'bg-primary-50')}
                >
                  <input type="checkbox" readOnly checked={checked} className="h-4 w-4 pointer-events-none" />
                  <span className={cn('flex-1', checked ? 'font-medium text-gray-900' : 'text-gray-700')}>{p.name}</span>
                  <span className="text-xs text-gray-400">#{p.id}{p.sku ? ` · ${p.sku}` : ''}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-1">No products match.</p>
        )
      )}
      {selected.size > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
          {Array.from(selected).map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary-50 border border-primary-200 px-2 py-0.5 text-xs text-primary-700">
              #{id}
              <button type="button" onClick={() => onToggle(id)} className="text-primary-400 hover:text-primary-600" aria-label={`Remove ${id}`}>×</button>
            </span>
          ))}
        </div>
      )}
      {selected.size >= 1 && selected.size <= 5 && (
        <p className="text-xs text-gray-400 mt-1.5">
          Tip: for hundreds of products at once, a category or default rule usually fits better than bulk-picking.
        </p>
      )}
    </div>
  );
}
