import { formatPremiumDate } from '../utils/formatters';
import { extractBibleText } from '../utils/bibleExtractor';
import { LITURGICAL_LABELS } from '../constants/liturgical';
import { buildStructuredOffice } from './divineOfficeEngine';

import type {
    DailyInspirationCard,
    LiturgicalBlock,
    MissalDay,
    PsalmVerse,
} from '../types/readings.types';

// getCalendar and its calendar-data cache live in calendarService to break a require cycle
// (this module imports buildStructuredOffice from divineOfficeEngine, which needs getCalendar).
import { getCalendar } from './calendarService';
export { getCalendar } from './calendarService';
import { normalizeBlockType } from '../utils/readingBlocks';
import { parsePsalmText } from '../utils/psalm';
import { getInspirationForDate } from '../utils/dailyInspiration';

let readingsDataMemo: Record<string, any> | null = null;
let inspirationDataMemo: Record<string, any> | null = null;
let passageDataMemo: Record<string, any> | null = null;
let usccbDataMemo: Record<string, { readings?: any, readingsList?: any[], masses?: any[] }> | null = null;

const getReadingsData = (): Record<string, any> => {
    if (!readingsDataMemo) {
        readingsDataMemo = require('../../data/readings.json') as Record<string, any>;
    }
    return readingsDataMemo;
};

const getInspirationData = (): Record<string, any> => {
    if (!inspirationDataMemo) {
        inspirationDataMemo = require('../../data/inspirations.json') as Record<string, any>;
    }
    return inspirationDataMemo;
};

const getPassagesData = (): Record<string, any> => {
    if (!passageDataMemo) {
        passageDataMemo = require('../../data/passageCache.json') as Record<string, any>;
    }
    return passageDataMemo;
};

const getUsccbData = (): Record<string, { readings?: any, readingsList?: any[], masses?: any[] }> => {
    if (!usccbDataMemo) {
        usccbDataMemo = require('../../data/usccb-readings-dataset.json') as Record<string, { readings?: any, readingsList?: any[], masses?: any[] }>;
    }
    return usccbDataMemo;
};

export const getTodayIso = () => {
    return new Date().toISOString().slice(0, 10);
};

const sanitizeText = (text?: string | null) =>
    (text ?? '')
        .replace(/Ã‚Â¶/g, '')
        .replace(/Ã‚/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/[ \t]+/g, ' ')
        .trim();

const normalizeReferenceChunk = (reference: string) =>
    reference
        .trim()
        .replace(/\.$/, '')
        .replace(/\s+/g, ' ');

const stripHeadersAndReferences = (
    text: string | null | undefined,
    reference?: string | null,
    options?: {
        /**
         * Keep a leading "R." / "R/" refrain marker. Responsorial psalms NEED it: the marker is what
         * delimits the refrain from the stanzas. Stripping it demoted the opening refrain to stanza
         * content, so stanza 1 began with the refrain text and the refrain was re-detected from the
         * next repetition (losing its verse citation). Only proclaimed readings want it removed.
         */
        keepResponseMarker?: boolean;
    },
): string | null => {
    let cleanText = sanitizeText(text);
    if (!cleanText) return null;

    // Remove UI labels that might have snuck in (e.g. "Verse Before the Gospel", "Reading I")
    cleanText = cleanText.replace(/^(?:Reading I[I12]?|Reading 1|Reading 2|Responsorial |Verse Before the Gospel|Gospel Acclamation|Gospel)\s*/i, '');

    // Remove the Bible Reference if it's sitting at the absolute beginning of the text
    if (reference) {
        // We replace any non-word characters with .*? to gracefully handle spaces, hyphens, and em-dashes
        const escapedRef = reference.replace(/[^\w]/g, '.*?');
        const regex = new RegExp(`^${escapedRef}\\s*(?:\\r?\\n|\\s)*`, 'i');
        cleanText = cleanText.replace(regex, '');
    }

    // Also remove generic inline R/ and V/ UI artifacts that were at the very beginning
    if (!options?.keepResponseMarker) {
        cleanText = cleanText.replace(/^(?:R\.|R\/|V\.|V\/)\s*(?:\([a-zA-Z0-9cd]+\)\s*)?/i, '');
    }

    return cleanText.trim();
};

