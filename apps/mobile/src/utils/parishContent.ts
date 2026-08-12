/**
 * Presentation helpers for admin-authored parish content (announcements and events).
 *
 * The problem these solve is upstream of any card design. Parish notices are typed the way a notice
 * board is written — ALL CAPS, the title repeated as the first line of the body, the date written
 * out inside the text — and the app then rendered that raw:
 *
 *     FEAST OF TRANSFIGURATION OF THE LORD
 *     THURSDAY 6TH AUGUST, 2026
 *     FEAST OF TRANSFIGURATION OF THE LORD
 *     MASSES: 6.00 am and 6.00 pm
 *
 * Two lines of shouted duplication before any new information. No card layout can rescue that, so
 * the text is normalised before it reaches one.
 *
 * The guiding rule: **only intervene when the input is actually shouted.** Mixed-case text the
 * admin wrote deliberately passes through untouched, so improving the admin's habits never fights
 * the app.
 */

/** Words that stay lowercase inside a title unless they open or close it. */
const MINOR_WORDS = new Set([
    'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'nor', 'of',
    'on', 'or', 'the', 'to', 'up', 'via', 'with',
]);

/**
 * Tokens that are genuinely acronyms in this parish's vocabulary and must not be title-cased into
 * nonsense ("CWO" → "Cwo"). Roman numerals cover papal names and Mass settings.
 */
const KEEP_UPPERCASE = new Set([
    'CWO', 'CMO', 'CYON', 'CYAN', 'PPC', 'RCIA', 'SVP', 'CCR', 'JDPC', 'CMS',
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
    'RIP', 'BVM',
]);
// `AM`/`PM` are deliberately absent: "6.00 am" is the ordinary reading style, and shouting the
// meridiem in the middle of a sentence is exactly the noise this module exists to remove.

/**
 * Words that keep their capital even when a shouted body is lowered to sentence case.
 *
 * Without this, "THURSDAY 6TH AUGUST" becomes "Thursday 6th august" — the month silently demoted,
 * which reads as a typo. The religious terms are here for the same reason: a parish app that prints
 * "the lord" has introduced an error the admin did not make.
 */
const PROPER_NOUNS = new Set([
    'january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'god', 'lord', 'jesus', 'christ', 'mary', 'holy', 'spirit', 'father', 'son',
    'mass', 'masses', 'advent', 'lent', 'easter', 'christmas', 'pentecost',
    'saint', 'st', 'church', 'parish', 'gospel', 'bible', 'rosary', 'angelus',
]);

/**
 * Is this text SHOUTED rather than merely containing some capitals?
 *
 * Measured over letters only, so digits, times and punctuation do not skew it. The length floor
 * stops a short deliberate title ("MASS") being rewritten.
 */
export const isShouted = (text: string): boolean => {
    const letters = text.replace(/[^A-Za-z]/g, '');
    if (letters.length < 8) return false;
    const upper = letters.replace(/[^A-Z]/g, '').length;
    return upper / letters.length > 0.8;
};

const capitalizeWord = (word: string, isFirst: boolean, isLast: boolean): string => {
    if (!word) return word;

    const bare = word.replace(/[^A-Za-z]/g, '');
    if (bare && KEEP_UPPERCASE.has(bare.toUpperCase())) return word.toUpperCase();

    // Ordinals and any token carrying digits: "6TH" → "6th", "6.00AM" → "6.00am".
    if (/\d/.test(word)) return word.toLowerCase().replace(/(\d)(st|nd|rd|th)\b/gi, '$1$2');

    const lower = word.toLowerCase();
    if (!isFirst && !isLast && MINOR_WORDS.has(lower)) return lower;

    // Hyphenated and apostrophised words capitalise each part: "ST. KIZITO'S" → "St. Kizito's",
    // "ALL-NIGHT" → "All-Night". The apostrophe case excludes a trailing possessive "s".
    return lower.replace(/(^|[-–—])([a-z])/g, (_, sep, char) => sep + char.toUpperCase())
        .replace(/(')([a-z])(?![a-z])/g, (m) => m);
};

/**
 * Title-case a shouted heading. Mixed-case input is returned unchanged.
 */
export const normalizeTitle = (raw: string | null | undefined): string => {
    const text = (raw ?? '').trim().replace(/\s+/g, ' ');
    if (!text || !isShouted(text)) return text;

    const words = text.split(' ');
    return words
        .map((word, index) => capitalizeWord(word, index === 0, index === words.length - 1))
        .join(' ');
};

/**
 * Sentence-case a shouted body, preserving paragraph breaks.
 *
 * Sentence rather than title case: body text title-cased reads like a headline that will not stop,
 * which is the opposite of the calm the rest of the app aims for.
 */
export const normalizeBody = (raw: string | null | undefined): string => {
    const text = (raw ?? '').trim();
    if (!text || !isShouted(text)) return text.replace(/[ \t]+/g, ' ');

    return text
        .split(/\n/)
        .map((line) => {
            const trimmed = line.trim().replace(/[ \t]+/g, ' ');
            if (!trimmed) return '';

            const lowered = trimmed
                .split(' ')
                .map((word) => {
                    const bare = word.replace(/[^A-Za-z]/g, '');
                    if (bare && KEEP_UPPERCASE.has(bare.toUpperCase())) return word.toUpperCase();

                    const lowered = word.toLowerCase();
                    if (bare && PROPER_NOUNS.has(bare.toLowerCase())) {
                        return lowered.replace(/[a-z]/, (char) => char.toUpperCase());
                    }
                    return lowered;
                })
                .join(' ');

            // Capitalise the line, and the start of each sentence within it.
            return lowered.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, char) => prefix + char.toUpperCase());
        })
        .join('\n');
};

