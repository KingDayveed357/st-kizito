import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Dimensions } from 'react-native';
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

// Mock generation for calendar 
const generateMonthData = (monthIndex: number): CalendarDay[] => {
    const prefixEmptyRows: CalendarDay[] = Array.from({ length: 3 }).map((_, i) => ({ date: `emp-${i}`, dayNum: 0 }));
    const days: CalendarDay[] = Array.from({ length: 31 }).map((_, i) => {
        return {
            date: `2024-${monthIndex}-${i + 1}`,
            dayNum: i + 1,
            season: (i + 1) % 7 === 0 ? 'ordinary' : (i + 1) % 9 === 0 ? 'easter' : undefined,
            isToday: i + 1 === 13,
        }
    });
    return [...prefixEmptyRows, ...days];
};

export default function CalendarScreen() {
    const { colors, allColors } = useTheme();
    const [selectedDate, setSelectedDate] = useState<string | null>('2024-5-13');
    const bottomSheetRef = React.useRef<BottomSheet>(null);
    const router = useRouter();

    const handleDatePress = (date: string) => {
        setSelectedDate(date);
        bottomSheetRef.current?.expand();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                leftElement={<Ionicons name="menu" size={28} color={allColors.liturgical.ordinaryTime} className="ml-4" />}
                centerElement={<Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-serif font-bold text-xl text-center">St. Kizito{'\n'}Parish</Text>}
                rightElement={
                    <View className="flex-row items-center mr-2">
                        <View style={{ backgroundColor: colors.surfaceElevated }} className="px-3 py-1.5 rounded-3xl mr-3">
                            <Text style={{ color: colors.textPrimary }} className="font-sans font-bold text-xs uppercase tracking-wider">TODAY</Text>
                        </View>
                        <Ionicons name="calendar-outline" size={24} color={allColors.liturgical.ordinaryTime} />
                    </View>
                }
            />

            <ScrollView className="flex-1 pt-6" showsVerticalScrollIndicator={false}>
                <View className="px-screen mb-4 items-center">
                    <View className="flex-row justify-between w-full items-center mb-6">
                        <View>
                            <Text style={{ color: colors.textSecondary }} className="font-sans font-bold text-[10px] uppercase tracking-widest mb-1">
                                LITURGICAL YEAR B
                            </Text>
                            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-3xl">
                                May 2024
                            </Text>
                        </View>
                        <View className="flex-row items-center">
                            <TouchableOpacity className="p-2"><Ionicons name="chevron-back" size={20} color={colors.textPrimary} /></TouchableOpacity>
                            <TouchableOpacity className="p-2 pl-4"><Ionicons name="chevron-forward" size={20} color={colors.textPrimary} /></TouchableOpacity>
                        </View>
                    </View>
                </View>

                <CalendarGrid
                    month="May"
                    year={2024}
                    selectedDate={selectedDate}
                    onDatePress={handleDatePress}
                    calendarData={generateMonthData(5)}
                />

                <View className="px-screen py-4 flex-row justify-center items-center">
                </View>

            </ScrollView>

            {/* Detail Bottom Sheet */}
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
                        <View>
                            <LiturgicalBadge label="ORDINARY TIME • WEEK 7" color="green" />
                            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-[22px] mt-4 mb-1">
                                Monday, May 13
                            </Text>
                            <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-serif italic text-[16px]">
                                Our Lady of Fatima
                            </Text>
                        </View>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1548625361-ec853f65e4ff?q=80&w=600&auto=format&fit=crop' }}
                            className="w-16 h-16 rounded-2xl"
                            contentFit="cover"
                        />
                    </View>

                    <Text style={{ color: colors.textPrimary }} className="font-sans text-sm leading-relaxed mb-6">
                        Commemorating the 1917 apparitions of the Blessed Virgin Mary to three shepherd children in Portugal. A day for prayer and reflection on the message of peace.
                    </Text>

                    <View className="flex-row">
                        <Button className="flex-1 mr-2" onPress={() => router.push('/readings')} leftIcon={<Ionicons name="book" size={18} color="#FFFFFF" />}>
                            <Text className="text-center font-sans font-bold">View{'\n'}Readings</Text>
                        </Button>
                        <Button variant="secondary" className="flex-1 ml-2 bg-gray-100" onPress={() => { }} leftIcon={<Ionicons name="notifications" size={18} color={colors.textPrimary} />}>
                            <Text className="text-center font-sans font-bold">Set{'\n'}Reminder</Text>
                        </Button>
                    </View>

                </BottomSheetView>
            </BottomSheet>
        </SafeAreaView>
    );
}