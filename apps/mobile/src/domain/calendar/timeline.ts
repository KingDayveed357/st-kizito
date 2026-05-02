export const DAY_MILLIS = 24 * 60 * 60 * 1000;
export const CALENDAR_MIN_ISO = '2000-01-01';
export const CALENDAR_MAX_ISO = '2040-12-31';
export const DEFAULT_WINDOW_DAYS = 365 * 2;
export const PAGE_SIZE_DAYS = 365;
export const MAX_WINDOW_DAYS = 365 * 4;

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type TimelineDay = {
    date: string;
    dayNum: number;
    dayName: string;
    isSunday: boolean;
};

export type CalendarRange = {
    start: string;
    end: string;
};

export const isoAtNoon = (date: string) => new Date(`${date}T12:00:00`);

export const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const clampDate = (date: Date): Date => {
    const min = isoAtNoon(CALENDAR_MIN_ISO);
    const max = isoAtNoon(CALENDAR_MAX_ISO);
    if (date < min) return min;
    if (date > max) return max;
    return date;
};

export const buildInitialRange = (anchorIso: string, windowDays: number = DEFAULT_WINDOW_DAYS): CalendarRange => {
    const anchor = clampDate(isoAtNoon(anchorIso));
    const halfWindow = Math.floor(windowDays / 2);
    const start = clampDate(new Date(anchor.getTime() - halfWindow * DAY_MILLIS));
    const end = clampDate(new Date(anchor.getTime() + halfWindow * DAY_MILLIS));
    return { start: toIsoDate(start), end: toIsoDate(end) };
};

export const expandRangeFuture = (range: CalendarRange, pageDays: number = PAGE_SIZE_DAYS): CalendarRange => {
    const end = isoAtNoon(range.end);
    const max = isoAtNoon(CALENDAR_MAX_ISO);
    if (end >= max) return range;
    const nextEnd = clampDate(new Date(end.getTime() + pageDays * DAY_MILLIS));
    return { ...range, end: toIsoDate(nextEnd) };
};

export const expandRangePast = (range: CalendarRange, pageDays: number = PAGE_SIZE_DAYS): CalendarRange => {
    const start = isoAtNoon(range.start);
    const min = isoAtNoon(CALENDAR_MIN_ISO);
    if (start <= min) return range;
    const nextStart = clampDate(new Date(start.getTime() - pageDays * DAY_MILLIS));
    return { ...range, start: toIsoDate(nextStart) };
};

export const ensureDateInRange = (range: CalendarRange, dateIso: string, windowDays: number = DEFAULT_WINDOW_DAYS): CalendarRange => {
    const date = clampDate(isoAtNoon(dateIso));
    const start = isoAtNoon(range.start);
    const end = isoAtNoon(range.end);
    if (date >= start && date <= end) {
        return range;
    }
    return buildInitialRange(toIsoDate(date), windowDays);
};

export const clampWindowSize = (range: CalendarRange, maxWindowDays: number = MAX_WINDOW_DAYS): CalendarRange => {
    const start = isoAtNoon(range.start);
    const end = isoAtNoon(range.end);
    const spanDays = Math.round((end.getTime() - start.getTime()) / DAY_MILLIS) + 1;
    if (spanDays <= maxWindowDays) {
        return range;
    }

    const trimmedStart = new Date(end.getTime() - (maxWindowDays - 1) * DAY_MILLIS);
    return {
        start: toIsoDate(clampDate(trimmedStart)),
        end: range.end,
    };
};

export const clampWindowSizeFromEnd = (range: CalendarRange, maxWindowDays: number = MAX_WINDOW_DAYS): CalendarRange => {
    const start = isoAtNoon(range.start);
    const end = isoAtNoon(range.end);
    const spanDays = Math.round((end.getTime() - start.getTime()) / DAY_MILLIS) + 1;
    if (spanDays <= maxWindowDays) {
        return range;
    }

    const trimmedEnd = new Date(start.getTime() + (maxWindowDays - 1) * DAY_MILLIS);
    return {
        start: range.start,
        end: toIsoDate(clampDate(trimmedEnd)),
    };
};

export const buildTimelineDays = (startIso: string, endIso: string): TimelineDay[] => {
    const start = isoAtNoon(startIso).getTime();
    const end = isoAtNoon(endIso).getTime();
    const days = Math.round((end - start) / DAY_MILLIS) + 1;

    return Array.from({ length: days }).map((_, i) => {
        const iso = toIsoDate(new Date(start + i * DAY_MILLIS));
        const date = isoAtNoon(iso);
        const dayOfWeek = date.getDay();

        return {
            date: iso,
            dayNum: date.getDate(),
            dayName: WEEKDAY_SHORT[dayOfWeek],
            isSunday: dayOfWeek === 0,
        };
    });
};
