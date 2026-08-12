import { supabase } from './supabase';
import type { GalleryAlbum, GalleryImage } from '../../types/gallery.types';

/**
 * Parish gallery data access.
 *
 * The `gallery` bucket is public (see apps/web/db/2026_08_gallery.sql), so image URLs are derived
 * locally rather than signed per request. That keeps `expo-image`'s disk cache useful — a signed
 * URL changes on every fetch, so nothing would ever be a cache hit and every scroll back through
 * the grid would re-download.
 */

const GALLERY_BUCKET = 'gallery';

/** Public URL for a stored object path. Pure and synchronous — safe to call during render. */
export const galleryImageUrl = (storagePath: string): string =>
    supabase.storage.from(GALLERY_BUCKET).getPublicUrl(storagePath).data.publicUrl;

const mapImage = (row: any): GalleryImage => ({
    id: String(row.id),
    albumId: row.album_id ?? null,
    storagePath: String(row.storage_path),
    caption: row.caption ?? null,
    width: typeof row.width === 'number' ? row.width : null,
    height: typeof row.height === 'number' ? row.height : null,
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at ?? '',
});

export const galleryApi = {
    /**
     * Published albums with their images, newest celebration first.
     *
     * One round-trip via an embedded select rather than N+1 queries — a parish with twenty albums
     * would otherwise cost twenty-one requests on a connection that is often the bottleneck.
     * RLS already restricts this to published albums; `published` is not selected because the
     * client has no use for a column that is always true.
     */
    fetchAlbums: async (): Promise<GalleryAlbum[]> => {
        const { data, error } = await supabase
            .from('gallery_albums')
            .select(
                'id, title, description, event_date, sort_order, created_at, ' +
                    'gallery_images (id, album_id, storage_path, caption, width, height, sort_order, created_at)',
            )
            .order('event_date', { ascending: false, nullsFirst: false })
            .order('sort_order', { ascending: true });

        if (error) throw new Error(error.message);

        return (data ?? []).map((row: any): GalleryAlbum => ({
            id: String(row.id),
            title: row.title ?? 'Parish photographs',
            description: row.description ?? null,
            eventDate: row.event_date ?? null,
            sortOrder: Number(row.sort_order ?? 0),
            createdAt: row.created_at ?? '',
            images: (row.gallery_images ?? [])
                .map(mapImage)
                .sort((a: GalleryImage, b: GalleryImage) => a.sortOrder - b.sortOrder),
        }))
        // An album with no photographs yet is real in the admin but meaningless to a parishioner.
        .filter((album: GalleryAlbum) => album.images.length > 0);
    },
};
