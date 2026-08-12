import type { PsalmVerse } from '../types/readings.types';

/**
 * Selects the psalm body verses to render beneath the refrain.
 *
 * The refrain (response) is displayed separately from `block.response`. Some data paths place a
 * duplicate of that refrain as the FIRST entry of `verses` (`type: 'response'`); others place a
 * real verse first. We must drop only the leading *response* duplicate — never a real verse,
 * which an unconditional `slice(1)` did, silently cutting scripture (see audit #6).
 *
 * Retained for the Divine Office path and any data that still supplies a flat verse list. New
 * rendering should prefer the structured model below.
 */
export const selectPsalmBodyVerses = (verses: PsalmVerse[] | undefined | null): PsalmVerse[] => {
    if (!verses || verses.length === 0) return [];
    return verses[0].type === 'response' ? verses.slice(1) : verses;
};

// ─── Structured psalm model ───────────────────────────────────────────────────

export interface PsalmStanza {
    /** Poetic lines exactly as authored — never re-wrapped or re-joined. */
    lines: string[];
}

export interface StructuredPsalm {
    /** Refrain text, stripped of the "R." marker and its verse citation. */
    response: string | null;
    /** Verse citation carried by the refrain, e.g. "2a" from "R. (2a) May God bless us…". */
    responseCitation: string | null;
    /** An alternative refrain, when the source offers one after an "or:" line. */
    alternateResponse: string | null;
    /** True stanzas. Refrain repetitions are treated as BOUNDARIES, never as content. */
    stanzas: PsalmStanza[];
}

/**
 * Matches a refrain line: "R.", "R/", "℟", or a bare "R" followed by whitespace (the lectionary
 * source uses all four, e.g. "R. (2a) …" and "R (40:5a) …"). Optionally followed by a "(2a)" style
 * citation, which in practice appears only on the first refrain.
 *
 * The bare-"R" branch requires a following space so ordinary verse lines beginning with the letter
 * R — "Rejoice in the Lord", "Remember your mercies" — are never mistaken for refrains.
 */
const REFRAIN_LINE = /^(?:℟|R[./]|R(?=\s))\s*(?:\(([^)]*)\)\s*)?(.*)$/i;

/** Lines that merely introduce an alternative refrain. */
const ALTERNATIVE_MARKER = /^or:?$/i;

/**
 * Parses raw lectionary psalm text into a structured refrain + stanza model.
 *
 * Why this exists: the source text delimits stanzas by REPEATING the refrain between them, e.g.
 *
 *     R. (2a) May God bless us in his mercy.
 *     May God have pity on us and bless us;      ← stanza 1
 *     may he let his face shine upon us.
 *     R. May God bless us in his mercy.          ← boundary, not content
 *     May the nations be glad and exult          ← stanza 2
 *     …
 *
 * The previous parser pushed each repeated refrain into the verse list as a sibling of the stanzas,
 * so a 3-stanza psalm became 7 entries; the renderer then drew each entry as its own block and the
 * screen showed 8–9 fragments instead of 3–4 stanzas, with refrains masquerading as verses. Treating
 * the refrain as a delimiter — and rendering repetitions from the model rather than from the text —
 * is what makes the output structurally correct rather than cosmetically patched.
 */
export const parsePsalmText = (raw: string | null | undefined): StructuredPsalm => {
    const empty: StructuredPsalm = {
        response: null,
        responseCitation: null,
        alternateResponse: null,
        stanzas: [],
    };
    if (!raw || !raw.trim()) return empty;

    const lines = raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    let response: string | null = null;
    let responseCitation: string | null = null;
    let alternateResponse: string | null = null;
    let expectingAlternate = false;

    const stanzas: PsalmStanza[] = [];
    let current: string[] = [];

    const flush = () => {
        if (current.length > 0) {
            stanzas.push({ lines: current });
            current = [];
        }
    };

    for (const line of lines) {
        if (ALTERNATIVE_MARKER.test(line)) {
            // The next refrain is an alternative, not a stanza boundary's refrain.
            expectingAlternate = true;
            continue;
        }

        const match = line.match(REFRAIN_LINE);
        if (match) {
            const [, citation, text] = match;
            const refrain = (text ?? '').trim();

            if (expectingAlternate) {
                if (refrain && !alternateResponse) alternateResponse = refrain;
                expectingAlternate = false;
                continue;
            }

            // A refrain ends the stanza in progress.
            flush();
            if (refrain && !response) {
                response = refrain;
                responseCitation = citation ? citation.trim() : null;
            }
            continue;
        }

        current.push(line);
    }

    flush();

    return { response, responseCitation, alternateResponse, stanzas };
};

/**
 * True when the parsed psalm has renderable content. Guards the renderer against falling back to a
 * structured-but-empty psalm when the source text was unusable.
 */
export const hasPsalmContent = (psalm: StructuredPsalm | null | undefined): boolean =>
    !!psalm && psalm.stanzas.some((stanza) => stanza.lines.length > 0);
