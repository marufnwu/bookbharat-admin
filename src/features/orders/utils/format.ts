/**
 * Centralized date / currency / phone formatters for the orders feature.
 * Previously duplicated in OrderDetail.tsx and other order components.
 */

export function formatDate(value?: string | null): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(value?: string | null): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Coerce a value to a finite number, falling back to 0.
 *
 * The Laravel backend serialises decimal columns (DECIMAL(8,2)) as
 * **strings** in JSON (e.g. `"650.00"`), so most monetary fields arrive
 * as strings. Helpers in this module must therefore coerce.
 */
export function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const value = toNumber(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Detect and strip Laravel cookie-deletion strings from a value.
 *
 * The backend occasionally leaks cookie-queue strings like
 *   "utm_source=deleted; expires=Sat, 12 Jul 2025 19:50:56 GMT; Max-Age=0; ..."
 * into the JSON response (when UTM/gclid/fbclid fields are read from
 * the request cookies/input). This helper recognises that pattern and
 * returns `null` so the UI can hide the row instead of rendering garbage.
 */
const COOKIE_DELETION_RE = /(?:^|[;\s])(?:expires=|Max-Age=0)/i;

export function sanitizeCookieValue(value: unknown): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  if (!str) return null;
  if (COOKIE_DELETION_RE.test(str)) return null;
  // Heuristic: if the value contains a `=` followed by another `=` or
  // looks like a Set-Cookie header value (more than one `=` segment
  // combined with semicolons), reject it.
  if (/=/.test(str) && /;\s*[A-Za-z-]+=/.test(str)) return null;
  return str;
}