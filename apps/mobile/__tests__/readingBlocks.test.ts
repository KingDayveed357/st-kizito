import { normalizeBlockType } from '../src/utils/readingBlocks';
import { getLiturgicalClosing } from '../src/utils/liturgicalClosings';

describe('normalizeBlockType (Verse Before the Gospel)', () => {
    it('retypes a gospel-typed "Verse Before the Gospel" to gospel_acclamation', () => {
        expect(normalizeBlockType('gospel', 'Verse Before the Gospel')).toBe('gospel_acclamation');
        expect(normalizeBlockType('gospel', 'Verse before the Gospel')).toBe('gospel_acclamation');
        expect(normalizeBlockType('gospel', 'Verse Before the Gospel See')).toBe('gospel_acclamation');
    });

    it('leaves the real Gospel reading untouched', () => {
        expect(normalizeBlockType('gospel', 'Gospel')).toBe('gospel');
    });

    it('leaves other block types untouched', () => {
        expect(normalizeBlockType('first_reading', 'Reading I')).toBe('first_reading');
        expect(normalizeBlockType('gospel_acclamation', 'Alleluia')).toBe('gospel_acclamation');
        expect(normalizeBlockType('psalm', 'Responsorial Psalm')).toBe('psalm');
    });

    it('regression: after normalization the verse gets NO liturgical closing', () => {
        // The whole point — a Verse Before the Gospel must never carry the Gospel closing.
        const verseType = normalizeBlockType('gospel', 'Verse Before the Gospel');
        expect(getLiturgicalClosing(verseType)).toBeNull();

        // …while the real Gospel still does.
        const gospelType = normalizeBlockType('gospel', 'Gospel');
        expect(getLiturgicalClosing(gospelType)).toEqual({
            versicle: 'The Gospel of the Lord.',
            response: 'Praise to you, Lord Jesus Christ.',
        });
    });
});
