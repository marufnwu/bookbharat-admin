/**
 * Authoritative order-status transition map.
 * Previously duplicated in OrderDetail.tsx and InlineStatusDropdown.tsx
 * with slightly different sets. This is now the single source of truth.
 */

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const TERMINAL_STATUSES: ReadonlyArray<OrderStatus> = [
  'delivered',
  'cancelled',
  'refunded',
];

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export function isValidTransition(
  from: OrderStatus | string,
  to: OrderStatus | string,
): boolean {
  const allowed = VALID_TRANSITIONS[from as OrderStatus];
  if (!allowed) return false;
  return allowed.includes(to as OrderStatus);
}