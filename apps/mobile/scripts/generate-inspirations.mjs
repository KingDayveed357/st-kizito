#!/usr/bin/env node
/**
 * Build the 366-day Daily Inspiration bank.
 *
 * WHY THIS IS GENERATED RATHER THAN HAND-WRITTEN
 * The previous implementation rotated a bank of SIX saint quotations by `dateSeed % 6`, so a
 * parishioner opening Daily Inspiration saw the same words come round every six days. The brief
 * asks for 365 unique inspirations (366 in a leap year), resolved deterministically from the date.
 *
 * The obvious way to get 366 entries is to write out 366 attributed quotations. That is exactly
 * what this script refuses to do. Attributed quotations are a correctness problem of the same kind
 * as liturgical text: the most-repeated "saint quotes" in circulation are frequently misattributed
 * — "Preach the Gospel at all times; when necessary, use words" is not St. Francis, and
 * "Pray as though everything depended on God..." is disputed between Augustine and Ignatius. A
 * parish app that puts words in a saint's mouth is publishing misinformation under the parish's
 * name.
 *
 * So the bank is built from SCRIPTURE, and every entry is verified: each reference below is
 * resolved against the bundled `bible.json` at build time, and the script fails if any reference
 * does not exist. A citation cannot silently be wrong, and no text is invented — it is quoted from
 * the bundled translation.
 *
 * Saint quotations remain supported by the data model (`source`/`attribution`) and can be added by
 * the parish through the admin without a new build, once someone with the references to hand has
 * verified them.
 *
 *   node scripts/generate-inspirations.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const BIBLE_PATH = join(HERE, '..', 'data', 'bible.json');
const OUT_PATH = join(HERE, '..', 'data', 'dailyInspirations.json');

/**
 * 366 verse references, one per day of the year.
 *
 * Chosen for the way a parishioner actually meets them: consolation, trust, courage, mercy, and
 * the call to charity — passages that carry on their own, out of the surrounding narrative.
 * `theme` drives the card's colour treatment in the app.
 */
