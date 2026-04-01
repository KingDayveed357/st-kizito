import calendar2026 from '../../data/calendar/2026.json';
import readings from '../../data/readings.json';
import divineOffice from '../../data/divineOffice.json';
import inspirations from '../../data/inspirations.json';
import passageCache from '../../data/passageCache.json';

const calendarData = calendar2026 as Record<string, any>;
const readingsData = readings as Record<string, any>;
const officeData = divineOffice as Record<string, any>;
const inspirationData = inspirations as Record<string, any>;
const passages = passageCache as Record<string, any>;

export const getTodayIso = () => {
    const today = new Date().toISOString().slice(0, 10);
    return calendarData[today] ? today : '2026-01-01';
};

export const getCalendar = (date: string) => calendarData[date] ?? null;

const sanitizeText = (text?: string) =>
    (text ?? '')
        .replace(/Ã‚Â¶/g, '')
        .replace(/Ã‚/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/\s+/g, ' ')
        .trim();

const normalizeReferenceChunk = (reference: string) =>
    reference
        .trim()
        .replace(/\.$/, '')
        .replace(/\s+/g, ' ');

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

const buildPsalmVerses = (reference?: string | null) => {
    const passage = getPassage(reference);
    if (!passage?.verses?.length) {
        return [];
    }

    return passage.verses.map((text: string, index: number) => ({
        type: index === 0 ? 'response' : 'verse',
        text: sanitizeText(text),
    }));
};

const normalizeSeason = (season?: string) => {
    if (!season) return 'ordinary';
    if (season === 'Ordinary Time') return 'ordinary';
    if (season === 'Lent' || season === 'Advent') return 'lent';
    if (season === 'Christmas' || season === 'Easter') return 'easter';
    return season.toLowerCase();
};

const liturgicalColor = (season?: string, celebrationType?: string) => {
    if (celebrationType === 'SOLEMNITY' || celebrationType === 'FEAST') return 'gold';
    if (season === 'Lent' || season === 'Advent') return 'purple';
    if (season === 'Christmas' || season === 'Easter') return 'gold';
    return 'green';
};

const weekdayCycle = (date: string) => (Number(date.slice(0, 4)) % 2 === 0 ? 'II' : 'I');

const titleCase = (value: string) =>
    value
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

const formatReadableDate = (date: string) =>
    new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).format(new Date(`${date}T12:00:00`));

const resolveReadingSet = (date: string, calendar: any) => {
    const entry = readingsData[calendar.key];
    if (!entry) return null;
    if (entry.type === 'proper') return entry.proper ?? null;
    if (entry.type === 'weekday') return entry.weekdayCycle?.[weekdayCycle(date)] ?? null;
    return entry[calendar.liturgicalYear] ?? null;
};

export const getReadings = (date: string) => {
    const calendar = getCalendar(date);
    if (!calendar) return null;

    const readingSet = resolveReadingSet(date, calendar) ?? {};
    const firstPassage = getPassage(readingSet.first);
    const secondPassage = getPassage(readingSet.second);
    const gospelPassage = getPassage(readingSet.gospel);
    const inspiration = getInspirations(date);
    const psalmVerses = buildPsalmVerses(readingSet.psalm);

    return {
        id: date,
        date,
        lectionaryNumber: null,
        feastName: calendar.celebration,
        liturgicalSeason: normalizeSeason(calendar.season),
        liturgicalColor: liturgicalColor(calendar.season, calendar.celebrationType),
        firstReading: {
            reference: readingSet.first ?? 'Unavailable',
            text: sanitizeText(firstPassage?.text) || 'Actual text is not available in the offline bundle for this passage yet.',
        },
        secondReading: readingSet.second
            ? {
                  reference: readingSet.second,
                  text: sanitizeText(secondPassage?.text) || 'Actual text is not available in the offline bundle for this passage yet.',
              }
            : undefined,
        psalm: {
            reference: readingSet.psalm ?? 'Unavailable',
            verses:
                psalmVerses.length > 0
                    ? psalmVerses
                    : [
                          {
                              type: 'verse',
                              text:
                                  sanitizeText(getPassage(readingSet.psalm)?.text) ||
                                  'Actual psalm text is not available in the offline bundle for this passage yet.',
                          },
                      ],
        },
        gospelAcclamation:
            sanitizeText(gospelPassage?.verses?.[0]) ||
            sanitizeText(inspiration?.inspiration?.prayer) ||
            'Alleluia.',
        gospel: {
            reference: readingSet.gospel ?? 'Unavailable',
            text: sanitizeText(gospelPassage?.text) || 'Actual text is not available in the offline bundle for this passage yet.',
        },
    };
};

