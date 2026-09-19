import { useQuery } from '@tanstack/react-query';
import { affiliatesApi } from '@/api/affiliates';

/**
 * SINGLE SOURCE OF TRUTH for affiliate money logic + wording on the frontend.
 *
 * Backend owns: hierarchy, rate-source labels/reasons, gate labels,
 * commission statuses, hold reasons, earning presets, setting labels —
 * served by GET /affiliate-money-meta (see backend MoneyTruth::meta()).
 *
 * This module owns: fetching + caching that meta ONCE, and the tiny pure
 * math helpers that mirror backend MoneyTruth EXACTLY (buyerDiscount,
 * workedExample). No page may hardcode its own copies of labels or math.
 *
 * If backend math changes, update these mirrors in lockstep — the unit
 * comments cite the exact backend lines.
 */

export interface MoneyMeta {
  hierarchy: { key: string; label: string; why: string }[];
  rate_sources: Record<string, { label: string; why: string }>;
  gates: Record<string, { label: string; unit: string; off: string }>;
  commission_status: Record<string, string>;
  hold_reasons: Record<string, string>;
  earning_presets: { label: string; coupon: number; link: number }[];
  setting_labels: Record<string, string>;
}

let cachedMeta: MoneyMeta | null = null;

export function useMoneyMeta() {
  const query = useQuery({
    queryKey: ['affiliate-money-meta'],
    queryFn: async () => {
      if (cachedMeta) return cachedMeta;
      const meta = await affiliatesApi.moneyMeta();
      cachedMeta = meta;
      return meta;
    },
    staleTime: 10 * 60_000,
  });
  return query;
}

/** Plain label for a settings key. Falls back to the raw key. */
export function settingLabel(meta: MoneyMeta | undefined, key: string): string {
  return meta?.setting_labels?.[key] ?? key;
}

/** Plain label for a commission rate_source value. */
export function rateSourceLabel(meta: MoneyMeta | undefined, source: string): string {
  return meta?.rate_sources?.[source]?.label ?? source;
}

/** Reason sentence for a rate_source value, with affiliate name filled in. */
export function rateSourceWhy(meta: MoneyMeta | undefined, source: string, affiliateName = ''): string {
  if ((source === 'affiliate_override_coupon' || source === 'affiliate_override_link') && affiliateName) {
    const which = source.includes('coupon') ? 'coupon' : 'link';
    return `Your personal setting for ${affiliateName} on ${which} orders.`;
  }
  return meta?.rate_sources?.[source]?.why ?? 'No rate configured — earns nothing until set.';
}

/** Plain label for a commission status enum value. */
export function commissionStatusLabel(meta: MoneyMeta | undefined, status: string): string {
  return meta?.commission_status?.[status] ?? status.replace('_', ' ');
}

/** Plain label for a hold reason_code. */
export function holdReasonLabel(meta: MoneyMeta | undefined, reason: string): string {
  return meta?.hold_reasons?.[reason] ?? reason.replace('_', ' ');
}

/**
 * Buyer discount for percentage coupons.
 * MIRROR of backend MoneyTruth::buyerDiscount() (which mirrors
 * Coupon::calculateDiscount()'s percentage branch):
 *   discount = total * value / 100, capped by maximum_discount_amount.
 */
export function buyerDiscount(orderTotal: number, valuePercent: number, cap: number | null): number {
  let discount = (orderTotal * valuePercent) / 100;
  if (cap !== null && cap > 0) {
    discount = Math.min(discount, cap);
  }
  return Math.round(discount * 100) / 100;
}

/**
 * Worked example on a sample order.
 * MIRROR of backend MoneyTruth::workedExample().
 */
export function workedExample(
  orderTotal: number,
  discountValue: number,
  discountCap: number | null,
  ratePercent: number | null,
  base: string = 'post_discount',
): { orderTotal: number; discount: number; buyerPays: number; earning: number | null; youKeep: number } {
  const discount = buyerDiscount(orderTotal, discountValue, discountCap);
  const baseAmount = base === 'post_discount' ? orderTotal - discount : orderTotal;
  const earning = ratePercent !== null ? Math.round(((baseAmount * ratePercent) / 100) * 100) / 100 : null;
  const youKeep = earning !== null
    ? Math.round((orderTotal - discount - earning) * 100) / 100
    : Math.round((orderTotal - discount) * 100) / 100;
  return { orderTotal, discount, buyerPays: Math.round((orderTotal - discount) * 100) / 100, earning, youKeep };
}

export function inr(n: unknown): string {
  const num = Number(n);
  return Number.isFinite(num) ? '₹' + num.toLocaleString('en-IN') : '₹—';
}
