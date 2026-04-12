import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Switch, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/hooks/useTheme';
import { useNotifications } from '../../src/hooks/useNotifications';
import { PrayerReminderKey } from '../../src/services/notifications/notificationService';
import { Ionicons } from '@expo/vector-icons';

type ReminderEntry = {
    key: PrayerReminderKey;
    title: string;
    helper: string;
    icon: keyof typeof Ionicons.glyphMap;
};

const REMINDER_ENTRIES: ReminderEntry[] = [
    { key: 'morning', title: 'Morning', helper: 'Begin your day with prayer.', icon: 'sunny-outline' },
    { key: 'afternoon', title: 'Afternoon', helper: 'Pause and reconnect with God.', icon: 'sunny' },
    { key: 'evening', title: 'Evening', helper: 'Close your day in thanksgiving.', icon: 'moon-outline' },
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
        <View style={styles.stepperContainer}>
            <Text style={[styles.stepperLabel, { color: colors.textSecondary }]}>{label}</Text>
            <View style={styles.stepperControls}>
                <TouchableOpacity
                    onPress={() => onChange(value <= min ? max : value - 1)}
                    style={[styles.stepperButton, { backgroundColor: colors.surfaceElevated }]}
                >
                    <Ionicons name="remove" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: colors.textPrimary }]}>
                    {String(value).padStart(2, '0')}
                </Text>
                <TouchableOpacity
                    onPress={() => onChange(value >= max ? min : value + 1)}
                    style={[styles.stepperButton, { backgroundColor: colors.surfaceElevated }]}
                >
                    <Ionicons name="add" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function ReminderSettingsScreen() {
    const { colors, allColors } = useTheme();
    const { prayerReminders, togglePrayerReminder, setPrayerReminderTime } = useNotifications();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="Prayer Reminders" />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.introSection}>
                    <Text style={[styles.introText, { color: colors.textSecondary }]}>
                        Gentle reminders to keep your day rooted in prayer. The app will play a peaceful tone at your chosen times.
                    </Text>
                </View>

                {REMINDER_ENTRIES.map((entry) => {
                    const reminder = prayerReminders[entry.key];
                    const isEnabled = reminder.enabled;

                    return (
                        <View
                            key={entry.key}
                            style={[
                                styles.card,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: isEnabled ? colors.accent : colors.border,
                                    elevation: isEnabled ? 4 : 1,
                                    shadowOpacity: isEnabled ? 0.1 : 0.05,
                                }
                            ]}
                        >
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconContainer, { backgroundColor: isEnabled ? `${colors.accent}15` : colors.surfaceElevated }]}>
                                    <Ionicons
                                        name={entry.icon}
                                        size={24}
                                        color={isEnabled ? colors.accent : colors.textSecondary}
                                    />
                                </View>
                                <View style={styles.titleContainer}>
                                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]} className="font-serif">
                                        {entry.title}
                                    </Text>
                                    <Text style={[styles.cardHelper, { color: colors.textSecondary }]}>
                                        {entry.helper}
                                    </Text>
                                </View>
                                <Switch
                                    value={reminder.enabled}
                                    onValueChange={(value) => { togglePrayerReminder(entry.key, value); }}
                                    trackColor={{ true: colors.accentSoft, false: '#D5CBB9' }}
                                    thumbColor={reminder.enabled ? colors.accent : '#FFFFFF'}
                                />
                            </View>

                            {isEnabled && (
                                <View style={[styles.timePickerSection, { backgroundColor: colors.surfaceElevated }]}>
                                    <View style={styles.timeLabelContainer}>
                                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                                        <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                                            Reminder scheduled for {reminder.label}
                                        </Text>
                                    </View>
                                    <View style={styles.steppersWrapper}>
                                        <TimeStepper
                                            label="HOUR"
                                            value={reminder.hour}
                                            min={0}
                                            max={23}
                                            onChange={(val) => setPrayerReminderTime(entry.key, val, reminder.minute)}
                                        />
                                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                        <TimeStepper
                                            label="MINUTE"
                                            value={reminder.minute}
                                            min={0}
                                            max={59}
                                            onChange={(val) => setPrayerReminderTime(entry.key, reminder.hour, val)}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}

                <View style={[styles.infoFooter, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="musical-notes-outline" size={20} color={colors.accent} style={{ marginBottom: 8 }} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Custom notification tone is enabled. Rebuild the app if you updated the sound file.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 40,
    },
    introSection: {
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    introText: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
    },
    card: {
        borderRadius: 24,
        borderWidth: 1.5,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    titleContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    cardHelper: {
        fontSize: 13,
        marginTop: 2,
    },
    timePickerSection: {
        marginTop: 20,
        borderRadius: 16,
        padding: 16,
    },
    timeLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    timeLabel: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    steppersWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stepperContainer: {
        flex: 1,
        alignItems: 'center',
    },
    stepperLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 1,
    },
    stepperControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepperButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperValue: {
        fontSize: 18,
        fontWeight: '800',
        marginHorizontal: 12,
        minWidth: 28,
        textAlign: 'center',
    },
    divider: {
        width: 1,
        height: 30,
        marginHorizontal: 10,
    },
    infoFooter: {
        marginTop: 8,
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        opacity: 0.8,
    },
});

