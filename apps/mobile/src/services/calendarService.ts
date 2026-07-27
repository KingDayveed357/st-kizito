import { computeLiturgicalDay } from './liturgicalCalendar';

/**
 * Liturgical calendar lookup, extracted from liturgicalData.ts to break a require cycle
 * (liturgicalData -> divineOfficeEngine -> liturgicalData). This module is a leaf: it depends
 * only on the calendar engine and the bundled calendar data, so both liturgicalData and
 * divineOfficeEngine can import `getCalendar` from here without a cycle.
 */

const MAX_CALENDAR_CACHE_SIZE = 2500;
const calendarCache = new Map<string, any>();

let calendarDataMemo: Record<string, any> | null = null;

const getCalendarData = (): Record<string, any> => {
    if (!calendarDataMemo) {
        calendarDataMemo = require('../../data/calendar/2026.json') as Record<string, any>;
    }
    return calendarDataMemo;
};

const setCalendarCache = (date: string, value: any) => {
    if (calendarCache.has(date)) {
        calendarCache.delete(date);
    }
    calendarCache.set(date, value);
    if (calendarCache.size > MAX_CALENDAR_CACHE_SIZE) {
        const oldestKey = calendarCache.keys().next().value;
        if (oldestKey) {
            calendarCache.delete(oldestKey);
        }
    }
};

export const getCalendar = (date: string) => {
    const cached = calendarCache.get(date);
    if (cached) return cached;
    const calendarData = getCalendarData();

    // Primary source: pre-built per-year calendar files (highest fidelity —
    // includes sanctoral names, precise celebration types, etc.)
    if (calendarData[date]) {
        setCalendarCache(date, calendarData[date]);
        return calendarData[date];
    }

    // Fallback: authoritative liturgical calendar engine.
    // computeLiturgicalDay() is the canonical algorithm, shared with the scraper,
    // so divine office keys will always match the stored data.
    // It is safe to use for any year from 2000–2040.
    try {
        const result = computeLiturgicalDay(date);
        setCalendarCache(date, result);
        return result;
    } catch {
        return null;
    }
};
