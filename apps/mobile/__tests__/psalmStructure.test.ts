import { parsePsalmText, hasPsalmContent } from '../src/utils/psalm';
import { getReadings } from '../src/services/liturgicalData';

/**
 * Regression suite for the responsorial-psalm structure bug: a psalm that should show 3–4 stanzas
 * rendered as 8–9 fragments because repeated refrains were emitted into the verse stream and drawn
 * as if they were stanzas.
 *
 * The invariant that matters liturgically: **a refrain is a boundary, never content.**
 */

// Real lectionary shape (Psalm 67, Jan 1) — refrain first with a citation, repeated between stanzas.
const PSALM_67 = [
    'R. (2a) May God bless us in his mercy.',
    'May God have pity on us and bless us;',
    'may he let his face shine upon us.',
    'So may your way be known upon earth;',
    'among all nations, your salvation.',
    'R. May God bless us in his mercy. ',
    'May the nations be glad and exult',
    'because you rule the peoples in equity;',
    'the nations on the earth you guide.',
    'R. May God bless us in his mercy. ',
    'May the peoples praise you, O God;',
    'may all the peoples praise you!',
    'R. May God bless us in his mercy.',
].join('\n');

describe('parsePsalmText', () => {
    it('extracts the refrain and its verse citation', () => {
        const psalm = parsePsalmText(PSALM_67);
        expect(psalm.response).toBe('May God bless us in his mercy.');
        expect(psalm.responseCitation).toBe('2a');
    });

    it('returns the TRUE stanza count, not one entry per refrain repetition', () => {
        const psalm = parsePsalmText(PSALM_67);
        // 3 stanzas — the old parser produced 7 entries for this exact input.
        expect(psalm.stanzas).toHaveLength(3);
    });

    it('never lets a refrain leak into stanza content', () => {
        const psalm = parsePsalmText(PSALM_67);
        for (const stanza of psalm.stanzas) {
            const joined = stanza.lines.join(' ').toLowerCase();
            expect(joined).not.toContain('may god bless us in his mercy');
        }
    });

    it('preserves each poetic line separately (no re-wrapping)', () => {
        const psalm = parsePsalmText(PSALM_67);
        expect(psalm.stanzas[0].lines).toEqual([
            'May God have pity on us and bless us;',
            'may he let his face shine upon us.',
            'So may your way be known upon earth;',
            'among all nations, your salvation.',
        ]);
    });

    it('matches a bare "R" refrain marker with no period (real lectionary variant)', () => {
        const raw = ['R (40:5a) Blessed are they who hope in the Lord.', 'Blessed the man who follows not', 'the counsel of the wicked,', 'R Blessed are they who hope in the Lord.', 'He is like a tree'].join('\n');
        const psalm = parsePsalmText(raw);
        expect(psalm.response).toBe('Blessed are they who hope in the Lord.');
        expect(psalm.responseCitation).toBe('40:5a');
        expect(psalm.stanzas).toHaveLength(2);
    });

    it('does NOT treat an ordinary verse beginning with "R" as a refrain', () => {
        const raw = ['R. Give thanks to the Lord.', 'Rejoice in the Lord, you just;', 'Remember the marvels he has done.'].join('\n');
        const psalm = parsePsalmText(raw);
        expect(psalm.stanzas).toHaveLength(1);
        expect(psalm.stanzas[0].lines).toEqual([
            'Rejoice in the Lord, you just;',
            'Remember the marvels he has done.',
        ]);
    });

    it('captures an alternative refrain offered after "or:"', () => {
        const raw = ['R. (1) The Lord is my shepherd.', 'or:', 'R. Alleluia.', 'The Lord is my shepherd; I shall not want.'].join('\n');
        const psalm = parsePsalmText(raw);
        expect(psalm.response).toBe('The Lord is my shepherd.');
        expect(psalm.alternateResponse).toBe('Alleluia.');
        expect(psalm.stanzas).toHaveLength(1);
    });

    it('handles text with no refrain at all', () => {
        const psalm = parsePsalmText('Line one\nLine two');
        expect(psalm.response).toBeNull();
        expect(psalm.stanzas).toHaveLength(1);
    });

    it('handles empty / missing input', () => {
        expect(parsePsalmText('').stanzas).toEqual([]);
        expect(parsePsalmText(null).response).toBeNull();
        expect(parsePsalmText(undefined).stanzas).toEqual([]);
        expect(hasPsalmContent(parsePsalmText(''))).toBe(false);
        expect(hasPsalmContent(parsePsalmText(PSALM_67))).toBe(true);
    });
});

describe('psalm structure across real liturgical day types', () => {
    // Weekday, Sunday, solemnity, feast and memorial all resolve through the same pipeline.
    const dates = [
        '2026-01-01', // Solemnity — Mary, Mother of God
        '2026-01-06', // Weekday (Christmas season)
        '2026-04-05', // Sunday — Easter
        '2026-06-15', // Ordinary weekday
        '2026-08-04', // Memorial — St John Vianney
        '2026-12-25', // Solemnity — Christmas
    ];

    test.each(dates)('%s renders a structurally sound psalm', (date) => {
        const day = getReadings(date);
        expect(day).not.toBeNull();

        const psalm = day!.readings.find((block) => block.type === 'psalm');
        if (!psalm) return; // Not every day in the corpus carries a psalm block.

        // A psalm must have real stanzas, and a sane number of them.
        expect(psalm.stanzas?.length ?? 0).toBeGreaterThan(0);
        expect(psalm.stanzas!.length).toBeLessThanOrEqual(9);

        // The refrain must never appear as stanza content — neither as a whole stanza nor as a
        // stanza's opening line. The latter is the subtler failure: pre-processing used to strip the
        // leading "R." marker, demoting the opening refrain into stanza 1.
        if (psalm.response) {
            const refrain = psalm.response.toLowerCase().replace(/\s+/g, ' ').trim();
            for (const stanza of psalm.stanzas!) {
                const joined = stanza.lines.join(' ').toLowerCase().replace(/\s+/g, ' ').trim();
                expect(joined).not.toBe(refrain);

                const firstLine = stanza.lines[0].toLowerCase().replace(/\s+/g, ' ').trim();
                expect(firstLine).not.toBe(refrain);
            }
        }

        // Every stanza must carry actual text.
        for (const stanza of psalm.stanzas!) {
            expect(stanza.lines.length).toBeGreaterThan(0);
            expect(stanza.lines.join('').trim().length).toBeGreaterThan(0);
        }
    });
});
