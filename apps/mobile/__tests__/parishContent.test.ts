import {
    buildExcerpt,
    describeWhen,
    extractSchedule,
    formatParishDate,
    isShouted,
    normalizeBody,
    normalizeTitle,
    splitDateParts,
} from '../src/utils/parishContent';

/**
 * Parish notices are written the way a notice board is written: ALL CAPS, the heading repeated as
 * the first line of the body, the date buried in prose. These helpers normalise that for display.
 *
 * The rule under test throughout: only intervene when the input is genuinely shouted. Deliberate
 * mixed-case text must survive untouched, or the app fights the admin every time they improve.
 */

describe('isShouted', () => {
    it('detects an all-caps notice', () => {
        expect(isShouted('FEAST OF TRANSFIGURATION OF THE LORD')).toBe(true);
    });
    it('leaves ordinary sentence case alone', () => {
        expect(isShouted('Pentecost is coming soon! Remain blessed fams')).toBe(false);
    });
    it('does not treat a short word as shouted', () => {
        expect(isShouted('MASS')).toBe(false);
    });
    it('is not fooled by an acronym inside normal text', () => {
        expect(isShouted('The CWO meeting holds on Sunday afternoon')).toBe(false);
    });
});

describe('normalizeTitle', () => {
    it('title-cases a shouted heading and keeps minor words lowercase', () => {
        expect(normalizeTitle('FEAST OF TRANSFIGURATION OF THE LORD')).toBe(
            'Feast of Transfiguration of the Lord',
        );
    });

    it('leaves a deliberately mixed-case title untouched', () => {
        const title = 'Harvest and Bazaar';
        expect(normalizeTitle(title)).toBe(title);
    });

    it('preserves parish acronyms rather than mangling them', () => {
        expect(normalizeTitle('CWO MONTHLY MEETING AND RCIA CLASS')).toBe(
            'CWO Monthly Meeting and RCIA Class',
        );
    });

    it('lowercases ordinal suffixes', () => {
        expect(normalizeTitle('THURSDAY 6TH AUGUST CELEBRATION')).toBe('Thursday 6th August Celebration');
    });

    it('capitalises after a hyphen', () => {
        expect(normalizeTitle('ALL-NIGHT VIGIL SERVICE FOR THE PARISH')).toBe(
            'All-Night Vigil Service for the Parish',
        );
    });

    it('handles empty and missing input', () => {
        expect(normalizeTitle('')).toBe('');
        expect(normalizeTitle(null)).toBe('');
        expect(normalizeTitle(undefined)).toBe('');
    });
});

describe('normalizeBody', () => {
    it('sentence-cases shouted body text', () => {
        expect(normalizeBody('THE VIGIL WILL HOLD AT SIX. PLEASE COME EARLY.')).toBe(
            'The vigil will hold at six. Please come early.',
        );
    });

    it('preserves paragraph breaks', () => {
        const result = normalizeBody('FIRST LINE OF THE NOTICE\nSECOND LINE OF THE NOTICE');
        expect(result.split('\n')).toHaveLength(2);
        expect(result).toBe('First line of the notice\nSecond line of the notice');
    });

    it('leaves normal prose untouched', () => {
        const body = 'Pentecost is coming soon! Remain blessed fams';
        expect(normalizeBody(body)).toBe(body);
    });
});

describe('buildExcerpt', () => {
    // The exact case from the parish's live data: the heading is repeated inside the body, so the
    // card showed the same shouted line twice before any new information.
    it('drops a title repeated as the first line of the body', () => {
        const title = 'FEAST OF TRANSFIGURATION OF THE LORD';
        const body =
            'THURSDAY 6TH AUGUST, 2026\nFEAST OF TRANSFIGURATION OF THE LORD\nMASSES: 6.00 AM AND 6.00 PM';

        const excerpt = buildExcerpt(body, title);
        expect(excerpt).not.toMatch(/Feast of Transfiguration of the Lord/);
        expect(excerpt).toMatch(/Thursday 6th August, 2026/);
        expect(excerpt).toMatch(/Masses: 6.00 am and 6.00 pm/);
    });

    it('removes the repeated title even when it leads the body', () => {
        const excerpt = buildExcerpt('HARVEST AND BAZAAR\nCOME ONE, COME ALL', 'HARVEST AND BAZAAR');
        expect(excerpt).toBe('Come one, come all');
    });

    it('keeps the body when it never repeats the title', () => {
        expect(buildExcerpt('Come one, come all', 'Harvest')).toBe('Come one, come all');
    });

    // The card already displays the title as its heading, so repeating it as the body would print
    // the same words twice. An empty excerpt lets the card omit the body block entirely.
    it('returns nothing when the body is only the title repeated', () => {
        expect(buildExcerpt('HARVEST AND BAZAAR', 'HARVEST AND BAZAAR')).toBe('');
    });

    it('keeps month and weekday names capitalised in a shouted body', () => {
        expect(buildExcerpt('THURSDAY 6TH AUGUST, 2026', 'Feast')).toBe('Thursday 6th August, 2026');
    });

    it('handles a missing body', () => {
        expect(buildExcerpt(null, 'Harvest')).toBe('');
        expect(buildExcerpt(undefined, undefined)).toBe('');
    });
});

describe('formatParishDate', () => {
    it('formats an ISO date', () => {
        expect(formatParishDate('2026-08-06')).toMatch(/6/);
        expect(formatParishDate('2026-08-06')).toMatch(/2026/);
    });

    // A date-only string parsed as UTC lands on the previous day west of Greenwich.
    it('does not shift the day across timezones', () => {
        expect(formatParishDate('2026-08-06')).toMatch(/\b6\b/);
    });

    it('returns null rather than "Invalid Date"', () => {
        expect(formatParishDate('not-a-date')).toBeNull();
        expect(formatParishDate(null)).toBeNull();
        expect(formatParishDate('')).toBeNull();
    });
});

describe('splitDateParts', () => {
    it('splits a date for a calendar chip', () => {
        expect(splitDateParts('2026-08-06')).toEqual(
            expect.objectContaining({ day: '6', year: '2026' }),
        );
    });
    it('returns null for unusable input', () => {
        expect(splitDateParts('rubbish')).toBeNull();
        expect(splitDateParts(undefined)).toBeNull();
    });
});

describe('describeWhen', () => {
    const iso = (offsetDays: number) => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().slice(0, 10);
    };

    it('recognises today and tomorrow', () => {
        expect(describeWhen(iso(0))).toBe('Today');
        expect(describeWhen(iso(1))).toBe('Tomorrow');
        expect(describeWhen(iso(-1))).toBe('Yesterday');
    });

    it('describes the near future', () => {
        expect(describeWhen(iso(3))).toBe('In 3 days');
    });

    // Beyond a fortnight the absolute date is more useful than "in 87 days".
    it('returns null for distant dates', () => {
        expect(describeWhen(iso(90))).toBeNull();
    });

    it('returns null for unusable input', () => {
        expect(describeWhen('nonsense')).toBeNull();
    });
});

describe('extractSchedule', () => {
    it('lifts a Masses line out of the body', () => {
        const { schedule, rest } = extractSchedule('Thursday 6th August, 2026\nMasses: 6.00 am and 6.00 pm');
        expect(schedule).toBe('6.00 am and 6.00 pm');
        expect(rest).toBe('Thursday 6th August, 2026');
    });

    it('leaves a body with no schedule line alone', () => {
        const body = 'Come one, come all';
        expect(extractSchedule(body)).toEqual({ schedule: null, rest: body });
    });
});
