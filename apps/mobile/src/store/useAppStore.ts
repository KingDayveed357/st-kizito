import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
    hasSeeded: boolean;
    setHasSeeded: (val: boolean) => void;
    lastSyncTime: number | null;
    setLastSyncTime: (time: number) => void;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    source: 'readings' | 'divineOffice' | 'inspirations';
    setSource: (source: 'readings' | 'divineOffice' | 'inspirations') => void;
    setLiturgicalContext: (date: string, source: 'readings' | 'divineOffice' | 'inspirations') => void;
}

const getTodayIso = () => new Date().toISOString().slice(0, 10);

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            hasSeeded: false,
            setHasSeeded: (hasSeeded) => set({ hasSeeded }),
            lastSyncTime: null,
            setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),
            selectedDate: getTodayIso(),
            setSelectedDate: (selectedDate) => set({ selectedDate }),
            source: 'readings',
            setSource: (source) => set({ source }),
            setLiturgicalContext: (selectedDate, source) => set({ selectedDate, source }),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // `selectedDate` and `source` are intentionally NOT persisted. Persisting the
            // selected date caused the app to reopen on a previous day's readings/office
            // (see docs/ENGINEERING-AUDIT.md #9). The date must always default to *today* on a
            // cold launch; intentional historical browsing is a within-session concern only.
            partialize: (state) => ({
                hasSeeded: state.hasSeeded,
                lastSyncTime: state.lastSyncTime,
            }),
        }
    )
);
