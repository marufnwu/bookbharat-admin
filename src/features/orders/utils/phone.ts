/**
 * Phone-number fallback chain used in OrderDetail and OrderList.
 * Order of preference: shipping mobile → user phone → shipping phone.
 */

export function getOrderPhone(order: any): string | undefined {
  if (!order) return undefined;
  return (
    order.shipping_address?.mobile ||
    order.shipping_address?.phone ||
    order.shipping_address?.whatsapp_number ||
    order.user?.phone ||
    undefined
  );
}