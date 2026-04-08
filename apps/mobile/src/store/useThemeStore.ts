import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'sepia' | 'high-contrast';
export type LineSpacing = 'compact' | 'standard' | 'relaxed';

interface ThemeState {
    mode: ThemeMode;
    textScale: number;
    lineSpacing: LineSpacing;
    autoSwitch: boolean;
    setMode: (mode: ThemeMode) => void;
    setTextScale: (scale: number) => void;
    setLineSpacing: (spacing: LineSpacing) => void;
    setAutoSwitch: (auto: boolean) => void;
}

interface LegacyThemeState {
    mode?: ThemeMode;
    textScale?: number;
    lineSpacing?: 'normal' | 'comfortable' | 'spacious' | LineSpacing;
    autoSwitch?: boolean;
}

const normalizeLineSpacing = (value?: LegacyThemeState['lineSpacing']): LineSpacing => {
    switch (value) {
        case 'normal':
            return 'compact';
        case 'spacious':
            return 'relaxed';
        case 'comfortable':
        case 'standard':
            return 'standard';
        case 'compact':
        case 'relaxed':
            return value;
        default:
            return 'standard';
    }
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            mode: 'light',
            textScale: 1,
            lineSpacing: 'standard',
            autoSwitch: true,
            setMode: (mode) => set({ mode }),
            setTextScale: (textScale) => set({ textScale }),
            setLineSpacing: (lineSpacing) => set({ lineSpacing }),
            setAutoSwitch: (autoSwitch) => set({ autoSwitch }),
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => AsyncStorage),
            version: 2,
            migrate: (persistedState) => {
                const legacy = persistedState as LegacyThemeState | undefined;

                return {
                    mode: legacy?.mode ?? 'light',
                    textScale: legacy?.textScale ?? 1,
                    lineSpacing: normalizeLineSpacing(legacy?.lineSpacing),
                    autoSwitch: legacy?.autoSwitch ?? true,
                };
            },
        }
    )
);
