import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';
import { ensureNotificationPermissions, setupNotificationChannel, cancelReminder } from './notificationService';
import { warn } from '../../utils/logger';

/**
 * Reminders for the devotions prayed at a fixed hour: the Angelus, the Chaplet of Divine Mercy,
 * and the Rosary.
 *
 * Kept separate from the three generic morning/afternoon/evening reminders in
 * `notificationService`, because these are different in kind: their hours are not the user's
 * preference but the Church's custom (the Angelus at noon and six; the Chaplet at three, the hour
 * of the Lord's death). The times are still editable — a parishioner who works nights should be
 * able to move them — but they default to the traditional hours rather than to nothing.
 *
 * Built on the same primitives as the existing reminders rather than a second scheduling system:
 * deterministic identifiers so re-scheduling replaces instead of duplicating, the same Android
 * channel, and the same permission handling.
 */

export type DevotionKey = 'angelus_midday' | 'angelus_evening' | 'divine_mercy' | 'rosary';

export interface DevotionReminder {
    enabled: boolean;
    hour: number;
    minute: number;
}

export type DevotionReminderSettings = Record<DevotionKey, DevotionReminder>;

interface DevotionMeta {
    title: string;
    body: string;
    /** Shown in settings so the traditional hour is explained rather than merely imposed. */
    note: string;
}

export const DEVOTION_META: Record<DevotionKey, DevotionMeta> = {
    angelus_midday: {
        title: 'The Angelus',
        body: 'The Angel of the Lord declared unto Mary.',
        note: 'Traditionally prayed at noon.',
    },
    angelus_evening: {
        title: 'The Angelus',
        body: 'The Angel of the Lord declared unto Mary.',
        note: 'Traditionally prayed at six in the evening.',
    },
    divine_mercy: {
        title: 'The Hour of Mercy',
        body: 'For the sake of his sorrowful Passion, have mercy on us and on the whole world.',
        note: 'Three o’clock, the hour of the Lord’s death.',
    },
    rosary: {
        title: 'The Holy Rosary',
        body: 'A quiet moment with Our Lady.',
        note: 'Choose the hour that suits your household.',
    },
};

export const DEVOTION_KEYS: DevotionKey[] = [
    'angelus_midday',
    'angelus_evening',
    'divine_mercy',
    'rosary',
];

export const defaultDevotionReminders: DevotionReminderSettings = {
    // Off by default: a notification nobody asked for is the fastest way to lose permission
    // altogether, and on iOS the user rarely grants it twice.
    angelus_midday: { enabled: false, hour: 12, minute: 0 },
    angelus_evening: { enabled: false, hour: 18, minute: 0 },
    divine_mercy: { enabled: false, hour: 15, minute: 0 },
    rosary: { enabled: false, hour: 20, minute: 0 },
};

/** Fixed per key: scheduling the same devotion twice replaces it rather than duplicating. */
export const devotionIdentifier = (key: DevotionKey) => `devotion-reminder-${key}`;

export const DEVOTION_IDENTIFIERS = DEVOTION_KEYS.map(devotionIdentifier);

const isValidTime = (hour: number, minute: number) =>
    Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;

export const loadDevotionReminders = async (): Promise<DevotionReminderSettings> => {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.devotionReminders);
        if (!raw) return defaultDevotionReminders;

        const stored = JSON.parse(raw) as Partial<DevotionReminderSettings>;
        // Merged over the defaults so a devotion added in a later release appears with sane values
        // instead of `undefined` reaching the scheduler.
        return DEVOTION_KEYS.reduce((acc, key) => {
            const value = stored[key];
            acc[key] =
                value && isValidTime(value.hour, value.minute)
                    ? { enabled: !!value.enabled, hour: value.hour, minute: value.minute }
                    : defaultDevotionReminders[key];
            return acc;
        }, {} as DevotionReminderSettings);
    } catch {
        return defaultDevotionReminders;
    }
};

const persist = async (settings: DevotionReminderSettings) => {
    await AsyncStorage.setItem(STORAGE_KEYS.devotionReminders, JSON.stringify(settings));
};

export const scheduleDevotion = async (key: DevotionKey, hour: number, minute: number): Promise<void> => {
    await setupNotificationChannel();
    const identifier = devotionIdentifier(key);

    // Always cancel first, even on a first schedule: the system may still hold one from a previous
    // install of the same build.
    await cancelReminder(identifier);

    const meta = DEVOTION_META[key];
    await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
            title: meta.title,
            body: meta.body,
            sound: Platform.OS === 'ios' ? 'notification.wav' : 'notification',
            data: { devotion: key },
        },
        trigger: {
            // DAILY triggers fire at the device's local time, so a parishioner who travels keeps
            // praying the Angelus at noon where they are.
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: Platform.OS === 'android' ? 'prayer-reminders' : undefined,
        },
    });
};

export interface ToggleResult {
    settings: DevotionReminderSettings;
    /** Set when the toggle could not be honoured — currently only a permission refusal. */
    reason?: string;
}

/**
 * Turn a devotion reminder on or off.
 *
 * Permission is requested only when switching one ON, and a refusal is reported rather than
 * swallowed: a switch that silently springs back tells the user nothing about why.
 */
export const setDevotionEnabled = async (
    key: DevotionKey,
    enabled: boolean,
): Promise<ToggleResult> => {
    const settings = await loadDevotionReminders();

    if (enabled) {
        const granted = await ensureNotificationPermissions();
        if (!granted) {
            return {
                settings,
                reason:
                    'Notifications are turned off for this app. Enable them in your device settings to receive prayer reminders.',
            };
        }
    }

    const next: DevotionReminderSettings = {
        ...settings,
        [key]: { ...settings[key], enabled },
    };

    try {
        if (enabled) {
            await scheduleDevotion(key, next[key].hour, next[key].minute);
        } else {
            await cancelReminder(devotionIdentifier(key));
        }
    } catch (error) {
        warn('devotions', `could not ${enabled ? 'schedule' : 'cancel'} ${key}`, error);
        return { settings, reason: 'That reminder could not be changed. Please try again.' };
    }

    await persist(next);
    return { settings: next };
};

/** Change the hour of a devotion, re-scheduling it if it is currently enabled. */
export const setDevotionTime = async (
    key: DevotionKey,
    hour: number,
    minute: number,
): Promise<DevotionReminderSettings> => {
    if (!isValidTime(hour, minute)) return loadDevotionReminders();

    const settings = await loadDevotionReminders();
    const next: DevotionReminderSettings = { ...settings, [key]: { ...settings[key], hour, minute } };

    if (next[key].enabled) {
        try {
            await scheduleDevotion(key, hour, minute);
        } catch (error) {
            warn('devotions', `could not re-schedule ${key}`, error);
        }
    }

    await persist(next);
    return next;
};

/**
 * Re-schedule the enabled devotions.
 *
 * Called from the boot-time reconciliation. Android drops scheduled notifications on reboot and on
 * some app updates, so re-asserting them at launch is what keeps a reminder the user set months ago
 * still firing.
 */
export const reconcileDevotionReminders = async (): Promise<void> => {
    try {
        const settings = await loadDevotionReminders();
        for (const key of DEVOTION_KEYS) {
            const reminder = settings[key];
            if (reminder?.enabled) {
                await scheduleDevotion(key, reminder.hour, reminder.minute);
            } else {
                await cancelReminder(devotionIdentifier(key));
            }
        }
    } catch (error) {
        warn('devotions', 'reconciliation failed', error);
    }
};
