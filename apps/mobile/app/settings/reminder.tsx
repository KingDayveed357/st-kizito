import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/hooks/useTheme';
import { useNotifications } from '../../src/hooks/useNotifications';
import { PrayerReminderKey } from '../../src/services/notifications/notificationService';

type ReminderEntry = {
    key: PrayerReminderKey;
    title: string;
    helper: string;
};

const REMINDER_ENTRIES: ReminderEntry[] = [
    { key: 'morning', title: 'Morning', helper: 'Begin your day with prayer.' },
    { key: 'afternoon', title: 'Afternoon', helper: 'Pause and reconnect with God.' },
    { key: 'evening', title: 'Evening', helper: 'Close your day in thanksgiving.' },
];

interface TimeStepperProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
}

const TimeStepper: React.FC<TimeStepperProps> = ({ label, value, onChange, min, max }) => {
    const { colors } = useTheme();

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginRight: 10 }}>{label}</Text>
            <TouchableOpacity
                onPress={() => onChange(value <= min ? max : value - 1)}
                style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}
            >
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>-</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginHorizontal: 10, minWidth: 24, textAlign: 'center' }}>
                {String(value).padStart(2, '0')}
            </Text>
            <TouchableOpacity
                onPress={() => onChange(value >= max ? min : value + 1)}
                style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}
            >
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>+</Text>
            </TouchableOpacity>
        </View>
    );
};

export default function ReminderSettingsScreen() {
    const { colors } = useTheme();
    const { prayerReminders, togglePrayerReminder, setPrayerReminderTime } = useNotifications();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="Prayer Reminders" />

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 44 }} showsVerticalScrollIndicator={false}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
                    Gentle reminders to keep your day rooted in prayer.
                </Text>

                {REMINDER_ENTRIES.map((entry) => {
                    const reminder = prayerReminders[entry.key];

                    return (
                        <View
                            key={entry.key}
                            style={{
                                borderRadius: 20,
                                backgroundColor: colors.surface,
                                borderWidth: 1,
                                borderColor: colors.border,
                                padding: 16,
                                marginBottom: 14,
                            }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flex: 1, paddingRight: 10 }}>
                                    <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700' }} className="font-serif">
                                        {entry.title}
                                    </Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 3 }}>
                                        {entry.helper}
                                    </Text>
                                </View>

                                <Switch
                                    value={reminder.enabled}
                                    onValueChange={(value) => {
                                        togglePrayerReminder(entry.key, value);
                                    }}
                                    trackColor={{ true: colors.accentSoft, false: '#D5CBB9' }}
                                    thumbColor={reminder.enabled ? colors.accent : '#FFFFFF'}
                                />
                            </View>

                            <View
                                style={{
                                    marginTop: 12,
                                    borderRadius: 16,
                                    backgroundColor: colors.surfaceElevated,
                                    paddingHorizontal: 12,
                                    paddingVertical: 12,
                                }}
                            >
                                <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 10 }}>
                                    Reminder time: {reminder.label}
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <TimeStepper
                                        label="Hour"
                                        value={reminder.hour}
                                        min={0}
                                        max={23}
                                        onChange={(value) => {
                                            setPrayerReminderTime(entry.key, value, reminder.minute);
                                        }}
                                    />
                                    <TimeStepper
                                        label="Minute"
                                        value={reminder.minute}
                                        min={0}
                                        max={59}
                                        onChange={(value) => {
                                            setPrayerReminderTime(entry.key, reminder.hour, value);
                                        }}
                                    />
                                </View>
                            </View>
                        </View>
                    );
                })}

                <View
                    style={{
                        borderRadius: 16,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 14,
                        marginTop: 4,
                    }}
                >
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
                        Notification tone: Time to pray. Take a quiet moment with God.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
