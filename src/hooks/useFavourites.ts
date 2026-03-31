import { useMemo } from 'react';
import { FavouriteCategory, FavouriteItem, useFavouritesStore } from '../store/useFavouritesStore';

export const useFavourites = (category?: FavouriteCategory) => {
    const items = useFavouritesStore((state) => state.items);
    const toggleFavourite = useFavouritesStore((state) => state.toggleFavourite);
    const removeFavourite = useFavouritesStore((state) => state.removeFavourite);
    const isFavourite = useFavouritesStore((state) => state.isFavourite);

    const filteredItems = useMemo(() => {
        if (!category) {
            return items;
        }

        return items.filter((item) => item.category === category);
    }, [category, items]);

    return {
        items: filteredItems,
        allItems: items,
        toggleFavourite: (item: Omit<FavouriteItem, 'savedAt'>) => toggleFavourite(item),
        removeFavourite,
        isFavourite,
    };
};
