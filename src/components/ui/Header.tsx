import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeaderProps {
    title?: React.ReactNode;
    showBack?: boolean;
    rightElement?: React.ReactNode;
    centerElement?: React.ReactNode;
    leftElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    showBack = false,
    rightElement,
    centerElement,
    leftElement,
}) => {
    const { colors } = useTheme();
    const router = useRouter();

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        }
    };

    return (
        <View
            style={{ backgroundColor: colors.background, minHeight: 64 }}
            className="flex-row items-center justify-between px-5"
        >
            <View className="flex-1 items-start justify-center">
                {leftElement ? leftElement : showBack ? (
                    <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
                        <Ionicons name="chevron-back" size={24} color={colors.accent} />
                    </TouchableOpacity>
                ) : null}
            </View>
            <View className="flex-[3] items-center justify-center">
                {centerElement ? centerElement : (
                    <Text
                        style={{ color: colors.accent }}
                        className="font-serif font-bold text-[22px] text-center"
                        numberOfLines={1}
                    >
                        {title}
                    </Text>
                )}
            </View>
            <View className="flex-1 items-end justify-center">
                {rightElement}
            </View>
        </View>
    );
};
