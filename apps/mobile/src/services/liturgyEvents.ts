import calendar2026 from '../../data/calendar/2026.json';

export type LiturgicalEventType = 'solemnity' | 'feast' | 'memorial' | 'optional' | 'weekday';

export interface LiturgicalCalendarEntry {
    date?: string;
    celebration?: string;
    celebrationType?: string;
    key?: string;
    day?: string;
}

export interface NextLiturgicalEvent {
    id: string;
    title: string;
    date: string;
    type: LiturgicalEventType;
}

export type LiturgicalCalendarData = Record<string, LiturgicalCalendarEntry>;

const CELEBRATION_PRIORITY: Record<LiturgicalEventType, number> = {
    solemnity: 5,
    feast: 4,
    memorial: 3,
    optional: 2,
    weekday: 1,
};

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const toEventType = (rawType?: string | null): LiturgicalEventType => {
    const value = (rawType ?? '').toUpperCase();

    if (value.includes('SOLEMNITY')) return 'solemnity';
    if (value.includes('FEAST')) return 'feast';
    if (value.includes('MEMORIAL') && !value.includes('OPT')) return 'memorial';
    if (value.includes('OPT')) return 'optional';
    return 'weekday';
};

const compareByPriorityThenDate = (a: NextLiturgicalEvent, b: NextLiturgicalEvent) => {
    const priorityDelta = CELEBRATION_PRIORITY[b.type] - CELEBRATION_PRIORITY[a.type];
    if (priorityDelta !== 0) return priorityDelta;
    return a.date.localeCompare(b.date);
};

const normalizeTitle = (entry: LiturgicalCalendarEntry, date: string) => {
    if (entry.celebration?.trim()) return entry.celebration.trim();
    return `Liturgy for ${date}`;
};

export const bundledLiturgyData: LiturgicalCalendarData = calendar2026 as LiturgicalCalendarData;

export const getNextLiturgicalEvent = (
    currentDate: string,
    liturgyData: LiturgicalCalendarData
): NextLiturgicalEvent | null => {
    const isoToday = isIsoDate(currentDate) ? currentDate : new Date().toISOString().slice(0, 10);

    const candidates = Object.entries(liturgyData)
        .filter(([date]) => isIsoDate(date) && date > isoToday)
        .map(([date, entry]) => {
            const type = toEventType(entry.celebrationType);
            const title = normalizeTitle(entry, date);

            return {
                id: `${date}:${entry.key ?? title}`,
                title,
                date,
                type,
            } satisfies NextLiturgicalEvent;
        })
        .sort(compareByPriorityThenDate);

    if (candidates.length > 0) {
        return candidates[0];
    }

    const tomorrow = new Date(`${isoToday}T12:00:00`);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fallbackDate = tomorrow.toISOString().slice(0, 10);

    const tomorrowEntry = liturgyData[fallbackDate];
    if (tomorrowEntry) {
        const type = toEventType(tomorrowEntry.celebrationType);
        const title = normalizeTitle(tomorrowEntry, fallbackDate);

        return {
            id: `${fallbackDate}:${tomorrowEntry.key ?? title}`,
            title,
            date: fallbackDate,
            type,
        };
    }

    return {
        id: `${fallbackDate}:weekday-fallback`,
        title: `Liturgy for ${fallbackDate}`,
        date: fallbackDate,
        type: 'weekday',
    };
};
