#!/usr/bin/env node
/**
 * Split recording credits out of Divine Office hymn text.
 *
 * THE PROBLEM
 * The divineoffice.org scraper captured each hymn's recording-credit line as part of the hymn text
 * itself. So a prayed hymn ends like this:
 *
 *     O Sacrament most holy,
 *     O Sacrament divine!
 *     All praise and all thanksgiving
 *     Be ev'ry moment Thine.
 *     "O Lord, I Am Not Worthy" by Rebecca Hincke • Title: O Lord, I Am Not Worthy; Author: Unknown;
 *     Tune: NON DIGNUS; Artist: Rebecca Hincke; Recording copyright 2024 by Surgeworks, Inc.
 *
 * `HymnBlock` renders every line of the hymn identically, so that credit blob appears in serif
 * italic at the same size as the prayer — the "irrelevant content right after the hymns" report.
 * 651 of 2,786 hymn blocks are affected.
 *
 * THE FIX
 * Move the credit into a sibling `attribution` field. The renderer then shows it as a small caption
 * (the credits are a licensing requirement — they must be displayed, just not prayed). Fixing the
 * data rather than hiding it in the renderer keeps the parser honest and means a re-scrape has one
 * obvious place to apply the same treatment.
 *
 * Idempotent: a hymn that already has `attribution` is left alone. Run with --dry to preview.
 *
 *   node scripts/clean-hymn-attribution.mjs --dry
 *   node scripts/clean-hymn-attribution.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(HERE, '..', 'data', 'divineOfficeComplete.json');

const DRY_RUN = process.argv.includes('--dry');

/**
 * A credit line, not a line of the hymn.
 *
 * Two shapes appear in the source:
 *   "<Hymn Title>" by <Performer> • Title: …; Author: …; Tune: …; Artist: …
 *   <something> • Musical Score • Text: …; Tune: …
 *
 * Both are single long lines carrying `•` plus at least one `Field:` label, or an explicit
 * copyright/permission statement. Requiring TWO independent signals keeps a genuine line of verse
 * that happens to contain a colon from being stripped.
 */
const CREDIT_FIELD = /\b(Title|Text|Tune|Author|Translator|Translation|Artist|Composer|Arranger|Melody|Setting|Meter|Source):/;
const CREDIT_RIGHTS = /\b(Recording copyright|Copyright|\(c\)\s*\d{4}|©|Used with permission|All rights reserved|Surgeworks)\b/i;
const CREDIT_OPENER = /^[""“"].+[""”"]\s+by\s+\S/;

const isCreditLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;

    const signals = [
        trimmed.includes('•'),
        CREDIT_FIELD.test(trimmed),
        CREDIT_RIGHTS.test(trimmed),
        CREDIT_OPENER.test(trimmed),
    ].filter(Boolean).length;

    // A line of verse essentially never trips two of these at once.
    return signals >= 2;
};

/**
 * Peel credit lines off the END of a hymn only.
 *
 * Deliberately not a global filter: a mid-hymn line is part of the prayer even if it looks odd, and
 * removing text from the middle of sung poetry is a worse failure than leaving a stray line at the
 * bottom. Credits are always trailing in this source.
 */
const splitAttribution = (text) => {
    const lines = text.split('\n');
    const credits = [];

    while (lines.length > 0) {
        const last = lines[lines.length - 1];
        if (last.trim() === '') {
            lines.pop();
            continue;
        }
        if (!isCreditLine(last)) break;
        credits.unshift(lines.pop().trim());
    }

    return {
        text: lines.join('\n').replace(/\s+$/, ''),
        attribution: credits.length > 0 ? credits.join(' ') : null,
    };
};

const raw = readFileSync(DATA_PATH, 'utf8');
const data = JSON.parse(raw);

let hymnCount = 0;
let changed = 0;
let alreadyDone = 0;
let emptied = 0;
const samples = [];

for (const [key, entry] of Object.entries(data)) {
    if (key === '__meta') continue;

    for (const [officeName, office] of Object.entries(entry.offices ?? {})) {
        const hymn = office?.parts?.hymn;
        if (!hymn) continue;

        // Older records store the hymn as a bare string; normalise to the object form so the
        // attribution has somewhere to live.
        const asObject = typeof hymn === 'string' ? { text: hymn } : hymn;
        if (!asObject.text) continue;

        hymnCount++;

        if (asObject.attribution) {
            alreadyDone++;
            continue;
        }

        const { text, attribution } = splitAttribution(asObject.text);
        if (!attribution) continue;

        // Never let cleanup destroy a hymn: if stripping credits leaves nothing, the detection was
        // wrong for this record and the original is kept for a human to look at.
        if (!text.trim()) {
            emptied++;
            console.warn(`  ! ${key}/${officeName}: stripping credits would empty the hymn — left unchanged`);
            continue;
        }

        if (samples.length < 5) {
            samples.push(`${key}/${officeName}\n      removed: ${attribution.slice(0, 140)}…`);
        }

        if (!DRY_RUN) {
            office.parts.hymn = { ...asObject, text, attribution };
        }
        changed++;
    }
}

console.log(`Hymn blocks scanned : ${hymnCount}`);
console.log(`Credits split out   : ${changed}`);
console.log(`Already clean       : ${alreadyDone}`);
if (emptied) console.log(`Skipped (would empty): ${emptied}`);
if (samples.length) {
    console.log('\nSamples:');
    samples.forEach((s) => console.log(`  - ${s}`));
}

if (DRY_RUN) {
    console.log('\n(dry run — nothing written)');
} else if (changed > 0) {
    data.__meta = {
        ...data.__meta,
        hymnAttributionSplitAt: new Date().toISOString(),
        hymnAttributionSplitCount: (data.__meta?.hymnAttributionSplitCount ?? 0) + changed,
    };
    writeFileSync(DATA_PATH, JSON.stringify(data));
    console.log(`\nWrote ${DATA_PATH}`);
} else {
    console.log('\nNothing to do.');
}
