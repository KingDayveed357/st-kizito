import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface FavouriteIconButtonProps {
    active: boolean;
    onPress: () => void;
    size?: number;
}

export const FavouriteIconButton: React.FC<FavouriteIconButtonProps> = ({
    active,
    onPress,
    size = 52,
}) => {
    const { colors, mode } = useTheme();

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={active ? 'Remove from favourites' : 'Save to favourites'}
            accessibilityState={{ selected: active }}
            activeOpacity={0.88}
            onPress={onPress}
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: active ? colors.accent : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.accent : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: mode === 'high-contrast' ? 'transparent' : '#000000',
                shadowOpacity: 0.12,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 8 },
                elevation: 6,
            }}
        >
            <View style={{ transform: [{ scale: active ? 1.02 : 1 }] }}>
                <Ionicons
                    name={active ? 'heart' : 'heart-outline'}
                    size={20}
                    color={active ? '#FFFFFF' : colors.textPrimary}
                />
            </View>
        </TouchableOpacity>
    );
};
