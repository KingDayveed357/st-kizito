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

const todayIso = new Date().toISOString().slice(0, 10);

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            hasSeeded: false,
            setHasSeeded: (hasSeeded) => set({ hasSeeded }),
            lastSyncTime: null,
            setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),
            selectedDate: todayIso,
            setSelectedDate: (selectedDate) => set({ selectedDate }),
            source: 'readings',
            setSource: (source) => set({ source }),
            setLiturgicalContext: (selectedDate, source) => set({ selectedDate, source }),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
