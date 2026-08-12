import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';
import { spacing } from '../theme';

/**
 * The single authority for how far anything pinned to the bottom of the screen must sit above it.
 *
 * Every floating element previously guessed: `Toast` was `absolute bottom-20`, `OfflineBanner` was
 * `absolute bottom-0`, and the readings screen carried its own `paddingBottom: 140`. On a device
 * with gesture navigation those land under the system bar; on a tab route they land under the tab
 * bar. Both were invisible in the emulator defaults and obvious on a real phone.
 *
 * The pieces that make up the offset:
 *
 *  - `insets.bottom`    — the home indicator (iOS) or gesture pill / nav bar (Android). Zero on
 *                         three-button navigation, where the system bar sits outside the app window.
 *  - the tab bar        — only on `(tabs)` routes. It is absolutely positioned by `ImmersiveTabBar`,
 *                         so content does NOT automatically clear it. Returned separately as
 *                         `tabBarHeight` because it animates: during immersive reading the bar
 *                         slides away and anything anchored to it should follow, which has to be
 *                         driven from the `chrome` shared value on the UI thread rather than here.
 *  - the keyboard       — iOS only. Android runs `softwareKeyboardLayoutMode: "resize"`
 *                         (app.json), so the window itself shrinks and adding the keyboard height
 *                         again would push content up by twice the keyboard.
 *
 * Consumers: `ToastProvider`, `OfflineBanner`, and `useTabBarClearance` (scroll padding).
 */

/** Breathing room between a floating element and whatever sits below it. */
export const BOTTOM_CHROME_GAP = 12;

export interface BottomChromeOffset {
    /** Fixed part of the offset: safe-area inset + keyboard + gap. Never animates. */
    base: number;
    /** Tab bar height on tab routes, 0 elsewhere. Animate this against the reading-mode chrome. */
    tabBarHeight: number;
    /** `base + tabBarHeight` — for static elements that do not follow the tab bar. */
    total: number;
    isTabRoute: boolean;
    isKeyboardVisible: boolean;
}

export const useBottomChromeOffset = (): BottomChromeOffset => {
    const insets = useSafeAreaInsets();
    const segments = useSegments();
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        // Android resizes the window instead of overlaying, so there is nothing to compensate for.
        if (Platform.OS !== 'ios') return;

        // `Will*` on iOS so the toast moves with the keyboard animation rather than after it.
        const showSub = Keyboard.addListener('keyboardWillShow', (event) => {
            setKeyboardHeight(event.endCoordinates.height);
        });
        const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const isTabRoute = segments[0] === '(tabs)';
    const tabBarHeight = isTabRoute ? spacing.tabBarHeight : 0;

    // With the keyboard up it already covers the home indicator, so counting the inset as well
    // leaves a visible dead strip.
    const base = (keyboardHeight > 0 ? keyboardHeight : insets.bottom) + BOTTOM_CHROME_GAP;

    return {
        base,
        tabBarHeight,
        total: base + tabBarHeight,
        isTabRoute,
        isKeyboardVisible: keyboardHeight > 0,
    };
};
