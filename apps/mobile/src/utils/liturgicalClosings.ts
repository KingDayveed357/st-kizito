import type { LiturgicalBlockType } from '../types/readings.types';

export interface LiturgicalClosing {
    /** The minister's line, e.g. "The word of the Lord." */
    versicle: string;
    /** The congregation's response, e.g. "Thanks be to God." */
    response: string;
}

const READING_CLOSING: LiturgicalClosing = {
    versicle: 'The word of the Lord.',
    response: 'Thanks be to God.',
};

const GOSPEL_CLOSING: LiturgicalClosing = {
    versicle: 'The Gospel of the Lord.',
    response: 'Praise to you, Lord Jesus Christ.',
};

// Proclaimed readings that end with "The word of the Lord. / Thanks be to God."
const READING_TYPES: ReadonlySet<LiturgicalBlockType> = new Set([
    'first_reading',
    'second_reading',
    'vigil_reading',
    'supplemental_reading',
    'reading',
]);

// Gospel proclamations end with "The Gospel of the Lord. / Praise to you, Lord Jesus Christ."
const GOSPEL_TYPES: ReadonlySet<LiturgicalBlockType> = new Set([
    'gospel',
    'procession_gospel',
]);

/**
 * Returns the standard Catholic closing versicle/response for a proclaimed reading, applied at
 * the render layer so the data files never need to embed it (see audit #5). Non-proclaimed
 * blocks (psalm, antiphons, acclamations) return `null`.
 */
export const getLiturgicalClosing = (type: LiturgicalBlockType): LiturgicalClosing | null => {
    if (GOSPEL_TYPES.has(type)) return GOSPEL_CLOSING;
    if (READING_TYPES.has(type)) return READING_CLOSING;
    return null;
};
