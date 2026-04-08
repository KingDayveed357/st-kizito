import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FavouriteCategory = 'reading' | 'inspiration' | 'prayer';

export interface FavouriteItem {
    id: string;
    category: FavouriteCategory;
    title: string;
    subtitle: string;
    body: string;
    accentColor: string;
    savedAt: string;
    route?: string;
    sourceLabel?: string;
}

interface LegacyFavouritesState {
    savedReadings?: string[];
    savedPrayers?: string[];
}

interface FavouritesState {
    items: FavouriteItem[];
    toggleFavourite: (item: Omit<FavouriteItem, 'savedAt'>) => void;
    removeFavourite: (id: string) => void;
    isFavourite: (id: string) => boolean;
}

const createLegacyReading = (id: string): FavouriteItem => ({
    id,
    category: 'reading',
    title: 'Saved Reading',
    subtitle: id,
    body: 'A reading saved in an earlier version of the app.',
    accentColor: '#4A7C59',
    savedAt: new Date().toISOString(),
    route: '/(tabs)/readings',
    sourceLabel: 'Reading',
});

const createLegacyPrayer = (id: string): FavouriteItem => ({
    id,
    category: 'prayer',
    title: 'Saved Prayer',
    subtitle: id,
    body: 'A prayer saved in an earlier version of the app.',
    accentColor: '#6B4E8A',
    savedAt: new Date().toISOString(),
    sourceLabel: 'Prayer',
});

export const useFavouritesStore = create<FavouritesState>()(
    persist(
        (set, get) => ({
            items: [],
            toggleFavourite: (item) => {
                const exists = get().items.some((current) => current.id === item.id);

                if (exists) {
                    set((state) => ({
                        items: state.items.filter((current) => current.id !== item.id),
                    }));
                    return;
                }

                set((state) => ({
                    items: [{ ...item, savedAt: new Date().toISOString() }, ...state.items],
                }));
            },
            removeFavourite: (id) =>
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id),
                })),
            isFavourite: (id) => get().items.some((item) => item.id === id),
        }),
        {
            name: 'favourites-storage',
            storage: createJSONStorage(() => AsyncStorage),
            version: 2,
            migrate: (persistedState) => {
                const nextShape = persistedState as { items?: FavouriteItem[] } | undefined;
                const legacy = persistedState as LegacyFavouritesState | undefined;

                if (nextShape && Array.isArray(nextShape.items)) {
                    return { items: nextShape.items };
                }

                return {
                    items: [
                        ...((legacy?.savedReadings ?? []).map(createLegacyReading)),
                        ...((legacy?.savedPrayers ?? []).map(createLegacyPrayer)),
                    ],
                };
            },
        }
    )
);
