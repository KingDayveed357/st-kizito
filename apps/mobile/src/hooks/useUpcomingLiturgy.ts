import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOfflineStatus } from './useOfflineStatus';
import { STORAGE_KEYS } from '../utils/constants';
import {
    bundledLiturgyData,
    getNextLiturgicalEvent,
    LiturgicalCalendarData,
    NextLiturgicalEvent,
} from '../services/liturgyEvents';
import {
    getEventReminderState,
    toggleLiturgyEventReminder,
} from '../services/notifications/liturgyReminderService';

interface CachedLiturgyEnvelope {
    data: LiturgicalCalendarData;
    updatedAt: number;
}

const parseEnvelope = (raw: string | null): CachedLiturgyEnvelope | null => {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as CachedLiturgyEnvelope;
        if (!parsed || typeof parsed !== 'object' || !parsed.data) return null;
        return parsed;
    } catch {
        return null;
    }
};

const persistBundleInBackground = async (source: LiturgicalCalendarData) => {
    const payload: CachedLiturgyEnvelope = {
        data: source,
        updatedAt: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.liturgyCalendarData, JSON.stringify(payload));
};

export const useUpcomingLiturgy = (currentDate: string) => {
    const { isOffline } = useOfflineStatus();
    const [calendarData, setCalendarData] = useState<LiturgicalCalendarData>(bundledLiturgyData);
    const [isLoading, setIsLoading] = useState(true);
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [isTogglingReminder, setIsTogglingReminder] = useState(false);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const cachedRaw = await AsyncStorage.getItem(STORAGE_KEYS.liturgyCalendarData);
                const cached = parseEnvelope(cachedRaw);

                if (mounted) {
                    if (cached?.data) {
                        setCalendarData(cached.data);
                    } else {
                        setCalendarData(bundledLiturgyData);
                    }
                    setIsLoading(false);
                }

                // Background sync/write for offline-first consistency.
                if (!isOffline) {
                    await persistBundleInBackground(bundledLiturgyData);
                    if (mounted) {
                        setCalendarData(bundledLiturgyData);
                    }
                }
            } catch {
                if (mounted) {
                    setCalendarData(bundledLiturgyData);
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, [isOffline]);

    const event = useMemo<NextLiturgicalEvent | null>(() => {
        return getNextLiturgicalEvent(currentDate, calendarData);
    }, [calendarData, currentDate]);

    useEffect(() => {
        let mounted = true;

        const syncReminderState = async () => {
            if (!event?.id) {
                if (mounted) setReminderEnabled(false);
                return;
            }
            const enabled = await getEventReminderState(event.id);
            if (mounted) setReminderEnabled(enabled);
        };

        syncReminderState();

        return () => {
            mounted = false;
        };
    }, [event?.id]);

    const toggleReminder = useCallback(async () => {
        if (!event || isTogglingReminder) return;

        setIsTogglingReminder(true);
        try {
            const next = await toggleLiturgyEventReminder(event);
            setReminderEnabled(next.scheduled);
            return next;
        } finally {
            setIsTogglingReminder(false);
        }
    }, [event, isTogglingReminder]);

    return {
        event,
        isLoading,
        reminderEnabled,
        isTogglingReminder,
        toggleReminder,
    };
};
