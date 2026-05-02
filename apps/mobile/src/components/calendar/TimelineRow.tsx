import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LITURGICAL_LABELS } from '../../constants/liturgical';

export type TimelineItem = {
    date: string;
    dayNum: number;
    dayName: string;
    isSunday: boolean;
    calendar?: any;
};

interface TimelineRowProps {
    item: TimelineItem;
    isSelected: boolean;
    onSelect: (d: string) => void;
    borderColor: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    accentSoft: string;
    surface: string;
    surfaceElevated: string;
    ordinaryColor: string;
    christmasColor: string;
    calendar: any;
}

export const TimelineRow = memo(({
    item,
    isSelected,
    onSelect,
    borderColor,
    textPrimary,
    textSecondary,
    accent,
    accentSoft,
    surface,
    surfaceElevated,
    ordinaryColor,
    christmasColor,
    calendar,
}: TimelineRowProps) => {
    const celebration = calendar?.celebration ?? LITURGICAL_LABELS.liturgicalDayFallback;
    const celebrationType = calendar?.celebrationType ?? 'Weekday';
    const liturgicalColor = calendar?.color === 'white'
        ? ordinaryColor
        : (calendar?.color === 'gold' ? christmasColor : (calendar?.color ?? 'green'));
    const isSpecial = celebrationType === 'Solemnity' || celebrationType === 'Feast';

    return (
        <TouchableOpacity
            onPress={() => onSelect(item.date)}
            activeOpacity={0.85}
            style={[
                styles.rowContainer,
                { borderBottomColor: borderColor },
                isSelected && { backgroundColor: surfaceElevated, borderBottomColor: accentSoft },
            ]}
        >
            <View style={styles.dateColumn}>
                <Text style={[styles.dayNameText, { color: item.isSunday ? accent : textSecondary }]}>
                    {item.dayName}
                </Text>
                <View
                    style={[
                        styles.selectedDayBadge,
                        isSelected && { backgroundColor: accent, borderColor: accent },
                    ]}
                >
                    <Text style={[styles.dayNumberText, { color: isSelected ? surface : textPrimary }]}>
                        {item.dayNum}
                    </Text>
                </View>
            </View>

            <View style={styles.contentColumn}>
                <Text
                    style={[
                        styles.celebrationText,
                        {
                            color: item.isSunday || isSpecial ? textPrimary : textSecondary,
                            fontWeight: item.isSunday || isSpecial ? '700' : '400',
                            fontStyle: isSpecial ? 'italic' : 'normal',
                        },
                    ]}
                    numberOfLines={1}
                >
                    {celebration}
                </Text>
                {celebrationType !== 'Weekday' && (
                    <Text style={[styles.celebrationTypeText, { color: liturgicalColor }]}>
                        {celebrationType}
                    </Text>
                )}
            </View>

            {isSelected && <View style={[styles.selectedRail, { backgroundColor: accent }]} />}
        </TouchableOpacity>
    );
}, (prev, next) => (
    prev.isSelected === next.isSelected &&
    prev.item.date === next.item.date &&
    prev.borderColor === next.borderColor &&
    prev.textPrimary === next.textPrimary &&
    prev.textSecondary === next.textSecondary &&
    prev.accent === next.accent &&
    prev.accentSoft === next.accentSoft &&
    prev.surface === next.surface &&
    prev.surfaceElevated === next.surfaceElevated &&
    prev.ordinaryColor === next.ordinaryColor &&
    prev.christmasColor === next.christmasColor &&
    prev.calendar === next.calendar
));

const styles = StyleSheet.create({
    rowContainer: {
        height: 70,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    dateColumn: {
        width: 50,
        alignItems: 'center',
        marginRight: 10,
    },
    selectedDayBadge: {
        minWidth: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    dayNameText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },
    dayNumberText: {
        fontSize: 20,
        fontWeight: '900',
    },
    contentColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    celebrationText: {
        fontSize: 18,
        lineHeight: 22,
    },
    celebrationTypeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginTop: 4,
        opacity: 0.8,
    },
    selectedRail: {
        position: 'absolute',
        left: 0,
        width: 4,
        height: '66%',
        borderTopRightRadius: 999,
        borderBottomRightRadius: 999,
    },
});
