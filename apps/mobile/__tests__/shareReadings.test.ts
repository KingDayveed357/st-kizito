/**
 * Tests for shareReadings.ts — the pure share-content formatter.
 *
 * The formatter has no React, no navigation, no Supabase, and no side effects,
 * so all tests run in a pure Node.js environment without mocking.
 */

import type { LiturgicalBlock } from '../src/types/readings.types';
import {
    buildShareOptions,
    formatAllReadings,
    formatSingleReading,
    getShareableBlocks,
    type ShareContext,
} from '../src/utils/shareReadings';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ctx: ShareContext = {
    celebrationTitle: 'Saint Jean Vianney, Priest',
    formattedDate: 'Thursday, 7 August',
};

const firstReading: LiturgicalBlock = {
    id: 'first-reading-2025-08-07',
    type: 'first_reading',
    label: 'First Reading',
    reference: '1 Kgs 19:9, 11–13',
    text: 'At the mountain of God, Horeb, Elijah came to a cave and spent the night there.',
};

const psalm: LiturgicalBlock = {
    id: 'psalm-2025-08-07',
    type: 'psalm',
    label: 'Responsorial Psalm',
    reference: 'Ps 85:9–14',
    response: 'Lord, let us see your kindness, and grant us your salvation.',
    verses: [
        { type: 'response', text: 'Lord, let us see your kindness, and grant us your salvation.' },
        { type: 'verse', text: 'I will hear what God proclaims;\nthe LORD—for he proclaims peace.' },
        { type: 'response', text: 'Lord, let us see your kindness, and grant us your salvation.' },
        { type: 'verse', text: 'Near indeed is his salvation to those who fear him,\nglory dwelling in our land.' },
    ],
    text: 'Lord, let us see your kindness.',
};

const psalmNoVerses: LiturgicalBlock = {
    id: 'psalm-no-verses',
    type: 'psalm',
    label: 'Responsorial Psalm',
    reference: 'Ps 23:1–6',
    response: 'The Lord is my shepherd; there is nothing I shall want.',
    verses: [],
    text: 'The Lord is my shepherd; there is nothing I shall want.',
};

const psalmPureTextFallback: LiturgicalBlock = {
    id: 'psalm-text-fallback',
    type: 'psalm',
    label: 'Responsorial Psalm',
    reference: 'Ps 23:1–6',
    response: null,
    verses: [],
    text: 'The Lord is my shepherd; there is nothing I shall want.',
};

const secondReading: LiturgicalBlock = {
    id: 'second-reading-2025-08-07',
    type: 'second_reading',
    label: 'Second Reading',
    reference: 'Rom 8:28–30',
    text: 'We know that all things work for good for those who love God.',
};

const gospel: LiturgicalBlock = {
    id: 'gospel-2025-08-07',
    type: 'gospel',
    label: 'Gospel',
    reference: 'Mt 14:22–33',
    text: 'Jesus made the disciples get into a boat and precede him to the other side.',
};

// Non-shareable blocks
const entrance: LiturgicalBlock = {
    id: 'entrance',
    type: 'entrance_antiphon',
    label: 'Entrance Antiphon',
    reference: null,
    text: 'O God, come to my assistance.',
};

const acclamation: LiturgicalBlock = {
    id: 'acclamation',
    type: 'gospel_acclamation',
    label: 'Gospel Acclamation',
    reference: null,
    text: 'Alleluia, alleluia.',
};

// Block with no text
const emptyBlock: LiturgicalBlock = {
    id: 'empty',
    type: 'first_reading',
    label: 'First Reading',
    reference: '1 Kgs 19:9',
    text: null,
};

const allBlocks = [firstReading, psalm, secondReading, gospel, entrance, acclamation];

// ---------------------------------------------------------------------------
// getShareableBlocks
// ---------------------------------------------------------------------------

