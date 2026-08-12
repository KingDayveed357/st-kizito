import React from 'react';
import { TouchableOpacity, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ChipProps {
    label: string;
    onPress?: () => void;
    active?: boolean;
    /** Ionicons name. Optional, but the Liturgical Actions row sets one on every chip. */
    icon?: keyof typeof Ionicons.glyphMap;
    /**
     * Spoken label, when the visible one is too terse out of context — "Mass Time" alone does not
     * tell a screen-reader user that it opens the parish page.
     */
    accessibilityLabel?: string;
    className?: string;
}

export const Chip: React.FC<ChipProps> = ({
    label,
    onPress,
    active,
    icon,
    accessibilityLabel,
    className = '',
}) => {
    const { colors } = useTheme();

    const containerStyle: ViewStyle = {
        backgroundColor: active ? colors.accent : colors.surfaceElevated,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 16,
        // 44 is the minimum comfortable touch target; the chip was ~34px tall, which is a small
        // target for the older parishioners this app is largely for.
        minHeight: 44,
        borderRadius: 22,
        marginRight: 8,
    };

    const foreground = active ? '#FFFFFF' : colors.textPrimary;

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityState={{ selected: !!active }}
            onPress={onPress}
            activeOpacity={0.85}
            style={containerStyle}
            className={className}
        >
            {icon ? <Ionicons name={icon} size={15} color={foreground} /> : null}
            <Text style={{ color: foreground }} className="font-sans font-medium text-sm">
                {label}
            </Text>
        </TouchableOpacity>
    );
};
