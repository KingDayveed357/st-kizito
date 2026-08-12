import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
    /** True once the parishioner has finished or skipped the welcome guide. Persisted. */
    hasSeenGuide: boolean;
    /** Set when the user asks to watch the guide again from More → Settings. */
    isReplaying: boolean;
    /** Hydration flag — prevents flashing the guide before AsyncStorage has been read. */
    hasHydrated: boolean;

    completeGuide: () => void;
    replayGuide: () => void;
    endReplay: () => void;
    setHasHydrated: (value: boolean) => void;
}

/**
 * Tracks whether the parishioner has seen the welcome guide.
 *
 * `hasSeenGuide` is persisted so the guide appears once after install and never nags a returning
 * user. `isReplaying` is deliberately NOT persisted: replaying is a one-off action from Settings and
 * must not survive a restart.
 *
 * `hasHydrated` matters because Zustand's persisted state loads asynchronously — without it, a
 * returning user would see the guide flash on every cold start before storage resolved.
 */
export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            hasSeenGuide: false,
            isReplaying: false,
            hasHydrated: false,

            completeGuide: () => set({ hasSeenGuide: true, isReplaying: false }),
            replayGuide: () => set({ isReplaying: true }),
            endReplay: () => set({ isReplaying: false }),
            setHasHydrated: (hasHydrated) => set({ hasHydrated }),
        }),
        {
            name: 'onboarding-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ hasSeenGuide: state.hasSeenGuide }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);
