import { useMemo } from 'react';
import { galleryApi } from '../services/api/gallery.api';
import { useCachedData } from './useCachedData';
import { STORAGE_KEYS } from '../utils/constants';
import type { GalleryAlbum, GalleryImage } from '../types/gallery.types';

/**
 * Parish gallery, cache-first.
 *
 * This hook used to return four hardcoded Unsplash URLs after a fake 300ms delay — stock
 * photographs of somebody else's church, presented as the parish's own, and blank with no network.
 * It now reads the real `gallery_albums` / `gallery_images` tables through `useCachedData`, so the
 * album structure survives offline. The photographs themselves are cached by `expo-image`'s disk
 * cache, which is why the bucket is public and URLs are stable rather than signed.
 */
export const useGallery = () => {
    const { data, isLoading, isRefreshing, lastUpdated, refresh } = useCachedData<GalleryAlbum[]>(
        STORAGE_KEYS.gallery,
        () => galleryApi.fetchAlbums(),
    );

    const albums = useMemo<GalleryAlbum[]>(() => data ?? [], [data]);

    /** Every image across every album, in display order — for the full-screen viewer's paging. */
    const images = useMemo<GalleryImage[]>(() => albums.flatMap((album) => album.images), [albums]);

    return { albums, images, isLoading, isRefreshing, lastUpdated, refetch: refresh };
};
