import React, { useCallback, useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../ui/ToastProvider';
import {
    DEVOTION_KEYS,
    DEVOTION_META,
    defaultDevotionReminders,
    loadDevotionReminders,
    setDevotionEnabled,
    type DevotionKey,
    type DevotionReminderSettings,
} from '../../services/notifications/devotionReminders';

const formatTime = (hour: number, minute: number): string => {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
};

/**
 * Reminders for the devotions prayed at a customary hour.
 *
 * Presented separately from the morning/afternoon/evening reminders because these have a fixed
 * traditional time that is part of what the devotion *is* — the Chaplet at three o'clock is not an
 * arbitrary default. Each row therefore states the custom alongside the time.
 *
 * Optimistic switching with a rollback: the toggle moves immediately (a switch that lags feels
 * broken), and reverts with an explanation if permission is refused or scheduling fails.
 */
export const DevotionReminders: React.FC = () => {
    const { colors, allColors } = useTheme();
    const { showToast } = useToast();
    const [settings, setSettings] = useState<DevotionReminderSettings>(defaultDevotionReminders);
    const [pendingKey, setPendingKey] = useState<DevotionKey | null>(null);
    const accent = allColors.liturgical.ordinaryTime;

    useEffect(() => {
        let mounted = true;
        loadDevotionReminders().then((loaded) => {
            if (mounted) setSettings(loaded);
        });
        return () => {
            mounted = false;
        };
    }, []);

    const handleToggle = useCallback(
        async (key: DevotionKey, enabled: boolean) => {
            const previous = settings;
            setSettings((current) => ({ ...current, [key]: { ...current[key], enabled } }));
            setPendingKey(key);

            const result = await setDevotionEnabled(key, enabled);
            setPendingKey(null);

            if (result.reason) {
                // Put the switch back where it was — leaving it "on" would promise a reminder that
                // is never going to arrive.
                setSettings(previous);
                showToast(result.reason, 'error');
                return;
            }

            setSettings(result.settings);
            showToast(
                enabled
                    ? `${DEVOTION_META[key].title} reminder set for ${formatTime(result.settings[key].hour, result.settings[key].minute)}.`
                    : `${DEVOTION_META[key].title} reminder removed.`,
                enabled ? 'success' : 'info',
            );
        },
        [settings, showToast],
    );

    return (
        <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Ionicons name="time-outline" size={17} color={accent} />
                <Text style={{ color: colors.textPrimary, fontSize: 17, fontFamily: 'Georgia', fontWeight: '700' }}>
                    Devotions
                </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
                The prayers of the Church at their customary hours.
            </Text>

            {DEVOTION_KEYS.map((key) => {
                const reminder = settings[key];
                const meta = DEVOTION_META[key];

                return (
                    <View
                        key={key}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            borderRadius: 16,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: 16,
                            marginBottom: 10,
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
                                {meta.title}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 }}>
                                {formatTime(reminder.hour, reminder.minute)} · {meta.note}
                            </Text>
                        </View>

                        <Switch
                            accessibilityLabel={`${meta.title} reminder at ${formatTime(reminder.hour, reminder.minute)}`}
                            value={reminder.enabled}
                            disabled={pendingKey === key}
                            onValueChange={(next) => handleToggle(key, next)}
                            trackColor={{ false: colors.border, true: `${accent}88` }}
                            thumbColor={reminder.enabled ? accent : colors.surfaceElevated}
                        />
                    </View>
                );
            })}
        </View>
    );
};
