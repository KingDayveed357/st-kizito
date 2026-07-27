import React, { createContext, useContext, useMemo } from 'react';
import { SharedValue, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Holds a single Reanimated shared value describing whether the "reading chrome" (the bottom tab
 * bar, and long-form screen headers) is shown (1) or hidden (0). Because it is a shared value,
 * every consumer animates on the UI thread with ZERO React re-renders — critical for keeping the
 * already-stabilized scroll logic on the readings screen jank-free.
 *
 * Lives at the root so both the tab navigator (which renders the tab bar) and the individual
 * reading screens share the exact same value.
 */
interface ReadingModeContextValue {
    /** 1 = chrome fully shown, 0 = fully hidden. */
    chrome: SharedValue<number>;
    show: () => void;
    hide: () => void;
    set: (visible: boolean) => void;
    /** Instantly (no animation) — used for reduce-motion. */
    showInstant: () => void;
}

const ReadingModeContext = createContext<ReadingModeContextValue | null>(null);

const DURATION = 220;

export const ReadingModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const chrome = useSharedValue(1);

    const value = useMemo<ReadingModeContextValue>(() => ({
        chrome,
        show: () => { chrome.value = withTiming(1, { duration: DURATION }); },
        hide: () => { chrome.value = withTiming(0, { duration: DURATION }); },
        set: (visible: boolean) => { chrome.value = withTiming(visible ? 1 : 0, { duration: DURATION }); },
        showInstant: () => { chrome.value = 1; },
    }), [chrome]);

    return <ReadingModeContext.Provider value={value}>{children}</ReadingModeContext.Provider>;
};

export const useReadingMode = (): ReadingModeContextValue => {
    const ctx = useContext(ReadingModeContext);
    if (!ctx) {
        throw new Error('useReadingMode must be used within a ReadingModeProvider');
    }
    return ctx;
};
