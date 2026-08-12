/**
 * shareReadings.ts — Pure share-content formatter for the Readings screen.
 *
 * Architecture note:
 *   Canonical reading data  →  this formatter  →  Share UI  →  Native Share / Clipboard
 *
 * This module is intentionally free of React, navigation, Supabase, and UI state.
 * All functions are pure, deterministic, and independently testable.
 *
 * The formatter uses the same data structures that drive the Readings screen so that
 * share content is always consistent with what the user sees on screen. No additional
 * network requests are ever triggered.
 */

import type { LiturgicalBlock, PsalmVerse } from '../types/readings.types';
import { getLiturgicalClosing } from './liturgicalClosings';
import { selectPsalmBodyVerses } from './psalm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The subset of LiturgicalBlockType values that represent shareable scripture. */
export type ShareableBlockType =
    | 'first_reading'
    | 'psalm'
    | 'second_reading'
    | 'gospel'
    | 'vigil_reading'
    | 'supplemental_reading'
    | 'reading'
    | 'procession_gospel';

/** A single option in the share sheet — represents one choosable reading. */
export interface ShareOption {
    block: LiturgicalBlock;
    /** Display label shown in the share sheet (e.g. "First Reading", "Gospel"). */
    label: string;
    /** Truncated reference shown as a subtitle in the share sheet. */
    reference: string;
    /** Short preview text (~2 lines) for the preview card. */
    previewText: string;
}

