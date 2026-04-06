import React from 'react';
import { Text, View } from 'react-native';
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
}

type TimeEntry = {
    time: string;
    context: string;
};

const parseEntries = (value: string | null, context: string): TimeEntry[] => {
    if (!value) return [];

    const rows = value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

    const entries: TimeEntry[] = [];
    let pendingContext: string | null = null;

    rows.forEach((row) => {
        if (/^\d{1,2}:\d{2}/.test(row)) {
            entries.push({ time: row, context: pendingContext ?? context });
            pendingContext = null;
            return;
        }

        if (entries.length > 0) {
            entries[entries.length - 1] = { ...entries[entries.length - 1], context: row };
        } else {
            pendingContext = row;
        }
    });

    return entries;
};

export const MassTimeRow: React.FC<MassTimeRowProps> = ({ massTime }) => {
    const { colors, allColors } = useTheme();
    const entries = [
        ...parseEntries(massTime.morning, 'Morning'),
        ...parseEntries(massTime.evening, 'Evening'),
    ];

    return (
        <View
            style={{
                borderRadius: 20,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 2,
                marginBottom: 12,
            }}
        >
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 12 }} className="font-serif">
                {massTime.day}
                {massTime.hasSubscript ? '*' : ''}
            </Text>

            {entries.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 14 }} className="font-sans">
                    No Mass times listed.
                </Text>
            ) : (
                entries.map((entry, index) => (
                    <View key={`${entry.time}-${entry.context}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: index === entries.length - 1 ? 0 : 10 }}>
                        <Ionicons
                            name={entry.context.toLowerCase().includes('evening') || entry.context.toLowerCase().includes('vigil') ? 'moon-outline' : 'sunny-outline'}
                            size={16}
                            color={allColors.liturgical.ordinaryTime}
                            style={{ marginRight: 10 }}
                        />
                        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginRight: 10 }} className="font-serif">
                            {entry.time}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }} className="font-sans">
                            {entry.context}
                        </Text>
                    </View>
                ))
            )}
        </View>
    );
};
