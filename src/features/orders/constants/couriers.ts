/**
 * Preferred-courier metadata + visual mapping.
 * Previously hardcoded inside OrderDetail.tsx and duplicated in two
 * render blocks (no-shipment empty state + Delivery Info card).
 */

export interface CourierMeta {
  code: string;
  name: string;
  bg: string;
  text: string;
  border: string;
  logo: string;
}

export const PREFERRED_COURIER_META: Record<string, CourierMeta> = {
  delhivery: {
    code: 'delhivery',
    name: 'Delhivery',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    logo: '/images/couriers/delhivery.png',
  },
  shadowfax: {
    code: 'shadowfax',
    name: 'Shadowfax',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    logo: '/images/couriers/shadowfax.png',
  },
  ekart: {
    code: 'ekart',
    name: 'Ekart',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    logo: '/images/couriers/ekart.png',
  },
  bluedart: {
    code: 'bluedart',
    name: 'Blue Dart',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    logo: '/images/couriers/bluedart.png',
  },
  xpressbees: {
    code: 'xpressbees',
    name: 'Xpressbees',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    logo: '/images/couriers/xpressbees.png',
  },
};

export function getPreferredCouriers(order: any): string[] {
  const list = order?.metadata?.customer_preferences?.preferred_couriers;
  return Array.isArray(list) ? list : [];
}