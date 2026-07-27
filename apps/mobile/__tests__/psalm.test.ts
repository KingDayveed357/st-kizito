import { selectPsalmBodyVerses } from '../src/utils/psalm';
import type { PsalmVerse } from '../src/types/readings.types';

const v = (text: string): PsalmVerse => ({ type: 'verse', text });
const r = (text: string): PsalmVerse => ({ type: 'response', text });

describe('selectPsalmBodyVerses', () => {
    it('drops a leading response (duplicate of the refrain shown above)', () => {
        const verses = [r('R refrain'), v('verse one'), v('verse two')];
        expect(selectPsalmBodyVerses(verses)).toEqual([v('verse one'), v('verse two')]);
    });

    it('keeps every verse when the first entry is a real verse (regression: no more slice(1) cut)', () => {
        const verses = [v('verse one'), v('verse two'), v('verse three')];
        expect(selectPsalmBodyVerses(verses)).toEqual(verses);
    });

    it('preserves interior response markers between stanzas', () => {
        const verses = [r('R refrain'), v('stanza one'), r('R refrain'), v('stanza two')];
        expect(selectPsalmBodyVerses(verses)).toEqual([v('stanza one'), r('R refrain'), v('stanza two')]);
    });

    it('handles empty / missing input', () => {
        expect(selectPsalmBodyVerses([])).toEqual([]);
        expect(selectPsalmBodyVerses(undefined)).toEqual([]);
        expect(selectPsalmBodyVerses(null)).toEqual([]);
    });
});