const prayerTitleMap: Record<string, string> = {
    officeOfReadings: 'Office of Readings',
    morningPrayer: 'Morning Prayer (Lauds)',
    eveningPrayer: 'Evening Prayer (Vespers)',
    nightPrayer: 'Night Prayer (Compline)',
};

const prayerIconMap: Record<string, string> = {
    officeOfReadings: 'book-outline',
    morningPrayer: 'sunny-outline',
    eveningPrayer: 'partly-sunny-outline',
    nightPrayer: 'moon-outline',
};

const getPsalterWeek = (calendar: any) => {
    const week = calendar?.week && calendar.week > 0 ? calendar.week : 1;
    return ((week - 1) % 4) + 1;
};

const officeSeasonKey = (season?: string) => (season === 'Ordinary Time' ? 'OrdinaryTime' : season);

const getOfficePrayer = (date: string, key: string) => {
    const calendar = getCalendar(date);
    if (!calendar) return null;

    const psalterWeek = getPsalterWeek(calendar);
    const seasonKey = officeSeasonKey(calendar.season) ?? 'OrdinaryTime';
    const psalterEntry = officeData.psalter?.[`week${psalterWeek}`]?.[key];
    const seasonEntry = officeData.seasons?.[seasonKey];
    const scope = calendar.day === 'Sunday' ? 'sunday' : 'weekday';
    const psalmRefs =
        key === 'nightPrayer'
            ? officeData.complineByDay?.[calendar.day]?.psalms ?? psalterEntry?.[scope]?.psalms ?? []
            : psalterEntry?.[scope]?.psalms ?? [];
    const readingReference = seasonEntry?.readings?.[key] ?? seasonEntry?.readings?.morningPrayer ?? null;
    const canticleReference =
        key === 'morningPrayer'
            ? officeData.commons?.gospelCanticles?.benedictus?.reference
            : key === 'eveningPrayer'
              ? officeData.commons?.gospelCanticles?.magnificat?.reference
              : key === 'nightPrayer'
                ? officeData.commons?.gospelCanticles?.nuncDimittis?.reference
                : null;
    const canticleText = sanitizeText(getPassage(canticleReference)?.text);

    return {
        key,
        title: prayerTitleMap[key] ?? key,
        psalms: psalmRefs.map((reference: string) => ({
            reference,
            text: sanitizeText(getPassage(reference)?.text) || reference,
        })),
        readingReference,
        readingText:
            sanitizeText(getPassage(readingReference)?.text) ||
            (readingReference ? `Reading reference: ${readingReference}` : null),
        antiphon: seasonEntry?.antiphons?.[key] ?? seasonEntry?.antiphons?.morningPrayer ?? null,
        canticleReference,
        canticleText: canticleText || (canticleReference ? `Canticle reference: ${canticleReference}` : null),
    };
};

export const getDivineOffice = (date: string) => {
    const calendar = getCalendar(date);
    if (!calendar) return null;

    const currentHour = new Date().getHours();
    const prayers = ['morningPrayer', 'officeOfReadings', 'eveningPrayer', 'nightPrayer'];
    const currentKey =
        currentHour < 11
            ? 'morningPrayer'
            : currentHour < 15
              ? 'officeOfReadings'
              : currentHour < 20
                ? 'eveningPrayer'
                : 'nightPrayer';

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

    const inspiration =
        inspirationData.celebrations?.[calendar.key] ?? inspirationData.defaults?.[calendar.season] ?? null;

    return {
        date,
        calendar,
        inspiration,
    };
};

export const getCalendarDescription = (date: string) => {
    const inspiration = getInspirations(date);
    if (inspiration?.inspiration?.body) {
        return inspiration.inspiration.body;
    }

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
        formattedDate: formatReadableDate(date),
        weekdayMonthDay: formatReadableDate(date),
        monthYear: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`)),
        shortMeta: `${date} - ${calendar.liturgicalYear}`,
        liturgicalYearLabel: `LITURGICAL YEAR ${calendar.liturgicalYear}`,
        badgeLabel: `${badgeSeason.toUpperCase()} - ${badgeSuffix}`,
        celebration: calendar.celebration,
    };
};
