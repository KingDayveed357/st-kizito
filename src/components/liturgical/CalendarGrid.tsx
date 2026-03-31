import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface CalendarDay {
    date: string;
    dayNum: number;
    season?: string;
    isToday?: boolean;
}

interface CalendarGridProps {
    month: string;
    year: number;
    selectedDate: string | null;
    onDatePress: (date: string) => void;
    calendarData: CalendarDay[];
    onPrevMonth?: () => void;
    onNextMonth?: () => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
    month, year, selectedDate, onDatePress, calendarData, onPrevMonth, onNextMonth
}) => {
    const { colors, allColors } = useTheme();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    return (
        <View style={{ backgroundColor: colors.surfaceElevated }} className="rounded-3xl p-4 self-center w-full mx-screen mb-4 mt-2 max-w-md shadow-sm">
            <View className="flex-row justify-between pb-4">
                {days.map((d) => (
                    <Text key={d} style={{ color: colors.textPrimary }} className="font-sans font-bold text-[11px] uppercase tracking-wider text-center flex-1">{d}</Text>
                ))}
            </View>
            <View className="flex-row flex-wrap">
                {calendarData.map((day, idx) => {
                    if (!day.dayNum) {
                        return <View key={idx} className="w-[14.28%] h-12" />; // Empty cell
                    }

                    const isSelected = selectedDate === day.date;
                    let dotColor: string = allColors.liturgical.ordinaryTime;
                    if (day.season?.toLowerCase()?.includes('easter')) dotColor = allColors.liturgical.christmasEaster;
                    else if (day.season?.toLowerCase()?.includes('lent')) dotColor = allColors.liturgical.adventLent;

                    return (
                        <TouchableOpacity
                            key={day.date}
                            onPress={() => onDatePress(day.date)}
                            className="w-[14.28%] h-12 items-center justify-center relative"
                        >
                            <View className={`w-9 h-9 items-center justify-center rounded-full ${isSelected ? 'border border-gray-300' : ''}`}
                                style={isSelected ? { borderColor: colors.accent, borderWidth: 1 } : {}}>
                                <Text style={{ color: colors.textPrimary }} className={`font-serif text-lg ${day.isToday ? 'font-bold' : ''}`}>
                                    {day.dayNum}
                                </Text>
                                {day.season && (
                                    <View style={{ backgroundColor: dotColor }} className="w-[4px] h-[4px] rounded-full absolute bottom-1" />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};