const getPassage = (reference?: string | null) => {
    if (!reference) return null;

    const passages = getPassagesData();
    const normalizedReference = normalizeReferenceChunk(reference);
    if (passages[normalizedReference]) {
        return {
            reference: normalizedReference,
            text: passages[normalizedReference],
            verses: []
        };
    }

    const parts = normalizedReference
        .split(/[;|]/)
        .map(normalizeReferenceChunk)
        .filter(Boolean);

    if (parts.length > 1) {
        const resolvedParts = parts.map((part) => passages[part]).filter(Boolean);

        if (resolvedParts.length) {
            return {
                reference: normalizedReference,
                text: resolvedParts
                    .map((entry: any) => sanitizeText(entry.text))
                    .filter(Boolean)
                    .join('\n\n'),
                verses: resolvedParts.flatMap((entry: any) => entry.verses ?? []),
            };
        }
    }

    // New offline fallback using the Bible extraction logic
    const backup = extractBibleText(normalizedReference);
    if (backup.text) {
        return {
            reference: backup.reference,
            text: backup.text,
            verses: backup.verses
        };
    }

    return null;
};

const buildPsalmVerses = (reference?: string | null): PsalmVerse[] => {
    const passage = getPassage(reference);
    if (!passage?.verses?.length) {
        return [];
    }

    return passage.verses.map((text: string, index: number) => ({
        type: index === 0 ? 'response' : 'verse',
        text: sanitizeText(text),
    }));
};

const buildPsalmBlock = (date: string, reference?: string | null): LiturgicalBlock => {
    const verses = buildPsalmVerses(reference);
    const textFallback = sanitizeText(getPassage(reference)?.text);

    // We strictly identify the response if we have verses, otherwise we use fallback.
    const response = verses.length > 0 ? verses[0].text : null;
    const finalVerses = verses.length > 0 ? verses : textFallback ? [{ type: 'verse' as const, text: textFallback }] : [];

    return {
        id: `psalm-${date}-${reference}`,
        type: 'psalm',
        label: LITURGICAL_LABELS.responsorialPsalm,
        reference: reference ?? LITURGICAL_LABELS.unavailable,
        response: response,
        verses: finalVerses,
        text: textFallback || null
    };
};

/**
 * Builds the psalm block fields from raw lectionary text using the structured parser.
 *
 * The refrain delimits stanzas in the source; the previous implementation pushed each repeated
 * refrain into `verses` alongside the stanzas, so a 3-stanza psalm produced 7 entries and rendered
 * as 8–9 fragments. `parsePsalmText` treats refrains as boundaries and returns real stanzas.
 *
 * `verses` is still populated (refrain first, then one entry per stanza) so any consumer that has
 * not migrated to `stanzas` keeps working — but it no longer interleaves refrain repetitions.
 */
const buildPsalmFields = (rawText: string) => {
    const parsed = parsePsalmText(rawText);

    const verses: PsalmVerse[] = [];
    if (parsed.response) verses.push({ type: 'response', text: parsed.response });
    for (const stanza of parsed.stanzas) {
        verses.push({ type: 'verse', text: stanza.lines.join('\n') });
    }

    return {
        response: parsed.response,
        responseCitation: parsed.responseCitation,
        alternateResponse: parsed.alternateResponse,
        stanzas: parsed.stanzas,
        verses,
    };
};

const buildGospelAcclamationText = (calendar: any) => {
    if (calendar?.period === 'Paschal Triduum' || calendar?.season === 'Lent') {
        return 'Praise to you, Lord Jesus Christ, king of endless glory.';
    }
    return 'Alleluia, alleluia.';
};

const buildOptionalAntiphons = (readingSet: any) => ({
    entrance: sanitizeText(readingSet?.entranceAntiphon ?? readingSet?.antiphons?.entrance ?? null) || null,
    communion: sanitizeText(readingSet?.communionAntiphon ?? readingSet?.antiphons?.communion ?? null) || null,
});

const buildReadingBlock = (
    id: string,
    type: LiturgicalBlock['type'],
    label: string,
    reference: string | null | undefined,
    text: string | null | undefined,
    context?: string | null,
): LiturgicalBlock => ({
    id,
    type,
    label,
    reference: reference ?? null,
    text: stripHeadersAndReferences(text, reference) || null,
    context: context ?? null,
});

