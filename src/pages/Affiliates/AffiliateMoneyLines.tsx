import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { affiliatesApi, type MoneyPreview } from '@/api/affiliates';
import type { Affiliate } from '@/types/affiliate';
// Single source: math + wording from moneyTruth (backend-owned meta).
import { inr, workedExample, useMoneyMeta, rateSourceWhy } from './moneyTruth';

/** Buyer side as static configured text. */
export function BuyerGetsLine({ coupon }: { coupon: Affiliate['coupon'] }) {
  if (!coupon) return <span className="text-gray-400">No coupon — buyers get no discount from this affiliate</span>;
  const parts = [`${coupon.discount_value}% off`];
  if (coupon.maximum_discount_amount != null && Number(coupon.maximum_discount_amount) > 0) {
    parts.push(`max ${inr(coupon.maximum_discount_amount)}`);
  }
  if (coupon.minimum_order_amount != null && Number(coupon.minimum_order_amount) > 0) {
    parts.push(`min order ${inr(coupon.minimum_order_amount)}`);
  }
  parts.push(coupon.is_active ? 'Active' : 'OFF');
  return <span className="font-medium text-gray-900">{parts.join(' · ')}</span>;
}

function gateText(which: string, value: number | boolean | null, unit: string): string {
  if (which === 'off' || value === null) return '';
  if (typeof value === 'boolean') return value ? 'first order only' : '';
  return unit === '₹' ? `min order ${inr(value)}` : `max ${value} orders`;
}

/** Affiliate side per source as static configured text. */
export function AffiliateEarnsLine({
  affiliate,
  source,
  affiliateName,
}: {
  affiliate: Affiliate;
  source: 'coupon' | 'link';
  affiliateName: string;
}) {
  const override = source === 'coupon' ? affiliate.commission_rate_override_coupon : affiliate.commission_rate_override_link;
  const gates = {
    min: source === 'coupon' ? affiliate.min_order_override_coupon : affiliate.min_order_override_link,
    first: source === 'coupon' ? affiliate.first_order_only_override_coupon : affiliate.first_order_only_override_link,
    perCust: source === 'coupon' ? affiliate.per_customer_limit_override_coupon : affiliate.per_customer_limit_override_link,
    total: source === 'coupon' ? affiliate.total_limit_override_coupon : affiliate.total_limit_override_link,
  };
  const gateBits = [
    gates.min != null ? `min order ${inr(gates.min)}` : '',
    gates.first === true ? 'first order only' : '',
    gates.perCust != null ? `max ${gates.perCust} orders per buyer` : '',
    gates.total != null ? `max ${gates.total} orders lifetime` : '',
  ].filter(Boolean);

  return (
    <span>
      {override !== null && override !== undefined ? (
        <span className="font-medium text-gray-900">
          {Number(override)}% <span className="font-normal text-gray-500">(your setting for {affiliateName})</span>
        </span>
      ) : (
        <span className="text-gray-700">Program rate <span className="text-gray-400">(varies by product — see example below)</span></span>
      )}
      {Number(override) === 0 && <span className="font-medium text-red-600"> — stopped</span>}
      {gateBits.length > 0 && <span className="text-gray-500"> · {gateBits.join(' · ')}</span>}
    </span>
  );
}

/**
 * Live worked example calling the money-preview endpoint (same math as
 * checkout + order creation). Editable sample amount, default 1000.
 */
export function MoneyExample({ affiliateId, affiliateName }: { affiliateId: number; affiliateName: string }) {
  const [amount, setAmount] = useState('1000');
  const total = Number(amount) > 0 ? Number(amount) : 1000;

  const { data, isLoading } = useQuery({
    queryKey: ['affiliate-money-preview', affiliateId, total],
    queryFn: () => affiliatesApi.moneyPreview(affiliateId, { order_total: total }),
  });

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-sm">
      <div className="mb-2 flex items-center gap-2">
        <label className="text-xs font-medium text-gray-600">Example order</label>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-28 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
        />
      </div>
      {isLoading || !data ? (
        <p className="text-xs text-gray-500">Calculating…</p>
      ) : (
        <MoneyExampleBody preview={data} name={affiliateName} />
      )}
    </div>
  );
}

function MoneyExampleBody({ preview, name }: { preview: MoneyPreview; name: string }) {
  const { data: meta } = useMoneyMeta();
  const total = preview.order_total;
  const discount = preview.buyer?.is_active ? preview.buyer.example_discount : 0;
  // Single source: workedExample() mirrors backend MoneyTruth::workedExample().
  const rate = preview.earning.coupon.rate;
  const ex = workedExample(
    total,
    preview.buyer?.discount_value ?? 0,
    preview.buyer?.maximum_discount_amount ?? null,
    rate,
    'post_discount',
  );
  const paid = ex.buyerPays;
  const earn = preview.buyer?.is_active ? ex.earning : 0;
  const keep = ex.youKeep;

  return (
    <div className="space-y-1 text-gray-800">
      <p>
        Buyer pays <strong>{inr(paid)}</strong> (saved {inr(discount)})
      </p>
      <p>
        {name} earns{' '}
        {earn != null ? (
          <strong>{inr(earn)}</strong>
        ) : (
          <span>depends on the product — no fixed rate set</span>
        )}
      </p>
      <p>
        You keep <strong>{inr(keep)}</strong> after discount and earning
      </p>
      {preview.buyer && !preview.buyer.is_active && (
        <p className="text-xs text-amber-700">Buyer discount is OFF — buyers pay full price.</p>
      )}
      {preview.earning.coupon.level === 'personal' ? (
        <p className="text-xs text-gray-500">Because: {rateSourceWhy(meta, 'affiliate_override_coupon', name)}</p>
      ) : preview.earning.coupon.level === 'program' ? (
        <p className="text-xs text-gray-500">Because: {rateSourceWhy(meta, 'global_default_coupon')}</p>
      ) : (
        <p className="text-xs text-gray-500">Because: no fixed rate — each product's own rate applies (estimate).</p>
      )}
    </div>
  );
}
