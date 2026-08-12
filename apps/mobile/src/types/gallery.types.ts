/**
 * Parish gallery.
 *
 * Photographs are grouped into albums (a celebration, a feast, a parish project) rather than
 * presented as one undifferentiated stream — a flat grid of hundreds of images has no story and no
 * way to find last Easter.
 */

export interface GalleryImage {
    id: string;
    albumId: string | null;
    /** Object path inside the public `gallery` bucket. Resolve with `galleryImageUrl`. */
    storagePath: string;
    caption: string | null;
    /**
     * Intrinsic size, when the uploader captured it. Used to reserve the right space before the
     * image arrives, so a grid does not reflow as photographs load in.
     */
    width: number | null;
    height: number | null;
    sortOrder: number;
    createdAt: string;
}

export interface GalleryAlbum {
    id: string;
    title: string;
    description: string | null;
    /** When the celebration happened — not when it was uploaded. */
    eventDate: string | null;
    sortOrder: number;
    createdAt: string;
    images: GalleryImage[];
}
