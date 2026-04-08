import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
    elevated?: boolean;
    accentColor?: string;
    onPress?: () => void;
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({
    elevated = false,
    accentColor,
    onPress,
    children,
    className = '',
}) => {
    const { colors } = useTheme();

    const containerStyle: ViewStyle = {
        backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
        ...(accentColor && { borderLeftWidth: 4, borderLeftColor: accentColor }),
        ...(elevated && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
        })
    };

    const content = (
        <View style={containerStyle} className={`rounded-card p-4 overflow-hidden ${className}`}>
            {children}
        </View>
    );

    if (onPress) {
        return <TouchableOpacity activeOpacity={0.8} onPress={onPress}>{content}</TouchableOpacity>;
    }

    return content;
};