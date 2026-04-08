import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info' }) => {
    const { colors, allColors } = useTheme();

    let bgColor = colors.textPrimary;
    if (type === 'success') bgColor = allColors.success;
    if (type === 'error') bgColor = allColors.error;

    return (
        <View style={{ backgroundColor: bgColor }} className="absolute bottom-20 mx-screen self-center py-3 px-4 rounded-xl shadow-md z-50 flex-row items-center">
            <Text style={{ color: colors.background }} className="font-sans font-medium text-sm">
                {message}
            </Text>
        </View>
    );
};