const resolveReadingSet = (date: string, calendar: any) => {
    const readingsData = getReadingsData();
    const entry = readingsData[calendar.key];
    if (!entry) return null;
    if (entry.type === 'proper') return entry.proper ?? null;

    // Normalization rules for cycle
    const weekdayCycleKey = (Number(date.slice(0, 4)) % 2 === 0 ? 'II' : 'I');
    if (entry.type === 'weekday') return entry.weekdayCycle?.[weekdayCycleKey] ?? null;

    return entry[calendar.liturgicalYear] ?? null;
};

const buildMissalDay = (date: string): MissalDay | null => {
    const calendar = getCalendar(date);
    if (!calendar) return null;

    const antiphons = buildOptionalAntiphons({});

    const usccbData = getUsccbData();
    const usccbEntry = usccbData[date];
    if (usccbEntry && (usccbEntry.readingsList || usccbEntry.readings || usccbEntry.masses)) {
        const variants: { id: string; title: string; readings: LiturgicalBlock[] }[] = [];
        let baseReadings: LiturgicalBlock[] = [];

        const processReadingsList = (rl: any[], massTitle?: string): LiturgicalBlock[] => {
            const arr: LiturgicalBlock[] = [];
            const titleSafe = massTitle ? massTitle.replace(/\s+/g, '-') : 'base';
            rl.forEach((item, idx) => {
                // Ensure globally unique keys based on date and mass title
                const uniqueId = `item-${date}-${titleSafe}-${idx}`;
                if (item.type === 'psalm') {
                    const cleanPsalmText = stripHeadersAndReferences(item.text, item.reference, { keepResponseMarker: true }) || '';
                    arr.push({
                        id: uniqueId,
                        type: 'psalm',
                        label: item.label || LITURGICAL_LABELS.responsorialPsalm,
                        reference: item.reference,
                        ...buildPsalmFields(cleanPsalmText),
                        text: cleanPsalmText || null
                    });
                } else {
                    // Normalize mistyped blocks (e.g. the Lenten "Verse Before the Gospel" which the
                    // dataset types as `gospel`) so acclamations never render as a Gospel reading or
                    // receive the Gospel closing. See utils/readingBlocks + audit item #2.
                    const normalizedType = normalizeBlockType(item.type, item.label);
                    arr.push(buildReadingBlock(uniqueId, normalizedType, item.label || LITURGICAL_LABELS.reading, item.reference, item.text));
                }
            });
            return arr;
        };

        const processReadingsLegacy = (ur: any, massTitle?: string): LiturgicalBlock[] => {
            const arr: LiturgicalBlock[] = [];
            const titleSafe = massTitle ? massTitle.replace(/\s+/g, '-') : 'base';

            if (ur.firstReading) arr.push(buildReadingBlock(`first-reading-${date}-${titleSafe}`, 'first_reading', LITURGICAL_LABELS.firstReading, ur.firstReading.reference, ur.firstReading.text));
            if (ur.responsorialPsalm) {
                const cleanPsalmText = stripHeadersAndReferences(ur.responsorialPsalm.text, ur.responsorialPsalm.reference, { keepResponseMarker: true }) || '';
                arr.push({
                    id: `psalm-${date}-${titleSafe}`,
                    type: 'psalm',
                    label: LITURGICAL_LABELS.responsorialPsalm,
                    reference: ur.responsorialPsalm.reference,
                    ...buildPsalmFields(cleanPsalmText),
                    text: cleanPsalmText || null
                });
            }
            if (ur.secondReading) arr.push(buildReadingBlock(`second-reading-${date}-${titleSafe}`, 'second_reading', LITURGICAL_LABELS.secondReading, ur.secondReading.reference, ur.secondReading.text));
            if (ur.gospelAcclamation) {
                const cleanAcclamation = stripHeadersAndReferences(ur.gospelAcclamation.text, ur.gospelAcclamation.reference) || '';
                arr.push(buildReadingBlock(`gospel-acclamation-${date}-${titleSafe}`, 'gospel_acclamation', LITURGICAL_LABELS.gospelAcclamation, ur.gospelAcclamation.reference, cleanAcclamation));
            }
            if (ur.gospel) arr.push(buildReadingBlock(`gospel-${date}-${titleSafe}`, 'gospel', LITURGICAL_LABELS.gospel, ur.gospel.reference, ur.gospel.text));
            return arr;
        };

        if (usccbEntry.masses && usccbEntry.masses.length > 0) {
            usccbEntry.masses.forEach((mass: any, idx: number) => {
                let massReadings: LiturgicalBlock[] = [];
                if (mass.readingsList) massReadings = processReadingsList(mass.readingsList, mass.title);
                else if (mass.readings) massReadings = processReadingsLegacy(mass.readings, mass.title);

                variants.push({
                    id: `mass-${date}-${idx}`,
                    title: mass.title || `Mass ${idx + 1}`,
                    readings: massReadings
                });
            });

            // Set the base readings to the first mass's readings to remain backwards compatible for default view
            baseReadings = variants[0].readings;
        } else {
            if (usccbEntry.readingsList) baseReadings = processReadingsList(usccbEntry.readingsList);
            else if (usccbEntry.readings) baseReadings = processReadingsLegacy(usccbEntry.readings);
        }

        return {
            id: date,
            date,
            liturgicalYear: calendar.liturgicalYear || 'A',
            feastName: calendar.celebration,
            celebration: calendar.celebration,
            celebrationType: calendar.celebrationType,
            liturgicalSeason: calendar.season ? calendar.season.toLowerCase() : 'ordinary',
            liturgicalColor: calendar.color || 'green',
            liturgicalDay: calendar.period ?? calendar.day,
            antiphons,
            readings: baseReadings,
            variants: variants.length > 0 ? variants : undefined
        };
    }

    const readingSet = resolveReadingSet(date, calendar) ?? {};
    const gospelAcclamationText = buildGospelAcclamationText(calendar);

    // DYNAMIC ENGINE: We do not assume rigid MissalDay properties, we build the liturgical sequence based on available payload.
    const readings: LiturgicalBlock[] = [];

    // Optional structure checking
    if (readingSet.entrance) {
        readings.push(buildReadingBlock(`entrance-${date}`, 'entrance_antiphon', LITURGICAL_LABELS.entranceAntiphon, null, readingSet.entrance));
    }

    // Process mappings dynamically based on dataset provided. 
    // If future datasets provide an array structure readingSet.readings, we parse that.
    if (Array.isArray(readingSet.readings)) {
        readingSet.readings.forEach((reading: any, idx: number) => {
            if (reading.type === 'psalm') {
                readings.push(buildPsalmBlock(date, reading.reference));
            } else {
                readings.push(buildReadingBlock(`reading-${idx}-${date}`, reading.type || 'supplemental_reading', reading.label || LITURGICAL_LABELS.reading, reading.reference, getPassage(reading.reference)?.text));
            }
        });
    } else {
        // Fallback for current Object-based dataset
        if (readingSet.first) {
            readings.push(buildReadingBlock(`first-reading-${date}`, 'first_reading', LITURGICAL_LABELS.firstReading, readingSet.first, getPassage(readingSet.first)?.text));
        }

        if (readingSet.psalm) {
            readings.push(buildPsalmBlock(date, readingSet.psalm));
        }

        if (readingSet.second) {
            readings.push(buildReadingBlock(`second-reading-${date}`, 'second_reading', LITURGICAL_LABELS.secondReading, readingSet.second, getPassage(readingSet.second)?.text));
        }

        if (readingSet.gospel) {
            // Gospel Acclamation usually has a Bible verse. Since it's missing in readings.json, we provide beautiful correct Liturgical rotating verses.
            const getGospelAcclamationVerse = () => {
                if (readingSet.acclamationVerse) return readingSet.acclamationVerse;

                const s = calendar.season || 'Ordinary Time';
                if (s === 'Advent') return "Prepare the way of the Lord, make straight his paths:\nall people shall see the salvation of God.";
                if (s === 'Christmas') return "I bring you news of great joy:\ntoday a Savior has been born to us, Christ the Lord.";
                if (s === 'Lent' || s === 'Triduum') return "Repent, says the Lord;\nthe kingdom of heaven is at hand.";
                if (s === 'Easter') return "I am the resurrection and the life, says the Lord;\nwhoever believes in me will never die.";

                // Ordinary Time
                const ordinaryVerses = [
                    "Your words, Lord, are Spirit and life;\nyou have the words of everlasting life.",
                    "Open our hearts, O Lord,\nto listen to the words of your Son.",
                    "I am the light of the world, says the Lord;\nwhoever follows me will have the light of life.",
                    "Speak, Lord, your servant is listening;\nyou have the words of everlasting life.",
                    "Blessed are you, Father, Lord of heaven and earth;\nyou have revealed to little ones the mysteries of the Kingdom."
                ];

                // Deterministic choice based on date
                const sum = date.split('-').reduce((acc, val) => acc + parseInt(val), 0) || 0;
                return ordinaryVerses[sum % ordinaryVerses.length];
            };

            const dynamicVerse = getGospelAcclamationVerse();
            const acclamationFullText = `${gospelAcclamationText}\n\n${dynamicVerse}\n\n${gospelAcclamationText}`;

            readings.push(buildReadingBlock(`gospel-acclamation-${date}`, 'gospel_acclamation', LITURGICAL_LABELS.gospelAcclamation, null, acclamationFullText));
            readings.push(buildReadingBlock(`gospel-${date}`, 'gospel', LITURGICAL_LABELS.gospel, readingSet.gospel, getPassage(readingSet.gospel)?.text));
        }
    }

    return {
        id: date,
        date,
        liturgicalYear: calendar.liturgicalYear || 'A',
        feastName: calendar.celebration,
        celebration: calendar.celebration,
        celebrationType: calendar.celebrationType,
        liturgicalSeason: calendar.season ? calendar.season.toLowerCase() : 'ordinary',
        liturgicalColor: calendar.color || 'green',
        liturgicalDay: calendar.period ?? calendar.day,
        antiphons,
        readings,
    };
};

