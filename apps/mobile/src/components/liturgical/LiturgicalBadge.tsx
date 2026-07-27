import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getLiturgicalHex, LiturgicalColor } from '../../theme/liturgicalColors';

interface LiturgicalBadgeProps {
    season?: string;
    label: string;
    color?: LiturgicalColor;
}

// Relative luminance (0 = dark, 1 = light) used to choose a readable foreground on any badge
// colour — previously the text was always white and vanished on light liturgical colours such as
// white (#F1F1F1) or gold (e.g. the "CHRISTMAS - MONDAY" tag), in light and dark themes alike.
const luminance = (hex: string): number => {
    const clean = hex.replace('#', '');
    if (clean.length < 6) return 1;
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const LiturgicalBadge: React.FC<LiturgicalBadgeProps> = ({ season, label, color }) => {
    const { colors, allColors } = useTheme();

    let hex = colors.accent;
    if (color) {
        hex = getLiturgicalHex(color);
    } else if (season) {
        if (season.toLowerCase().includes('ordinary')) hex = allColors.liturgical.ordinaryTime;
        if (season.toLowerCase().includes('advent') || season.toLowerCase().includes('lent')) hex = allColors.liturgical.adventLent;
        if (season.toLowerCase().includes('easter') || season.toLowerCase().includes('christmas')) hex = allColors.liturgical.christmasEaster;
    }

    const isLightBg = luminance(hex) > 0.62;
    const fg = isLightBg ? '#1A1A1A' : '#FFFFFF';

    return (
        <View
            style={{
                backgroundColor: hex,
                borderWidth: 1,
                // Delineate a light badge from a light page background; invisible on saturated ones.
                borderColor: isLightBg ? 'rgba(0,0,0,0.12)' : 'transparent',
            }}
            className="self-start px-3 py-1 rounded-full flex-row items-center"
        >
            {season && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg, marginRight: 6 }} />}
            <Text style={{ color: fg }} className="font-sans font-bold text-[10px] uppercase tracking-wider">
                {label}
            </Text>
        </View>
    );
};
