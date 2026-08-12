import React from 'react';
import { View, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../hooks/useTheme';
import { galleryImageUrl } from '../../services/api/gallery.api';
import type { GalleryAlbum, GalleryImage } from '../../types/gallery.types';

interface GalleryGridProps {
    albums: GalleryAlbum[];
    onImagePress: (image: GalleryImage) => void;
}

const formatEventDate = (iso: string | null): string | null => {
    if (!iso) return null;
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

/**
 * Album-grouped parish gallery.
 *
 * The previous version faked a masonry layout by making the first image full-width and every other
 * one a fixed 48% × 128px box, which cropped portrait photographs to a letterbox strip. Layout is
 * now driven by each image's real aspect ratio: the first photograph of an album leads at its own
 * proportions, and the rest tile in pairs.
 *
 * `recyclingKey` matters here — without it `expo-image` shows the previous photograph in a reused
 * view for a frame while the new one decodes, which on a fast scroll reads as images flickering
 * between each other.
 */
export const GalleryGrid: React.FC<GalleryGridProps> = ({ albums, onImagePress }) => {
    const { colors } = useTheme();
    const { width } = useWindowDimensions();

    // 20px screen padding each side, 8px gutter between the paired tiles.
    const contentWidth = width - 40;
    const tileWidth = (contentWidth - 8) / 2;

    const aspectRatio = (image: GalleryImage, fallback: number) =>
        image.width && image.height ? image.width / image.height : fallback;

    return (
        <View>
            {albums.map((album) => {
                const [lead, ...rest] = album.images;
                const eventDate = formatEventDate(album.eventDate);

                return (
                    <View key={album.id} style={{ marginBottom: 30 }}>
                        <Text
                            style={{ color: colors.textPrimary, fontSize: 17, marginBottom: 2 }}
                            className="font-serif font-bold"
                        >
                            {album.title}
                        </Text>
                        {eventDate ? (
                            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 10 }}>
                                {eventDate}
                            </Text>
                        ) : (
                            <View style={{ height: 10 }} />
                        )}

                        {lead ? (
                            <TouchableOpacity
                                accessibilityRole="imagebutton"
                                accessibilityLabel={lead.caption ?? `Photograph from ${album.title}`}
                                activeOpacity={0.9}
                                onPress={() => onImagePress(lead)}
                                style={{ marginBottom: 8 }}
                            >
                                <Image
                                    source={{ uri: galleryImageUrl(lead.storagePath) }}
                                    style={{
                                        width: contentWidth,
                                        // Capped so a very tall portrait cannot take a whole screen
                                        // on its own and push the rest of the album out of view.
                                        aspectRatio: Math.max(aspectRatio(lead, 4 / 3), 0.8),
                                        borderRadius: 14,
                                        backgroundColor: colors.surfaceElevated,
                                    }}
                                    contentFit="cover"
                                    transition={180}
                                    recyclingKey={lead.id}
                                    cachePolicy="disk"
                                />
                            </TouchableOpacity>
                        ) : null}

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {rest.map((image) => (
                                <TouchableOpacity
                                    key={image.id}
                                    accessibilityRole="imagebutton"
                                    accessibilityLabel={image.caption ?? `Photograph from ${album.title}`}
                                    activeOpacity={0.9}
                                    onPress={() => onImagePress(image)}
                                >
                                    <Image
                                        source={{ uri: galleryImageUrl(image.storagePath) }}
                                        style={{
                                            width: tileWidth,
                                            // Square tiles in the pair grid: a consistent rhythm
                                            // reads better than rows of mismatched heights, and
                                            // `cover` keeps the subject centred.
                                            height: tileWidth,
                                            borderRadius: 12,
                                            backgroundColor: colors.surfaceElevated,
                                        }}
                                        contentFit="cover"
                                        transition={180}
                                        recyclingKey={image.id}
                                        cachePolicy="disk"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );
            })}
        </View>
    );
};
