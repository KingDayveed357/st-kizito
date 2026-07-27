import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { getTodayIso } from '../services/liturgicalData';

/**
 * Keeps the app on *today's* liturgy across a day boundary.
 *
 * Two cases are covered together with the store's `partialize` (see useAppStore):
 *  1. Cold launch — `selectedDate` is no longer persisted, so it always initializes to today.
 *  2. Long-lived session — if the calendar day rolls over while the app is open/backgrounded,
 *     snap back to today when it returns to the foreground.
 *
 * Intentional historical browsing is preserved: we only snap when the user was already on the
 * (previous) "today". If they navigated to a past date, we leave their selection alone.
 */
export const useDailyRefresh = () => {
    const knownTodayRef = useRef(getTodayIso());

    useEffect(() => {
        const handleChange = (status: AppStateStatus) => {
            if (status !== 'active') return;

            const today = getTodayIso();
            const prevToday = knownTodayRef.current;
            if (today === prevToday) return;

            // Day has rolled over. Read fresh state to avoid a stale closure.
            const { selectedDate, setSelectedDate } = useAppStore.getState();
            if (selectedDate === prevToday) {
                setSelectedDate(today);
            }
            knownTodayRef.current = today;
        };

        const subscription = AppState.addEventListener('change', handleChange);
        return () => subscription.remove();
    }, []);
};
