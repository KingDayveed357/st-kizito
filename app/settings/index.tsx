import React, { useMemo } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/hooks/useTheme';
import { useThemeStore, LineSpacing, ThemeMode } from '../../src/store/useThemeStore';
import { PreferenceThemeCard } from '../../src/components/more/PreferenceThemeCard';
import { useNotifications } from '../../src/hooks/useNotifications';

const APPEARANCE_OPTIONS: Array<{
    key: ThemeMode;
    label: string;
    preview: {
        background: string;
        card: string;
        lines: string;
        accent: string;
    };
}> = [
    {
        key: 'light',
        label: 'Light',
        preview: { background: '#FFFFFF', card: '#F1EEE7', lines: '#D6D0C4', accent: '#2F6A46' },
    },
    {
        key: 'dark',
        label: 'Dark',
        preview: { background: '#101216', card: '#1B1F28', lines: '#4A4F5D', accent: '#19B187' },
    },
    {
        key: 'sepia',
        label: 'Sepia',
        preview: { background: '#F4E7CC', card: '#E7D9B9', lines: '#C7B38B', accent: '#9A7A43' },
    },
    {
        key: 'high-contrast',
        label: 'High Contrast',
        preview: { background: '#000000', card: '#0F0F0F', lines: '#FFFFFF', accent: '#FFD21F' },
    },
];

const LINE_SPACING_OPTIONS: LineSpacing[] = ['compact', 'standard', 'relaxed'];
const TEXT_SCALE_STEPS = [0.9, 1, 1.1, 1.2, 1.3];

