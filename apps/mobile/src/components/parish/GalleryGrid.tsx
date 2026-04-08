import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../hooks/useTheme';

export interface GalleryItemType {
    id: string;
    uri: string;
    spanCount?: number; // basic masonry-like stub
}

interface GalleryGridProps {
    items: GalleryItemType[];
    onImagePress: (item: GalleryItemType) => void;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({ items, onImagePress }) => {
    return (
        <View className="flex-row flex-wrap justify-between pr-[-8px]">
            {items.map((item, index) => {
                // Mock a masonry grid by using specific widths occasionally
                const isLarge = index === 0;
                return (
                    <TouchableOpacity
                        key={item.id}
                        onPress={() => onImagePress(item)}
                        className={`mb-2 ${isLarge ? 'w-full h-48' : 'w-[48%] h-32'}`}
                    >
                        <Image
                            source={{ uri: item.uri }}
                            style={{ width: '100%', height: '100%', borderRadius: 12 }}
                            contentFit="cover"
                            transition={200}
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};