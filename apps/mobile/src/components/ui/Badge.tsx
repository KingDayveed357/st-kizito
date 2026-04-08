import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface BadgeProps {
    label: string;
    color?: string;
    variant?: 'solid' | 'outline';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ label, color, variant = 'solid', className = '' }) => {
    const { colors } = useTheme();
    const themeColor = color || colors.accent;

    const containerStyle: ViewStyle = variant === 'solid' ? {
        backgroundColor: themeColor,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    } : {
        borderColor: themeColor,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'transparent',
    };

    return (
        <View style={containerStyle} className={`self-start ${className}`}>
            <Text style={{ color: variant === 'solid' ? '#FFFFFF' : themeColor }} className="font-sans font-bold text-xs uppercase tracking-wider">
                {label}
            </Text>
        </View>
    );
};