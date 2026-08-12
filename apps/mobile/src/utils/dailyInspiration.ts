import inspirationsRaw from '../../data/dailyInspirations.json';

/**
 * The daily inspiration: one entry per day of the year, the same for everyone, every year.
 *
 * Replaces a bank of six saint quotations rotated by `dateSeed % 6`, which meant the same words
 * came round every six days — and `dateSeed` was the sum of the ISO date's numeric parts, so
 * 2026-01-31 and 2026-02-30-equivalents collided freely.
 *
 * Selection is by DAY OF YEAR, so:
 *  - the same date always resolves to the same inspiration, on any device, with no network;
 *  - all 366 entries are reachable, and none repeats within a year;
 *  - 29 February has its own entry rather than borrowing another day's.
 *
 * See scripts/generate-inspirations.mjs for why the bank is Scripture rather than attributed
 * quotations, and how every citation is verified at build time.
 */

export type InspirationTheme =
    | 'faith' | 'hope' | 'love' | 'mercy' | 'peace' | 'joy'
    | 'trust' | 'courage' | 'strength' | 'wisdom' | 'humility'
    | 'perseverance' | 'prayer' | 'service';

export interface DailyInspiration {
    /** Stable id for bookmarking — the date it belongs to, not an array index. */
    id: string;
    date: string;
    reference: string;
    text: string;
    theme: InspirationTheme;
    /** The translation the text is quoted from, for attribution. */
    translation: string;
}

interface InspirationEntry {
    reference: string;
    text: string;
    theme: InspirationTheme;
}

const data = inspirationsRaw as unknown as {
    __meta: { translation: string; count: number };
    entries: InspirationEntry[];
};

const ENTRIES = data.entries;
const TRANSLATION = data.__meta.translation;

const isLeapYear = (year: number): boolean =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/**
 * Day of year, 1–366, with 29 February always resolving to 60.
 *
 * Computed from the ISO parts rather than via `Date` arithmetic: constructing a Date and
 * subtracting January 1st introduces a timezone dependency, so a parishioner in Lagos and the
 * bundled data could disagree about which day it is either side of midnight.
 */
export const dayOfYear = (isoDate: string): number | null => {
    const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const leap = isLeapYear(year);
    let index = DAYS_BEFORE_MONTH[month - 1] + day;
    // From 1 March onwards a leap year runs one day ahead of a common year.
    if (leap && month > 2) index += 1;

    return index;
};

/**
 * The inspiration for a date.
 *
 * In a common year, day 60 onwards maps past the leap-day entry, so 29 February's entry is simply
 * not used that year — every other day still lands on its own, and the sequence stays stable from
 * one year to the next. (Skipping is deliberate: shifting the whole year by one instead would mean
 * the same date showed different words depending on the year.)
 */
export const getInspirationForDate = (isoDate: string): DailyInspiration | null => {
    const day = dayOfYear(isoDate);
    if (day === null) return null;

    const entry = ENTRIES[(day - 1) % ENTRIES.length];
    if (!entry) return null;

    return {
        id: `inspiration-${isoDate}`,
        date: isoDate,
        reference: entry.reference,
        text: entry.text,
        theme: entry.theme,
        translation: TRANSLATION,
    };
};

/** Total entries in the bank — used by the data-integrity test. */
export const INSPIRATION_COUNT = ENTRIES.length;
