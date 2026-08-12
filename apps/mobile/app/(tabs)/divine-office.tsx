import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useDivineOffice } from '../../src/hooks/useDivineOffice';
import { Header } from '../../src/components/ui/Header';
import { CalendarIconButton } from '../../src/components/ui/CalendarIconButton';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { getCalendar, getDailyInspiration, getDatePresentation, getDivineOfficePrayer, getTodayIso } from '../../src/services/liturgicalData';
import { useTabBarClearance } from '../../src/hooks/useTabBarClearance';
import { DivineOfficeSkeleton } from '../../src/components/liturgical/LiturgicalSkeletons';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function DivineOfficeScreen() {
    const { colors, allColors } = useTheme();
    const tabBarClearance = useTabBarClearance();
    const router = useRouter();
    const { selectedDate, setSource, setLiturgicalContext, setSelectedDate } = useAppStore();
    const effectiveDate = getCalendar(selectedDate) ? selectedDate : getTodayIso();
    const { data, isLoading } = useDivineOffice(effectiveDate);
    const presentation = getDatePresentation(effectiveDate);
    const morningPrayer = getDivineOfficePrayer(effectiveDate, 'morningPrayer');
    const inspiration = getDailyInspiration(effectiveDate);

    if (isLoading) return <DivineOfficeSkeleton />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                centerElement={
                    <View className="flex-row items-center">
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-xl">Divine Office</Text>
                    </View>
                }
                rightElement={
                    <CalendarIconButton
                        color={allColors.liturgical.ordinaryTime}
                        onPress={() => {
                            setSource('divineOffice');
                            router.push('/calendar');
                        }}
                    />
                }
            />

            <ScrollView className="flex-1 px-screen pt-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarClearance }}>
                <Text style={{ color: colors.textSecondary }} className="font-sans font-bold text-[10px] tracking-widest uppercase mb-1 ">
                    LITURGY OF THE HOURS
                </Text>
                <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-3xl mb-6">
                    {presentation?.formattedDate ?? 'Divine Office'}
                </Text>

                <View style={{ backgroundColor: colors.surfaceElevated }} className="rounded-2xl p-4 mb-6 relative flex-row items-center border border-gray-100 shadow-sm">
                    <View className="mr-4 w-12 h-12 rounded-full overflow-hidden items-center justify-center bg-[#cae5d6]">
                        <Ionicons name="partly-sunny" size={22} color={allColors.liturgical.ordinaryTime} />
                    </View>
                    <View className="flex-1">
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-lg mb-1">Morning Prayer</Text>
                        {/* Line-based truncation (was `slice(0, 120)`, which cut mid-word). */}
                        <Text
                            numberOfLines={3}
                            ellipsizeMode="tail"
                            style={{ color: colors.textSecondary }}
                            className="font-serif italic text-sm"
                        >
                            {morningPrayer?.parts?.reading?.text ?? '"O Lord, open my lips, and my mouth shall declare your praise."'}
                        </Text>
                    </View>
                </View>

                <View className="mb-6">
                    {/*
                      The hours come from the bundled Divine Office corpus, which is keyed by
                      liturgical position rather than by date — a key the calendar engine has not
                      covered yields nothing. This branch previously rendered an empty `View`, so
                      the screen showed its header and the Daily Manna card with a silent gap where
                      the seven hours belong, and no way to tell that anything was wrong.
                    */}
                    {!data || data.length === 0 ? (
                        <EmptyState
                            icon={<Ionicons name="book-outline" size={38} color={colors.textMuted} />}
                            title="The hours aren't available for this day"
                            subtitle="The Liturgy of the Hours could not be resolved for the date you have selected. Choose another date, or return to today."
                            actionLabel="Go to today"
                            onAction={() => {
                                setSelectedDate(getTodayIso());
                            }}
                        />
                    ) : null}

                    {data?.map((prayer: any) => {
                        const isCurrent = prayer.isCurrent;
                        return (
                            <TouchableOpacity
                                key={prayer.id}
                                onPress={() => router.push(`/divine-office/${prayer.key}`)}
                                className={`mb-4 flex-row items-center bg-white p-4 rounded-2xl shadow-sm border ${isCurrent ? 'border-green-600 border-l-[4px]' : 'border-gray-50'}`}
                                style={{
                                    backgroundColor: colors.surface,
                                    borderLeftColor: isCurrent ? allColors.liturgical.ordinaryTime : undefined,
                                    borderLeftWidth: isCurrent ? 4 : 1
                                }}
                            >
                                <View style={{ backgroundColor: colors.surfaceElevated, borderRadius: 10, padding: 8 }} className="w-10 h-10 items-center justify-center mr-4">
                                    <Ionicons name={prayer.icon} size={18} color={isCurrent ? allColors.liturgical.ordinaryTime : colors.textPrimary} />
                                </View>
                                <View className="flex-1">
                                    <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-base mb-1">{prayer.title}</Text>
                                    <View className="flex-row items-center">
                                        <Ionicons name="time" size={10} color={colors.textSecondary} className="mr-1" />
                                        <Text style={{ color: colors.textSecondary }} className="font-sans font-bold text-[9px] uppercase">{prayer.timeLength}</Text>
                                    </View>
                                </View>
                                {isCurrent && (
                                    <View style={{ backgroundColor: '#e2f2e7' }} className="px-2 py-1 rounded-full absolute right-4 top-4">
                                        <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-sans font-bold text-[8px] tracking-wider uppercase">CURRENT</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {/* Daily Manna */}
                <View style={{ backgroundColor: colors.background }} className="rounded-3xl border border-gray-100 overflow-hidden mb-8 shadow-sm">
                    <Image
                        // Bundled parish image — offline-first (was a remote Unsplash URL that broke
                        // the card with no network and added an external dependency). See audit NEW-3.
                        source={require('../../assets/st-kizito.jpg')}
                        className="w-full h-40"
                        contentFit="cover"
                        transition={200}
                    />
                    <View className="p-6 pb-8 bg-[#EFEEE8]">
                        <View style={{ backgroundColor: '#e2f2e7' }} className="self-start px-2 py-1 rounded-md mb-3">
                            <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-sans font-bold text-[9px] tracking-wider uppercase">DAILY MANNA</Text>
                        </View>
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-xl mb-2">Meditation of the Day</Text>
                        <Text
                            numberOfLines={4}
                            ellipsizeMode="tail"
                            style={{ color: colors.textSecondary }}
                            className="font-sans italic text-sm mb-6 leading-relaxed"
                        >
                            {`"${inspiration?.body ?? 'The Divine Office is the voice of the Church, publicly praising God.'}"`}
                        </Text>
                        <Button
                            size="sm"
                            variant="primary"
                            onPress={() => {
                                setLiturgicalContext(effectiveDate, 'inspirations');
                                router.push({ pathname: '/inspiration', params: { date: effectiveDate, source: 'divineOffice' } });
                            }}
                            className="self-start"
                        >
                            Read Reflection
                        </Button>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
