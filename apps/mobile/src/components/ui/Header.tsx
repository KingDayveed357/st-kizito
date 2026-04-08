import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { spacing } from '../../theme';

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
            return;
        }

        router.replace('/(tabs)/more');
    };

    return (
        <View
            style={{
                backgroundColor: colors.background,
                minHeight: 72,
                paddingHorizontal: spacing.screenMargin - 2,
            }}
            className="flex-row items-center justify-between"
        >
            <View className="flex-1 items-start justify-center">
                {leftElement ? leftElement : showBack ? (
                    <TouchableOpacity
                        onPress={handleBack}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.82}
                        style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#000000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.06,
                            shadowRadius: 6,
                            elevation: 1,
                        }}
                    >
                        <Ionicons name="chevron-back" size={20} color={colors.accent} />
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