describe('getShareableBlocks', () => {
    it('filters out non-shareable types (antiphons, acclamations)', () => {
        const result = getShareableBlocks(allBlocks);
        const types = result.map((b) => b.type);
        expect(types).not.toContain('entrance_antiphon');
        expect(types).not.toContain('gospel_acclamation');
        expect(types).not.toContain('communion_antiphon');
    });

    it('includes first_reading, psalm, second_reading, gospel', () => {
        const result = getShareableBlocks(allBlocks);
        const types = result.map((b) => b.type);
        expect(types).toContain('first_reading');
        expect(types).toContain('psalm');
        expect(types).toContain('second_reading');
        expect(types).toContain('gospel');
    });

    it('excludes blocks with no text (non-psalm)', () => {
        const result = getShareableBlocks([emptyBlock, gospel]);
        expect(result.find((b) => b.id === 'empty')).toBeUndefined();
        expect(result.find((b) => b.type === 'gospel')).toBeDefined();
    });

    it('preserves liturgical order', () => {
        const result = getShareableBlocks(allBlocks);
        const ids = result.map((b) => b.id);
        expect(ids.indexOf('first-reading-2025-08-07')).toBeLessThan(ids.indexOf('psalm-2025-08-07'));
        expect(ids.indexOf('psalm-2025-08-07')).toBeLessThan(ids.indexOf('second-reading-2025-08-07'));
        expect(ids.indexOf('second-reading-2025-08-07')).toBeLessThan(ids.indexOf('gospel-2025-08-07'));
    });

    it('handles empty input', () => {
        expect(getShareableBlocks([])).toEqual([]);
    });

    it('includes psalm with only response (no verses, no text fallback)', () => {
        const psalmResponseOnly: LiturgicalBlock = {
            id: 'psalm-response-only',
            type: 'psalm',
            label: 'Responsorial Psalm',
            reference: 'Ps 23',
            response: 'The Lord is my shepherd.',
            verses: [],
            text: null,
        };
        const result = getShareableBlocks([psalmResponseOnly]);
        expect(result).toHaveLength(1);
    });
});

// ---------------------------------------------------------------------------
// formatSingleReading — First Reading
// ---------------------------------------------------------------------------

describe('formatSingleReading — First Reading', () => {
    let output: string;

    beforeEach(() => {
        output = formatSingleReading(firstReading, ctx);
    });

    it('contains the app header', () => {
        expect(output).toContain('ST KIZITO — Daily Readings');
    });

    it('contains the celebration title (natural casing, not all-caps)', () => {
        expect(output).toContain('Saint Jean Vianney, Priest');
    });

    it('contains the formatted date', () => {
        expect(output).toContain('Thursday, 7 August');
    });

    it('contains the reading label in uppercase', () => {
        expect(output).toContain('FIRST READING');
    });

    it('contains the reference', () => {
        expect(output).toContain('1 Kgs 19:9, 11–13');
    });

    it('contains the full reading text', () => {
        expect(output).toContain('At the mountain of God, Horeb');
    });

    it('contains the liturgical closing for a reading', () => {
        expect(output).toContain('The word of the Lord.');
        expect(output).toContain('Thanks be to God.');
    });

    it('contains the attribution footer', () => {
        expect(output).toContain('Shared from the St Kizito App');
    });

    it('does NOT contain Gospel closing', () => {
        expect(output).not.toContain('The Gospel of the Lord.');
    });
});

// ---------------------------------------------------------------------------
// formatSingleReading — Gospel
// ---------------------------------------------------------------------------

describe('formatSingleReading — Gospel', () => {
    let output: string;

    beforeEach(() => {
        output = formatSingleReading(gospel, ctx);
    });

    it('contains GOSPEL label', () => {
        expect(output).toContain('GOSPEL');
    });

    it('contains the Gospel reference', () => {
        expect(output).toContain('Mt 14:22–33');
    });

    it('contains Gospel closing, not reading closing', () => {
        expect(output).toContain('The Gospel of the Lord.');
        expect(output).toContain('Praise to you, Lord Jesus Christ.');
        expect(output).not.toContain('The word of the Lord.');
    });
});

// ---------------------------------------------------------------------------
// formatSingleReading — Psalm (structured verses)
// ---------------------------------------------------------------------------