/** Context passed to all formatters alongside the block data. */
export interface ShareContext {
    /** Natural-language celebration title, e.g. "Saint Jean Vianney, Priest". */
    celebrationTitle: string;
    /**
     * Human-readable date string used in share text.
     * Should be a long-form date like "Thursday, 7 August" or the short form
     * produced by formatPremiumDate() — whichever fits the share context.
     */
    formattedDate: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APP_ATTRIBUTION = 'Shared from the St Kizito App';
const APP_HEADER = 'ST KIZITO — Daily Readings';

/**
 * Types of blocks that carry proclaimed scripture suitable for sharing.
 * Antiphons, acclamations, and entrance/communion texts are excluded because
 * they are liturgical rubric elements rather than proclaimed scripture.
 */
const SHAREABLE_TYPES = new Set<string>([
    'first_reading',
    'psalm',
    'second_reading',
    'gospel',
    'vigil_reading',
    'supplemental_reading',
    'reading',
    'procession_gospel',
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Formats a single Psalm block as plain text suitable for messaging apps.
 * Uses the canonical response + selectPsalmBodyVerses() — the same source of truth
 * as the Readings screen renders. Does NOT create a second Psalm parser.
 *
 * Output example:
 *
 *   R/ The hand of the Lord feeds us; he answers all our needs.
 *
 *   Let all your works give you thanks, O Lord,
 *   and let your faithful ones bless you.
 *
 *   R/ The hand of the Lord feeds us; he answers all our needs.
 */
const formatPsalmText = (block: LiturgicalBlock): string => {
    const parts: string[] = [];

    // Opening refrain (from block.response, set by buildPsalmBlock / parseUSCCBPsalmText)
    if (block.response) {
        parts.push(`R/ ${block.response}`);
    }

    // Body verses — uses the existing canonical utility that correctly handles
    // leading-response duplicates and internal response markers.
    const bodyVerses: PsalmVerse[] = selectPsalmBodyVerses(block.verses);

    if (bodyVerses.length > 0) {
        for (const verse of bodyVerses) {
            if (verse.type === 'response') {
                // Repeated refrain between stanzas
                parts.push(`\nR/ ${verse.text}`);
            } else {
                // Verse stanza — preserve line breaks that exist in the data
                parts.push(`\n${verse.text}`);
            }
        }
    } else if (!block.response && block.text) {
        // Pure text fallback (no structured verses, no response)
        parts.push(block.text);
    }

    return parts.join('\n').trim();
};

/**
 * Formats the liturgical closing for a reading type.
 * Delegates entirely to getLiturgicalClosing() — the single canonical source of truth.
 * Returns null for the Psalm (which has no liturgical closing).
 */
const formatClosing = (block: LiturgicalBlock): string | null => {
    const closing = getLiturgicalClosing(block.type);
    if (!closing) return null;
    return `${closing.versicle}\n${closing.response}`;
};

/**
 * Builds the standard share-text header:
 *
 *   ST KIZITO — Daily Readings
 *
 *   Saint Jean Vianney, Priest
 *   Thursday, 7 August
 */
const buildShareHeader = (ctx: ShareContext): string => {
    return `${APP_HEADER}\n\n${ctx.celebrationTitle}\n${ctx.formattedDate}`;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns only the blocks that carry shareable scripture, in liturgical order.
 * Blocks without text are excluded — the UI should never show a share option for
 * content that does not exist or has no readable text.
 */
export const getShareableBlocks = (blocks: LiturgicalBlock[]): LiturgicalBlock[] => {
    return blocks.filter(
        (b) =>
            SHAREABLE_TYPES.has(b.type) &&
            // Psalm may have no text but a structured response/verses
            (b.type === 'psalm'
                ? !!(b.response || (b.verses && b.verses.length > 0) || b.text)
                : !!b.text),
    );
};

/**
 * Builds the list of share options for the share sheet.
 * Each option contains the block, display label, reference, and a short preview.
 * Only includes options for blocks with available content.
 */
export const buildShareOptions = (
    blocks: LiturgicalBlock[],
    ctx: ShareContext,
): ShareOption[] => {
    return getShareableBlocks(blocks).map((block) => {
        const previewSource =
            block.type === 'psalm'
                ? block.response ?? block.text ?? ''
                : block.text ?? '';

        // Preview: first ~120 chars of text, ending cleanly at a word boundary
        let previewText = previewSource.slice(0, 120).trim();
        if (previewSource.length > 120) {
            const lastSpace = previewText.lastIndexOf(' ');
            previewText = (lastSpace > 80 ? previewText.slice(0, lastSpace) : previewText) + '…';
        }

        return {
            block,
            label: block.label,
            reference: block.reference ?? '',
            previewText,
        };
    });
};

/**
 * Formats a single reading block as shareable plain text.
 *
 * Output structure:
 *   [APP HEADER]
 *
 *   [Celebration]
 *   [Date]
 *
 *   FIRST READING
 *   2 Kings 4:42–44
 *
 *   [Scripture text]
 *
 *   The word of the Lord.
 *   Thanks be to God.
 *
 *   — Shared from the St Kizito App
 */
export const formatSingleReading = (
    block: LiturgicalBlock,
    ctx: ShareContext,
): string => {
    const lines: string[] = [buildShareHeader(ctx), ''];

    // Section label — already localised via LITURGICAL_LABELS in the data layer
    lines.push(block.label.toUpperCase());

    if (block.reference) {
        lines.push(block.reference);
    }

    lines.push('');

    // Body
    if (block.type === 'psalm') {
        lines.push(formatPsalmText(block));
    } else if (block.text) {
        lines.push(block.text);
    }

    // Liturgical closing — sourced from getLiturgicalClosing(), not hardcoded
    const closing = formatClosing(block);
    if (closing) {
        lines.push('');
        lines.push(closing);
    }

    lines.push('');
    lines.push(`— ${APP_ATTRIBUTION}`);

    return lines.join('\n').trim();
};

/**
 * Formats all available readings as a single shareable plain-text message.
 * Readings appear in their natural liturgical order as returned by getShareableBlocks().
 *
 * Output structure:
 *   [APP HEADER]
 *
 *   [Celebration]
 *   [Date]
 *
 *   FIRST READING
 *   [reference]
 *
 *   [text]
 *
 *   The word of the Lord.
 *   Thanks be to God.
 *
 *   RESPONSORIAL PSALM
 *   [reference]
 *
 *   R/ [response]
 *   ...
 *
 *   GOSPEL
 *   [reference]
 *
 *   [text]
 *
 *   The Gospel of the Lord.
 *   Praise to you, Lord Jesus Christ.
 *
 *   — Shared from the St Kizito App
 */
export const formatAllReadings = (
    blocks: LiturgicalBlock[],
    ctx: ShareContext,
): string => {
    const shareable = getShareableBlocks(blocks);
    if (shareable.length === 0) return '';

    const lines: string[] = [buildShareHeader(ctx)];

    for (const block of shareable) {
        lines.push('');
        lines.push(block.label.toUpperCase());

        if (block.reference) {
            lines.push(block.reference);
        }

        lines.push('');

        if (block.type === 'psalm') {
            lines.push(formatPsalmText(block));
        } else if (block.text) {
            lines.push(block.text);
        }

        const closing = formatClosing(block);
        if (closing) {
            lines.push('');
            lines.push(closing);
        }
    }

    lines.push('');
    lines.push(`— ${APP_ATTRIBUTION}`);

    return lines.join('\n').trim();
};
