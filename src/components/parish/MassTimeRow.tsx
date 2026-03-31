import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export interface MassTime {
    day: string;
    morning: string | null;
    evening: string | null;
    hasSubscript?: boolean;
    isHighlighted?: boolean;
}

interface MassTimeRowProps {
    massTime: MassTime;
    isLast?: boolean;
}

const ICON_SIZE = 11;

/**
 * Splits a multi-line time string into [primary, ...badges].
 * e.g. "7:30 AM\nEnglish\n9:30 AM\nSwahili" → parsed into time+label pairs
 */
function parseTimeSlots(raw: string | null): { time: string; label?: string }[] {
    if (!raw) return [];
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    const slots: { time: string; label?: string }[] = [];
    let i = 0;
    while (i < lines.length) {
        const isTime = /^\d{1,2}:\d{2}/.test(lines[i]);
        if (isTime) {
            slots.push({ time: lines[i], label: lines[i + 1] && !/^\d{1,2}:\d{2}/.test(lines[i + 1]) ? lines[i + 1] : undefined });
            i += slots[slots.length - 1].label ? 2 : 1;
        } else {
            // standalone label (e.g. "Vigil Mass") attaches to last slot
            if (slots.length > 0) slots[slots.length - 1].label = lines[i];
            i++;
        }
    }
    return slots;
}

interface TimeCellProps {
    raw: string | null;
    icon: 'sunny-outline' | 'moon-outline';
    accentColor: string;
    pillBg: string;
    pillText: string;
    textColor: string;
    secondaryColor: string;
}

const TimeCell: React.FC<TimeCellProps> = ({ raw, icon, accentColor, pillBg, pillText, textColor, secondaryColor }) => {
    const slots = parseTimeSlots(raw);

    if (slots.length === 0) {
        return (
            <View style={{ flex: 1 }}>
                <Text style={{ color: secondaryColor, fontSize: 12 }}>—</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, gap: 8 }}>
            {slots.map((slot, idx) => (
                <View key={idx}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: slot.label ? 3 : 0 }}>
                        <Ionicons name={icon} size={ICON_SIZE} color={accentColor} />
                        <Text style={{ color: textColor, fontSize: 13, fontWeight: '600', letterSpacing: -0.1 }}>
                            {slot.time}
                        </Text>
                    </View>
                    {slot.label && (
                        <View
                            style={{
                                alignSelf: 'flex-start',
                                backgroundColor: pillBg,
                                borderRadius: 6,
                                paddingHorizontal: 7,
                                paddingVertical: 2,
                                marginLeft: ICON_SIZE + 4,
                            }}
                        >
                            <Text style={{ color: pillText, fontSize: 10, fontWeight: '600', letterSpacing: 0.2 }}>
                                {slot.label}
                            </Text>
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
};

export const MassTimeRow: React.FC<MassTimeRowProps> = ({ massTime, isLast = false }) => {
    const { colors, allColors } = useTheme();

    const accent = allColors.liturgical.ordinaryTime; // your green/teal brand color
    const eveningAccent = allColors.liturgical.adventLent ?? '#7C6D9E'; // purple-ish for evening

    // Derive pill colors from theme surfaces
    const morningPillBg = colors.surfaceElevated;
    const eveningPillBg = colors.surfaceElevated;
    const morningPillText = accent;
    const eveningPillText = eveningAccent;

    return (
        <View
            style={{
                borderBottomWidth: isLast ? 0 : 0.5,
                borderBottomColor: colors.surfaceElevated,
                paddingHorizontal: 20,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                backgroundColor: massTime.isHighlighted ? `${accent}0D` : 'transparent',
            }}
        >
            {/* Day column */}
            <View style={{ width: 80, paddingTop: 1 }}>
                <Text
                    style={{
                        color: massTime.isHighlighted ? accent : colors.textPrimary,
                        fontSize: 13,
                        fontWeight: '700',
                        letterSpacing: -0.1,
                        lineHeight: 18,
                    }}
                    numberOfLines={2}
                >
                    {massTime.day}
                    {massTime.hasSubscript && (
                        <Text style={{ color: accent, fontSize: 13 }}> *</Text>
                    )}
                </Text>
            </View>

            {/* Divider */}
            <View
                style={{
                    width: 0.5,
                    alignSelf: 'stretch',
                    backgroundColor: colors.surfaceElevated,
                    marginTop: 2,
                    marginBottom: 2,
                }}
            />

            {/* Morning column */}
            <TimeCell
                raw={massTime.morning}
                icon="sunny-outline"
                accentColor={accent}
                pillBg={morningPillBg}
                pillText={morningPillText}
                textColor={colors.textPrimary}
                secondaryColor={colors.textSecondary}
            />

            {/* Divider */}
            <View
                style={{
                    width: 0.5,
                    alignSelf: 'stretch',
                    backgroundColor: colors.surfaceElevated,
                    marginTop: 2,
                    marginBottom: 2,
                }}
            />

            {/* Evening column */}
            <TimeCell
                raw={massTime.evening}
                icon="moon-outline"
                accentColor={eveningAccent}
                pillBg={eveningPillBg}
                pillText={eveningPillText}
                textColor={colors.textPrimary}
                secondaryColor={colors.textSecondary}
            />
        </View>
    );
};