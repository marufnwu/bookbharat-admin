/**
 * Product slug helpers — client-side twin of the backend
 * App\Support\Slugs::normalize() / validation regex.
 *
 * Slugs with spaces/ampersands/punctuation were shipped by the 2026 legacy
 * import (GSC audit: 31 space-slugs + 148 &/double-dash slugs). Both the
 * admin UI and the backend must reject/normalize them at every entry point.
 */

/**
 * Normalize a typed slug the same way the backend does:
 * lowercase, invalid runs (spaces, &, punctuation) collapse to a single
 * hyphen, no leading/trailing/double hyphens. Unicode letters (Bangla) and
 * combining marks are preserved.
 */
export function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}-]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Exact mirror of the backend validation regex:
 * letters/numbers/marks joined by single hyphens — no spaces, no
 * punctuation, no leading/trailing/double hyphens.
 */
export function isValidSlug(value: string): boolean {
  return /^[\p{L}\p{N}\p{M}]+(?:-[\p{L}\p{N}\p{M}]+)*$/u.test(value);
}

export const SLUG_ERROR_MESSAGE =
  'URL Slug: only letters, numbers, Bangla characters and single hyphens are allowed — no spaces or special characters.';
