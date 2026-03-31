import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, actionLabel, onAction, className = '' }) => {
    const { colors } = useTheme();

    return (
        <View className={`flex-1 items-center justify-center p-screen ${className}`}>
            {icon && <View className="mb-4">{icon}</View>}
            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-xl mb-2 text-center">
                {title}
            </Text>
            {subtitle && (
                <Text style={{ color: colors.textSecondary }} className="font-sans text-center mb-6">
                    {subtitle}
                </Text>
            )}
            {actionLabel && onAction && (
                <Button onPress={onAction} variant="outline" size="md">
                    {actionLabel}
                </Button>
            )}
        </View>
    );
};