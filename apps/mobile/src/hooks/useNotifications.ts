import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { STORAGE_KEYS } from '../utils/constants';
import {
    PrayerReminderKey,
    PrayerReminderSettings,
    cancelReminder,
    defaultPrayerReminders,
    ensureNotificationPermissions,
    reconcileNotifications,
    scheduleDailyPrayerReminder,
} from '../services/notifications/notificationService';

export interface NotificationPreferences {
    massUpdates: boolean;
    parishAnnouncements: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    massUpdates: true,
    parishAnnouncements: true,
};

const parseJson = <T>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

const toTwoDigits = (value: number) => String(value).padStart(2, '0');

export const formatReminderTime = (hour: number, minute: number) => {
    const today = new Date();
    today.setHours(hour, minute, 0, 0);

    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(today);
};

export const useNotifications = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
    const [prayerReminders, setPrayerReminders] = useState<PrayerReminderSettings>(defaultPrayerReminders);

    // ── Ref to prevent stale closures ────────────────────────────────────
    // togglePrayerReminder and setPrayerReminderTime always read the LATEST
    // state through this ref, even if React hasn't re-rendered yet.
    const prayerRemindersRef = useRef(prayerReminders);
    useEffect(() => {
        prayerRemindersRef.current = prayerReminders;
    }, [prayerReminders]);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const [prefsRaw, remindersRaw, permissions] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.notificationPreferences),
                    AsyncStorage.getItem(STORAGE_KEYS.prayerReminders),
                    Notifications.getPermissionsAsync(),
                ]);

                if (!mounted) return;

                setPermissionGranted(
                    permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
                );
                setPreferences(parseJson(prefsRaw, DEFAULT_PREFERENCES));
                setPrayerReminders(parseJson(remindersRaw, defaultPrayerReminders));

                // Boot-time reconciliation: clean up any orphan notifications
                // from previous app sessions that crashed or were force-killed.
                await reconcileNotifications();
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, []);

    const ensurePermissions = useCallback(async () => {
        const granted = await ensureNotificationPermissions();
        setPermissionGranted(granted);
        return granted;
    }, []);

    const updatePreferences = useCallback(async (next: NotificationPreferences) => {
        setPreferences(next);
        await AsyncStorage.setItem(STORAGE_KEYS.notificationPreferences, JSON.stringify(next));
    }, []);

    const setNotificationPreference = useCallback(
        async (key: keyof NotificationPreferences, value: boolean) => {
            if (value) {
                const granted = await ensurePermissions();
                if (!granted) return false;
            }

            const next = { ...preferences, [key]: value };
            await updatePreferences(next);
            return true;
        },
        [ensurePermissions, preferences, updatePreferences]
    );

    const persistPrayerReminders = useCallback(async (next: PrayerReminderSettings) => {
        setPrayerReminders(next);
        prayerRemindersRef.current = next; // ← sync ref immediately
        await AsyncStorage.setItem(STORAGE_KEYS.prayerReminders, JSON.stringify(next));
    }, []);

    const togglePrayerReminder = useCallback(async (key: PrayerReminderKey, enabled: boolean) => {
        if (enabled) {
            const granted = await ensurePermissions();
            if (!granted) return false;
        }

        const current = prayerRemindersRef.current[key]; // ← always fresh via ref

        if (!enabled) {
            await cancelReminder(current.identifier);
            const next = {
                ...prayerRemindersRef.current,
                [key]: {
                    ...current,
                    enabled: false,
                    identifier: undefined,
                },
            };
            await persistPrayerReminders(next);
            return true;
        }

        // Cancel any existing before scheduling (deterministic ID handles this too,
        // but explicit cancel is defense-in-depth)
        await cancelReminder(current.identifier);
        const identifier = await scheduleDailyPrayerReminder(key, current.hour, current.minute);
        const next = {
            ...prayerRemindersRef.current,
            [key]: {
                ...current,
                enabled: true,
                identifier,
            },
        };
        await persistPrayerReminders(next);
        return true;
    }, [ensurePermissions, persistPrayerReminders]); // ← NO prayerReminders dep!

    const setPrayerReminderTime = useCallback(async (key: PrayerReminderKey, hour: number, minute: number) => {
        const normalizedHour = Math.min(23, Math.max(0, hour));
        const normalizedMinute = Math.min(59, Math.max(0, minute));
        const current = prayerRemindersRef.current[key]; // ← always fresh via ref

        let identifier = current.identifier;

        if (current.enabled) {
            await cancelReminder(current.identifier);
            identifier = await scheduleDailyPrayerReminder(key, normalizedHour, normalizedMinute);
        }

        const next = {
            ...prayerRemindersRef.current,
            [key]: {
                ...current,
                hour: normalizedHour,
                minute: normalizedMinute,
                identifier,
            },
        };

        await persistPrayerReminders(next);
        return true;
    }, [persistPrayerReminders]); // ← NO prayerReminders dep!

    const remindersWithLabel = useMemo(() => {
        return {
            morning: {
                ...prayerReminders.morning,
                label: formatReminderTime(prayerReminders.morning.hour, prayerReminders.morning.minute),
                machineLabel: `${toTwoDigits(prayerReminders.morning.hour)}:${toTwoDigits(prayerReminders.morning.minute)}`,
            },
            afternoon: {
                ...prayerReminders.afternoon,
                label: formatReminderTime(prayerReminders.afternoon.hour, prayerReminders.afternoon.minute),
                machineLabel: `${toTwoDigits(prayerReminders.afternoon.hour)}:${toTwoDigits(prayerReminders.afternoon.minute)}`,
            },
            evening: {
                ...prayerReminders.evening,
                label: formatReminderTime(prayerReminders.evening.hour, prayerReminders.evening.minute),
                machineLabel: `${toTwoDigits(prayerReminders.evening.hour)}:${toTwoDigits(prayerReminders.evening.minute)}`,
            },
        };
    }, [prayerReminders]);

    return {
        isLoading,
        permissionGranted,
        preferences,
        prayerReminders: remindersWithLabel,
        ensurePermissions,
        setNotificationPreference,
        togglePrayerReminder,
        setPrayerReminderTime,
    };
};

