/**
 * Address-line builder used in OrderDetail shipping/billing rendering.
 * Handles the multiple field aliases the backend exposes.
 */

const ADDRESS_FIELDS = [
  'house_number',
  'address_line_1',
  'address_1',
  'address',
  'address_line_2',
  'address_2',
  'landmark',
] as const;

export function buildAddressLines(address: any): string {
  if (!address) return 'N/A';
  const lines: string[] = [];
  for (const field of ADDRESS_FIELDS) {
    const value = address[field];
    if (value && !lines.includes(value)) lines.push(value);
  }
  return lines.length ? lines.join(', ') : 'N/A';
}

export function buildAddressLocality(address: any): string {
  if (!address) return '';
  const city = address.city || '';
  const state = address.state || '';
  const pincode = address.pincode || address.postal_code || '';
  const parts = [city, state, pincode].filter(Boolean);
  return parts.join(', ');
}

export function getAddressName(address: any): string {
  if (!address) return 'N/A';
  if (address.name) return address.name;
  const first = address.first_name || '';
  const last = address.last_name || '';
  return `${first} ${last}`.trim() || 'N/A';
}

export function getAddressPhone(address: any): string | undefined {
  if (!address) return undefined;
  return (
    address.phone ||
    address.mobile ||
    address.whatsapp_number ||
    undefined
  );
}