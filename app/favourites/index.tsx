import React, { useMemo, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/hooks/useTheme';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { FavouriteCategory } from '../../src/store/useFavouritesStore';
import { useFavourites } from '../../src/hooks/useFavourites';

const FILTERS: Array<{ key: 'all' | FavouriteCategory; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'reading', label: 'Readings' },
    { key: 'inspiration', label: 'Inspirations' },
    { key: 'prayer', label: 'Prayers' },
];

const formatSavedAt = (savedAt: string) =>
    new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(savedAt));

export default function FavouritesScreen() {
    const { colors, textScale, lineHeightScale } = useTheme();
    const { allItems, removeFavourite } = useFavourites();
    const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]['key']>('all');

    const filteredItems = useMemo(() => {
        if (activeFilter === 'all') {
            return allItems;
        }

        return allItems.filter((item) => item.category === activeFilter);
    }, [activeFilter, allItems]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                title="Favourites"
                rightElement={<Ionicons name="calendar-outline" className='px-screen' size={24} color={colors.accent} />}
            />

            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 56 }}
                ListHeaderComponent={
                    <View
                        style={{
                            backgroundColor: colors.surface,
                            borderRadius: 22,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: 6,
                            flexDirection: 'row',
                            marginBottom: 20,
                        }}
                    >
                        {FILTERS.map((filter) => {
                            const active = filter.key === activeFilter;
                            return (
                                <TouchableOpacity
                                    key={filter.key}
                                    activeOpacity={0.9}
                                    onPress={() => setActiveFilter(filter.key)}
                                    style={{
                                        flex: 1,
                                        minHeight: 44,
                                        borderRadius: 16,
                                        backgroundColor: active ? colors.accent : 'transparent',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={{ color: active ? '#FFFFFF' : colors.textPrimary }} className="font-sans text-[13px] font-semibold">
                                        {filter.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                }
                ListEmptyComponent={
                    <EmptyState
                        title="Nothing saved yet"
                        subtitle="Save a reading or daily inspiration and it will appear here instantly."
                    />
                }
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                renderItem={({ item }) => (
                    <View
                        style={{
                            borderRadius: 28,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: 22,
                        }}
                    >
                        <View className="flex-row items-center justify-between">
                            <Text style={{ color: item.accentColor }} className="font-sans text-[11px] font-bold uppercase tracking-[2px]">
                                {item.sourceLabel ?? item.category}
                            </Text>
                            <Text style={{ color: colors.textMuted }} className="font-sans text-[12px]">
                                Saved {formatSavedAt(item.savedAt)}
                            </Text>
                        </View>

                        <Text
                            style={{
                                color: colors.textPrimary,
                                fontSize: 19 * textScale,
                                lineHeight: 27 * textScale * lineHeightScale,
                                marginTop: 18,
                            }}
                            className="font-serif font-bold"
                        >
                            {item.title}
                        </Text>
                        <Text
                            style={{
                                color: colors.textPrimary,
                                fontSize: 16 * textScale,
                                lineHeight: 28 * textScale * lineHeightScale,
                                marginTop: 14,
                            }}
                            className="font-serif italic"
                        >
                            {item.body}
                        </Text>

                        <View className="flex-row items-center justify-between mt-6">
                            <View className="flex-row items-center">
                                <Ionicons name="bookmark-outline" size={18} color={colors.textSecondary} />
                                <Text style={{ color: colors.textSecondary }} className="font-sans text-[13px] ml-2">
                                    {item.subtitle}
                                </Text>
                            </View>
                            <TouchableOpacity activeOpacity={0.86} onPress={() => removeFavourite(item.id)}>
                                <Text style={{ color: colors.accent }} className="font-sans text-[13px] font-semibold">
                                    Remove
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}
