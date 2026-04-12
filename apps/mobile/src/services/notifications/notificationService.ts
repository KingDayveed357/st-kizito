import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';

export type PrayerReminderKey = 'morning' | 'afternoon' | 'evening';

export interface PrayerReminderConfig {
    enabled: boolean;
    hour: number;
    minute: number;
    identifier?: string;
}

export type PrayerReminderSettings = Record<PrayerReminderKey, PrayerReminderConfig>;

const DEFAULT_BODY: Record<PrayerReminderKey, string> = {
    morning: 'Take a quiet moment with God this morning.',
    afternoon: 'Pause for prayer and receive peace.',
    evening: 'Close your day in prayerful gratitude.',
};

export const defaultPrayerReminders: PrayerReminderSettings = {
    morning: { enabled: false, hour: 6, minute: 30 },
    afternoon: { enabled: false, hour: 12, minute: 0 },
    evening: { enabled: false, hour: 20, minute: 0 },
};

// ── Deterministic Identifier ──────────────────────────────────────────────
// Every prayer reminder uses a FIXED identifier. Scheduling the same key
// twice will REPLACE the previous notification, not duplicate it.
const getDeterministicId = (key: PrayerReminderKey) => `prayer-reminder-${key}`;

const VALID_IDENTIFIERS = new Set(
    (['morning', 'afternoon', 'evening'] as PrayerReminderKey[]).map(getDeterministicId)
);

let isHandlerConfigured = false;

export const configureNotificationHandler = () => {
    if (isHandlerConfigured) return;

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });

    isHandlerConfigured = true;
};

export const ensureNotificationPermissions = async () => {
    configureNotificationHandler();

    const permissions = await Notifications.getPermissionsAsync();
    if (permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
        return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted || requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
};

export const setupNotificationChannel = async () => {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('prayer-reminders', {
        name: 'Prayer Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'notification',
        vibrationPattern: [0, 120, 120],
        lightColor: '#4A7C59',
    });
};

export const cancelReminder = async (identifier?: string) => {
    if (!identifier) return;
    try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch {
        // no-op — identifier may have already been removed by the system
    }
};

/**
 * Schedule a daily prayer reminder with a DETERMINISTIC identifier.
 * Calling this multiple times for the same key is safe — it always
 * cancels the previous notification first.
 */
export const scheduleDailyPrayerReminder = async (
    key: PrayerReminderKey,
    hour: number,
    minute: number
): Promise<string> => {
    await setupNotificationChannel();

    const identifier = getDeterministicId(key);

    // Always cancel first to prevent duplicates, even if this is the "first" schedule.
    await cancelReminder(identifier);

    await Notifications.scheduleNotificationAsync({
        identifier, // ← DETERMINISTIC: replaces instead of creating new
        content: {
            title: 'Time to pray 🙏',
            body: DEFAULT_BODY[key],
            sound: Platform.OS === 'ios' ? 'notification.wav' : 'notification',
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: Platform.OS === 'android' ? 'prayer-reminders' : undefined,
        },
    });

    return identifier;
};

/**
 * Boot-time reconciliation: clears ALL orphan notifications and re-schedules
 * only the reminders that the user has explicitly enabled.
 * 
 * Call this ONCE on app startup (e.g., in _layout.tsx useEffect).
 */
export const reconcileNotifications = async (): Promise<void> => {
    try {
        // 1. Read the user's persisted settings
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.prayerReminders);
        const reminders: PrayerReminderSettings = raw
            ? JSON.parse(raw)
            : defaultPrayerReminders;

        // 2. Cancel ALL scheduled notifications to start clean
        await Notifications.cancelAllScheduledNotificationsAsync();

        // 3. Re-schedule only the enabled ones with deterministic IDs
        const keys: PrayerReminderKey[] = ['morning', 'afternoon', 'evening'];
        for (const key of keys) {
            const r = reminders[key];
            if (r?.enabled) {
                await scheduleDailyPrayerReminder(key, r.hour, r.minute);
            }
        }
    } catch {
        // Reconciliation is best-effort; don't crash the app boot
    }
};

/**
 * Debug helper: returns the count of currently scheduled notifications.
 * Use this in development to verify deduplication.
 */
export const getScheduledNotificationCount = async (): Promise<number> => {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.length;
};
