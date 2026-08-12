import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHymnStanzas, stripHymnCredits } from '../src/utils/divineOfficeParser';

/**
 * The Divine Office scraper captured each hymn's recording credits as part of the hymn text, so a
 * block of licensing metadata rendered as a final stanza in serif italic — the "irrelevant content
 * right after the hymns" report. `scripts/clean-hymn-attribution.mjs` split those into a separate
 * `attribution` field (670 blocks), and `stripHymnCredits` catches anything the script misses.
 *
 * These tests hold both ends: the detection logic, and the bundled data staying clean.
 */

describe('stripHymnCredits', () => {
    const hymn = [
        'O Sacrament most holy,',
        'O Sacrament divine!',
        'All praise and all thanksgiving',
        "Be ev'ry moment Thine.",
    ].join('\n');

    it('removes a trailing credit line', () => {
        const withCredit = `${hymn}\n"O Lord, I Am Not Worthy" by Rebecca Hincke • Title: O Lord, I Am Not Worthy; Author: Unknown; Tune: NON DIGNUS; Recording copyright 2024 by Surgeworks, Inc.`;
        expect(stripHymnCredits(withCredit)).toBe(hymn);
    });

    it('removes the "Musical Score" credit variant', () => {
        const withCredit = `${hymn}\n"The Day You Gave Us Lord is Ended" by Eva Zlatkovic Ristic • Musical Score • Text: John Ellerton, 1826-1893; Tune: St. Clement`;
        expect(stripHymnCredits(withCredit)).toBe(hymn);
    });

    it('leaves a hymn with no credits untouched', () => {
        expect(stripHymnCredits(hymn)).toBe(hymn);
    });

    // The failure that would matter most: silently deleting a line of prayer.
    it('keeps verse lines that merely contain a colon', () => {
        const withColon = 'Hear us, O Lord:\nand let our cry come unto thee.';
        expect(stripHymnCredits(withColon)).toBe(withColon);
    });

    it('keeps a line naming a saint or a place, which is not a credit', () => {
        const verse = `${hymn}\nSaint Cecilia, pray for us.`;
        expect(stripHymnCredits(verse)).toBe(verse);
    });

    // Better a stray credit line than an empty hymn: if detection matches everything, the record is
    // returned unchanged for a human to look at.
    it('returns the original when every line looks like a credit', () => {
        const allCredits = '"A Hymn" by Someone • Title: A Hymn; Artist: Someone';
        expect(stripHymnCredits(allCredits)).toBe(allCredits);
    });

    it('parseHymnStanzas drops credits while preserving stanza breaks', () => {
        const raw = `Verse one line one\nVerse one line two\n\nVerse two line one\nVerse two line two\n"X" by Y • Title: X; Artist: Y`;
        const stanzas = parseHymnStanzas(raw);
        expect(stanzas).toHaveLength(2);
        expect(stanzas.join('\n')).not.toMatch(/Artist:/);
    });
});

describe('bundled divineOfficeComplete.json', () => {
    const data = JSON.parse(
        readFileSync(join(__dirname, '..', 'data', 'divineOfficeComplete.json'), 'utf8'),
    ) as Record<string, any>;

    const hymns: { key: string; office: string; text: string }[] = [];
    for (const [key, entry] of Object.entries(data)) {
        if (key === '__meta') continue;
        for (const [office, value] of Object.entries((entry as any).offices ?? {})) {
            const hymn = (value as any)?.parts?.hymn;
            if (!hymn) continue;
            const text = typeof hymn === 'string' ? hymn : hymn.text;
            if (text) hymns.push({ key, office, text });
        }
    }

    it('has hymns to check', () => {
        expect(hymns.length).toBeGreaterThan(1000);
    });

    it('no hymn body still contains recording credits', () => {
        const offenders = hymns
            .filter(({ text }) => /Recording copyright|Surgeworks|•\s*Musical Score|;\s*Tune:/i.test(text))
            .map(({ key, office }) => `${key}/${office}`);

        expect(offenders).toEqual([]);
    });

    it('no hymn was emptied by the cleanup', () => {
        expect(hymns.filter(({ text }) => text.trim().length === 0)).toEqual([]);
    });
});
