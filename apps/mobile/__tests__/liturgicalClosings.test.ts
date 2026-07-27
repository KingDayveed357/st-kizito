import { getLiturgicalClosing } from '../src/utils/liturgicalClosings';

describe('getLiturgicalClosing', () => {
    it('returns the reading closing for proclaimed readings', () => {
        for (const type of ['first_reading', 'second_reading', 'vigil_reading', 'supplemental_reading', 'reading'] as const) {
            expect(getLiturgicalClosing(type)).toEqual({
                versicle: 'The word of the Lord.',
                response: 'Thanks be to God.',
            });
        }
    });

    it('returns the gospel closing for gospel proclamations', () => {
        for (const type of ['gospel', 'procession_gospel'] as const) {
            expect(getLiturgicalClosing(type)).toEqual({
                versicle: 'The Gospel of the Lord.',
                response: 'Praise to you, Lord Jesus Christ.',
            });
        }
    });

    it('returns null for non-proclaimed blocks', () => {
        for (const type of ['psalm', 'gospel_acclamation', 'entrance_antiphon', 'communion_antiphon'] as const) {
            expect(getLiturgicalClosing(type)).toBeNull();
        }
    });
});
