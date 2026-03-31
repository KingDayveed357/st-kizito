import React from 'react';
import { TouchableOpacity, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ChipProps {
    label: string;
    onPress?: () => void;
    active?: boolean;
    className?: string;
}

export const Chip: React.FC<ChipProps> = ({ label, onPress, active, className = '' }) => {
    const { colors } = useTheme();

    const containerStyle: ViewStyle = {
        backgroundColor: active ? colors.accent : colors.surfaceElevated,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    };

    const textStyle = {
        color: active ? '#FFFFFF' : colors.textPrimary,
    };

    return (
        <TouchableOpacity onPress={onPress} style={containerStyle} className={className}>
            <Text style={textStyle} className="font-sans font-medium text-sm">
                {label}
            </Text>
        </TouchableOpacity>
    );
};