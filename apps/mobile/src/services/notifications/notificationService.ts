import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        vibrationPattern: [0, 120, 120],
        lightColor: '#4A7C59',
    });
};

export const cancelReminder = async (identifier?: string) => {
    if (!identifier) return;
    try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch {
        // no-op
    }
};

export const scheduleDailyPrayerReminder = async (
    key: PrayerReminderKey,
    hour: number,
    minute: number
) => {
    await setupNotificationChannel();

    return Notifications.scheduleNotificationAsync({
        content: {
            title: 'Time to pray ??',
            body: DEFAULT_BODY[key],
            sound: 'default',
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            channelId: Platform.OS === 'android' ? 'prayer-reminders' : undefined,
        },
    });
};
