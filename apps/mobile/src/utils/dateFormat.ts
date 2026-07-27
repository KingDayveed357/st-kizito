/**
 * Format a Date to a local 'YYYY-MM-DD' string.
 *
 * Deliberately NOT via `toISOString()`, which converts to UTC and can roll the date to the
 * previous/next day depending on the device timezone — the classic off-by-one date-picker bug.
 */
export const toIsoDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/**
 * Parse a 'YYYY-MM-DD' string to a Date at local noon (so day arithmetic never lands on the
 * previous day across timezones). Returns null for malformed input.
 */
export const fromIsoDate = (value: string): Date | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const d = new Date(`${value}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
};
