import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';
import {
    NextLiturgicalEvent,
    LiturgicalEventType,
} from '../liturgyEvents';
import {
    ensureNotificationPermissions,
    setupNotificationChannel,
} from './notificationService';
import * as Notifications from 'expo-notifications';

type ReminderRecord = {
    eventId: string;
    notificationId: string;
    scheduled: boolean;
    eventDate: string;
    title: string;
    type: LiturgicalEventType;
};

type ReminderMap = Record<string, ReminderRecord>;

const parseReminderMap = (raw: string | null): ReminderMap => {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as ReminderMap;
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

const getReminderStore = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.liturgyEventReminders);
    return parseReminderMap(raw);
};

const saveReminderStore = async (map: ReminderMap) => {
    await AsyncStorage.setItem(STORAGE_KEYS.liturgyEventReminders, JSON.stringify(map));
};

const toTriggerDate = (eventDate: string, hour = 6, minute = 0) => {
    const [y, m, d] = eventDate.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1, hour, minute, 0, 0);
};

export const getEventReminderState = async (eventId: string) => {
    const map = await getReminderStore();
    return map[eventId]?.scheduled ?? false;
};

export const toggleLiturgyEventReminder = async (
    event: NextLiturgicalEvent
): Promise<{ scheduled: boolean; reason?: string }> => {
    const map = await getReminderStore();
    const existing = map[event.id];

    if (existing?.scheduled) {
        try {
            await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
        } catch {
            // best effort cancel
        }

        delete map[event.id];
        await saveReminderStore(map);
        return { scheduled: false };
    }

    const hasPermission = await ensureNotificationPermissions();
    if (!hasPermission) {
        return { scheduled: false, reason: 'Notifications permission was not granted.' };
    }

    await setupNotificationChannel();

    const triggerDate = toTriggerDate(event.date, 6, 0);
    if (triggerDate.getTime() <= Date.now()) {
        return { scheduled: false, reason: 'Cannot schedule reminders for past liturgies.' };
    }

    // duplicate guard by eventId in persisted map
    if (map[event.id]?.scheduled) {
        return { scheduled: true };
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: event.title,
            body: "Today's liturgy is ready",
            sound: 'default',
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
            channelId: 'prayer-reminders',
        },
    });

    map[event.id] = {
        eventId: event.id,
        notificationId,
        scheduled: true,
        eventDate: event.date,
        title: event.title,
        type: event.type,
    };

    await saveReminderStore(map);
    return { scheduled: true };
};
