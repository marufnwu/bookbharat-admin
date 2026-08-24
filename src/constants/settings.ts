/**
 * Shared constants and helpers for the dynamic settings system.
 *
 * Two-tier filtering:
 *
 *   1. Backend filter — `GET /api/v1/admin/settings/groups?context=...&groups=...`
 *      `context` selects groups whose `show_in` config entry matches.
 *      `groups`  selects an explicit whitelist of group keys.
 *      Both can be combined (AND). Unknown values are silently dropped.
 *
 *   2. Frontend filter — `filterGroupsByWhitelist()` is applied to the
 *      response on the page so the developer can also restrict what renders
 *      purely from the frontend, without touching backend config files.
 *
 * To control what a page shows, edit the constants below — no other file
 * change is needed.
 */

/**
 * All valid context identifiers recognised by the backend. A group is
 * returned for a context only when its `show_in` config entry includes
 * that context (or `*`).
 */
export const SETTINGS_CONTEXTS = ['main', 'site'] as const;
export type SettingsContext = (typeof SETTINGS_CONTEXTS)[number];

/**
 * All well-known group keys registered in `config/settings/*.php` on the
 * backend. Adding a new group there means adding its key here too.
 */
export const SETTINGS_GROUPS = [
  // 'general',
  // 'authentication',
  // 'payment',
  // 'shipping',
  // 'features',
  // 'currency',
  // 'business',
  // 'messaging',
  // 'tax',
  // 'modules',
  'android_app',
  'affiliate',
  // 'company',
  // 'payment_flow',
] as const;
export type SettingsGroupKey = (typeof SETTINGS_GROUPS)[number];

/**
 * Per-page context arrays. Change these (and the page UI will react):
 *   - empty array  → no `?context=` filter is sent → backend returns all
 *                    groups (then `SETTINGS_GROUPS` whitelist applies).
 *   - non-empty    → only groups marked with one of those contexts in
 *                    `show_in` will reach the page.
 */
export const MAIN_SETTINGS_PAGE_CONTEXT: readonly SettingsContext[] = ['main'];
export const SITE_SETTINGS_PAGE_CONTEXT: readonly SettingsContext[] = ['site'];

/**
 * Build query params for the groups endpoint. Either argument may be a
 * single string, an array, or undefined. Empty arrays / undefined drop the
 * parameter from the request entirely. `readonly` arrays are accepted so
 * the `as const` constant exports can be passed in directly.
 */
export interface SettingsGroupsParams {
  context?: SettingsContext | readonly SettingsContext[] | string | readonly string[];
  groups?: SettingsGroupKey | readonly SettingsGroupKey[] | string | readonly string[];
}

export function buildSettingsGroupsParams(
  params: SettingsGroupsParams = {},
): Record<string, string> {
  const out: Record<string, string> = {};

  if (params.context !== undefined && params.context !== null) {
    const list = Array.isArray(params.context) ? params.context : [params.context];
    const cleaned = list.map((c) => String(c).trim()).filter((c) => c !== '');
    if (cleaned.length > 0) {
      out.context = cleaned.join(',');
    }
  }

  if (params.groups !== undefined && params.groups !== null) {
    const list = Array.isArray(params.groups) ? params.groups : [params.groups];
    const cleaned = list.map((g) => String(g).trim()).filter((g) => g !== '');
    if (cleaned.length > 0) {
      out.groups = cleaned.join(',');
    }
  }

  return out;
}

/**
 * Apply a frontend whitelist to the backend response. When the whitelist is
 * empty, the response is returned as-is (permissive). When non-empty, only
 * keys present in the whitelist are kept (in their original sort order).
 *
 * Use this on the page after fetching the groups to additionally restrict
 * what renders — useful when the backend context filter is broad but a
 * specific page should only show a curated subset.
 */
export function filterGroupsByWhitelist<T>(
  response: Record<string, T>,
  whitelist: readonly string[],
): Record<string, T> {
  if (!Array.isArray(whitelist) || whitelist.length === 0) {
    return response;
  }
  const allowed = new Set(whitelist);
  const out: Record<string, T> = {};
  for (const [key, value] of Object.entries(response)) {
    if (allowed.has(key)) {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Read runtime overrides from the URL query string. Useful for debugging /
 * testing filters without editing the constants file.
 *
 * Supported query params:
 *   - `?context=a,b`  — replaces the page context array.
 *   - `?groups=a,b`   — replaces the page whitelist array.
 *   - `?context=`     — clears the context filter (returns all).
 *   - `?groups=`      — clears the whitelist filter (returns all).
 *   - `?nofilter=1`   — disables BOTH filters entirely.
 *
 * Pass `null` for either side to leave that filter untouched.
 */
export interface RuntimeOverride {
  context: readonly string[] | null | undefined;
  groups: readonly string[] | null | undefined;
  noFilter: boolean;
}

export function readRuntimeOverrides(
  search: string = typeof window !== 'undefined' ? window.location.search : '',
): RuntimeOverride {
  const params = new URLSearchParams(search);
  const out: RuntimeOverride = { context: undefined, groups: undefined, noFilter: false };

  if (params.get('nofilter') === '1') {
    out.noFilter = true;
  }

  if (params.has('context')) {
    const raw = params.get('context') ?? '';
    out.context = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (params.has('groups')) {
    const raw = params.get('groups') ?? '';
    out.groups = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return out;
}

/**
 * Apply the runtime override on top of the base values. When `noFilter` is
 * set the result is `[]` for both (caller treats empty as "no filter"). When
 * the override is `undefined`, the base value is kept as-is.
 */
export function applyRuntimeOverride<T extends readonly string[]>(
  base: T,
  override: readonly string[] | null | undefined,
): T | readonly string[] {
  if (override === undefined) return base;
  if (override === null) return [];
  return override;
}