export const getReadings = (date: string) => {
    return buildMissalDay(date);
};

const prayerTitleMap: Record<string, string> = {
    officeOfReadings: 'Office of Readings',
    midMorningPrayer: 'Mid-Morning Prayer',
    middayPrayer: 'Midday Prayer',
    afternoonPrayer: 'Afternoon Prayer',
    morningPrayer: 'Morning Prayer (Lauds)',
    eveningPrayer: 'Evening Prayer (Vespers)',
    nightPrayer: 'Night Prayer (Compline)',
};

const prayerIconMap: Record<string, string> = {
    officeOfReadings: 'book-outline',
    midMorningPrayer: 'time-outline',
    middayPrayer: 'sunny',
    afternoonPrayer: 'time',
    morningPrayer: 'sunny-outline',
    eveningPrayer: 'partly-sunny-outline',
    nightPrayer: 'moon-outline',
};

const getPsalterWeek = (calendar: any) => {
    const week = calendar?.week && calendar.week > 0 ? calendar.week : 1;
    return ((week - 1) % 4) + 1;
};

const getOfficePrayer = (date: string, key: string) => {
    const calendar = getCalendar(date);
    if (!calendar) return null;

    const structuredEngineData = buildStructuredOffice(date, key);
    if (!structuredEngineData) return null;

    return {
        key,
        title: prayerTitleMap[key] ?? key,
        icon: prayerIconMap[key] || 'book-outline',
        ...structuredEngineData
    };
};

