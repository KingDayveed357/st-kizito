import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface CalendarDay {
    date: string;
    dayNum: number;
    season?: string;
    isToday?: boolean;
    isSunday?: boolean;
    celebration?: string;
    celebrationType?: string;
    color?: string;
}

interface CalendarGridProps {
    month: string;
    year: number;
    selectedDate: string | null;
    onDatePress: (date: string) => void;
    calendarData: CalendarDay[];
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
    selectedDate, onDatePress, calendarData
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
                        return <View key={idx} className="w-[14.28%] h-14" />; // Empty cell
                    }

                    const isSelected = selectedDate === day.date;
                    const isFeastDay = !!day.celebrationType && day.celebrationType !== 'Weekday';
                    
                    let dotColor: string = day.color || colors.textSecondary;
                    if (day.season?.toLowerCase()?.includes('easter') || day.season?.toLowerCase()?.includes('christmas')) dotColor = allColors.liturgical.christmasEaster;
                    else if (day.season?.toLowerCase()?.includes('lent') || day.season?.toLowerCase()?.includes('advent')) dotColor = allColors.liturgical.adventLent;
                    else if (day.season?.toLowerCase()?.includes('ordinary')) dotColor = allColors.liturgical.ordinaryTime;

                    const dayTextColor = day.isSunday || isFeastDay ? colors.accent : colors.textPrimary;

                    return (
                        <TouchableOpacity
                            key={day.date}
                            onPress={() => onDatePress(day.date)}
                            className="w-[14.28%] h-14 items-center justify-center relative"
                        >
                            <View 
                                style={[
                                    styles.dayCircle,
                                    isSelected && { borderColor: colors.accent, borderWidth: 1.5, backgroundColor: colors.surface }
                                ]}
                            >
                                <Text 
                                    style={{ color: dayTextColor, opacity: day.dayNum === 0 ? 0 : 1 }} 
                                    className={`font-serif text-[17px] ${day.isToday ? 'font-black' : ''}`}
                                >
                                    {day.dayNum || ''}
                                </Text>
                                {day.dayNum !== 0 && (
                                    <View style={{ backgroundColor: dotColor }} className="w-[4px] h-[4px] rounded-full absolute bottom-1.5" />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    dayCircle: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        borderRadius: 20,
        alignItems: 'center',
        position: 'relative'
    }
});
