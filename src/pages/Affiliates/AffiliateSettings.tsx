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

  // Commission (4)
  commission_base: 'Commission',
  coupon_default_commission_rate: 'Commission',
  link_default_commission_rate: 'Commission',
  commission_max_per_order: 'Commission',

  // Commission Eligibility (8)
  min_order_for_commission_coupon: 'Commission Eligibility',
  min_order_for_commission_link: 'Commission Eligibility',
  first_order_only_commission_coupon: 'Commission Eligibility',
  first_order_only_commission_link: 'Commission Eligibility',
  commission_per_customer_limit_coupon: 'Commission Eligibility',
  commission_per_customer_limit_link: 'Commission Eligibility',
  total_commission_limit_coupon: 'Commission Eligibility',
  total_commission_limit_link: 'Commission Eligibility',

  // Commission Lifecycle (1)
  return_period_days: 'Commission Lifecycle',

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
  Commission: {
    icon: ReceiptPercentIcon,
    description: 'How much affiliates earn',
  },
  'Commission Eligibility': {
    icon: ShieldCheckIcon,
    description: 'When an attributed order qualifies for commission',
  },
  'Commission Lifecycle': {
    icon: ArrowPathIcon,
    description: 'How long commissions stay pending before approval',
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

const SECTION_ORDER = [
  'Program',
  'Attribution',
  'Commission',
  'Commission Eligibility',
  'Commission Lifecycle',
  'Coupons',
  'Payouts',
  'Tax & KYC',
  'Fraud & Risk',
  'Terms',
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
    return [...known, ...unknown];
  }, [grouped]);

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

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Affiliate Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure the affiliate lifecycle — from click through commission to payout.
          </p>
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
          {activeSection === 'Commission' && <PrecedenceBanner />}
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

            {activeFields.length === 0 ? (
              <CardContent className="py-12 text-center text-sm text-gray-500">
                No settings in this section.
              </CardContent>
            ) : (
              <CardContent className="px-0 pb-0">
                <div className="divide-y divide-gray-100">
                  {activeFields.map(({ key, meta }) =>
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

function PrecedenceBanner() {
  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-700">
      <p className="font-medium text-gray-900">Rate resolution order</p>
      <p className="mt-1 leading-relaxed">
        exclusions → per-affiliate source override → source global default (above) → product rule → product custom rate →
        category rule → default rule → none. Credit between coupon and link follows{' '}
        <span className="font-medium">Attribution priority</span> in the Attribution section.
        Per-affiliate overrides are configured on each affiliate profile.
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

function SettingRow({
  fieldKey,
  meta,
  value,
  onChange,
  dirty,
  disabled,
  parentLabel,
}: {
  fieldKey: string;
  meta: FieldMeta;
  value: any;
  onChange: (v: any) => void;
  dirty: boolean;
  disabled: boolean;
  parentLabel: string;
}) {
  const label = meta.label ?? '';
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