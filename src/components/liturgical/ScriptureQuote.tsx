import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ScriptureQuoteProps {
    text: string;
    reference: string;
}

export const ScriptureQuote: React.FC<ScriptureQuoteProps> = ({ text, reference }) => {
    const { colors, allColors } = useTheme();

    return (
        <View style={{ backgroundColor: colors.surface }} className="rounded-card p-6 shadow-sm mb-4 relative overflow-hidden">
            <View className="absolute top-4 right-4 z-10">
                <Ionicons name="heart" size={24} color="#Eebfb7" />
            </View>
            <Text style={{ color: allColors.liturgical.christmasEaster }} className="font-serif font-bold text-4xl leading-none italic mb-[-10px]">
                "
            </Text>
            <Text style={{ color: colors.textPrimary }} className="font-serif italic text-xl leading-relaxed mb-4 z-10">
                {text}
            </Text>
            <Text style={{ color: colors.textSecondary }} className="font-sans font-bold text-[11px] tracking-widest uppercase">
                {reference}
            </Text>
        </View>
    );
};