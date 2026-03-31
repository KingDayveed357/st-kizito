import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { ThemeMode } from '../../store/useThemeStore';

interface PreferenceThemeCardProps {
    modeValue: ThemeMode;
    label: string;
    active: boolean;
    preview: {
        background: string;
        card: string;
        lines: string;
        accent: string;
    };
    onPress: () => void;
}

export const PreferenceThemeCard: React.FC<PreferenceThemeCardProps> = ({
    modeValue,
    label,
    active,
    preview,
    onPress,
}) => {
    const { colors } = useTheme();

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onPress}
            style={{
                width: '48%',
                marginBottom: 16,
            }}
        >
            <View
                style={{
                    minHeight: 152,
                    borderRadius: 20,
                    backgroundColor: preview.background,
                    borderWidth: active ? 2 : 1,
                    borderColor: active ? colors.accent : colors.border,
                    padding: 14,
                    justifyContent: 'space-between',
                }}
            >
                <View>
                    <View style={{ width: '72%', height: 7, borderRadius: 999, backgroundColor: preview.lines, marginBottom: 8 }} />
                    <View style={{ width: '58%', height: 7, borderRadius: 999, backgroundColor: preview.lines, opacity: 0.75, marginBottom: 12 }} />
                    <View style={{ borderRadius: 12, backgroundColor: preview.card, padding: 10 }}>
                        <View style={{ width: '90%', height: 5, borderRadius: 999, backgroundColor: preview.lines, marginBottom: 6 }} />
                        <View style={{ width: '64%', height: 5, borderRadius: 999, backgroundColor: preview.lines, opacity: 0.8 }} />
                    </View>
                </View>
                <View
                    style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: preview.accent,
                    }}
                />
            </View>
            <Text style={{ color: colors.textPrimary }} className="font-sans text-[13px] mt-2">
                {label}
            </Text>
            <Text style={{ color: colors.textMuted }} className="font-sans text-[11px] mt-1">
                {modeValue === 'high-contrast' ? 'High readability' : 'Reading mode'}
            </Text>
        </TouchableOpacity>
    );
};
