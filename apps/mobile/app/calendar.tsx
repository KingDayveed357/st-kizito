import React, { useMemo, useRef, useState, useCallback } from 'react';
import { View, ScrollView, Text, TouchableOpacity, FlatList, useWindowDimensions } from 'react-native';
import { useTheme } from '../src/hooks/useTheme';
import { Header } from '../src/components/ui/Header';
import { CalendarGrid, CalendarDay } from '../src/components/liturgical/CalendarGrid';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/ui/Button';
import { Image } from 'expo-image';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { LiturgicalBadge } from '../src/components/liturgical/LiturgicalBadge';
import { SafeAreaView } from 'react-native-safe-area-context';
import calendar2026 from '../data/calendar/2026.json';
import { useAppStore } from '../src/store/useAppStore';
import { getCalendarDescription, getDatePresentation, getTodayIso } from '../src/services/liturgicalData';

const calendarData = calendar2026 as Record<string, any>;
const todayIso = getTodayIso();

const getMonthLabel = (monthIndex: number) =>
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(2026, monthIndex, 1));

const buildMonthData = (monthIndex: number, selectedDate: string): CalendarDay[] => {
    const firstDay = new Date(2026, monthIndex, 1);
    const daysInMonth = new Date(2026, monthIndex + 1, 0).getDate();
    const prefixEmptyRows: CalendarDay[] = Array.from({ length: firstDay.getDay() }).map((_, i) => ({ date: `emp-${monthIndex}-${i}`, dayNum: 0 }));

    const days: CalendarDay[] = Array.from({ length: daysInMonth }).map((_, i) => {
        const day = i + 1;
        const date = `2026-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = calendarData[date];

        return {
            date,
            dayNum: day,
            season: entry?.season,
            isToday: date === todayIso,
            isSunday: entry?.day === 'Sunday',
            celebration: entry?.celebration,
            celebrationType: entry?.celebrationType,
        };
    });

    return [...prefixEmptyRows, ...days];
};

const routeBySource = {
    readings: '/readings',
    divineOffice: '/divine-office',
    inspirations: '/inspiration',
} as const;

const badgeColor = (season?: string) => {
    if (season === 'Lent' || season === 'Advent') return 'purple';
    if (season === 'Easter' || season === 'Christmas') return 'gold';
    return 'green';
};

export default function CalendarScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const { selectedDate, source, setLiturgicalContext } = useAppStore();
    const effectiveDate = calendarData[selectedDate] ? selectedDate : todayIso;
    const [visibleMonth, setVisibleMonth] = useState(Number(effectiveDate.slice(5, 7)) - 1);
    
    // Pre-calculate all 12 months data to allow smooth swiping
    const allMonthsData = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => ({
            monthIndex: i,
            data: buildMonthData(i, effectiveDate)
        }));
    }, [effectiveDate]);

    const detailDate = calendarData[effectiveDate] ? effectiveDate : todayIso;
    const detail = calendarData[detailDate];
    const presentation = getDatePresentation(detailDate);
    const { width: screenWidth } = useWindowDimensions();
    const flatListRef = useRef<FlatList>(null);

    const handleDatePress = (date: string) => {
        setLiturgicalContext(date, source);
        bottomSheetRef.current?.expand();
    };

    const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems && viewableItems.length > 0) {
            setVisibleMonth(viewableItems[0].item.monthIndex);
        }
    }, []);

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    const navigateMonth = (index: number) => {
        if (index >= 0 && index <= 11) {
            flatListRef.current?.scrollToIndex({ index, animated: true });
            setVisibleMonth(index);
        }
    };

    const navigateToContextScreen = () => {
        if (source === 'readings') {
            router.push({ pathname: routeBySource.readings, params: { date: detailDate } });
            return;
        }

        router.push(routeBySource[source]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                leftElement={<Ionicons name="menu" size={28} color={allColors.liturgical.ordinaryTime} className="ml-4" />}
                centerElement={<Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-serif font-bold text-xl text-center">St. Kizito{'\n'}Parish</Text>}
                rightElement={
                    <TouchableOpacity
                        onPress={() => {
                            setVisibleMonth(Number(todayIso.slice(5, 7)) - 1);
                            setLiturgicalContext(todayIso, source);
                            bottomSheetRef.current?.expand();
                        }}
                        className="mr-2"
                    >
                        <View style={{ backgroundColor: colors.surfaceElevated }} className="px-3 py-1.5 rounded-3xl">
                            <Text style={{ color: colors.textPrimary }} className="font-sans font-bold text-xs uppercase tracking-wider">TODAY</Text>
                        </View>
                    </TouchableOpacity>
                }
            />

            <ScrollView className="flex-1 pt-6" showsVerticalScrollIndicator={false}>
                <View className="px-screen mb-4 items-center">
                    <View className="flex-row justify-between w-full items-center mb-6">
                        <View>
                            <Text style={{ color: colors.textSecondary }} className="font-sans font-bold text-[10px] uppercase tracking-widest mb-1">
                                {presentation?.liturgicalYearLabel ?? 'LITURGICAL YEAR'}
                            </Text>
                            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-3xl">
                                {getMonthLabel(visibleMonth)}
                            </Text>
                        </View>
                        <View className="flex-row items-center">
                            <TouchableOpacity className="p-2" onPress={() => navigateMonth(visibleMonth - 1)}>
                                <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                            </TouchableOpacity>
                            <TouchableOpacity className="p-2 pl-4" onPress={() => navigateMonth(visibleMonth + 1)}>
                                <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={allMonthsData}
                    keyExtractor={item => `month-${item.monthIndex}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={visibleMonth}
                    getItemLayout={(data, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
                    onViewableItemsChanged={handleViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    renderItem={({ item }) => (
                        <View style={{ width: screenWidth }}>
                            <CalendarGrid
                                month={getMonthLabel(item.monthIndex)}
                                year={2026}
                                selectedDate={effectiveDate}
                                onDatePress={handleDatePress}
                                calendarData={item.data}
                            />
                        </View>
                    )}
                />

                <View className="px-screen py-4 flex-row justify-center items-center" />
            </ScrollView>

            <BottomSheet
                ref={bottomSheetRef}
                index={1}
                snapPoints={['25%', '50%']}
                enablePanDownToClose={false}
                handleIndicatorStyle={{ backgroundColor: colors.surfaceElevated, width: 40 }}
                backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 32 }}
            >
                <BottomSheetView style={{ flex: 1, padding: 24 }}>
                    <View className="flex-row justify-between mb-4 mt-2">
                        <View style={{ flex: 1, paddingRight: 12 }}>
                            <LiturgicalBadge label={presentation?.badgeLabel ?? 'LITURGICAL DAY'} color={badgeColor(detail?.season)} />
                            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-[22px] mt-4 mb-1">
                                {presentation?.weekdayMonthDay ?? detailDate}
                            </Text>
                            <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-serif italic text-[16px]">
                                {detail?.celebration ?? 'Liturgical observance'}
                            </Text>
                        </View>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1548625361-ec853f65e4ff?q=80&w=600&auto=format&fit=crop' }}
                            className="w-16 h-16 rounded-2xl"
                            contentFit="cover"
                        />
                    </View>

                    <Text style={{ color: colors.textPrimary }} className="font-sans text-sm leading-relaxed mb-6">
                        {getCalendarDescription(detailDate)}
                    </Text>

                    <View className="flex-row">
                        <Button className="flex-1 mr-2" onPress={navigateToContextScreen} leftIcon={<Ionicons name="book" size={18} color="#FFFFFF" />}>
                            <Text className="text-center font-sans font-bold">Open{'\n'}Day</Text>
                        </Button>
                        <Button
                            variant="secondary"
                            className="flex-1 ml-2 bg-gray-100"
                            onPress={() => {
                                setLiturgicalContext(todayIso, source);
                                setVisibleMonth(Number(todayIso.slice(5, 7)) - 1);
                                bottomSheetRef.current?.expand();
                            }}
                            leftIcon={<Ionicons name="today" size={18} color={colors.textPrimary} />}
                        >
                            <Text className="text-center font-sans font-bold">Jump To{'\n'}Today</Text>
                        </Button>
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </SafeAreaView>
    );
}