const REFERENCES = [
    // ── January — beginnings, trust, light ──────────────────────────────────
    ['Isaiah 43:19', 'hope'], ['Jeremiah 29:11', 'hope'], ['Psalms 143:8', 'trust'],
    ['Lamentations 3:22', 'mercy'], ['Lamentations 3:23', 'mercy'], ['Isaiah 40:31', 'strength'],
    ['Psalms 23:1', 'peace'], ['John 8:12', 'faith'], ['Psalms 27:1', 'courage'],
    ['Proverbs 3:5', 'trust'], ['Proverbs 3:6', 'trust'], ['Matthew 5:14', 'faith'],
    ['Romans 12:2', 'wisdom'], ['Psalms 119:105', 'wisdom'], ['Isaiah 41:10', 'courage'],
    ['2 Corinthians 5:17', 'hope'], ['Philippians 3:13', 'hope'], ['Philippians 3:14', 'hope'],
    ['Psalms 51:10', 'mercy'], ['Ezekiel 36:26', 'mercy'], ['Micah 6:8', 'service'],
    ['Matthew 6:33', 'trust'], ['Joshua 1:9', 'courage'], ['Psalms 46:10', 'peace'],
    ['Isaiah 43:1', 'love'], ['1 John 4:19', 'love'], ['Colossians 3:23', 'service'],
    ['Hebrews 12:1', 'perseverance'], ['Hebrews 12:2', 'faith'], ['Psalms 34:8', 'joy'],
    ['James 1:17', 'joy'],

    // ── February — love, mercy, humility ────────────────────────────────────
    ['1 Corinthians 13:4', 'love'], ['1 Corinthians 13:7', 'love'], ['1 Corinthians 13:13', 'love'],
    ['John 15:12', 'love'], ['John 15:13', 'love'], ['1 John 4:7', 'love'],
    ['1 John 4:8', 'love'], ['1 John 4:16', 'love'], ['Romans 8:38', 'love'],
    ['Romans 8:39', 'love'], ['Ephesians 4:32', 'mercy'], ['Colossians 3:12', 'humility'],
    ['Colossians 3:13', 'mercy'], ['Matthew 5:7', 'mercy'], ['Luke 6:36', 'mercy'],
    ['Psalms 103:8', 'mercy'], ['Psalms 103:12', 'mercy'], ['Micah 7:18', 'mercy'],
    ['Philippians 2:3', 'humility'], ['Philippians 2:4', 'service'], ['Matthew 11:29', 'humility'],
    ['James 4:10', 'humility'], ['Luke 1:46', 'joy'], ['Luke 1:47', 'joy'],
    ['Proverbs 11:2', 'humility'], ['1 Peter 5:5', 'humility'], ['1 Peter 5:6', 'humility'],
    ['1 Peter 5:7', 'trust'], ['Psalms 25:9', 'humility'],

    // ── Leap day ────────────────────────────────────────────────────────────
    ['Psalms 90:12', 'wisdom'],

    // ── March — repentance, discipline, the Cross ───────────────────────────
    ['Joel 2:12', 'mercy'], ['Joel 2:13', 'mercy'], ['Psalms 51:1', 'mercy'],
    ['Psalms 51:12', 'joy'], ['Isaiah 58:6', 'service'], ['Isaiah 58:7', 'service'],
    ['Matthew 6:6', 'prayer'], ['Matthew 6:14', 'mercy'], ['Luke 9:23', 'perseverance'],
    ['Galatians 2:20', 'faith'], ['Romans 5:8', 'love'], ['1 Peter 2:24', 'mercy'],
    ['Isaiah 53:5', 'mercy'], ['John 12:24', 'hope'], ['2 Corinthians 12:9', 'strength'],
    ['Psalms 31:24', 'courage'], ['Psalms 130:5', 'hope'], ['Psalms 130:7', 'hope'],
    ['Hebrews 4:16', 'mercy'], ['Romans 8:18', 'hope'], ['James 1:2', 'perseverance'],
    ['James 1:3', 'perseverance'], ['James 1:4', 'perseverance'], ['Romans 5:3', 'perseverance'],
    ['Romans 5:4', 'perseverance'], ['Romans 5:5', 'hope'], ['2 Timothy 4:7', 'perseverance'],
    ['Galatians 6:9', 'perseverance'], ['Psalms 37:5', 'trust'], ['Psalms 37:7', 'peace'],
    ['Isaiah 30:15', 'peace'],

    // ── April — resurrection, joy, new life ─────────────────────────────────
    ['John 11:25', 'faith'], ['John 11:26', 'faith'], ['Luke 24:5', 'joy'],
    ['1 Corinthians 15:20', 'hope'], ['1 Corinthians 15:55', 'hope'], ['1 Corinthians 15:57', 'joy'],
    ['Romans 6:4', 'hope'], ['Colossians 3:1', 'hope'], ['Colossians 3:2', 'wisdom'],
    ['Psalms 118:24', 'joy'], ['Psalms 118:1', 'joy'], ['John 20:29', 'faith'],
    ['John 14:27', 'peace'], ['John 14:1', 'trust'], ['John 14:6', 'faith'],
    ['Acts 2:42', 'faith'], ['Acts 4:12', 'faith'], ['1 Peter 1:3', 'hope'],
    ['Revelation 21:4', 'hope'], ['Revelation 21:5', 'hope'], ['Isaiah 25:8', 'hope'],
    ['Psalms 16:11', 'joy'], ['Nehemiah 8:10', 'joy'], ['Philippians 4:4', 'joy'],
    ['Psalms 126:5', 'joy'], ['Psalms 30:5', 'joy'], ['John 16:22', 'joy'],
    ['Romans 15:13', 'hope'], ['Zephaniah 3:17', 'love'], ['Psalms 100:2', 'joy'],

    // ── May — Our Lady, discipleship, the Church ────────────────────────────
    ['Luke 1:38', 'humility'], ['Luke 1:45', 'faith'], ['Luke 1:48', 'humility'],
    ['Luke 1:49', 'joy'], ['John 2:5', 'trust'], ['John 19:27', 'love'],
    ['Acts 1:14', 'prayer'], ['Luke 2:19', 'wisdom'], ['Luke 2:51', 'humility'],
    ['Proverbs 31:25', 'strength'], ['Proverbs 31:26', 'wisdom'], ['Sirach 2:6', 'trust'],
    ['Wisdom 3:1', 'peace'], ['Psalms 34:18', 'peace'], ['Psalms 91:1', 'peace'],
    ['Psalms 91:2', 'trust'], ['Psalms 121:1', 'trust'], ['Psalms 121:2', 'trust'],
    ['Psalms 121:8', 'peace'], ['Matthew 28:19', 'service'], ['Matthew 28:20', 'trust'],
    ['Mark 16:15', 'service'], ['Acts 1:8', 'courage'], ['1 Corinthians 12:4', 'service'],
    ['1 Corinthians 12:7', 'service'], ['1 Corinthians 12:27', 'service'], ['Ephesians 4:2', 'humility'],
    ['Ephesians 4:3', 'peace'], ['Romans 12:4', 'service'], ['Romans 12:5', 'service'],
    ['Romans 12:10', 'love'],

    // ── June — the Sacred Heart, charity, the Spirit ────────────────────────
    ['Matthew 11:28', 'peace'], ['Ezekiel 34:16', 'mercy'], ['John 7:37', 'hope'],
    ['John 7:38', 'joy'], ['Galatians 5:22', 'joy'], ['Galatians 5:23', 'peace'],
    ['Romans 8:26', 'prayer'], ['Romans 8:28', 'trust'], ['John 14:16', 'trust'],
    ['John 14:26', 'wisdom'], ['Acts 2:4', 'courage'], ['1 Corinthians 3:16', 'faith'],
    ['2 Corinthians 3:17', 'joy'], ['Matthew 25:35', 'service'], ['Matthew 25:40', 'service'],
    ['James 2:17', 'service'], ['James 1:27', 'service'], ['1 John 3:17', 'service'],
    ['1 John 3:18', 'love'], ['Luke 10:27', 'love'], ['Luke 6:38', 'service'],
    ['Proverbs 19:17', 'service'], ['Proverbs 22:9', 'service'], ['Hebrews 13:16', 'service'],
    ['Galatians 6:2', 'service'], ['Philippians 2:13', 'trust'], ['Psalms 133:1', 'peace'],
    ['Psalms 145:8', 'mercy'], ['Psalms 145:9', 'mercy'], ['Psalms 145:18', 'prayer'],

    // ── July — prayer, wisdom, everyday holiness ────────────────────────────
    ['Matthew 7:7', 'prayer'], ['Matthew 7:8', 'prayer'], ['Luke 11:9', 'prayer'],
    ['Luke 18:1', 'prayer'], ['1 Thessalonians 5:16', 'joy'], ['1 Thessalonians 5:17', 'prayer'],
    ['1 Thessalonians 5:18', 'joy'], ['Philippians 4:6', 'peace'], ['Philippians 4:7', 'peace'],
    ['Philippians 4:8', 'wisdom'], ['Philippians 4:13', 'strength'], ['Psalms 5:3', 'prayer'],
    ['Psalms 63:1', 'prayer'], ['Psalms 62:8', 'trust'], ['Psalms 55:22', 'trust'],
    ['Mark 1:35', 'prayer'], ['Luke 5:16', 'prayer'], ['James 5:16', 'prayer'],
    ['1 John 5:14', 'prayer'], ['Proverbs 2:6', 'wisdom'], ['Proverbs 4:23', 'wisdom'],
    ['Proverbs 15:1', 'peace'], ['Proverbs 16:3', 'trust'], ['Proverbs 16:9', 'trust'],
    ['Ecclesiastes 3:1', 'wisdom'], ['Sirach 6:14', 'love'], ['Wisdom 7:7', 'wisdom'],
    ['James 1:5', 'wisdom'], ['James 3:17', 'wisdom'], ['Psalms 111:10', 'wisdom'],
    ['Colossians 4:2', 'prayer'],

    // ── August — courage, perseverance, the saints ──────────────────────────
    ['2 Timothy 1:7', 'courage'], ['Deuteronomy 31:6', 'courage'], ['Psalms 118:6', 'courage'],
    ['Isaiah 41:13', 'courage'], ['Matthew 10:28', 'courage'], ['Matthew 10:32', 'faith'],
    ['Romans 8:31', 'courage'], ['Ephesians 6:10', 'strength'], ['Ephesians 6:11', 'strength'],
    ['1 Corinthians 16:13', 'courage'], ['1 Corinthians 16:14', 'love'], ['Hebrews 11:1', 'faith'],
    ['Hebrews 10:23', 'faith'], ['Hebrews 13:8', 'trust'], ['Revelation 7:9', 'hope'],
    ['Revelation 2:10', 'perseverance'], ['Matthew 5:8', 'faith'], ['Matthew 5:9', 'peace'],
    ['Matthew 5:10', 'perseverance'], ['Matthew 5:16', 'service'], ['1 Peter 3:15', 'courage'],
    ['2 Corinthians 4:8', 'perseverance'], ['2 Corinthians 4:9', 'perseverance'],
    ['2 Corinthians 4:16', 'strength'], ['2 Corinthians 4:18', 'hope'], ['Psalms 27:14', 'perseverance'],
    ['Psalms 31:3', 'trust'], ['Psalms 18:2', 'strength'], ['Psalms 28:7', 'strength'],
    ['Isaiah 40:29', 'strength'], ['Nahum 1:7', 'trust'],

    // ── September — labour, humility, the Cross exalted ─────────────────────
    ['Ecclesiastes 9:10', 'service'], ['Colossians 3:17', 'service'], ['1 Corinthians 10:31', 'service'],
    ['Proverbs 12:11', 'perseverance'], ['Proverbs 13:4', 'perseverance'], ['2 Thessalonians 3:13', 'perseverance'],
    ['Galatians 6:4', 'humility'], ['Romans 12:11', 'service'], ['Romans 12:12', 'hope'],
    ['John 3:16', 'love'], ['John 3:17', 'mercy'], ['Philippians 2:8', 'humility'],
    ['Philippians 2:9', 'faith'], ['Galatians 6:14', 'faith'], ['1 Corinthians 1:18', 'faith'],
    ['Luke 14:11', 'humility'], ['Luke 18:14', 'humility'], ['Matthew 23:12', 'humility'],
    ['Matthew 20:26', 'service'], ['Matthew 20:28', 'service'], ['John 13:14', 'service'],
    ['John 13:15', 'service'], ['1 Peter 4:10', 'service'], ['Psalms 90:17', 'service'],
    ['Psalms 127:1', 'trust'], ['Sirach 3:17', 'humility'], ['Proverbs 22:4', 'humility'],
    ['Isaiah 66:2', 'humility'], ['Psalms 138:6', 'humility'], ['Psalms 147:3', 'mercy'],

    // ── October — the Rosary, the word, gratitude ───────────────────────────
    ['Luke 1:28', 'joy'], ['Luke 1:42', 'joy'], ['Luke 2:10', 'joy'],
    ['Luke 2:11', 'joy'], ['John 1:1', 'faith'], ['John 1:14', 'love'],
    ['Hebrews 4:12', 'wisdom'], ['2 Timothy 3:16', 'wisdom'], ['Isaiah 55:11', 'trust'],
    ['Psalms 19:7', 'wisdom'], ['Psalms 19:14', 'prayer'], ['Matthew 4:4', 'wisdom'],
    ['Luke 11:28', 'faith'], ['James 1:22', 'service'], ['Psalms 1:2', 'wisdom'],
    ['Psalms 107:1', 'joy'], ['Psalms 136:1', 'joy'], ['1 Chronicles 16:34', 'joy'],
    ['Colossians 3:15', 'peace'], ['Colossians 3:16', 'joy'], ['Ephesians 5:20', 'joy'],
    ['Psalms 95:1', 'joy'], ['Psalms 95:2', 'joy'], ['Psalms 150:6', 'joy'],
    ['Sirach 50:22', 'joy'], ['Tobit 4:19', 'prayer'], ['Tobit 12:7', 'faith'],
    ['Judith 8:25', 'trust'], ['Psalms 116:12', 'joy'], ['Psalms 116:17', 'joy'],
    ['Habakkuk 3:18', 'joy'],

    // ── November — the saints, the departed, eternal hope ───────────────────
    ['Revelation 21:3', 'hope'], ['Revelation 14:13', 'peace'], ['Wisdom 3:2', 'hope'],
    ['Wisdom 3:3', 'hope'], ['Wisdom 4:7', 'peace'],
    // Cited as 12:46 in the Douay/Vulgate numbering familiar from the prayer for the dead, but the
    // bundled translation numbers it 12:45. The citation shown must match the text shown, so this
    // follows the bundled edition. (Caught by this script's own verification, which is the point of
    // resolving every reference at build time rather than trusting the list.)
    ['2 Maccabees 12:45', 'prayer'],
    ['John 5:24', 'hope'], ['John 6:40', 'hope'], ['John 14:2', 'hope'],
    ['John 14:3', 'hope'], ['1 Thessalonians 4:13', 'hope'], ['1 Thessalonians 4:14', 'hope'],
    ['Romans 14:8', 'faith'], ['Philippians 1:21', 'faith'], ['2 Corinthians 5:1', 'hope'],
    ['Psalms 116:15', 'peace'], ['Psalms 23:4', 'courage'], ['Psalms 23:6', 'hope'],
    ['Isaiah 26:3', 'peace'], ['Job 19:25', 'faith'], ['Daniel 12:3', 'hope'],
    ['Matthew 25:21', 'service'], ['Matthew 24:13', 'perseverance'], ['1 Corinthians 2:9', 'hope'],
    ['Hebrews 12:14', 'peace'], ['Hebrews 13:14', 'hope'], ['1 John 3:2', 'hope'],
    ['Psalms 73:26', 'strength'], ['Psalms 42:11', 'hope'], ['Isaiah 12:2', 'trust'],

    // ── December — Advent watchfulness, the Nativity ────────────────────────
    ['Isaiah 9:2', 'hope'], ['Isaiah 9:6', 'joy'], ['Isaiah 7:14', 'faith'],
    ['Isaiah 11:1', 'hope'], ['Isaiah 35:4', 'courage'], ['Isaiah 40:3', 'hope'],
    ['Isaiah 40:5', 'hope'], ['Luke 3:4', 'hope'], ['Micah 5:2', 'faith'],
    ['Malachi 3:1', 'hope'], ['Matthew 24:42', 'perseverance'], ['Mark 13:33', 'perseverance'],
    ['Romans 13:11', 'perseverance'], ['Romans 13:12', 'hope'], ['1 Thessalonians 5:5', 'faith'],
    ['Baruch 5:9', 'joy'], ['Zechariah 9:9', 'joy'], ['Zephaniah 3:14', 'joy'],
    ['Luke 1:78', 'mercy'], ['Luke 1:79', 'peace'], ['Titus 2:11', 'mercy'],
    ['Titus 3:5', 'mercy'], ['Luke 2:7', 'humility'], ['Luke 2:14', 'joy'],
    ['Luke 2:16', 'faith'], ['John 1:5', 'hope'], ['John 1:9', 'faith'],
    ['Galatians 4:4', 'love'], ['Galatians 4:5', 'love'], ['1 John 4:9', 'love'],
];