/**
 * Body text with a repeated title removed from the front.
 *
 * Notice-board style repeats the heading as the first line. Shown under the card's own title, that
 * line is pure duplication and pushes the actual information below the fold.
 */
export const buildExcerpt = (
    body: string | null | undefined,
    title: string | null | undefined,
): string => {
    const normalizedBody = normalizeBody(body);
    if (!normalizedBody) return '';

    const compare = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const titleKey = compare(title ?? '');
    if (!titleKey) return normalizedBody;

    const lines = normalizedBody.split('\n');
    while (lines.length > 0) {
        const first = lines[0].trim();
        // Drop leading blank lines and any line that is just the title again.
        if (first === '' || compare(first) === titleKey) {
            lines.shift();
            continue;
        }
        break;
    }

    // If every line was the title, return nothing. The card already shows the title as its heading,
    // so repeating it as the body would print the same words twice — which is the duplication this
    // function exists to remove, not something to fall back to.
    return lines.join('\n').trim();
};

/**
 * A date the way a parishioner reads one.
 *
 * Returns null rather than "Invalid Date" for unparseable input, so a card can omit the date block
 * instead of printing a defect.
 */
export const formatParishDate = (
    value: string | null | undefined,
    options?: { includeYear?: boolean; weekday?: boolean },
): string | null => {
    if (!value) return null;
    // Date-only strings are anchored at local noon so a timezone shift cannot move the day.
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleDateString(undefined, {
        weekday: options?.weekday ? 'long' : undefined,
        day: 'numeric',
        month: 'long',
        ...(options?.includeYear === false ? {} : { year: 'numeric' }),
    });
};

/** Compact day/month for a calendar chip. `null` when the date cannot be read. */
export const splitDateParts = (
    value: string | null | undefined,
): { day: string; month: string; year: string } | null => {
    if (!value) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return {
        day: String(date.getDate()),
        month: date.toLocaleDateString(undefined, { month: 'short' }),
        year: String(date.getFullYear()),
    };
};

/** "Today" / "Tomorrow" / "In 3 days" / "Last week" — relative sense for a date. */
export const describeWhen = (value: string | null | undefined): string | null => {
    if (!value) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOfDay(date) - startOfDay(new Date())) / 86_400_000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days > 1 && days <= 14) return `In ${days} days`;
    if (days < -1 && days >= -7) return `${Math.abs(days)} days ago`;
    return null;
};

/**
 * Pull "Masses: 6.00 am and 6.00 pm" style lines out of a body.
 *
 * Parish notices carry their key logistics inside prose. Surfacing them as their own line lets a
 * card show *when* without the reader parsing a paragraph. Returns the detail and the body with
 * that line removed, so nothing is shown twice.
 */
export const extractSchedule = (body: string): { schedule: string | null; rest: string } => {
    const lines = body.split('\n');
    const index = lines.findIndex((line) => /^\s*(masses?|time|times|venue|location)\s*[:\-]/i.test(line));
    if (index === -1) return { schedule: null, rest: body };

    const schedule = lines[index].replace(/^\s*[^:\-]+[:\-]\s*/, '').trim();
    const rest = lines.filter((_, i) => i !== index).join('\n').trim();
    return { schedule: schedule || null, rest };
};