export default function SettingsScreen() {
    const { colors, mode, textScale, lineSpacing, lineHeightScale } = useTheme();
    const router = useRouter();
    const { setMode, setTextScale, setLineSpacing } = useThemeStore();
    const { preferences, setNotificationPreference } = useNotifications();

    const activeTextScaleLabel = useMemo(() => {
        if (textScale <= 0.95) return 'Small';
        if (textScale <= 1.05) return 'Medium';
        if (textScale <= 1.15) return 'Large';
        return 'Extra Large';
    }, [textScale]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="Settings" />

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 56 }} showsVerticalScrollIndicator={false}>
                <Text style={{ color: colors.accent }} className="font-sans text-[11px] font-bold uppercase tracking-[2px]">
                    Visual Identity
                </Text>
                <Text style={{ color: colors.textPrimary }} className="font-serif text-[30px] font-bold mt-3">
                    Appearance
                </Text>

                <View className="flex-row flex-wrap justify-between mt-6">
                    {APPEARANCE_OPTIONS.map((option) => (
                        <PreferenceThemeCard
                            key={option.key}
                            modeValue={option.key}
                            label={option.label}
                            active={mode === option.key}
                            preview={option.preview}
                            onPress={() => setMode(option.key)}
                        />
                    ))}
                </View>

                <Text style={{ color: colors.accent, marginTop: 20 }} className="font-sans text-[11px] font-bold uppercase tracking-[2px] mt-6">
                    Typography
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 18 }} className="font-serif text-[30px] font-bold mt-3">
                    Reading Preferences
                </Text>

                <View
                    style={{
                        marginTop: 18,
                        borderRadius: 28,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 18,
                    }}
                >
                    <View className="flex-row items-center justify-between">
                        <Text style={{ color: colors.textPrimary }} className="font-sans text-[15px] font-semibold">
                            Text Size
                        </Text>
                        <View
                            style={{
                                backgroundColor: colors.surfaceElevated,
                                borderRadius: 999,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                            }}
                        >
                            <Text style={{ color: colors.textSecondary }} className="font-sans text-[12px] font-medium">
                                {activeTextScaleLabel} ({Math.round(textScale * 16)}px)
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between mt-4">
                        <Text style={{ color: colors.textPrimary }} className="font-sans text-[15px]">
                            A
                        </Text>
                        <View className="flex-row items-center justify-between" style={{ flex: 1, marginHorizontal: 16 }}>
                            {TEXT_SCALE_STEPS.map((step) => {
                                const active = textScale === step;
                                return (
                                    <TouchableOpacity
                                        key={step}
                                        activeOpacity={0.9}
                                        onPress={() => setTextScale(step)}
                                        style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: 9,
                                            backgroundColor: active ? colors.accent : colors.surfaceElevated,
                                            borderWidth: active ? 0 : 1,
                                            borderColor: colors.border,
                                        }}
                                    />
                                );
                            })}
                        </View>
                        <Text style={{ color: colors.textPrimary, fontSize: 20 }} className="font-sans">
                            A
                        </Text>
                    </View>

                    <Text style={{ color: colors.textPrimary }} className="font-sans text-[15px] font-semibold mt-8">
                        Line Spacing
                    </Text>
                    <View className="flex-row mt-4" style={{ gap: 10 }}>
                        {LINE_SPACING_OPTIONS.map((option) => {
                            const active = option === lineSpacing;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    activeOpacity={0.88}
                                    onPress={() => setLineSpacing(option)}
                                    style={{
                                        flex: 1,
                                        minHeight: 44,
                                        borderRadius: 14,
                                        backgroundColor: active ? colors.accent : colors.surfaceElevated,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={{ color: active ? '#FFFFFF' : colors.textPrimary }} className="font-sans text-[13px] font-semibold capitalize">
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View
                        style={{
                            marginTop: 18,
                            borderRadius: 18,
                            backgroundColor: colors.background,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: 16,
                        }}
                    >
                        <Text
                            style={{
                                color: colors.textPrimary,
                                fontSize: 16 * textScale,
                                lineHeight: 26 * textScale * lineHeightScale,
                            }}
                            className="font-serif"
                        >
                            Reading comfort changes are saved automatically and applied throughout the app.
                        </Text>
                    </View>
                </View>

                <Text style={{ color: colors.accent, marginTop: 20 }} className="font-sans text-[11px] font-bold uppercase tracking-[2px]">
                    Alerts
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 18 }} className="font-serif text-[30px] font-bold mt-3">
                    Notifications
                </Text>

                <View
                    style={{
                        marginTop: 18,
                        borderRadius: 28,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 18,
                        gap: 16,
                    }}
                >
                    <View className="flex-row items-center justify-between">
                        <View style={{ flex: 1, paddingRight: 16 }}>
                            <Text style={{ color: colors.textPrimary }} className="font-sans text-[15px] font-semibold">
                                Mass Updates
                            </Text>
                            <Text style={{ color: colors.textSecondary }} className="font-sans text-[13px] leading-[20px] mt-1">
                                Changes to liturgy times or special Mass notices.
                            </Text>
                        </View>
                        <Switch
                            value={preferences.massUpdates}
                            onValueChange={(value) => {
                                setNotificationPreference('massUpdates', value);
                            }}
                            trackColor={{ true: colors.accentSoft, false: '#D5CBB9' }}
                            thumbColor={preferences.massUpdates ? colors.accent : '#FFFFFF'}
                        />
                    </View>

                    <View className="flex-row items-center justify-between">
                        <View style={{ flex: 1, paddingRight: 16 }}>
                            <Text style={{ color: colors.textPrimary }} className="font-sans text-[15px] font-semibold">
                                Parish Announcements
                            </Text>
                            <Text style={{ color: colors.textSecondary }} className="font-sans text-[13px] leading-[20px] mt-1">
                                Events, bulletins, and community updates.
                            </Text>
                        </View>
                        <Switch
                            value={preferences.parishAnnouncements}
                            onValueChange={(value) => {
                                setNotificationPreference('parishAnnouncements', value);
                            }}
                            trackColor={{ true: colors.accentSoft, false: '#D5CBB9' }}
                            thumbColor={preferences.parishAnnouncements ? colors.accent : '#FFFFFF'}
                        />
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.86}
                        onPress={() => router.push('/settings/reminder')}
                        style={{
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.surfaceElevated,
                            paddingHorizontal: 14,
                            paddingVertical: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={{ color: colors.textPrimary }} className="font-sans text-[14px] font-semibold">
                                Prayer Reminders
                            </Text>
                            <Text style={{ color: colors.textSecondary }} className="font-sans text-[12px] mt-1">
                                Set morning, afternoon, and evening reminders.
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                <Text style={{ color: colors.accent, marginTop: 20 }} className="font-sans text-[11px] font-bold uppercase tracking-[2px]">
                    Information
                </Text>
                <Text style={{ color: colors.textPrimary, fontSize: 18 }} className="font-serif text-[30px] font-bold mt-3">
                    About
                </Text>

                <View
                    style={{
                        marginTop: 18,
                        borderRadius: 28,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        overflow: 'hidden',
                    }}
                >
                    {[
                        { icon: 'library-outline', label: 'Parish History' },
                        { icon: 'star-outline', label: 'Rate the App' },
                        { icon: 'share-social-outline', label: 'Share with Friends' },
                    ].map((item, index, array) => (
                        <View
                            key={item.label}
                            style={{
                                flexDirection: 'row',
                                gap: 12,
                                alignItems: 'center',
                                paddingHorizontal: 18,
                                paddingVertical: 18,
                                borderBottomWidth: index === array.length - 1 ? 0 : 1,
                                borderBottomColor: colors.border,
                            }}
                        >
                            <Ionicons name={item.icon as never} size={20} color={colors.textPrimary} />
                            <Text style={{ color: colors.textPrimary }} className="font-sans text-[15px] ml-3 flex-1">
                                {item.label}
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </View>
                    ))}
                </View>

                <View style={{ marginTop: 32, alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600' }}>
                        St. Kizito Parish App . Version 1.0.0
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                        Built for the community of faith
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
