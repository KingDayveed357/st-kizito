import type { PsalmVerse } from '../types/readings.types';

/**
 * Selects the psalm body verses to render beneath the refrain.
 *
 * The refrain (response) is displayed separately from `block.response`. Some data paths place a
 * duplicate of that refrain as the FIRST entry of `verses` (`type: 'response'`); others place a
 * real verse first. We must drop only the leading *response* duplicate — never a real verse,
 * which an unconditional `slice(1)` did, silently cutting scripture (see audit #6).
 */
export const selectPsalmBodyVerses = (verses: PsalmVerse[] | undefined | null): PsalmVerse[] => {
    if (!verses || verses.length === 0) return [];
    return verses[0].type === 'response' ? verses.slice(1) : verses;
};
