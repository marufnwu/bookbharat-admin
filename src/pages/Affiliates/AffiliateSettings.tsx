import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import {
  Card,
  CardContent,
  Button,
  LoadingSpinner,
  Banner,
} from '@/components';
import { Select, Textarea } from '@/components/Input';
import { toast } from '@/utils/toast';
import { AffiliatePageHelp } from './AffiliatePageHelp';
import { useMoneyMeta, settingLabel, workedExample, inr } from './moneyTruth';
import {
  AdjustmentsHorizontalIcon,
  CursorArrowRaysIcon,
  ReceiptPercentIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  TicketIcon,
  WalletIcon,
  BuildingLibraryIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

function unwrap<T>(res: { data: any }): T {
  const body = res.data;
  if (body?.success === false) throw new Error(body.message || 'API error');
  return body?.data as T;
}

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

type FieldType = 'switch' | 'number' | 'select' | 'textarea' | string;

interface FieldMeta {
  value: any;
  type: FieldType;
  label?: string;
  description?: string;
  options?: Record<string, string> | null;
  option_labels?: Record<string, string> | null;
  min?: number | null;
  max?: number | null;
  sort_order?: number;
  is_editable?: boolean;
  nullable?: boolean;
  depends_on?: string | null;
}

type GroupData = Record<string, FieldMeta> | undefined;

const SECTION_TITLES: Record<string, string> = {
  // Program (5) — absorbs old Applications card
  program_enabled: 'Program',
  registration_enabled: 'Program',
  new_affiliate_auto_approve: 'Program',
  reapply_lock_days: 'Program',
  payouts_enabled: 'Program',

  // Attribution (5)
  click_tracking_enabled: 'Attribution',
  attribution_window: 'Attribution',
  attribution_model: 'Attribution',
  attribution_priority: 'Attribution',
  click_archive_days: 'Attribution',

  // Earning (13): one matrix — rates + gates + safety. Coupon orders |
  // link orders side by side instead of 13 scattered rows.
  commission_base: 'Earning',
  coupon_default_commission_rate: 'Earning',
  link_default_commission_rate: 'Earning',
  commission_max_per_order: 'Earning',
  min_order_for_commission_coupon: 'Earning',
  min_order_for_commission_link: 'Earning',
  first_order_only_commission_coupon: 'Earning',
  first_order_only_commission_link: 'Earning',
  commission_per_customer_limit_coupon: 'Earning',
  commission_per_customer_limit_link: 'Earning',
  total_commission_limit_coupon: 'Earning',
  total_commission_limit_link: 'Earning',
  return_period_days: 'Earning',

  // Coupons (5)
  coupon_discount: 'Coupons',
  coupon_max_discount_percent: 'Coupons',
  coupon_validity_days: 'Coupons',
  coupon_maximum_discount_amount: 'Coupons',
  coupon_per_customer_limit: 'Coupons',

  // Payouts (1)
  minimum_payout: 'Payouts',

  // Tax & KYC (5)
  tds_enabled: 'Tax & KYC',
  tds_rate_individual: 'Tax & KYC',
  tds_rate_other: 'Tax & KYC',
  tds_threshold_amount: 'Tax & KYC',
  require_pan_above_amount: 'Tax & KYC',

  // Fraud & Risk (4)
  click_velocity_per_minute: 'Fraud & Risk',
  click_dedupe_window_minutes: 'Fraud & Risk',
  leak_ratio_threshold: 'Fraud & Risk',
  leak_min_clicks: 'Fraud & Risk',
  leak_min_orders: 'Fraud & Risk',

  // Terms (1)
  terms: 'Terms',
};

interface SectionMeta {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
}

const SECTION_META: Record<string, SectionMeta> = {
  Program: {
    icon: AdjustmentsHorizontalIcon,
    description: 'Whether the program operates and who can join',
  },
  Attribution: {
    icon: CursorArrowRaysIcon,
    description: 'Who gets credit when an order happens',
  },
  Earning: {
    icon: ReceiptPercentIcon,
    description: 'How much affiliates earn and which orders count — coupon vs link side by side',
  },
  Coupons: {
    icon: TicketIcon,
    description: 'Customer-facing discount rules for affiliate coupons',
  },
  Payouts: {
    icon: WalletIcon,
    description: 'Withdrawal thresholds',
  },
  'Tax & KYC': {
    icon: BuildingLibraryIcon,
    description: 'Section 194H tax deduction and PAN requirements',
  },
  'Fraud & Risk': {
    icon: ShieldExclamationIcon,
    description: 'Click abuse and coupon-leakage detection — flags affiliates in the Audit Log for review',
  },
  Terms: {
    icon: DocumentTextIcon,
    description: 'Shown to applicants during registration',
  },
};

const FALLBACK_SECTION_META: SectionMeta = {
  icon: CogIcon,
  description: '',
};

// Single source: labels + presets come from moneyTruth (backend-owned
// money-meta). No per-page copies — backend MoneyTruth::meta() is the
// authority. Fallbacks below only render before meta loads.
// Sections shown in simple mode. Everything else hides behind
// "Show advanced" — still functional, just not visible by default.
const SIMPLE_SECTIONS = ['Program', 'Earning', 'Coupons', 'Payouts', 'Tax & KYC'];

const SECTION_ORDER = [
  'Program',
  'Attribution',
  'Earning',
  'Coupons',
  'Payouts',
  'Tax & KYC',
  'Fraud & Risk',
  'Terms',
];

// Earning matrix rows: label + the two settings keys (coupon | link).
// Rendered as one table instead of 13 scattered rows.
const EARNING_MATRIX: { label: string; coupon: string; link: string }[] = [
  { label: 'Affiliate earns', coupon: 'coupon_default_commission_rate', link: 'link_default_commission_rate' },
  { label: 'Min order to earn', coupon: 'min_order_for_commission_coupon', link: 'min_order_for_commission_link' },
  { label: 'First order only', coupon: 'first_order_only_commission_coupon', link: 'first_order_only_commission_link' },
  { label: 'Max orders per buyer', coupon: 'commission_per_customer_limit_coupon', link: 'commission_per_customer_limit_link' },
  { label: 'Max lifetime orders', coupon: 'total_commission_limit_coupon', link: 'total_commission_limit_link' },
];

type Adornment = 'percent' | 'currency';

const FIELD_ADORNMENT: Record<string, Adornment> = {
  coupon_discount: 'percent',
  coupon_max_discount_percent: 'percent',
  coupon_default_commission_rate: 'percent',
  link_default_commission_rate: 'percent',
  tds_rate_individual: 'percent',
  tds_rate_other: 'percent',
  minimum_payout: 'currency',
  require_pan_above_amount: 'currency',
  coupon_maximum_discount_amount: 'currency',
  commission_max_per_order: 'currency',
  min_order_for_commission_coupon: 'currency',
  min_order_for_commission_link: 'currency',
  tds_threshold_amount: 'currency',
};

function toBool(v: any): boolean {
  return v === true || v === 1 || v === '1' || v === 'true';
}

function selectOptions(meta: FieldMeta): { value: string; label: string }[] {
  const opts = meta.options;
  if (!opts) return [];
  if (Array.isArray(opts)) {
    return opts.map((v) => ({ value: String(v), label: String(v) }));
  }
  return Object.entries(opts).map(([value, label]) => ({
    value: String(value),
    label: String(label),
  }));
}

export default function AffiliateSettings() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('Program');
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Single source: labels/presets/hierarchy from backend money-meta.
  const { data: moneyMeta } = useMoneyMeta();

  const {
    data: server,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['affiliate-settings'],
    queryFn: () => api.get('/settings/affiliate').then((res) => unwrap<GroupData>(res)),
  });

  useEffect(() => {
    if (server) setDraft({});
  }, [server]);

  function getVal(key: string): any {
    if (key in draft) return draft[key];
    return server?.[key]?.value;
  }

  function isDirty(key: string): boolean {
    return key in draft;
  }

  function update(key: string, value: any) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  const dirtyCount = Object.keys(draft).length;

  async function handleSave() {
    if (dirtyCount === 0) return;
    setSaving(true);
    try {
      await api.put('/settings/affiliate', draft);
      // Clear optimistically — do NOT rely on the refetch effect, because
      // react-query's structural sharing keeps the identical payload by
      // reference and would leave `draft` (and the dirty UI) stuck.
      setDraft({});
      toast.success(`Saved ${dirtyCount} setting${dirtyCount === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: ['affiliate-settings'] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const grouped: Record<string, { key: string; meta: FieldMeta }[]> = useMemo(() => {
    const map: Record<string, { key: string; meta: FieldMeta }[]> = {};
    if (!server) return map;
    const entries = Object.entries(server)
      .filter(([, m]) => m.is_editable !== false)
      .sort(([, a], [, b]) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    for (const [key, meta] of entries) {
      const section = SECTION_TITLES[key] ?? 'Other';
      if (!map[section]) map[section] = [];
      map[section].push({ key, meta });
    }
    return map;
  }, [server]);

  const orderedSections = useMemo(() => {
    const known = SECTION_ORDER.filter((s) => grouped[s]);
    const unknown = Object.keys(grouped).filter((s) => !SECTION_ORDER.includes(s));
    const all = [...known, ...unknown];
    // Simple mode hides the technical sections. Advanced toggle reveals them.
    if (!showAdvanced) return all.filter((s) => SIMPLE_SECTIONS.includes(s));
    return all;
  }, [grouped, showAdvanced]);

  // Default the active tab to the first available section (once data arrives)
  useEffect(() => {
    if (server && !grouped[activeSection] && orderedSections.length > 0) {
      setActiveSection(orderedSections[0]);
    }
  }, [orderedSections, server, grouped, activeSection]);

  const dirtyBySection: Record<string, number> = {};
  for (const section of orderedSections) {
    dirtyBySection[section] = (grouped[section] ?? []).filter((f) => isDirty(f.key)).length;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }
  if (isError || !server) {
    return (
      <div className="space-y-6">
        <Banner tone="danger">Failed to load affiliate settings.</Banner>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const activeFields = grouped[activeSection] ?? [];
  const activeMeta = SECTION_META[activeSection] ?? FALLBACK_SECTION_META;
  const ActiveIcon = activeMeta.icon;

  // Live money preview for the Commission section (computed inline below
  // the hooks so no hook sits after the early returns).
  const previewBase = activeSection === 'Commission' && server
    ? String('commission_base' in draft ? draft.commission_base : server?.commission_base?.value ?? 'post_discount')
    : null;
  const previewCouponRate = activeSection === 'Commission' && server
    ? Number('coupon_default_commission_rate' in draft ? draft.coupon_default_commission_rate : server?.coupon_default_commission_rate?.value ?? 0) || 0
    : 0;
  const previewBuyerOff = activeSection === 'Commission' && server
    ? Number('coupon_discount' in draft ? draft.coupon_discount : server?.coupon_discount?.value ?? 0) || 0
    : 0;

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Affiliate Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure the affiliate lifecycle — from click through commission to payout.
          </p>
          <div className="mt-3">
            <AffiliatePageHelp page="settings" />
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {dirtyCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => setDraft({})} disabled={saving}>
              Discard
            </Button>
          )}
          <Button onClick={handleSave} loading={saving} disabled={dirtyCount === 0}>
            {dirtyCount > 0 ? `Save ${dirtyCount} change${dirtyCount === 1 ? '' : 's'}` : 'Saved'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Sidebar nav */}
        <nav
          aria-label="Setting sections"
          className="lg:w-60 lg:flex-shrink-0 lg:sticky lg:top-4"
        >
          <div className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="mb-1 flex w-full items-center justify-between rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700"
          >
            {showAdvanced ? 'Hide advanced' : 'Show advanced'}
            <span className="text-gray-400">{showAdvanced ? '▲' : '▼'}</span>
          </button>
          {orderedSections.map((section) => {
              const Icon = (SECTION_META[section] ?? FALLBACK_SECTION_META).icon;
              const dirtyHere = dirtyBySection[section] ?? 0;
              const isActive = section === activeSection;
              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => setActiveSection(section)}
                  className={cn(
                    'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary-50 font-medium text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-primary-600' : 'text-gray-400')} />
                  <span className="truncate">{section}</span>
                  {dirtyHere > 0 && (
                    <span
                      aria-label={`${dirtyHere} unsaved`}
                      className="ml-auto h-2 w-2 flex-shrink-0 rounded-full bg-amber-500"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Active section panel */}
        <div className="min-w-0 flex-1">
          {activeSection === 'Earning' && previewBase !== null && (
            <>
              <EarningPresets
                presets={moneyMeta?.earning_presets}
                onPick={(c, l) => { update('coupon_default_commission_rate', c); update('link_default_commission_rate', l); }}
              />
              {(() => {
                const order = 1000;
                const linkRate = activeSection === 'Earning' && server
                  ? Number('link_default_commission_rate' in draft ? draft.link_default_commission_rate : server?.link_default_commission_rate?.value ?? 0) || 0
                  : 0;
                const exC = workedExample(order, previewBuyerOff, null, previewCouponRate, previewBase);
                const exL = workedExample(order, 0, null, linkRate, previewBase);
                return (
                  <div className="mb-4 space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                    <p>
                      Coupon order: buyer pays {inr(exC.buyerPays)}, affiliate earns {inr(exC.earning)} ({previewCouponRate}%), you keep {inr(exC.youKeep)}.
                    </p>
                    <p>
                      Link order: buyer pays {inr(exL.buyerPays)}, affiliate earns {inr(exL.earning)} ({linkRate}%), you keep {inr(exL.youKeep)}.
                    </p>
                  </div>
                );
              })()}
              <PrecedenceBanner hierarchy={moneyMeta?.hierarchy} />
              <EarningMatrix
                grouped={grouped}
                getVal={getVal}
                update={update}
                isDirty={isDirty}
                isDisabled={(k) => isDependsOnDisabled(k, getVal, server, draft)}
                parentOf={(k) => parentLabel(k, server, draft)}
                labels={moneyMeta?.setting_labels}
              />
            </>
          )}
          <Card>
            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <ActiveIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center text-base font-semibold text-gray-900">
                  {activeSection}
                  {dirtyBySection[activeSection] > 0 && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-medium text-amber-700">
                      {dirtyBySection[activeSection]} changed
                    </span>
                  )}
                </h3>
                {activeMeta.description && (
                  <p className="truncate text-xs text-gray-500">{activeMeta.description}</p>
                )}
              </div>
            </div>

            {activeSection === 'Earning' ? (
              <EarningSafetyCard
                grouped={grouped}
                getVal={getVal}
                update={update}
                isDirty={isDirty}
                isDisabled={(k) => isDependsOnDisabled(k, getVal, server, draft)}
                parentOf={(k) => parentLabel(k, server, draft)}
                labels={moneyMeta?.setting_labels}
              />
            ) : activeFields.length === 0 ? (
              <CardContent className="py-12 text-center text-sm text-gray-500">
                No settings in this section.
              </CardContent>
            ) : (
              <CardContent className="px-0 pb-0">
                <div className="divide-y divide-gray-100">
                  {activeFields
                    .filter(({ key }) => !(activeSection === 'Earning' && EARNING_MATRIX.some((r) => r.coupon === key || r.link === key)))
                    .map(({ key, meta }) =>
                    meta.type === 'textarea' ? (
                      <TextareaBlock
                        key={key}
                        meta={meta}
                        value={getVal(key)}
                        onChange={(v) => update(key, v)}
                        dirty={isDirty(key)}
                        disabled={isDependsOnDisabled(key, getVal, server, draft)}
                        parentLabel={parentLabel(key, server, draft)}
                      />
                    ) : (
                      <SettingRow
                        key={key}
                        fieldKey={key}
                        meta={meta}
                        value={getVal(key)}
                        onChange={(v) => update(key, v)}
                        dirty={isDirty(key)}
                        disabled={isDependsOnDisabled(key, getVal, server, draft)}
                        parentLabel={parentLabel(key, server, draft)}
                        plainLabel={moneyMeta?.setting_labels?.[key] ?? meta.label ?? key}
                      />
                    ),
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/90 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            {dirtyCount > 0 ? (
              <>
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                <span className="font-medium text-gray-900">
                  {dirtyCount} unsaved change{dirtyCount === 1 ? '' : 's'}
                </span>
              </>
            ) : (
              <span className="text-gray-400">All changes saved</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {dirtyCount > 0 && (
              <Button variant="outline" size="sm" onClick={() => setDraft({})} disabled={saving}>
                Discard
              </Button>
            )}
            <Button onClick={handleSave} loading={saving} disabled={dirtyCount === 0}>
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrecedenceBanner({ hierarchy }: { hierarchy?: { key: string; label: string; why: string }[] }) {
  const steps = hierarchy && hierarchy.length > 0
    ? hierarchy.map((h) => h.label)
    : ['Switched off', 'Excluded (0% rule)', 'Personal rate', 'Program rate', 'Product rule', 'Custom product rate', 'Category rule', 'Default rule', 'No rate — earns 0%'];
  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-700">
      <p className="font-medium text-gray-900">Who wins? First match in this order:</p>
      <ol className="mt-1 list-decimal space-y-0.5 pl-4 leading-relaxed">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p className="mt-1">
        The source default (step 4) beats product/category/default rules below it.
        Per-affiliate rates live on each affiliate profile.
      </p>
    </div>
  );
}

function isDependsOnDisabled(
  key: string,
  getVal: (k: string) => any,
  server: GroupData,
  draft: Record<string, any>,
): boolean {
  const meta = server?.[key];
  const parent = meta?.depends_on;
  if (!parent) return false;
  if (!(parent in (server ?? {}))) return false;
  return !toBool(parent in draft ? draft[parent] : (server?.[parent]?.value ?? false));
}

function parentLabel(
  key: string,
  server: GroupData,
  draft: Record<string, any>,
): string {
  const meta = server?.[key];
  const parent = meta?.depends_on;
  if (!parent) return '';
  return server?.[parent]?.label ?? parent;
}

/**
 * Earning matrix: rates + gates as one coupon|link table. Each blank cell
 * shows its inherited meaning (Blank = OFF / Blank = program default).
 * Same settings keys, same save path — presentational only.
 */
function EarningMatrix({ grouped, getVal, update, isDirty, isDisabled, parentOf, labels }: {
  grouped: Record<string, { key: string; meta: FieldMeta }[]>;
  getVal: (k: string) => any;
  update: (k: string, v: any) => void;
  isDirty: (k: string) => boolean;
  isDisabled: (k: string) => boolean;
  parentOf: (k: string) => string;
  labels?: Record<string, string>;
}) {
  const all = grouped['Earning'] ?? [];
  const byKey: Record<string, FieldMeta> = {};
  all.forEach(({ key, meta }) => { byKey[key] = meta; });

  const blankHint = (key: string): string => {
    const v = getVal(key);
    if (v !== '' && v !== null && v !== undefined) return '';
    if (key === 'coupon_default_commission_rate' || key === 'link_default_commission_rate') {
      return 'Blank = catalog rules decide';
    }
    return 'Blank = OFF';
  };

  return (
    <Card className="mb-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">Rule</th>
              <th className="px-4 py-2 font-medium">Coupon orders</th>
              <th className="px-4 py-2 font-medium">Link orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {EARNING_MATRIX.map((row) => (
              <tr key={row.label}>
                <td className="px-4 py-2 text-gray-700">{row.label}</td>
                {([row.coupon, row.link] as const).map((k) => {
                  const meta = byKey[k];
                  if (!meta) return <td key={k} className="px-4 py-2 text-gray-400">—</td>;
                  return (
                    <td key={k} className="px-4 py-2">
                      <MatrixCell
                        fieldKey={k}
                        meta={meta}
                        value={getVal(k)}
                        onChange={(v) => update(k, v)}
                        dirty={isDirty(k)}
                        disabled={isDisabled(k)}
                        parentLabel={parentOf(k)}
                        hint={blankHint(k)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-2 text-xs text-gray-500">
        Personal rates on an affiliate profile beat everything here. Program rates here beat product, category and default rules.
      </p>
    </Card>
  );
}

function MatrixCell({ fieldKey, meta, value, onChange, dirty, disabled, parentLabel, hint }: {
  fieldKey: string;
  meta: FieldMeta;
  value: any;
  onChange: (v: any) => void;
  dirty: boolean;
  disabled: boolean;
  parentLabel: string;
  hint: string;
}) {
  // Reuse SettingRow's editors in compact form.
  if (meta.type === 'switch') {
    const checked = value === true || value === 1 || value === '1' || value === 'true';
    return (
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{checked ? 'Yes' : 'No'}</span>
        {dirty && <span className="h-2 w-2 rounded-full bg-amber-500" title="Unsaved" />}
      </label>
    );
  }
  const adornment = FIELD_ADORNMENT[fieldKey];
  return (
    <span>
      <span className="inline-flex max-w-[160px] items-center rounded-md border border-gray-300 px-2 py-1 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
        {adornment === 'currency' && <span className="mr-1 text-gray-400">₹</span>}
        <input
          type="number"
          value={value ?? ''}
          min={meta.min ?? undefined}
          max={meta.max ?? undefined}
          disabled={disabled}
          placeholder="—"
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === '' ? '' : Number(raw));
          }}
          className="w-full bg-transparent text-sm outline-none"
        />
        {adornment === 'percent' && <span className="ml-1 text-gray-400">%</span>}
      </span>
      {dirty && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-amber-500" title="Unsaved" />}
      {hint && (value === '' || value === null || value === undefined) && (
        <span className="ml-1 text-xs text-gray-400">{hint}</span>
      )}
      {parentLabel && <span className="ml-1 block text-xs text-gray-400">{parentLabel}</span>}
    </span>
  );
}

/**
 * Safety row below the matrix: earning base, per-order fraud cap, return
 * cover days. Small, separate from the rate matrix.
 */
function EarningSafetyCard({ grouped, getVal, update, isDirty, isDisabled, parentOf, labels }: {
  grouped: Record<string, { key: string; meta: FieldMeta }[]>;
  getVal: (k: string) => any;
  update: (k: string, v: any) => void;
  isDirty: (k: string) => boolean;
  isDisabled: (k: string) => boolean;
  parentOf: (k: string) => string;
  labels?: Record<string, string>;
}) {
  const keys = ['commission_base', 'commission_max_per_order', 'return_period_days'];
  const all = grouped['Earning'] ?? [];
  const items = all.filter(({ key }) => keys.includes(key));
  if (items.length === 0) return null;
  return (
    <Card className="mb-4">
      <p className="border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Safety — base, fraud cap, return cover
      </p>
      <div className="divide-y divide-gray-100">
        {items.map(({ key, meta }) => (
          <SettingRow
            key={key}
            fieldKey={key}
            meta={meta}
            value={getVal(key)}
            onChange={(v) => update(key, v)}
            dirty={isDirty(key)}
            disabled={isDisabled(key)}
            parentLabel={parentOf(key)}
            plainLabel={labels?.[key] ?? meta.label ?? key}
          />
        ))}
      </div>
    </Card>
  );
}

function EarningPresets({ presets, onPick }: {
  presets?: { label: string; coupon: number; link: number }[];
  onPick: (coupon: number, link: number) => void;
}) {
  const list = presets && presets.length > 0 ? presets : [
    { label: 'Paused', coupon: 0, link: 0 },
    { label: 'Low cost', coupon: 3, link: 3 },
    { label: 'Standard', coupon: 5, link: 8 },
    { label: 'Growth', coupon: 10, link: 10 },
  ];
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-500">Quick earning:</span>
      {list.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => onPick(p.coupon, p.link)}
          title={`Coupon ${p.coupon}%, Link ${p.link}%`}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-primary-400 hover:text-primary-700"
        >
          {p.label} · {p.coupon}%/{p.link}%
        </button>
      ))}
    </div>
  );
}

function SettingRow({
  fieldKey,
  meta,
  value,
  onChange,
  dirty,
  disabled,
  parentLabel,
  plainLabel,
}: {
  fieldKey: string;
  meta: FieldMeta;
  value: any;
  onChange: (v: any) => void;
  dirty: boolean;
  disabled: boolean;
  parentLabel: string;
  plainLabel: string;
}) {
  const label = plainLabel || meta.label || '';
  const description = meta.description;

  let control: React.ReactNode;

  switch (meta.type) {
    case 'switch':
      control = (
        <button
          type="button"
          role="switch"
          aria-checked={toBool(value)}
          aria-label={label}
          disabled={disabled}
          onClick={() => onChange(!toBool(value))}
          className={cn(
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            toBool(value) ? 'bg-primary-600' : 'bg-gray-200',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200',
              toBool(value) ? 'translate-x-[22px]' : 'translate-x-0.5',
            )}
          />
        </button>
      );
      break;

    case 'number': {
      const adorn = FIELD_ADORNMENT[fieldKey];
      const adornment = adorn === 'percent' ? { suffix: '%' } : adorn === 'currency' ? { prefix: '₹' } : null;
      control = (
        <NumberControl
          value={value}
          onChange={onChange}
          min={meta.min ?? undefined}
          max={meta.max ?? undefined}
          adornment={adornment}
          disabled={disabled}
        />
      );
      break;
    }

    case 'select': {
      const opts = selectOptions(meta);
      const current = opts.find((o) => String(o.value) === String(value));
      const currentLabel = current?.label ?? '';
      control = (
        <div className="w-64" title={currentLabel || undefined}>
          <Select
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
            options={opts}
            disabled={disabled}
          />
        </div>
      );
      break;
    }

    default:
      control = (
        <div className="w-72">
          <input
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>
      );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-6 px-6 py-4 transition-colors',
        dirty && 'bg-amber-50/50',
        disabled && 'opacity-50',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
          )}
          <p className="text-sm font-medium text-gray-900">{label}</p>
        </div>
        {description && (
          <p className="mt-0.5 max-w-md text-xs leading-relaxed text-gray-500">{description}</p>
        )}
        {disabled && parentLabel && (
          <p className="mt-1 text-xs italic text-gray-400">Requires {parentLabel} = ON</p>
        )}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

function TextareaBlock({
  meta,
  value,
  onChange,
  dirty,
  disabled,
  parentLabel,
}: {
  meta: FieldMeta;
  value: any;
  onChange: (v: any) => void;
  dirty: boolean;
  disabled: boolean;
  parentLabel: string;
}) {
  return (
    <div className={cn('px-6 py-4 transition-colors', dirty && 'bg-amber-50/50', disabled && 'opacity-50')}>
      <div className="mb-2 flex items-center gap-2">
        {dirty && <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />}
        <p className="text-sm font-medium text-gray-900">{meta.label ?? ''}</p>
      </div>
      <Textarea
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Enter program terms…"
        disabled={disabled}
      />
      {meta.description && (
        <p className="mt-1.5 text-xs text-gray-500">{meta.description}</p>
      )}
      {disabled && parentLabel && (
        <p className="mt-1 text-xs italic text-gray-400">Requires {parentLabel} = ON</p>
      )}
    </div>
  );
}

function NumberControl({
  value,
  onChange,
  min,
  max,
  adornment,
  disabled,
}: {
  value: any;
  onChange: (v: any) => void;
  min?: number;
  max?: number;
  adornment?: { prefix?: string; suffix?: string } | null;
  disabled?: boolean;
}) {
  const str = value === undefined || value === null || value === '' ? '' : String(value);
  return (
    <div className="w-36">
      <div className="relative">
        {adornment?.prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
            {adornment.prefix}
          </span>
        )}
        <input
          type="number"
          value={str}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          placeholder="Not set"
          disabled={disabled}
          className={cn(
            'block w-full rounded-lg border border-gray-300 bg-white py-1.5 text-right text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
            adornment?.prefix ? 'pl-7' : 'pl-3',
            adornment?.suffix ? 'pr-8' : 'pr-3',
          )}
        />
        {adornment?.suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">
            {adornment.suffix}
          </span>
        )}
      </div>
    </div>
  );
}