import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useDivineOffice } from '../../src/hooks/useDivineOffice';
import { Header } from '../../src/components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { getCalendar, getDailyInspiration, getDatePresentation, getDivineOfficePrayer, getTodayIso } from '../../src/services/liturgicalData';

export default function DivineOfficeScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const { selectedDate, setSource } = useAppStore();
    const effectiveDate = getCalendar(selectedDate) ? selectedDate : getTodayIso();
    const { data, isLoading } = useDivineOffice(effectiveDate);
    const presentation = getDatePresentation(effectiveDate);
    const morningPrayer = getDivineOfficePrayer(effectiveDate, 'morningPrayer');
    const inspiration = getDailyInspiration(effectiveDate);

    if (isLoading) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                centerElement={
                    <View className="flex-row items-center">
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-xl">Divine Office</Text>
                    </View>
                }
                rightElement={
                    <TouchableOpacity
                        onPress={() => {
                            setSource('divineOffice');
                            router.push('/calendar');
                        }}
                        className="p-2 mr-2"
                    >
                        <Ionicons name="calendar-outline" size={24} color={allColors.liturgical.ordinaryTime} />
                    </TouchableOpacity>
                }
            />

            <ScrollView className="flex-1 px-screen pt-2" showsVerticalScrollIndicator={false}>
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
                        <Text style={{ color: colors.textSecondary }} className="font-serif italic text-sm">
                            {morningPrayer?.parts?.reading?.text?.slice(0, 120) ?? '"O Lord, open my lips, and my mouth shall declare your praise."'}
                        </Text>
                    </View>
                </View>

                <View className="mb-6">
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
                        source={{ uri: 'https://images.unsplash.com/photo-1548625361-ec853f65e4ff?q=80&w=600&auto=format&fit=crop' }}
                        className="w-full h-40"
                        contentFit="cover"
                    />
                    <View className="p-6 pb-8 bg-[#EFEEE8]">
                        <View style={{ backgroundColor: '#e2f2e7' }} className="self-start px-2 py-1 rounded-md mb-3">
                            <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-sans font-bold text-[9px] tracking-wider uppercase">DAILY MANNA</Text>
                        </View>
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-xl mb-2">Meditation of the Day</Text>
                        <Text style={{ color: colors.textSecondary }} className="font-sans italic text-sm mb-6 leading-relaxed">
                            {`"${inspiration?.body ?? 'The Divine Office is the voice of the Church, publicly praising God.'}"`}
                        </Text>
                        <Button size="sm" variant="primary" onPress={() => router.push('/inspiration')} className="self-start">
                            Read Reflection
                        </Button>
                    </View>
                </View>

                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
