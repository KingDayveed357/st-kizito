import {
    dayOfYear,
    getInspirationForDate,
    INSPIRATION_COUNT,
} from '../src/utils/dailyInspiration';

/**
 * The brief asks for 365 unique inspirations (366 in a leap year), resolved deterministically from
 * the date rather than randomised on each screen load. The previous implementation rotated six
 * saint quotations by the sum of the date's numeric parts.
 */

describe('dayOfYear', () => {
    it('is 1 on 1 January', () => {
        expect(dayOfYear('2026-01-01')).toBe(1);
    });

    it('is 365 on 31 December of a common year', () => {
        expect(dayOfYear('2026-12-31')).toBe(365);
    });

    it('is 366 on 31 December of a leap year', () => {
        expect(dayOfYear('2028-12-31')).toBe(366);
    });

    it('gives 29 February its own index', () => {
        expect(dayOfYear('2028-02-29')).toBe(60);
        // 1 March follows it in a leap year, but takes index 60 in a common year.
        expect(dayOfYear('2028-03-01')).toBe(61);
        expect(dayOfYear('2026-03-01')).toBe(60);
    });

    // Century years are the case a naive `year % 4` gets wrong: 1900 was not a leap year, 2000 was.
    it('applies the century rule', () => {
        expect(dayOfYear('1900-03-01')).toBe(60);
        expect(dayOfYear('2000-03-01')).toBe(61);
    });

    it('rejects malformed input rather than guessing', () => {
        expect(dayOfYear('')).toBeNull();
        expect(dayOfYear('2026-13-01')).toBeNull();
        expect(dayOfYear('not-a-date')).toBeNull();
    });
});

describe('getInspirationForDate', () => {
    it('has a full year of entries, including the leap day', () => {
        expect(INSPIRATION_COUNT).toBe(366);
    });

    it('is deterministic — the same date always gives the same words', () => {
        const a = getInspirationForDate('2026-06-15');
        const b = getInspirationForDate('2026-06-15');
        expect(a).not.toBeNull();
        expect(a).toEqual(b);
    });

    it('never repeats within a common year', () => {
        const seen = new Set<string>();
        const date = new Date(Date.UTC(2026, 0, 1));
        for (let i = 0; i < 365; i++) {
            const iso = date.toISOString().slice(0, 10);
            const inspiration = getInspirationForDate(iso);
            expect(inspiration).not.toBeNull();
            seen.add(inspiration!.reference);
            date.setUTCDate(date.getUTCDate() + 1);
        }
        expect(seen.size).toBe(365);
    });

    it('never repeats within a leap year, and uses all 366 entries', () => {
        const seen = new Set<string>();
        const date = new Date(Date.UTC(2028, 0, 1));
        for (let i = 0; i < 366; i++) {
            const iso = date.toISOString().slice(0, 10);
            seen.add(getInspirationForDate(iso)!.reference);
            date.setUTCDate(date.getUTCDate() + 1);
        }
        expect(seen.size).toBe(366);
    });

    // A date must mean the same thing every year, so the bookmark a parishioner saved last year
    // still points at the words they saved.
    it('gives the same words for the same date in different years', () => {
        expect(getInspirationForDate('2026-09-14')?.reference).toBe(
            getInspirationForDate('2030-09-14')?.reference,
        );
    });

    it('carries a citation and a translation for every entry', () => {
        const inspiration = getInspirationForDate('2026-04-05');
        expect(inspiration?.reference).toMatch(/\d+:\d+$/);
        expect(inspiration?.text.length).toBeGreaterThan(10);
        expect(inspiration?.translation).toMatch(/World English Bible/);
    });

    it('bookmark ids are derived from the date, not an array position', () => {
        expect(getInspirationForDate('2026-04-05')?.id).toBe('inspiration-2026-04-05');
    });

    it('returns null for an unparseable date instead of throwing', () => {
        expect(getInspirationForDate('nonsense')).toBeNull();
    });
});
