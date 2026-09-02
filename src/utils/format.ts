// Shared formatting helpers for analytics pages.
// Before this lived inline in every page; consolidating avoids divergence
// and dodges the mojibake (U+00E2 U+201A U+00B9 instead of U+20B9) produced by
// prior cp1252 re-saves. Deliberately no literal mojibake bytes in this file so
// repo-wide byte scans stay clean.

export const INR = '\u20B9'; // U+20B9 Indian Rupee Sign — single source of truth.

export const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return `${INR}0`;
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (!Number.isFinite(n)) return `${INR}0`;
    return `${INR}${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const formatPercent = (value: number | string | null | undefined, digits = 1): string => {
    if (value === null || value === undefined || value === '') return '0%';
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (!Number.isFinite(n)) return '0%';
    return `${n.toFixed(digits)}%`;
};

export const formatNumber = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '0';
    const n = typeof value === 'string' ? parseFloat(value) : value;
    if (!Number.isFinite(n)) return '0';
    return n.toLocaleString('en-IN');
};

// Parse date range strings defensively; avoids `format(new Date(), 'yyyy-MM-dd')`
// producing a local-time-vs-UTC off-by-one in non-UTC timezones.
export const toIsoDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const daysAgoIso = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return toIsoDate(d);
};
