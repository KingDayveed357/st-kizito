import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface PrayerSectionProps {
    label: string;
    text: string;
}

export const PrayerSection: React.FC<PrayerSectionProps> = ({ label, text }) => {
    const { colors, textScale, lineHeightScale } = useTheme();

    return (
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <View className="flex-row items-center justify-center mb-4">
                <View style={{ backgroundColor: colors.surfaceElevated, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 }}>
                    <Text style={{ color: colors.accent }} className="font-sans font-bold text-[11px] tracking-[1.8px] uppercase">
                        {label}
                    </Text>
                </View>
            </View>

            <Text
                style={{ color: colors.textPrimary, fontSize: 18 * textScale, lineHeight: 32 * textScale * lineHeightScale }}
                className="font-serif text-center"
            >
                {text}
            </Text>
        </View>
    );
};