export const getDivineOffice = (date: string) => {
    const calendar = getCalendar(date);
    if (!calendar) return null;

    const currentHour = new Date().getHours();
    const prayers = ['officeOfReadings', 'morningPrayer', 'midMorningPrayer', 'middayPrayer', 'afternoonPrayer', 'eveningPrayer', 'nightPrayer'];
    const currentKey = currentHour < 9 ? 'morningPrayer' : currentHour < 11 ? 'midMorningPrayer' : currentHour < 13 ? 'middayPrayer' : currentHour < 16 ? 'afternoonPrayer' : currentHour < 20 ? 'eveningPrayer' : 'nightPrayer';

    return prayers.map((key, index) => ({
        id: String(index + 1),
        key,
        title: prayerTitleMap[key],
        timeLength: '~8 MIN',
        isCurrent: key === currentKey,
        icon: prayerIconMap[key],
        detail: getOfficePrayer(date, key),
    }));
};

export const getDivineOfficePrayer = (date: string, prayerKey: string) => getOfficePrayer(date, prayerKey);

export const getInspirations = (date: string) => {
    const calendar = getCalendar(date);
    if (!calendar) return null;

    const inspirationData = getInspirationData();
    const inspiration = inspirationData.celebrations?.[calendar.key] ?? inspirationData.defaults?.[calendar.season] ?? null;

    return {
        date,
        calendar,
        inspiration,
        readings: getReadings(date),
    };
};

