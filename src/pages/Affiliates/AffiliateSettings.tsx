import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/api/axios';
import { Card, CardContent, Button, Input, LoadingSpinner, Banner } from '@/components';
import { Select, Textarea } from '@/components/Input';
import { toast } from '@/utils/toast';

function unwrap<T>(res: { data: any }): T {
  const body = res.data;
  if (body?.success === false) throw new Error(body.message || 'API error');
  return body?.data as T;
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
}

type GroupData = Record<string, FieldMeta> | undefined;

const SECTION_TITLES: Record<string, string> = {
  program_enabled: 'Program Switches',
  new_affiliate_auto_approve: 'Applications',
  attribution_window: 'Attribution & Refunds',
  return_period_days: 'Attribution & Refunds',
  minimum_payout: 'Payouts & Coupon',
  require_pan_above_amount: 'Payouts & Coupon',
  coupon_discount: 'Payouts & Coupon',
  commission_base: 'Commissions',
  coupon_validity_days: 'Coupons',
  coupon_max_discount_percent: 'Coupons',
  coupon_maximum_discount_amount: 'Coupons',
  coupon_per_customer_limit: 'Coupons',
  commission_max_per_order: 'Commissions',
  tds_enabled: 'TDS Configuration',
  tds_rate_individual: 'TDS Configuration',
  tds_rate_other: 'TDS Configuration',
  tds_threshold_amount: 'TDS Configuration',
  leak_ratio_threshold: 'Leak Detection',
  leak_min_orders: 'Leak Detection',
  reapply_lock_days: 'Applications',
  click_archive_days: 'Attribution & Refunds',
  click_velocity_per_minute: 'Attribution & Refunds',
  terms: 'Program Switches',
};

const SECTION_ORDER = [
  'Program Switches',
  'Applications',
  'Attribution & Refunds',
  'Commissions',
  'Coupons',
  'Payouts & Coupon',
  'TDS Configuration',
  'Leak Detection',
];

function toBool(v: any): boolean {
  return v === true || v === 1 || v === '1' || v === 'true';
}

function selectOptions(meta: FieldMeta): { value: string; label: string }[] {
  const opts = meta.options;
  if (!opts) return [];
  if (Array.isArray(opts)) {
    return opts.map((v) => ({ value: String(v), label: String(v) }));
  }
  return Object.entries(opts).map(([value, label]) => ({ value: String(value), label: String(label) }));
}

export default function AffiliateSettings() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

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

  function resetKey(key: string) {
    setDraft((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }

  const dirtyCount = Object.keys(draft).length;

  async function handleSave() {
    if (dirtyCount === 0) {
      toast('No changes to save');
      return;
    }
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

  function handleReset() {
    setDraft({});
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
        <Banner tone="danger">
          Failed to load affiliate settings.
        </Banner>
        <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const fields = Object.entries(server)
    .filter(([, meta]) => meta.is_editable !== false)
    .sort(([, a], [, b]) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

  const grouped: Record<string, { key: string; meta: FieldMeta }[]> = {};
  for (const [key, meta] of fields) {
    const section = SECTION_TITLES[key] ?? 'Other';
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push({ key, meta });
  }
  const orderedSections = [
    ...SECTION_ORDER.filter((s) => grouped[s]),
    ...Object.keys(grouped).filter((s) => !SECTION_ORDER.includes(s)),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Affiliate Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Program switches, attribution, payouts, TDS, and leak detection — rendered from
            config/settings/affiliate.php.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirtyCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
              Reset {dirtyCount} change{dirtyCount === 1 ? '' : 's'}
            </Button>
          )}
          <Button onClick={handleSave} loading={saving} disabled={dirtyCount === 0}>
            Save Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {orderedSections.map((section) => {
          const sectionFields = grouped[section];
          const spanAll = sectionFields.length > 3 ? 'md:col-span-2' : '';
          return (
            <Card key={section} className={spanAll}>
              <CardContent>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">{section}</h3>
                <div className="space-y-4">
                  {sectionFields.map(({ key, meta }) => (
                    <FieldRow
                      key={key}
                      fieldKey={key}
                      meta={meta}
                      value={getVal(key)}
                      onChange={(v) => update(key, v)}
                      dirty={isDirty(key)}
                      onReset={() => resetKey(key)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FieldRow({
  fieldKey,
  meta,
  value,
  onChange,
  dirty,
  onReset,
}: {
  fieldKey: string;
  meta: FieldMeta;
  value: any;
  onChange: (v: any) => void;
  dirty: boolean;
  onReset: () => void;
}) {
  const label = meta.label ?? fieldKey;
  const description = meta.description;

  let control: React.ReactNode;
  switch (meta.type) {
    case 'switch':
      control = (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={toBool(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          {label}
        </label>
      );
      return (
        <div className="rounded-md border border-gray-100 px-3 py-2">
          {control}
          {description && <p className="ml-6 mt-1 text-xs text-gray-500">{description}</p>}
          {dirty && (
            <button type="button" onClick={onReset} className="ml-6 mt-1 text-xs text-primary-600 hover:underline">
              Reset
            </button>
          )}
        </div>
      );

    case 'number':
      control = (
        <Input
          label={label}
          type="number"
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => onChange(e.target.value)}
          helper={description}
          min={meta.min ?? undefined}
          max={meta.max ?? undefined}
        />
      );
      break;

    case 'select': {
      const opts = selectOptions(meta);
      const raw = value === undefined || value === null ? '' : String(value);
      control = (
        <Select
          label={label}
          value={raw}
          onChange={(e) => onChange(e.target.value)}
          options={opts}
          helper={description}
        />
      );
      break;
    }

    case 'textarea':
      control = (
        <Textarea
          label={label}
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          helper={description}
        />
      );
      break;

    default:
      control = (
        <Input
          label={label}
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => onChange(e.target.value)}
          helper={description}
        />
      );
  }

  return (
    <div>
      {control}
      {dirty && (
        <button type="button" onClick={onReset} className="mt-1 text-xs text-primary-600 hover:underline">
          Reset to saved
        </button>
      )}
    </div>
  );
}