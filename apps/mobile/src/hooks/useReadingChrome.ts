import { useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useReadingMode } from '../components/reading/ReadingModeProvider';
import { decideChrome } from '../utils/readingChrome';

/**
 * Drives the immersive reading chrome from a screen's scroll position.
 *
 * Design guarantees:
 *  - Reduce-motion ON → auto-hide is fully disabled; chrome stays visible (accessibility).
 *  - On focus (enter) and blur (leave) → chrome resets to visible, so navigation is never lost
 *    and other screens never inherit a hidden tab bar.
 *  - Writes only to a Reanimated shared value → no React re-renders, so the readings screen's
 *    stabilized scroll-spy / flicker-lock logic is completely untouched.
 *
 * Usage: call `onScroll(contentOffsetY)` from the screen's existing scroll handler.
 */
export const useReadingChrome = () => {
    const { show, hide, showInstant } = useReadingMode();
    const lastY = useRef(0);
    const reduceMotion = useRef(false);

    useEffect(() => {
        let mounted = true;
        AccessibilityInfo.isReduceMotionEnabled()
            .then((v) => { if (mounted) reduceMotion.current = v; })
            .catch(() => {});
        const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
            reduceMotion.current = v;
        });
        return () => { mounted = false; sub.remove(); };
    }, []);

    useFocusEffect(
        useCallback(() => {
            lastY.current = 0;
            showInstant();
            return () => showInstant();
        }, [showInstant]),
    );

    const onScroll = useCallback((y: number) => {
        if (reduceMotion.current) {
            showInstant();
            lastY.current = y;
            return;
        }
        const action = decideChrome(lastY.current, y);
        lastY.current = y;
        if (action === 'show') show();
        else if (action === 'hide') hide();
    }, [show, hide, showInstant]);

    return { onScroll };
};
