import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme';
import { useReadingMode } from './ReadingModeProvider';

/**
 * The app's bottom tab bar, wrapped so it can glide out of the way during immersive reading.
 * It is absolutely positioned (so reading screens reclaim the space) and translates down / fades
 * out as the shared `chrome` value goes 1 → 0. All animation runs on the UI thread.
 */
export const ImmersiveTabBar: React.FC<BottomTabBarProps> = (props) => {
    const { chrome } = useReadingMode();
    const insets = useSafeAreaInsets();
    const barHeight = spacing.tabBarHeight + insets.bottom;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: interpolate(chrome.value, [0, 1], [barHeight, 0], Extrapolation.CLAMP) },
        ],
        opacity: chrome.value,
    }));

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <BottomTabBar {...props} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
});
