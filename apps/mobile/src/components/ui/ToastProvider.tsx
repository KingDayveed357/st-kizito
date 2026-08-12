import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useBottomChromeOffset } from '../../hooks/useBottomChromeOffset';
import { useReadingMode } from '../reading/ReadingModeProvider';

/**
 * The app's single toast layer.
 *
 * Replaces five independent copies of the same `useState` + `setTimeout` pattern (booking payment,
 * donation payment, sacrament form, parish tab, …), each rendering a `<Toast>` hardcoded to
 * `absolute bottom-20`. Two problems that fixed:
 *
 *  1. **Position.** 80px is under the tab bar on a tab route, and under the Android gesture bar on
 *     a tall phone. Positioning now comes from `useBottomChromeOffset`, and the tab-bar portion is
 *     interpolated from the reading-mode `chrome` shared value so a toast follows the tab bar as it
 *     glides away instead of hanging in mid-air.
 *  2. **Collisions.** A second toast used to replace the first mid-read. Messages now queue.
 *
 * Mounted once in `app/_layout.tsx`, inside `ReadingModeProvider` (it reads `chrome`) and inside
 * `SafeAreaProvider` (it reads insets).
 */

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
    durationMs: number;
}

interface ToastContextValue {
    /**
     * Queue a toast. Returns immediately; messages are shown one at a time in order.
     *
     * Errors default to a longer dwell — they usually carry an instruction, and 1.6s was not
     * enough to read one.
     */
    showToast: (message: string, type?: ToastType, durationMs?: number) => void;
    /** Clear the current message and anything queued behind it (e.g. on navigating away). */
    dismissToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS: Record<ToastType, number> = {
    success: 2200,
    info: 2600,
    error: 4000,
};

const ICON: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
    success: 'checkmark-circle',
    error: 'alert-circle',
    info: 'information-circle',
};

export const useToast = (): ToastContextValue => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider (mounted in app/_layout.tsx).');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [queue, setQueue] = useState<ToastMessage[]>([]);
    const nextId = useRef(0);

    const showToast = useCallback((message: string, type: ToastType = 'info', durationMs?: number) => {
        const trimmed = message.trim();
        if (!trimmed) return;

        setQueue((current) => {
            // Guard against a re-render or a double tap enqueueing the same sentence twice.
            if (current.some((item) => item.message === trimmed)) return current;
            return [
                ...current,
                { id: nextId.current++, message: trimmed, type, durationMs: durationMs ?? DEFAULT_DURATION_MS[type] },
            ];
        });
    }, []);

    const dismissToast = useCallback(() => setQueue([]), []);

    const advance = useCallback(() => setQueue((current) => current.slice(1)), []);

    const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastHost current={queue[0] ?? null} onDone={advance} />
        </ToastContext.Provider>
    );
};

const ToastHost: React.FC<{ current: ToastMessage | null; onDone: () => void }> = ({ current, onDone }) => {
    const { colors, allColors } = useTheme();
    const { base, tabBarHeight } = useBottomChromeOffset();
    const { chrome } = useReadingMode();
    const progress = useSharedValue(0);

    // Screen readers do not benefit from a message that vanishes on a timer, so announce it
    // directly as well; `accessibilityLiveRegion` covers TalkBack, `announceForAccessibility`
    // covers VoiceOver.
    useEffect(() => {
        if (!current) return;
        if (Platform.OS === 'ios') {
            AccessibilityInfo.announceForAccessibility(current.message);
        }
    }, [current]);

    useEffect(() => {
        if (!current) {
            progress.value = withTiming(0, { duration: 160 });
            return;
        }

        progress.value = withTiming(1, { duration: 200 });
        const timer = setTimeout(() => {
            progress.value = withTiming(0, { duration: 180 });
            // Let the exit animation finish before unmounting, otherwise the next message in the
            // queue snaps in with no transition.
            setTimeout(onDone, 190);
        }, current.durationMs);

        return () => clearTimeout(timer);
    }, [current, onDone, progress]);

    const animatedStyle = useAnimatedStyle(() => ({
        // `chrome` runs 1 (visible) → 0 (hidden) during immersive reading; the toast tracks the tab
        // bar so it never floats over a gap or drops behind the system navigation.
        bottom: base + interpolate(chrome.value, [0, 1], [0, tabBarHeight], Extrapolation.CLAMP),
        opacity: progress.value,
        transform: [{ translateY: interpolate(progress.value, [0, 1], [12, 0], Extrapolation.CLAMP) }],
    }));

    if (!current) return null;

    const background =
        current.type === 'success'
            ? allColors.success
            : current.type === 'error'
              ? allColors.error
              : colors.textPrimary;

    return (
        <Animated.View pointerEvents="none" style={[styles.container, animatedStyle]}>
            <View style={[styles.pill, { backgroundColor: background }]}>
                <Ionicons name={ICON[current.type]} size={16} color={colors.background} />
                <Text
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                    style={[styles.text, { color: colors.background }]}
                >
                    {current.message}
                </Text>
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
        zIndex: 100,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        maxWidth: '100%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        // Elevation keeps it above the tab bar on Android, where zIndex alone is not enough.
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    text: {
        flexShrink: 1,
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 19,
    },
});
