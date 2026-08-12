import React, { useState } from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    SharedValue,
    useAnimatedReaction,
    useAnimatedStyle,
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

interface ScrollToTopButtonProps {
    /** Shared value tracking the scroll offset Y of the list/scrollview. */
    scrollY: SharedValue<number>;
    onPress: () => void;
    /** Appears only after scrolling past this many px. */
    threshold?: number;
    /** Extra bottom offset on top of the safe-area inset (to clear tab bars / floating controls). */
    bottomOffset?: number;
    right?: number;
}

/**
 * Premium "scroll to top" affordance. Fades/rises in only after a meaningful scroll distance,
 * animates on the UI thread, and is positioned above the safe-area (gesture nav) plus any caller
 * offset. A fixed icon size keeps it stable under large font settings.
 */
export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
    scrollY,
    onPress,
    threshold = 480,
    bottomOffset = 24,
    right = 20,
}) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [interactive, setInteractive] = useState(false);

    // Toggle hit-testing so an invisible button never intercepts taps.
    useAnimatedReaction(
        () => scrollY.value > threshold,
        (visible, prev) => {
            if (visible !== prev) runOnJS(setInteractive)(visible);
        },
    );

    const animatedStyle = useAnimatedStyle(() => {
        const p = interpolate(scrollY.value, [threshold - 60, threshold], [0, 1], Extrapolation.CLAMP);
        return {
            opacity: p,
            transform: [{ translateY: (1 - p) * 14 }, { scale: 0.9 + p * 0.1 }] as ViewStyle['transform'],
        };
    });

    return (
        <Animated.View
            pointerEvents={interactive ? 'auto' : 'none'}
            style={[
                styles.container,
                { bottom: insets.bottom + bottomOffset, right },
                animatedStyle,
            ]}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Scroll to top"
                accessibilityElementsHidden={!interactive}
                importantForAccessibility={interactive ? 'yes' : 'no-hide-descendants'}
                hitSlop={8}
                onPress={onPress}
                style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
                <Ionicons name="chevron-up" size={22} color={colors.accent} />
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        zIndex: 40,
    },
    button: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
        elevation: 8,
    },
});