describe('formatSingleReading — Psalm with structured verses', () => {
    let output: string;

    beforeEach(() => {
        output = formatSingleReading(psalm, ctx);
    });

    it('contains RESPONSORIAL PSALM label', () => {
        expect(output).toContain('RESPONSORIAL PSALM');
    });

    it('contains the psalm reference', () => {
        expect(output).toContain('Ps 85:9–14');
    });

    it('contains the refrain prefixed with R/', () => {
        expect(output).toContain("R/ Lord, let us see your kindness, and grant us your salvation.");
    });

    it('contains verse content (stanzas)', () => {
        expect(output).toContain('I will hear what God proclaims');
    });

    it('contains repeated refrain marker between stanzas', () => {
        // The psalm fixture has a response entry between two verse entries
        const rCount = (output.match(/R\//g) ?? []).length;
        expect(rCount).toBeGreaterThanOrEqual(2);
    });

    it('does NOT include a liturgical closing (psalm has no closing)', () => {
        expect(output).not.toContain('The word of the Lord.');
        expect(output).not.toContain('The Gospel of the Lord.');
    });

    it('does NOT duplicate the leading response as a verse', () => {
        // The fixture has response as first verse — should appear only as R/ refrain, not as a V/
        const lines = output.split('\n');
        const responseText = 'Lord, let us see your kindness, and grant us your salvation.';
        const occurrences = lines.filter((l) => l.includes(responseText));
        // Should appear at least once as R/ refrain + at least once as repeated refrain,
        // but never as a bare verse without a prefix
        for (const line of occurrences) {
            if (line.trim() !== '') {
                expect(line.trimStart()).toMatch(/^R\//);
            }
        }
    });
});

// ---------------------------------------------------------------------------
// formatSingleReading — Psalm (no verses, fallback to response only)
// ---------------------------------------------------------------------------

describe('formatSingleReading — Psalm with no verses (response only)', () => {
    it('contains the response prefixed with R/', () => {
        const output = formatSingleReading(psalmNoVerses, ctx);
        expect(output).toContain('R/ The Lord is my shepherd; there is nothing I shall want.');
    });
});

// ---------------------------------------------------------------------------
// formatSingleReading — Psalm (pure text fallback, no response, no verses)
// ---------------------------------------------------------------------------

describe('formatSingleReading — Psalm with pure text fallback', () => {
    it('falls back to block.text when no response and no verses', () => {
        const output = formatSingleReading(psalmPureTextFallback, ctx);
        expect(output).toContain('The Lord is my shepherd; there is nothing I shall want.');
    });
});

// ---------------------------------------------------------------------------
// formatAllReadings
// ---------------------------------------------------------------------------

describe('formatAllReadings', () => {
    let output: string;

    beforeEach(() => {
        output = formatAllReadings(allBlocks, ctx);
    });

    it('contains exactly one app header', () => {
        const count = (output.match(/ST KIZITO — Daily Readings/g) ?? []).length;
        expect(count).toBe(1);
    });

    it('contains celebration title', () => {
        expect(output).toContain('Saint Jean Vianney, Priest');
    });

    it('contains all four reading labels', () => {
        expect(output).toContain('FIRST READING');
        expect(output).toContain('RESPONSORIAL PSALM');
        expect(output).toContain('SECOND READING');
        expect(output).toContain('GOSPEL');
    });

    it('does NOT include antiphon or acclamation content', () => {
        expect(output).not.toContain('Entrance Antiphon');
        expect(output).not.toContain('Gospel Acclamation');
        expect(output).not.toContain('O God, come to my assistance.');
        expect(output).not.toContain('Alleluia, alleluia.');
    });

    it('readings appear in liturgical order', () => {
        const firstIdx = output.indexOf('FIRST READING');
        const psalmIdx = output.indexOf('RESPONSORIAL PSALM');
        const secondIdx = output.indexOf('SECOND READING');
        const gospelIdx = output.indexOf('GOSPEL');
        expect(firstIdx).toBeLessThan(psalmIdx);
        expect(psalmIdx).toBeLessThan(secondIdx);
        expect(secondIdx).toBeLessThan(gospelIdx);
    });

    it('contains exactly one attribution footer', () => {
        const count = (output.match(/Shared from the St Kizito App/g) ?? []).length;
        expect(count).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// formatAllReadings — Missing readings
// ---------------------------------------------------------------------------

describe('formatAllReadings — missing Second Reading', () => {
    it('omits Second Reading when not present', () => {
        const blocks = [firstReading, psalm, gospel, entrance];
        const output = formatAllReadings(blocks, ctx);
        expect(output).not.toContain('SECOND READING');
        expect(output).toContain('FIRST READING');
        expect(output).toContain('GOSPEL');
    });
});

describe('formatAllReadings — no Gospel', () => {
    it('omits Gospel when not present', () => {
        const blocks = [firstReading, psalm];
        const output = formatAllReadings(blocks, ctx);
        expect(output).not.toContain('GOSPEL');
        expect(output).toContain('FIRST READING');
    });
});

describe('formatAllReadings — no readings at all', () => {
    it('returns empty string when no shareable blocks', () => {
        const output = formatAllReadings([entrance, acclamation], ctx);
        expect(output).toBe('');
    });
});

describe('formatAllReadings — only empty-text readings', () => {
    it('returns empty string when all readable blocks have no text', () => {
        const output = formatAllReadings([emptyBlock], ctx);
        expect(output).toBe('');
    });
});

// ---------------------------------------------------------------------------
// Special characters
// ---------------------------------------------------------------------------

describe('Special characters in share text', () => {
    it('preserves accented characters in celebration title', () => {
        const accentCtx: ShareContext = {
            celebrationTitle: 'Saint Jean Vianney (The Curé of Ars), Priest',
            formattedDate: 'Thursday, 7 August',
        };
        const output = formatSingleReading(firstReading, accentCtx);
        expect(output).toContain('Curé');
    });

    it('preserves Unicode punctuation in reference', () => {
        const blockWithDash: LiturgicalBlock = {
            ...firstReading,
            reference: '1 Kgs 19:9, 11–13', // en-dash
        };
        const output = formatSingleReading(blockWithDash, ctx);
        expect(output).toContain('11–13');
    });

    it('preserves apostrophes in reading text', () => {
        const blockWithApostrophe: LiturgicalBlock = {
            ...firstReading,
            text: "I'm here, Lord. Come, let's go.",
        };
        const output = formatSingleReading(blockWithApostrophe, ctx);
        expect(output).toContain("I'm here");
        expect(output).toContain("let's go");
    });

    it('preserves quotation marks in reading text', () => {
        const blockWithQuotes: LiturgicalBlock = {
            ...firstReading,
            text: 'He said, \u201cGo out and stand on the mountain.\u201d',
        };
        const output = formatSingleReading(blockWithQuotes, ctx);
        expect(output).toContain('\u201cGo out');
    });

    it('preserves newlines within reading text', () => {
        const blockWithNewlines: LiturgicalBlock = {
            ...firstReading,
            text: 'Line one.\nLine two.\nLine three.',
        };
        const output = formatSingleReading(blockWithNewlines, ctx);
        expect(output).toContain('Line one.\nLine two.');
    });
});

// ---------------------------------------------------------------------------
// buildShareOptions
// ---------------------------------------------------------------------------

describe('buildShareOptions', () => {
    it('returns one option per shareable block', () => {
        const options = buildShareOptions(allBlocks, ctx);
        expect(options).toHaveLength(4); // first, psalm, second, gospel
    });

    it('each option has a label, reference, and previewText', () => {
        const options = buildShareOptions([firstReading], ctx);
        expect(options[0].label).toBe('First Reading');
        expect(options[0].reference).toBe('1 Kgs 19:9, 11–13');
        expect(typeof options[0].previewText).toBe('string');
        expect(options[0].previewText.length).toBeGreaterThan(0);
    });

    it('preview text is truncated to ~120 characters', () => {
        const longBlock: LiturgicalBlock = {
            ...firstReading,
            text: 'A'.repeat(300),
        };
        const options = buildShareOptions([longBlock], ctx);
        // Should end with an ellipsis and be shorter than the full text
        expect(options[0].previewText.endsWith('…')).toBe(true);
        expect(options[0].previewText.length).toBeLessThan(300);
    });

    it('psalm preview text comes from response', () => {
        const options = buildShareOptions([psalm], ctx);
        expect(options[0].previewText).toContain("Lord, let us see your kindness");
    });
});