export const getDailyInspiration = (date: string): DailyInspirationCard | null => {
    const missalDay = getReadings(date);
    if (!missalDay) return null;

    const gospelBlock = missalDay.readings.find(b => b.type === 'gospel');
    const psalmBlock = missalDay.readings.find(b => b.type === 'psalm');
    const firstReadingBlock = missalDay.readings.find(b => b.type === 'first_reading');

    // Create a seed from the date to keep it deterministic (same inspiration for everyone on same day)
    const dateSeed = date.split('-').reduce((acc, val) => acc + parseInt(val), 0);

    // 1. SELECT HERO VERSE (Gospel preferred, then Psalm response)
    let heroText = 'The Lord is my shepherd, there is nothing I shall want.';
    let heroRef = 'Psalm 23';

    if (gospelBlock?.text) {
        // Grab first sentence or meaningful chunk
        const sentences = gospelBlock.text.match(/[^.!?]+[.!?]+/g) || [gospelBlock.text];
        heroText = sentences[0].trim();
        heroRef = gospelBlock.reference || 'Gospel';
    } else if (psalmBlock?.response) {
        heroText = psalmBlock.response;
        heroRef = psalmBlock.reference || 'Psalm';
    }

    // 2. SYNTHESIZE REFLECTIONS
    const reflections: any[] = [];

    if (gospelBlock?.text) {
        reflections.push({
            id: `${date}-gospel-reflection`,
            verse: gospelBlock.text.split('\n')[0].slice(0, 100) + '...',
            reference: gospelBlock.reference || 'Gospel',
            reflection: `In today's Gospel, we encounter the heart of Christ's message for ${missalDay.feastName.toLowerCase()}. Let his words penetrate your heart and guide your decisions today.`,
            theme: (['faith', 'hope', 'love'][dateSeed % 3]) as any,
        });
    }

    if (firstReadingBlock?.text) {
        reflections.push({
            id: `${date}-first-reading-reflection`,
            verse: firstReadingBlock.text.split('\n')[0].slice(0, 100) + '...',
            reference: firstReadingBlock.reference || 'First Reading',
            reflection: `The first reading reminds us of the long history of God's faithfulness to His people. As we celebrate ${missalDay.feastName}, we are called to trust in that same providence.`,
            theme: (['strength', 'peace'][dateSeed % 2]) as any,
        });
    }

    // 3. THE DAY'S VERSE
    //
    // Was a six-quotation bank indexed by `dateSeed % 6`, so the same words returned every six days
    // and only six ever appeared all year. It now comes from a 366-entry bank keyed on the day of
    // the year: unique across the year, identical on every device, and stable from year to year so
    // a saved bookmark keeps its meaning. See src/utils/dailyInspiration.ts.
    const dailyInspiration = getInspirationForDate(date);

    return {
        title: missalDay.feastName,
        body: `Today we celebrate ${missalDay.feastName}. Amidst the busyness of life, take a moment to rest in the Word.`,
        heroVerse: { text: heroText, reference: heroRef },
        reflections,
        dailyVerse: dailyInspiration
            ? {
                  text: dailyInspiration.text,
                  reference: dailyInspiration.reference,
                  translation: dailyInspiration.translation,
                  id: dailyInspiration.id,
              }
            : // Unreachable for a well-formed ISO date, but the card must never render `undefined`.
              { text: heroText, reference: heroRef, translation: '', id: `inspiration-${date}` },
        sourceReadings: missalDay.readings,
    };
};

const titleCase = (value: string) => value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const formatReadableDate = (date: string) => formatPremiumDate(date);

export const getCalendarDescription = (date: string) => {
    const calendar = getCalendar(date);
    if (!calendar) return 'No liturgical information is available for this date.';
    return `${calendar.celebration} falls in ${calendar.season}${calendar.week ? `, week ${calendar.week}` : ''} of the liturgical year.`;
};

export const getDatePresentation = (date: string) => {
    const calendar = getCalendar(date);
    if (!calendar) return null;

    const badgeSeason = calendar.period ? titleCase(calendar.period) : calendar.season;
    const badgeSuffix = calendar.week ? `WEEK ${calendar.week}` : calendar.day.toUpperCase();

    return {
        formattedDate: formatPremiumDate(date),
        weekdayMonthDay: formatPremiumDate(date),
        monthYear: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)),
        shortMeta: `${date} - ${calendar.liturgicalYear || 'A'}`,
        liturgicalYearLabel: `LITURGICAL YEAR ${calendar.liturgicalYear || 'A'}`,
        badgeLabel: `${badgeSeason.toUpperCase()} - ${badgeSuffix}`,
        celebration: calendar.celebration,
    };
};
