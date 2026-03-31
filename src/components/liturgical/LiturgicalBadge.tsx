import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getLiturgicalHex, LiturgicalColor } from '../../theme/liturgicalColors';

interface LiturgicalBadgeProps {
    season?: string;
    label: string;
    color?: LiturgicalColor;
}

export const LiturgicalBadge: React.FC<LiturgicalBadgeProps> = ({ season, label, color }) => {
    const { colors, allColors } = useTheme();

    // Actually maps string season to color, or uses straight color
    let hex = colors.accent;
    if (color) {
        hex = getLiturgicalHex(color);
    } else if (season) {
        if (season.toLowerCase().includes('ordinary')) hex = allColors.liturgical.ordinaryTime;
        if (season.toLowerCase().includes('advent') || season.toLowerCase().includes('lent')) hex = allColors.liturgical.adventLent;
        if (season.toLowerCase().includes('easter') || season.toLowerCase().includes('christmas')) hex = allColors.liturgical.christmasEaster;
    }

    return (
        <View style={{ backgroundColor: hex }} className="self-start px-3 py-1 rounded-full flex-row items-center">
            {season && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', marginRight: 6 }} />}
            <Text style={{ color: '#FFFFFF' }} className="font-sans font-bold text-[10px] uppercase tracking-wider">
                {label}
            </Text>
        </View>
    );
};