const bible = JSON.parse(readFileSync(BIBLE_PATH, 'utf8'));

/** Resolve "John 3:16" against bible.json. Returns null when the reference does not exist. */
const resolve = (reference) => {
    const match = reference.match(/^((?:\d\s)?[A-Za-z][A-Za-z\s]*?)\s+(\d+):(\d+)$/);
    if (!match) return null;

    const [, book, chapter, verse] = match;
    const text = bible?.[book.trim()]?.[chapter]?.[verse];
    return typeof text === 'string' && text.trim() ? text.trim() : null;
};

const failures = [];
const seen = new Set();
const duplicates = [];
const entries = [];

for (const [reference, theme] of REFERENCES) {
    if (seen.has(reference)) duplicates.push(reference);
    seen.add(reference);

    const text = resolve(reference);
    if (!text) {
        failures.push(reference);
        continue;
    }

    entries.push({ reference, theme, text });
}

if (duplicates.length > 0) {
    console.error(`Duplicate references (each day must be unique):\n  ${duplicates.join('\n  ')}`);
    process.exit(1);
}

if (failures.length > 0) {
    console.error(
        `${failures.length} reference(s) could not be resolved against bible.json — fix these before shipping:\n  ${failures.join('\n  ')}`,
    );
    process.exit(1);
}

if (entries.length !== 366) {
    console.error(`Expected 366 entries (one per day, including 29 February); got ${entries.length}.`);
    process.exit(1);
}

writeFileSync(
    OUT_PATH,
    JSON.stringify(
        {
            __meta: {
                schemaVersion: 1,
                count: entries.length,
                translation: 'World English Bible (Catholic edition), public domain',
                generatedAt: new Date().toISOString(),
                note:
                    'Generated by scripts/generate-inspirations.mjs. Every reference is verified against ' +
                    'data/bible.json at build time. Do not hand-edit; edit the reference list in the script.',
            },
            entries,
        },
        null,
        0,
    ),
);

const byTheme = entries.reduce((acc, e) => ({ ...acc, [e.theme]: (acc[e.theme] ?? 0) + 1 }), {});
console.log(`Wrote ${entries.length} inspirations to ${OUT_PATH}`);
console.log('Themes:', byTheme);
