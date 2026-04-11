import calendar2026 from '../../data/calendar/2026.json';
import readings from '../../data/readings.json';
import divineOffice from '../../data/divineOffice.json';
import inspirations from '../../data/inspirations.json';
import passageCache from '../../data/passageCache.json';
import { formatPremiumDate } from '../utils/formatters';

// Import scraped USCCB API data if generated. (Optional fallback structure avoids missing text issues)
import usccbDataRaw from '../../data/usccb-readings-dataset.json';

import { buildStructuredOffice } from './divineOfficeEngine';

import type {
    DailyInspirationCard,
    LiturgicalBlock,
    MissalDay,
    PsalmVerse,
} from '../types/readings.types';

import { getLiturgicalDay } from './liturgicalEngine';

const calendarData = calendar2026 as Record<string, any>;
const readingsData = readings as Record<string, any>;
const officeData = divineOffice as Record<string, any>;
const inspirationData = inspirations as Record<string, any>;
const passages = passageCache as Record<string, any>;
const usccbData = usccbDataRaw as Record<string, { readings?: any, readingsList?: any[], masses?: any[] }>;

export const getTodayIso = () => {
    return new Date().toISOString().slice(0, 10);
};

export const getCalendar = (date: string) => {
    if (calendarData[date]) return calendarData[date];
    // Fallback to dynamic engine
    try {
        const dynamic = getLiturgicalDay(date);
        return {
            date: dynamic.date,
            celebration: dynamic.celebration,
            celebrationType: dynamic.celebrationType,
            season: dynamic.season,
            color: dynamic.color,
            liturgicalYear: dynamic.year,
            week: dynamic.week,
            day: dynamic.dayOfWeek,
            key: `ot-week-${dynamic.week}-${dynamic.dayOfWeek.toLowerCase()}` // Fallback key
        };
    } catch (e) {
        return null;
    }
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

const stripHeadersAndReferences = (text: string | null | undefined, reference?: string | null): string | null => {
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
    cleanText = cleanText.replace(/^(?:R\.|R\/|V\.|V\/)\s*(?:\([a-zA-Z0-9cd]+\)\s*)?/i, '');

    return cleanText.trim();
};

const getPassage = (reference?: string | null) => {
    if (!reference) return null;

    const normalizedReference = normalizeReferenceChunk(reference);
    if (passages[normalizedReference]) {
        return passages[normalizedReference];
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
        label: 'Responsorial Psalm',
        reference: reference ?? 'Unavailable',
        response: response,
        verses: finalVerses,
        text: textFallback || null
    };
};

const parseUSCCBPsalmText = (rawText: string): { response: string | null, verses: PsalmVerse[] } => {
    if (!rawText) return { response: null, verses: [] };

    const lines = rawText.split('\n');
    const verses: PsalmVerse[] = [];
    let response: string | null = null;
    let currentVerseText = '';

    for (const line of lines) {
        if (line.trim().startsWith('R.') || line.trim().startsWith('R ')) {
            if (currentVerseText.trim()) {
                verses.push({ type: 'verse', text: currentVerseText.trim() });
                currentVerseText = '';
            }
            const cleanResponse = line.replace(/^R\.\s*(?:\([^)]+\)\s*)?|^R\s*(?:\([^)]+\)\s*)?/, '').trim();
            if (cleanResponse) {
                if (!response) response = cleanResponse; // Set initial generic response
                // Add the response inline as a verse type so React renders it nicely
                verses.push({ type: 'response', text: cleanResponse });
            }
        } else {
            currentVerseText += (currentVerseText ? '\n' : '') + line.trim();
        }
    }

    if (currentVerseText.trim()) {
        verses.push({ type: 'verse', text: currentVerseText.trim() });
    }

    if (verses.length === 0) {
        return { response: null, verses: [{ type: 'verse', text: rawText }] };
    }

    return { response, verses };
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
                    const cleanPsalmText = stripHeadersAndReferences(item.text, item.reference) || '';
                    const parsedPsalm = parseUSCCBPsalmText(cleanPsalmText);
                    arr.push({
                        id: uniqueId,
                        type: 'psalm',
                        label: item.label || 'Responsorial Psalm',
                        reference: item.reference,
                        response: parsedPsalm.response,
                        verses: parsedPsalm.verses,
                        text: cleanPsalmText || null
                    });
                } else {
                    arr.push(buildReadingBlock(uniqueId, item.type, item.label || 'Reading', item.reference, item.text));
                }
            });
            return arr;
        };

        const processReadingsLegacy = (ur: any, massTitle?: string): LiturgicalBlock[] => {
            const arr: LiturgicalBlock[] = [];
            const titleSafe = massTitle ? massTitle.replace(/\s+/g, '-') : 'base';

            if (ur.firstReading) arr.push(buildReadingBlock(`first-reading-${date}-${titleSafe}`, 'first_reading', 'First Reading', ur.firstReading.reference, ur.firstReading.text));
            if (ur.responsorialPsalm) {
                const cleanPsalmText = stripHeadersAndReferences(ur.responsorialPsalm.text, ur.responsorialPsalm.reference) || '';
                const parsedPsalm = parseUSCCBPsalmText(cleanPsalmText);
                arr.push({
                    id: `psalm-${date}-${titleSafe}`,
                    type: 'psalm',
                    label: 'Responsorial Psalm',
                    reference: ur.responsorialPsalm.reference,
                    response: parsedPsalm.response,
                    verses: parsedPsalm.verses,
                    text: cleanPsalmText || null
                });
            }
            if (ur.secondReading) arr.push(buildReadingBlock(`second-reading-${date}-${titleSafe}`, 'second_reading', 'Second Reading', ur.secondReading.reference, ur.secondReading.text));
            if (ur.gospelAcclamation) {
                const cleanAcclamation = stripHeadersAndReferences(ur.gospelAcclamation.text, ur.gospelAcclamation.reference) || '';
                arr.push(buildReadingBlock(`gospel-acclamation-${date}-${titleSafe}`, 'gospel_acclamation', 'Gospel Acclamation', ur.gospelAcclamation.reference, cleanAcclamation));
            }
            if (ur.gospel) arr.push(buildReadingBlock(`gospel-${date}-${titleSafe}`, 'gospel', 'Gospel', ur.gospel.reference, ur.gospel.text));
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
        readings.push(buildReadingBlock(`entrance-${date}`, 'entrance_antiphon', 'Entrance Antiphon', null, readingSet.entrance));
    }

    // Process mappings dynamically based on dataset provided. 
    // If future datasets provide an array structure readingSet.readings, we parse that.
    if (Array.isArray(readingSet.readings)) {
        readingSet.readings.forEach((reading: any, idx: number) => {
            if (reading.type === 'psalm') {
                readings.push(buildPsalmBlock(date, reading.reference));
            } else {
                readings.push(buildReadingBlock(`reading-${idx}-${date}`, reading.type || 'supplemental_reading', reading.label || 'Reading', reading.reference, getPassage(reading.reference)?.text));
            }
        });
    } else {
        // Fallback for current Object-based dataset
        if (readingSet.first) {
            readings.push(buildReadingBlock(`first-reading-${date}`, 'first_reading', 'First Reading', readingSet.first, getPassage(readingSet.first)?.text));
        }

        if (readingSet.psalm) {
            readings.push(buildPsalmBlock(date, readingSet.psalm));
        }

        if (readingSet.second) {
            readings.push(buildReadingBlock(`second-reading-${date}`, 'second_reading', 'Second Reading', readingSet.second, getPassage(readingSet.second)?.text));
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

            readings.push(buildReadingBlock(`gospel-acclamation-${date}`, 'gospel_acclamation', 'Gospel Acclamation', null, acclamationFullText));
            readings.push(buildReadingBlock(`gospel-${date}`, 'gospel', 'Gospel', readingSet.gospel, getPassage(readingSet.gospel)?.text));
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
    const inspiration = getInspirations(date);

    if (!missalDay || !inspiration) return null;

    const gospelBlock = missalDay.readings.find(b => b.type === 'gospel');
    const firstReadingBlock = missalDay.readings.find(b => b.type === 'first_reading');

    const sourceHeroVerse = inspiration.inspiration?.heroVerse ??
        (gospelBlock && gospelBlock.text
            ? { text: gospelBlock.text.slice(0, 120), reference: gospelBlock.reference || 'Gospel' }
            : (firstReadingBlock && firstReadingBlock.text
                ? { text: firstReadingBlock.text.slice(0, 120), reference: firstReadingBlock.reference || 'Reading' }
                : { text: 'The Lord is my shepherd, there is nothing I shall want.', reference: 'Psalm 23' }));

    const reflections = inspiration.inspiration?.reflections ?? [
        firstReadingBlock && firstReadingBlock.text ? {
            id: `${date}-first-reading`,
            verse: firstReadingBlock.text.slice(0, 120),
            reference: firstReadingBlock.reference || 'First Reading',
            reflection: `The first reading anchors the day's prayer in ${missalDay.feastName.toLowerCase()}.`,
            theme: 'faith' as const,
        } : null,
        gospelBlock && gospelBlock.text ? {
            id: `${date}-gospel`,
            verse: gospelBlock.text.slice(0, 120),
            reference: gospelBlock.reference || 'Gospel',
            reflection: `The Gospel brings the day's liturgical meaning into focus and asks for a concrete response.`,
            theme: 'hope' as const,
        } : null,
    ].filter(Boolean);

    return {
        title: inspiration.inspiration?.title ?? missalDay.feastName,
        body: inspiration.inspiration?.body ??
            `Today the Church celebrates ${missalDay.feastName}. Let the proclaimed word shape your prayer and action.`,
        heroVerse: sourceHeroVerse,
        reflections,
        saintQuote: inspiration.inspiration?.saintQuote ?? {
            quote: 'Let the word of Christ dwell in you richly.',
            saint: 'Scripture',
            initials: 'SC',
        },
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
