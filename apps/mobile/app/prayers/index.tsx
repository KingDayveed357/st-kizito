import React, { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { useAppStore } from '../../src/store/useAppStore';
import { getCalendar, getTodayIso } from '../../src/services/liturgicalData';
import { PRAYER_CATEGORIES, PRAYERS, getPrayersByCategory } from '../../src/data/prayers';

/**
 * The prayer library.
 *
 * Organised by category rather than as one long alphabetical list — the brief's "easy to discover
 * rather than one giant list". A parishioner looking for the prayer for the dead should not have to
 * scroll past the Angelus to find it.
 */
export default function PrayersScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const { selectedDate } = useAppStore();
    const accent = allColors.liturgical.ordinaryTime;

    /**
     * Which Marian antiphon belongs to today.
     *
     * The Regina Caeli replaces the Angelus throughout Eastertide — a rule the app should apply
     * rather than leaving a parishioner to know it. The season comes from the same calendar engine
     * that drives readings and the Divine Office, so this cannot drift from the rest of the app.
     */
    const suggested = useMemo(() => {
        const effectiveDate = getCalendar(selectedDate) ? selectedDate : getTodayIso();
        const isEastertide = getCalendar(effectiveDate)?.season?.toLowerCase().includes('easter');
        const slug = isEastertide ? 'regina-caeli' : 'angelus';
        return {
            prayer: PRAYERS.find((p) => p.slug === slug)!,
            reason: isEastertide
                ? 'During Eastertide the Regina Caeli is prayed in place of the Angelus.'
                : 'Prayed at noon and at six in the evening.',
        };
    }, [selectedDate]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="Prayers" />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 20 }}>
                    The prayers of the Church, always available — with or without a connection.
                </Text>

                {/* Today's Marian antiphon */}
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`${suggested.prayer.title}. ${suggested.reason}`}
                    activeOpacity={0.88}
                    onPress={() => router.push(`/prayers/${suggested.prayer.slug}`)}
                    style={{
                        borderRadius: 22,
                        backgroundColor: `${accent}12`,
                        borderWidth: 1,
                        borderColor: `${accent}33`,
                        padding: 18,
                        marginBottom: 26,
                    }}
                >
                    <Text
                        style={{
                            color: accent,
                            fontSize: 10,
                            fontWeight: '700',
                            letterSpacing: 1.8,
                            textTransform: 'uppercase',
                            marginBottom: 8,
                        }}
                    >
                        Pray today
                    </Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 20, fontFamily: 'Georgia', fontWeight: '700' }}>
                        {suggested.prayer.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
                        {suggested.reason}
                    </Text>
                </TouchableOpacity>

                {PRAYER_CATEGORIES.map((category) => {
                    const prayers = getPrayersByCategory(category.id);
                    if (prayers.length === 0) return null;

                    return (
                        <View key={category.id} style={{ marginBottom: 26 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                <Ionicons name={category.icon as any} size={18} color={accent} />
                                <Text style={{ color: colors.textPrimary, fontSize: 17, fontFamily: 'Georgia', fontWeight: '700' }}>
                                    {category.title}
                                </Text>
                            </View>
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 12 }}>
                                {category.description}
                            </Text>

                            {prayers.map((prayer) => (
                                <TouchableOpacity
                                    key={prayer.slug}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${prayer.title}. ${prayer.context}`}
                                    activeOpacity={0.85}
                                    onPress={() => router.push(`/prayers/${prayer.slug}`)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 12,
                                        borderRadius: 16,
                                        backgroundColor: colors.surface,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        marginBottom: 10,
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
                                            {prayer.title}
                                        </Text>
                                        <Text
                                            style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 2 }}
                                            numberOfLines={2}
                                        >
                                            {prayer.context}
                                        </Text>
                                    </View>
                                    {prayer.reminderKey ? (
                                        <Ionicons name="alarm-outline" size={16} color={colors.textMuted} />
                                    ) : null}
                                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    );
                })}

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Open prayer reminder settings"
                    activeOpacity={0.85}
                    onPress={() => router.push('/settings/reminder')}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        minHeight: 48,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                    }}
                >
                    <Ionicons name="alarm-outline" size={17} color={accent} />
                    <Text style={{ color: accent, fontSize: 14, fontWeight: '700' }}>Set prayer reminders</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
