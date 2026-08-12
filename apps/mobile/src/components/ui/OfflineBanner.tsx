import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useTheme } from '../../hooks/useTheme';
import { useBottomChromeOffset } from '../../hooks/useBottomChromeOffset';
import { useReadingMode } from '../reading/ReadingModeProvider';

interface OfflineBannerProps {
    /**
     * When the content on this screen was last fetched (`lastUpdated` from `useCachedData`).
     *
     * The banner used to read "Offline • Updated Today" unconditionally — a hardcoded string with
     * no timestamp behind it, so it claimed today's data even when showing a week-old cache. Pass
     * the real value where the screen has one; omit it and the banner simply states it is showing
     * saved content rather than inventing a freshness claim.
     */
    lastUpdatedAt?: number | null;
}

/** "Updated just now" / "Updated 3 hours ago" / "Updated on 4 Aug". */
const describeFreshness = (timestamp: number): string => {
    const minutes = Math.floor((Date.now() - timestamp) / 60_000);
    if (minutes < 2) return 'Updated just now';
    if (minutes < 60) return `Updated ${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Updated ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Updated yesterday';
    if (days < 7) return `Updated ${days} days ago`;

    return `Updated ${new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
};

/**
 * Persistent "you are offline" strip.
 *
 * Positioning comes from `useBottomChromeOffset` rather than the old `absolute bottom-0`, which put
 * it underneath the tab bar and the Android navigation bar — the exact place a user would never see
 * it. Like the toast layer, it tracks the tab bar through the reading-mode `chrome` value.
 */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({ lastUpdatedAt }) => {
    const { isOffline } = useOfflineStatus();
    const { colors } = useTheme();
    const { base, tabBarHeight } = useBottomChromeOffset();
    const { chrome } = useReadingMode();

    const animatedStyle = useAnimatedStyle(() => ({
        bottom: base + interpolate(chrome.value, [0, 1], [0, tabBarHeight], Extrapolation.CLAMP),
    }));

    if (!isOffline) return null;

    const freshness = typeof lastUpdatedAt === 'number' ? describeFreshness(lastUpdatedAt) : 'Showing saved content';

    return (
        <Animated.View pointerEvents="none" style={[styles.container, animatedStyle]}>
            <View
                accessibilityRole="alert"
                accessibilityLabel={`You are offline. ${freshness}.`}
                style={[styles.pill, { backgroundColor: colors.textMuted }]}
            >
                <Ionicons name="cloud-offline-outline" size={14} color="#FFFFFF" />
                <Text style={styles.text}>Offline • {freshness}</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        alignItems: 'center',
        zIndex: 20,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 999,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    text: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
});
