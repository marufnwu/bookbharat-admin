/**
 * Selectors / computed values over the Order shape returned by the API.
 *
 * The Laravel backend exposes a denormalised `order` payload with the
 * following shape (relevant to the order detail page):
 *
 *   - Items live under `order_items[]` (NOT `items[]`).
 *   - Each item carries bundle fields at the root:
 *       bundle_variant_id, bundle_quantity, bundle_variant_name,
 *       bundle_discount_rule_id, bundle_discount_amount, is_bundle.
 *   - The order may include `activities[]` (admin-side audit) OR
 *     `timeline[]` (customer-facing status steps). We prefer `activities`
 *     and fall back to mapping `timeline` to activity-shaped rows.
 *   - Customer aggregate stats live under `customer.total_orders` if
 *     present, otherwise we surface `user.id` as the only signal.
 *   - Delivery option may be null on older orders; in that case the
 *     friendly name lives at `metadata.shipping_method` or
 *     `shipping_method` (mirrored from metadata).
 */

import type { Order } from '../../../types';
import { toNumber } from '../utils/format';

export interface BundleDetails {
  discount_amount: number;
  quantity_per_bundle?: number;
  total_items?: number;
  variant_name?: string;
}

/**
 * Parse bundle details from either the new top-level item fields
 * (bundle_discount_amount / bundle_quantity / bundle_variant_name /
 * is_bundle) or the legacy `product_attributes` JSON blob.
 */
