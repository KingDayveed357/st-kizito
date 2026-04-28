import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CalendarIconButtonProps {
    onPress: () => void;
    color: string;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
}

export const CalendarIconButton: React.FC<CalendarIconButtonProps> = ({
    onPress,
    color,
    style,
    accessibilityLabel = 'Open calendar',
}) => {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            hitSlop={10}
            pressRetentionOffset={12}
            android_ripple={{ color: `${color}22`, borderless: false }}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,
                {
                    backgroundColor: `${color}12`,
                    borderColor: `${color}36`,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                    opacity: pressed ? 0.9 : 1,
                },
                style,
            ]}
        >
            <Ionicons name="calendar-outline" size={22} color={color} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
