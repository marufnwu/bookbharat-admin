import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal, Button, Input, Select, Badge } from '@/components';
import { affiliatesApi, type AffiliateCouponDetail } from '@/api/affiliates';
import { toast } from '@/utils/toast';
// Single source: buyer-discount math mirrors backend MoneyTruth::buyerDiscount().
import { buyerDiscount, inr } from './moneyTruth';

interface Props {
  open: boolean;
  affiliateId: number;
  coupon: AffiliateCouponDetail | null;
  onClose: () => void;
  onUpdated: () => void;
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function toIntList(s: string): number[] {
  return s.split(',').map((p) => parseInt(p.trim(), 10)).filter((n) => Number.isFinite(n) && n > 0);
}

export function EditCouponModal({ open, affiliateId, coupon, onClose, onUpdated }: Props) {
  const [discountValue, setDiscountValue] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [minimumOrder, setMinimumOrder] = useState('');
  const [maximumDiscount, setMaximumDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perCustomerLimit, setPerCustomerLimit] = useState('');
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [applicableCategories, setApplicableCategories] = useState('');
  const [excludedCategories, setExcludedCategories] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coupon) return;
    setDiscountValue(String(coupon.discount_value ?? ''));
    setIsActive(Boolean(coupon.is_active));
    setExpiresAt(toDateInput(coupon.expires_at));
    setStartsAt(toDateInput(coupon.starts_at));
    setMinimumOrder(coupon.minimum_order_amount ? String(coupon.minimum_order_amount) : '');
    setMaximumDiscount(coupon.maximum_discount_amount !== null && coupon.maximum_discount_amount !== undefined ? String(coupon.maximum_discount_amount) : '');
    setUsageLimit(coupon.usage_limit !== null && coupon.usage_limit !== undefined ? String(coupon.usage_limit) : '');
    setPerCustomerLimit(coupon.usage_limit_per_customer !== null && coupon.usage_limit_per_customer !== undefined ? String(coupon.usage_limit_per_customer) : '');
    setFirstOrderOnly(Boolean(coupon.first_order_only));
    setApplicableCategories((coupon.applicable_categories ?? []).join(', '));
    setExcludedCategories((coupon.excluded_categories ?? []).join(', '));
    setError(null);
  }, [coupon, open]);

  async function handleSave() {
    const val = parseFloat(discountValue);
    if (!Number.isFinite(val) || val < 0) {
      setError('Enter a valid discount value');
      return;
    }
    setSaving(true); setError(null);
    try {
      await affiliatesApi.updateCoupon(affiliateId, {
        discount_value: val,
        is_active: isActive,
        starts_at: startsAt || null,
        expires_at: expiresAt || null,
        minimum_order_amount: minimumOrder === '' ? 0 : Number(minimumOrder),
        maximum_discount_amount: maximumDiscount === '' ? null : Number(maximumDiscount),
        usage_limit: usageLimit === '' ? null : Number(usageLimit),
        usage_limit_per_customer: perCustomerLimit === '' ? null : Number(perCustomerLimit),
        first_order_only: firstOrderOnly,
        applicable_categories: toIntList(applicableCategories),
        excluded_categories: toIntList(excludedCategories),
      });
      toast.success('Coupon updated');
      onUpdated(); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update coupon');
    } finally {
      setSaving(false);
    }
  }

  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  const expiredStyle = !isActive || isExpired;

  // Program-wide coupon guardrails (cap shown as helper, not a surprise 422).
  const { data: programSettings } = useQuery({
    queryKey: ['coupon-guardrails'],
    queryFn: () => affiliatesApi.programRates(),
    staleTime: 5 * 60_000,
    enabled: open,
  });

  // Category names for the allow/block lists (IDs still stored).
  const { data: categories } = useQuery({
    queryKey: ['coupon-categories'],
    queryFn: () => affiliatesApi.listCategories(),
    staleTime: 10 * 60_000,
    enabled: open,
  });
  const catName = (id: number): string => {
    const hit = (categories ?? []).find((c: any) => Number(c.id) === Number(id));
    return hit ? `${hit.name} (#${hit.id})` : `#${id}`;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Coupon: ${coupon?.code ?? '—'}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} loading={saving}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        {expiredStyle && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {!isActive ? 'Coupon is currently inactive.' : null}
            {isExpired ? (!isActive ? ' ' : '') + 'Coupon has expired.' : null}
          </div>
        )}

        <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <span>Status:</span>
            {isActive && !isExpired
              ? <Badge variant="success">Active</Badge>
              : <Badge variant="destructive">Inactive</Badge>}
            <span className="text-gray-400">·</span>
            <span>Used {coupon?.usage_count ?? 0} times</span>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Discount — what the buyer saves</h4>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Buyer discount (%)"
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            helper="What the buyer saves at checkout"
            error={error ?? undefined}
          />
          <Input
            label="Maximum discount per order (₹)"
            type="number"
            value={maximumDiscount}
            onChange={(e) => setMaximumDiscount(e.target.value)}
            placeholder="No cap"
          />
        </div>
        {(() => {
          const pct = parseFloat(discountValue);
          const cap = maximumDiscount === '' ? null : Number(maximumDiscount);
          if (!Number.isFinite(pct) || pct < 0) return null;
          return (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              On a {inr(1000)} order the buyer saves {inr(buyerDiscount(1000, pct, Number.isFinite(cap as number) ? (cap as number) : null))}.
              Changing program Settings later does not update this coupon — edit here.
            </p>
          );
        })()}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Minimum order amount (₹)"
            type="number"
            value={minimumOrder}
            onChange={(e) => setMinimumOrder(e.target.value)}
            placeholder="0"
          />
          <Select
            label="First-order only?"
            value={firstOrderOnly ? 'yes' : 'no'}
            onChange={(e) => setFirstOrderOnly(e.target.value === 'yes')}
            options={[
              { value: 'no', label: 'No — any order' },
              { value: 'yes', label: 'Yes — first order only' },
            ]}
          />
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reuse — how often it works</h4>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Starts at"
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
          <Input
            label="Expires at"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            helper="Leave empty for no expiry"
          />
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Validity</h4>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Total usage limit"
            type="number"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder="Unlimited"
          />
          <Input
            label="Per-customer usage limit"
            type="number"
            value={perCustomerLimit}
            onChange={(e) => setPerCustomerLimit(e.target.value)}
            placeholder="Unlimited"
          />
        </div>

        <details className="rounded-md border border-gray-200 p-3">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-gray-500">
            Category limits (advanced)
          </summary>
          <div className="mt-3 space-y-2">
            <Input
              label="Only these categories (blank = all)"
              type="text"
              value={applicableCategories}
              onChange={(e) => setApplicableCategories(e.target.value)}
              placeholder="e.g. 3, 7, 12"
              helper="IDs work — names shown below after save."
            />
            {applicableCategories.trim() && (
              <p className="text-xs text-gray-500">
                {applicableCategories.split(',').map((p) => parseInt(p.trim(), 10)).filter((n) => Number.isFinite(n) && n > 0).map((n) => catName(n)).join(' · ')}
              </p>
            )}
            <Input
              label="Never these categories"
              type="text"
              value={excludedCategories}
              onChange={(e) => setExcludedCategories(e.target.value)}
              placeholder="e.g. 5, 9"
            />
            {excludedCategories.trim() && (
              <p className="text-xs text-gray-500">
                {excludedCategories.split(',').map((p) => parseInt(p.trim(), 10)).filter((n) => Number.isFinite(n) && n > 0).map((n) => catName(n)).join(' · ')}
              </p>
            )}
          </div>
        </details>
      </div>
    </Modal>
  );
}