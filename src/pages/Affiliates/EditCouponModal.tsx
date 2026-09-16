import { useEffect, useState } from 'react';
import { Modal, Button, Input, Select, Badge } from '@/components';
import { affiliatesApi, type AffiliateCouponDetail } from '@/api/affiliates';
import { toast } from '@/utils/toast';

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

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Discount value"
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            helper="Percentage off"
            error={error ?? undefined}
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

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Minimum order amount (₹)"
            type="number"
            value={minimumOrder}
            onChange={(e) => setMinimumOrder(e.target.value)}
            placeholder="0"
          />
          <Input
            label="Maximum discount per order (₹)"
            type="number"
            value={maximumDiscount}
            onChange={(e) => setMaximumDiscount(e.target.value)}
            placeholder="No cap"
          />
        </div>

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

        <div className="space-y-2">
          <Input
            label="Applicable category IDs (blank = all)"
            type="text"
            value={applicableCategories}
            onChange={(e) => setApplicableCategories(e.target.value)}
            placeholder="e.g. 3, 7, 12"
            helper="Comma-separated category IDs. Leave empty to apply to all categories."
          />
        </div>

        <div className="space-y-2">
          <Input
            label="Excluded category IDs"
            type="text"
            value={excludedCategories}
            onChange={(e) => setExcludedCategories(e.target.value)}
            placeholder="e.g. 5, 9"
            helper="Comma-separated category IDs to exclude from this coupon."
          />
        </div>
      </div>
    </Modal>
  );
}