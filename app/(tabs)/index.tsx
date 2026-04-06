import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { LiturgicalBadge } from '../../src/components/liturgical/LiturgicalBadge';
import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import { ScriptureQuote } from '../../src/components/liturgical/ScriptureQuote';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import { getCalendar, getDatePresentation, getReadings, getTodayIso } from '../../src/services/liturgicalData';
import { useAnnouncements } from '../../src/hooks/useAnnouncements';
import { useEvents } from '../../src/hooks/useEvents';

export default function HomeScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const { selectedDate, setSource } = useAppStore();

    const effectiveDate = getCalendar(selectedDate) ? selectedDate : getTodayIso();
    const presentation = getDatePresentation(effectiveDate);
    const readings = getReadings(effectiveDate);

    const { data: announcements, isLoading: loadingAnnouncements } = useAnnouncements();
    const { data: events, isLoading: loadingEvents } = useEvents();
    const latestAnnouncement = announcements[0];
    const upcomingEvent = events[0];

    const firstReadingBlock = readings?.readings.find(
        (r) => r.type === 'first_reading' || r.type === 'reading' || r.type === 'vigil_reading'
    );
    const gospelBlock = readings?.readings.find((r) => r.type === 'gospel');

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                centerElement={
                    <View className="items-center">
                        <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-serif font-bold text-center text-lg leading-snug mx-4">
                            {readings?.feastName ?? 'Daily Readings'}
                        </Text>
                        <Text style={{ color: colors.textSecondary }} className="font-sans font-bold text-[10px] uppercase tracking-widest mt-2">
                            {presentation?.shortMeta ?? effectiveDate}
                        </Text>
                    </View>
                }

            />

            <ScrollView className="flex-1 px-screen pt-4" showsVerticalScrollIndicator={false}>
                <Card accentColor={allColors.liturgical.ordinaryTime} className="mb-8" elevated>
                    <View className="flex-row justify-between items-start mb-4">
                        <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-sans font-bold text-[10px] tracking-widest uppercase">
                            FIRST READING
                        </Text>
                        <LiturgicalBadge
                            label={
                                readings?.liturgicalSeason === 'lent'
                                    ? 'Lent'
                                    : readings?.liturgicalSeason === 'easter'
                                      ? 'Easter'
                                      : 'Ordinary Time'
                            }
                            color="green"
                        />
                    </View>

                    <Text style={{ color: colors.textPrimary }} className="font-serif italic font-bold text-[22px] leading-[28px] mb-4">
                        "{firstReadingBlock?.text?.slice(0, 92) ?? 'Daily reading unavailable.'}"
                    </Text>

                    <Text style={{ color: colors.textSecondary }} className="font-sans text-[14px] leading-[20px] mb-6">
                        {firstReadingBlock?.reference ?? 'Reference unavailable'}
                    </Text>

                    <Button
                        onPress={() => {
                            setSource('readings');
                            router.push('/readings');
                        }}
                        rightIcon={<Ionicons name="arrow-forward" size={16} color="#FFFFFF" />}
                        size="md"
                        className="w-full"
                    >
                        Read Now
                    </Button>
                </Card>

                <Text style={{ color: colors.textPrimary }} className="font-sans font-bold text-[10px] tracking-widest uppercase mb-4">
                    LITURGICAL ACTIONS
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 flex-row pr-screen">
                    <Chip
                        label="Divine Office"
                        onPress={() => {
                            setSource('divineOffice');
                            router.push('/divine-office');
                        }}
                    />
                    <Chip label="Mass Time" onPress={() => router.push('/parish')} />
                    <Chip label="Mass Intentions" onPress={() => {}} />
                </ScrollView>

                <ScriptureQuote
                    text={gospelBlock?.text?.slice(0, 120) ?? 'Daily Gospel unavailable.'}
                    reference={gospelBlock?.reference?.toUpperCase() ?? 'GOSPEL'}
                />

                <Text style={{ color: colors.textPrimary }} className="font-sans font-bold text-[10px] tracking-widest uppercase mt-4 mb-4">
                    PARISH PULSE
                </Text>

                <View
                    style={{
                        backgroundColor: colors.surface,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 16,
                        marginBottom: 12,
                    }}
                >
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <View
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: `${allColors.liturgical.ordinaryTime}18`,
                                }}
                            >
                                <Ionicons name="megaphone-outline" size={18} color={allColors.liturgical.ordinaryTime} />
                            </View>
                            <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-sans font-bold text-[10px] tracking-widest uppercase ml-3">
                                Latest Announcement
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/parish/announcements')}>
                            <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-sans font-semibold text-[12px]">
                                View
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {loadingAnnouncements ? (
                        <Text style={{ color: colors.textSecondary }} className="font-sans text-[13px]">Loading announcements...</Text>
                    ) : latestAnnouncement ? (
                        <>
                            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-[18px] leading-[24px] mb-2">
                                {latestAnnouncement.title}
                            </Text>
                            <Text style={{ color: colors.textSecondary }} className="font-sans text-[13px] leading-[19px] mb-3">
                                {latestAnnouncement.excerpt}
                            </Text>
                            <Text style={{ color: colors.textMuted }} className="font-sans font-bold text-[10px] tracking-widest uppercase">
                                {latestAnnouncement.date} • PARISH OFFICE
                            </Text>
                        </>
                    ) : (
                        <Text style={{ color: colors.textSecondary }} className="font-sans text-[13px]">No announcements published yet.</Text>
                    )}
                </View>

                <View
                    style={{
                        backgroundColor: colors.surface,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 16,
                        marginBottom: 8,
                    }}
                >
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <View
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: `${allColors.liturgical.adventLent}18`,
                                }}
                            >
                                <Ionicons name="calendar-outline" size={18} color={allColors.liturgical.adventLent} />
                            </View>
                            <Text style={{ color: allColors.liturgical.adventLent }} className="font-sans font-bold text-[10px] tracking-widest uppercase ml-3">
                                Upcoming Event
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/parish/events')}>
                            <Text style={{ color: allColors.liturgical.adventLent }} className="font-sans font-semibold text-[12px]">
                                View
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {loadingEvents ? (
                        <Text style={{ color: colors.textSecondary }} className="font-sans text-[13px]">Loading events...</Text>
                    ) : upcomingEvent ? (
                        <>
                            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-[18px] leading-[24px] mb-2">
                                {upcomingEvent.title}
                            </Text>
                            <Text style={{ color: colors.textSecondary }} className="font-sans text-[13px] leading-[19px] mb-3">
                                {upcomingEvent.description}
                            </Text>
                            <View className="flex-row items-center justify-between">
                                <Text style={{ color: colors.textMuted }} className="font-sans font-bold text-[10px] tracking-widest uppercase">
                                    {`${upcomingEvent.day} ${upcomingEvent.month}`}
                                </Text>
                                <Text style={{ color: colors.textSecondary }} className="font-sans text-[12px]">
                                    {upcomingEvent.location ?? 'Parish grounds'}
                                </Text>
                            </View>
                        </>
                    ) : (
                        <Text style={{ color: colors.textSecondary }} className="font-sans text-[13px]">No upcoming events right now.</Text>
                    )}
                </View>

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}

