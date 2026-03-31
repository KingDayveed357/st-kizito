import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppState {
    hasSeeded: boolean;
    setHasSeeded: (val: boolean) => void;
    lastSyncTime: number | null;
    setLastSyncTime: (time: number) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            hasSeeded: false,
            setHasSeeded: (hasSeeded) => set({ hasSeeded }),
            lastSyncTime: null,
            setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