export function getBundleDetails(item: any): BundleDetails | null {
  if (!item) return null;

  // 1. New top-level fields exposed by the backend (preferred).
  if (
    item.is_bundle === true ||
    item.bundle_variant_id ||
    item.bundle_variant_name ||
    (item.bundle_discount_amount && Number(item.bundle_discount_amount) > 0)
  ) {
    const discount = Number(item.bundle_discount_amount || 0);
    if (discount > 0 || item.bundle_variant_id || item.is_bundle) {
      const result: BundleDetails = {
        discount_amount: discount,
        quantity_per_bundle:
          item.bundle_quantity != null ? Number(item.bundle_quantity) : undefined,
        variant_name: item.bundle_variant_name || undefined,
      };
      return result;
    }
  }

  // 2. Explicit `bundle_details` blob (defensive).
  if (item.bundle_details) return item.bundle_details as BundleDetails;

  // 3. Legacy `product_attributes` JSON string.
  if (item.product_attributes) {
    try {
      const attrs =
        typeof item.product_attributes === 'string'
          ? JSON.parse(item.product_attributes)
          : item.product_attributes;
      if (attrs?.bundle_discount_amount > 0) {
        return {
          discount_amount: Number(attrs.bundle_discount_amount),
          quantity_per_bundle: attrs.bundle_quantity
            ? Number(attrs.bundle_quantity)
            : 1,
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function isBundleItem(item: any): boolean {
  if (!item) return false;
  if (item.is_bundle === true) return true;
  return Boolean(item.bundle_variant_id || getBundleDetails(item));
}

/**
 * Sum of (product weight × quantity) in grams for the order's items.
 */
export function getOrderTotalWeight(order: Order | any): number {
  const items = order?.order_items || order?.items || [];
  return items.reduce((sum: number, item: any) => {
    const weight = toNumber(item?.product?.weight ?? 0);
    return sum + weight * toNumber(item?.quantity ?? 0);
  }, 0);
}

/**
 * Returns the canonical "items" array regardless of backend alias.
 */
export function getOrderItems(order: any): any[] {
  return order?.order_items || order?.items || [];
}

/**
 * Returns the preorder release date (or null) as a Date.
 */
export function getPreorderReleaseDate(order: any): Date | null {
  if (!order?.is_preorder || !order?.release_date) return null;
  const date = new Date(order.release_date);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Total orders for the customer.
 *
 * Backend inconsistency: some endpoints expose `customer.total_orders`
 * while others only include `user`. Prefer customer aggregate when
 * present; otherwise return 1 (this single order) as a safe default.
 */
export function getCustomerTotalOrders(order: any): number {
  const customerTotal = order?.customer?.total_orders;
  if (customerTotal != null && Number.isFinite(Number(customerTotal))) {
    return Number(customerTotal);
  }
  // user-scoped endpoints often don't include the aggregate. If a
  // dedicated count is exposed on the user, use it.
  const userTotal =
    order?.user?.total_orders ?? order?.user?.orders_count ?? null;
  if (userTotal != null && Number.isFinite(Number(userTotal))) {
    return Number(userTotal);
  }
  return 1;
}

/**
 * Friendly delivery option label, with sensible fallbacks:
 *   1. order.delivery_option.name (preferred)
 *   2. order.metadata.shipping_method (legacy / fallback)
 *   3. order.shipping_method (mirrored by some endpoints)
 */
export function getDeliveryOptionName(order: any): string | null {
  if (order?.delivery_option?.name) return order.delivery_option.name;
  return (
    order?.metadata?.shipping_method || order?.shipping_method || null
  );
}

/**
 * Order total amount. Prefers the canonical `total_amount` field, then
 * `total`, then computes from items + charges + tax + shipping. Returns
 * `0` if nothing usable is present (caller should fall back to "—").
 *
 * Defensive against stale or partial responses where `total_amount` was
 * never saved but items have valid prices (or vice versa).
 */
export function getOrderTotalAmount(order: any): number {
  if (order == null) return 0;
  const fromRoot = toNumber(order.total_amount ?? order.total ?? 0);
  if (fromRoot > 0) return fromRoot;

  const items = order?.order_items || order?.items || [];
  const itemTotal = items.reduce((sum: number, item: any) => {
    const lineTotal = toNumber(item?.total_price ?? item?.total ?? 0);
    if (lineTotal > 0) return sum + lineTotal;
    const qty = toNumber(item?.quantity ?? 0);
    const unit = toNumber(item?.unit_price ?? item?.price ?? 0);
    return sum + qty * unit;
  }, 0);

  if (itemTotal <= 0) return 0;

  // Add shipping + tax + charges so the fallback matches what the
  // server-side calculation would produce.
  const shipping = toNumber(order.shipping_amount ?? order.shipping_cost ?? 0);
  const tax = toNumber(order.tax_amount ?? order.tax ?? 0);
  const packaging = toNumber(order.packaging_amount ?? 0);
  const insurance = toNumber(order.insurance_amount ?? 0);
  const couponDiscount = toNumber(order.coupon_discount ?? 0);
  const bundleDiscount = toNumber(order.bundle_discount ?? 0);
  const charges = Array.isArray(order.charges)
    ? order.charges.reduce(
        (s: number, c: any) => s + toNumber(c?.amount ?? 0),
        0,
      )
    : 0;

  return (
    itemTotal +
    shipping +
    tax +
    packaging +
    insurance +
    charges -
    couponDiscount -
    bundleDiscount
  );
}

/**
 * Per-line-item price. Prefers the snapshotted `total_price` saved at
 * checkout, falls back to `quantity * unit_price`, then to `0`.
 */
export function getItemLineTotal(item: any): number {
  if (!item) return 0;
  const direct = toNumber(item.total_price ?? item.total ?? 0);
  if (direct > 0) return direct;
  const qty = toNumber(item.quantity ?? 0);
  const unit = toNumber(item.unit_price ?? item.price ?? 0);
  return Math.max(0, qty * unit);
}

export interface ActivityRow {
  id: string;
  type?: string;
  description: string;
  old_value?: string | null;
  new_value?: string | null;
  created_at?: string | null;
  performed_by?: string | null;
}

/**
 * Activity timeline normalisation. Prefers `order.activities[]`, falls
 * back to the root-level `timeline` argument (the customer-facing status
 * steps returned by the admin GET /orders/{id} endpoint), and finally
 * to `order.timeline[]` (in case it is nested).
 * Returns `[]` if none are present.
 */
export function getOrderActivities(order: any, rootTimeline?: any[]): ActivityRow[] {
  if (Array.isArray(order?.activities) && order.activities.length) {
    return order.activities.map((a: any, idx: number) => ({
      id: String(a.id ?? `activity-${idx}`),
      type: a.type,
      description: a.description || a.status || '',
      old_value: a.old_value ?? null,
      new_value: a.new_value ?? null,
      created_at: a.created_at ?? null,
      performed_by: a.performed_by ?? null,
    }));
  }

  const timeline: any[] | undefined = Array.isArray(rootTimeline)
    ? rootTimeline
    : Array.isArray(order?.timeline)
      ? order.timeline
      : undefined;

  if (timeline && timeline.length) {
    return timeline.map((step: any, idx: number) => ({
      id: `timeline-${step.status || idx}`,
      type: step.completed ? 'status_change' : 'status_pending',
      description: step.completed
        ? `Order moved to ${step.status}`
        : `${step.status} (pending)`,
      old_value: null,
      new_value: step.status,
      created_at: step.date ?? null,
      performed_by: 'System',
    }));
  }

  return [];
}