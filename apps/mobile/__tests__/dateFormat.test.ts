import { toIsoDate, fromIsoDate } from '../src/utils/dateFormat';

describe('toIsoDate', () => {
    it('formats a local date as YYYY-MM-DD (no UTC shift)', () => {
        // Local components — regardless of timezone, the calendar day is preserved.
        expect(toIsoDate(new Date(2001, 4, 14, 23, 30))).toBe('2001-05-14'); // late-evening must not roll to the 15th
        expect(toIsoDate(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01'); // just-after-midnight must not roll to Dec 31
    });

    it('zero-pads month and day', () => {
        expect(toIsoDate(new Date(2026, 2, 9))).toBe('2026-03-09');
    });
});

describe('fromIsoDate', () => {
    it('parses a valid date at local noon and round-trips', () => {
        const d = fromIsoDate('2001-05-14');
        expect(d).not.toBeNull();
        expect(toIsoDate(d as Date)).toBe('2001-05-14');
    });

    it('rejects malformed input', () => {
        expect(fromIsoDate('')).toBeNull();
        expect(fromIsoDate('14/05/2001')).toBeNull();
        expect(fromIsoDate('2001-5-4')).toBeNull();
    });
});
