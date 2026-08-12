import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { galleryImageUrl } from '../../services/api/gallery.api';
import type { GalleryImage } from '../../types/gallery.types';

interface GalleryViewerProps {
    images: GalleryImage[];
    /** Index to open on; null closes the viewer. */
    initialIndex: number | null;
    onClose: () => void;
}

/**
 * Full-screen photograph viewer.
 *
 * Tapping a gallery image previously did nothing at all — `onImagePress` was `() => {}`.
 *
 * Deliberately built on `FlatList` with paging rather than a gesture library: the app already
 * carries `react-native-reanimated` and `react-native-gesture-handler`, but a pinch-zoom pager
 * would mean either a new dependency (against the bundle budget) or a substantial amount of gesture
 * code to maintain. Horizontal paging plus a close button covers what a parishioner actually does
 * here — look through the photographs from a celebration — and `windowSize` keeps only the
 * neighbouring images in memory.
 */
export const GalleryViewer: React.FC<GalleryViewerProps> = ({ images, initialIndex, onClose }) => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const listRef = useRef<FlatList<GalleryImage>>(null);
    const [currentIndex, setCurrentIndex] = useState(initialIndex ?? 0);

    useEffect(() => {
        if (initialIndex !== null) setCurrentIndex(initialIndex);
    }, [initialIndex]);

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
            const index = viewableItems[0]?.index;
            if (typeof index === 'number') setCurrentIndex(index);
        },
    ).current;

    const renderItem = useCallback(
        ({ item }: { item: GalleryImage }) => (
            <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
                <Image
                    source={{ uri: galleryImageUrl(item.storagePath) }}
                    style={{ width, height: height * 0.8 }}
                    // `contain`, not `cover`: at full screen the point is to see the whole
                    // photograph, not to fill the frame.
                    contentFit="contain"
                    transition={140}
                    recyclingKey={item.id}
                    cachePolicy="disk"
                    accessibilityLabel={item.caption ?? 'Parish photograph'}
                />
            </View>
        ),
        [width, height],
    );

    if (initialIndex === null) return null;

    const current = images[currentIndex];

    return (
        <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <StatusBar barStyle="light-content" />
            <View style={styles.backdrop}>
                <FlatList
                    ref={listRef}
                    data={images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={initialIndex}
                    // Fixed page width, so the list can jump straight to the tapped photograph
                    // instead of measuring its way there.
                    getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
                    windowSize={3}
                    initialNumToRender={1}
                    maxToRenderPerBatch={2}
                />

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Close photograph"
                    onPress={onClose}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={[styles.close, { top: insets.top + 12 }]}
                >
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={[styles.footer, { bottom: insets.bottom + 20 }]}>
                    {current?.caption ? (
                        <Text style={styles.caption} numberOfLines={3}>
                            {current.caption}
                        </Text>
                    ) : null}
                    {images.length > 1 ? (
                        <Text style={styles.counter}>
                            {currentIndex + 1} of {images.length}
                        </Text>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: '#000000',
    },
    close: {
        position: 'absolute',
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    footer: {
        position: 'absolute',
        left: 24,
        right: 24,
        alignItems: 'center',
        gap: 6,
    },
    caption: {
        color: '#FFFFFF',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    counter: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
    },
});
