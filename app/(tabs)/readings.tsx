import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useReadings } from '../../src/hooks/useReadings';
import { TextSizeControl } from '../../src/components/ui/TextSizeControl';
import { ReadingSection } from '../../src/components/liturgical/ReadingSection';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { OfflineBanner } from '../../src/components/ui/OfflineBanner';
import { useFavourites } from '../../src/hooks/useFavourites';
import { useAppStore } from '../../src/store/useAppStore';
import { getCalendar, getDatePresentation, getTodayIso } from '../../src/services/liturgicalData';
import { useCelebration } from '../../src/hooks/useCelebration';
import { CelebrationSelector } from '../../src/components/liturgical/CelebrationSelector';

const HORIZONTAL_PADDING = 24;
const SECTION_SCROLL_OFFSET = 148;

export default function ReadingsScreen() {
    const { colors, allColors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const { toggleFavourite, isFavourite } = useFavourites();
    const { selectedDate, setSource } = useAppStore();

    const effectiveDate = getCalendar(selectedDate) ? selectedDate : getTodayIso();
    const presentation = getDatePresentation(effectiveDate);
    const { data: rawData, isLoading } = useReadings(effectiveDate);

    const {
        resolved,
        activeCelebration,
        activeVariantId,
        setActiveVariantId,
        blocksToRender,
        missalDay: data
    } = useCelebration(effectiveDate);

    const [activeTabId, setActiveTabId] = useState<string | null>(null);
    const [sectionOffsets, setSectionOffsets] = useState<Record<string, number>>({});

    const colorMap = {
        green: allColors.liturgical.ordinaryTime,
        purple: allColors.liturgical.adventLent,
        gold: allColors.liturgical.christmasEaster,
    } as const;
    const accentColor = colorMap[data?.liturgicalColor as keyof typeof colorMap] ?? allColors.liturgical.ordinaryTime;

    const visibleBlocks = useMemo(() => {
        return blocksToRender.filter(b => b.type !== 'gospel_acclamation' && b.type !== 'entrance_antiphon' && b.type !== 'communion_antiphon');
    }, [blocksToRender]);

    useEffect(() => {
        if (visibleBlocks.length > 0 && (!activeTabId || !visibleBlocks.find(b => b.id === activeTabId))) {
            setActiveTabId(visibleBlocks[0].id);
        }
    }, [visibleBlocks, activeTabId]);

    const tabPills = useMemo(() => {
        return visibleBlocks.map((block) => ({
            key: block.id,
            label: block.label || 'Reading',
            isActive: block.id === activeTabId,
        }));
    }, [visibleBlocks, activeTabId]);

    const handleSectionLayout = (id: string) => (event: LayoutChangeEvent) => {
        const { y } = event.nativeEvent.layout;
        setSectionOffsets((current) => ({ ...current, [id]: y }));
    };

    const handleTabPress = (id: string) => {
        setActiveTabId(id);
        const offset = sectionOffsets[id];
        if (offset !== undefined) {
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, offset - SECTION_SCROLL_OFFSET),
                animated: true,
            });
        }
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentY = event.nativeEvent.contentOffset.y + SECTION_SCROLL_OFFSET;

        let nextActiveId = activeTabId;
        let minDiff = Infinity;

        // Find closest section
        for (const [id, offset] of Object.entries(sectionOffsets)) {
            if (currentY >= offset - 50) {
                const diff = currentY - offset;
                if (diff < minDiff) {
                    minDiff = diff;
                    nextActiveId = id;
                }
            }
        }

        if (nextActiveId && nextActiveId !== activeTabId) {
            setActiveTabId(nextActiveId);
        }
    };

    const handleShare = async () => {
        if (!data) return;
        const gospelBlock = blocksToRender.find(r => r.type === 'gospel');
        if (!gospelBlock) return;

        await Share.share({
            title: 'Daily Readings',
            message: `${data.feastName}\n${gospelBlock.reference}\n\n${gospelBlock.text}`,
        });
    };

    const handleSaveReading = () => {
        if (!data) return;
        const gospelBlock = blocksToRender.find(r => r.type === 'gospel');
        if (!gospelBlock) return;

        toggleFavourite({
            id: `reading-${data.date}`,
            category: 'reading',
            title: data.feastName,
            subtitle: gospelBlock.reference || 'Gospel',
            body: gospelBlock.text ? gospelBlock.text.slice(0, 180) : '',
            accentColor: colors.accent,
            route: '/readings',
            sourceLabel: 'Reading',
        });
    };

    if (isLoading) {
        return <View style={{ flex: 1, backgroundColor: colors.background }} />;
    }

    if (!data) {
        return <EmptyState title="No Readings Available" />;
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.headerShell}>
                <View style={[styles.headerRow, { paddingHorizontal: HORIZONTAL_PADDING }]}>
                    <View style={styles.titleBlock}>
                        <Text style={{ color: colors.textPrimary }} className="font-serif text-[22px] font-bold">
                            {presentation?.formattedDate ?? effectiveDate}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextSizeControl />
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Open calendar"
                            onPress={() => {
                                setSource('readings');
                                router.push('/calendar');
                            }}
                            style={{ marginLeft: 12 }}
                        >
                            <Ionicons name="calendar-outline" size={22} color={accentColor} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.metaRow, { paddingHorizontal: HORIZONTAL_PADDING }]}>
                    <View
                        style={{
                            backgroundColor: accentColor,
                            width: 7,
                            height: 7,
                            borderRadius: 999,
                            marginTop: 5,
                        }}
                    />
                    <Text
                        style={{ color: colors.textSecondary, flex: 1 }}
                        className="font-sans text-[11px] font-bold uppercase tracking-[1.8px]"
                    >
                        {(activeCelebration?.title ?? data.feastName ?? 'Daily Readings').toUpperCase()}
                    </Text>
                </View>
            </View>

            <View
                style={[
                    styles.tabsRow,
                    {
                        borderBottomColor: colors.surfaceElevated,
                        paddingHorizontal: HORIZONTAL_PADDING,
                    },
                ]}
            >
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: HORIZONTAL_PADDING }}>
                    {tabPills.map((tab) => (
                        <Pressable
                            key={tab.key}
                            accessibilityRole="button"
                            accessibilityState={{ selected: tab.isActive }}
                            onPress={() => handleTabPress(tab.key)}
                            style={[
                                styles.tabButton,
                                {
                                    backgroundColor: tab.isActive ? accentColor : colors.surfaceElevated,
                                },
                            ]}
                        >
                            <Text
                                style={{ color: tab.isActive ? '#FFFFFF' : colors.textPrimary }}
                                className="font-sans text-[13px] font-semibold"
                            >
                                {tab.label.toUpperCase()}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={{
                    paddingTop: 24,
                    paddingBottom: 140 + insets.bottom,
                }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                {resolved.variants && resolved.variants.length > 1 && (
                    <CelebrationSelector 
                        variants={resolved.variants}
                        activeVariantId={activeVariantId}
                        onSelectVariant={setActiveVariantId}
                        accentColor={accentColor}
                    />
                )}

                {blocksToRender.map((block) => {
                    // Rendering Antiphons & Special Acclamations
                    if (block.type === 'entrance_antiphon' || block.type === 'communion_antiphon') {
                        return (
                            <View key={block.id} style={{ paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 36 }}>
                                <Text style={{ color: colors.accent, textAlign: 'center', marginBottom: 8 }} className="font-sans text-[11px] font-bold uppercase tracking-[2px]">
                                    {block.label}
                                </Text>
                                <Text style={{ color: colors.textPrimary, textAlign: 'center', fontStyle: 'italic' }} className="font-serif text-[16px] leading-7">
                                    "{block.text}"
                                </Text>
                            </View>
                        );
                    }

                    if (block.type === 'gospel_acclamation') {
                        return (
                            <View key={block.id} style={{ paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 18 }}>
                                <View style={styles.gospelHeader}>
                                    <Text style={{ color: colors.accent }} className="font-sans text-[11px] font-bold uppercase tracking-[2px]">
                                        GOSPEL ACCLAMATION
                                    </Text>
                                </View>
                                <View style={[styles.gospelAcclamationCard, { backgroundColor: colors.surfaceElevated }]}>
                                    <Text style={{ color: colors.textPrimary }} className="text-center font-serif text-[16px] italic leading-7">
                                        {block.text}
                                    </Text>
                                </View>
                            </View>
                        );
                    }

                    // Rendering Psalms
                    if (block.type === 'psalm') {
                        return (
                            <View key={block.id} onLayout={handleSectionLayout(block.id)} style={{ paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 36 }}>
                                <View style={{ backgroundColor: colors.surfaceElevated }} className="rounded-[30px] px-6 py-8">
                                    <Text style={{ color: colors.accent }} className="text-center font-sans text-[11px] font-bold uppercase tracking-[2px]">
                                        {block.label}
                                    </Text>
                                    <Text style={{ color: colors.textSecondary }} className="mt-2 text-center font-serif text-[13px] italic">
                                        {block.reference}
                                    </Text>

                                    {block.response && (
                                        <View className="mt-7 items-center">
                                            <Text style={{ color: colors.accent }} className="font-serif text-[18px] font-bold italic">
                                                R/
                                            </Text>
                                            <Text style={{ color: colors.textPrimary }} className="mt-2 text-center font-serif text-[18px] font-bold leading-8">
                                                {block.response}
                                            </Text>
                                        </View>
                                    )}

                                    {block.verses && block.verses.slice(1).map((verse, index) => (
                                        <View key={`${verse.text}-${index}`} style={styles.psalmVerseRow}>
                                            <Text style={{ color: colors.accent, marginTop: 3 }} className="mr-3 font-serif text-[18px] font-bold italic">
                                                {verse.type === 'response' ? 'R/' : 'V/'}
                                            </Text>
                                            <Text style={{ color: colors.textPrimary, flex: 1 }} className="font-serif text-[16px] leading-8">
                                                {verse.text}
                                            </Text>
                                        </View>
                                    ))}

                                    {block.response && (
                                        <View className="mt-6 items-center">
                                            <Text style={{ color: colors.accent }} className="font-serif text-[18px] font-bold italic">
                                                R/
                                            </Text>
                                            <Text style={{ color: colors.textPrimary }} className="mt-2 text-center font-serif text-[18px] font-bold leading-8">
                                                {block.response}
                                            </Text>
                                        </View>
                                    )}

                                    {!block.verses?.length && block.text && (
                                        <Text style={{ color: colors.textPrimary }} className="mt-4 text-center font-serif text-[16px] leading-8">
                                            {block.text}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    }

                    // Standard Reading Types
                    return (
                        <View key={block.id} onLayout={handleSectionLayout(block.id)}>
                            {block.type === 'gospel' && (
                                <View style={{ paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 18 }}>
                                    <View style={styles.gospelHeader}>
                                        <Text style={{ color: colors.accent }} className="font-sans text-[11px] font-bold uppercase tracking-[2px]">
                                            {block.label}
                                        </Text>
                                        <Text style={{ color: colors.textSecondary }} className="font-serif text-[13px] italic">
                                            {block.reference}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <ReadingSection
                                label={block.type !== 'gospel' ? block.label.toUpperCase() : ""}
                                reference={block.type !== 'gospel' ? (block.reference || undefined) : undefined}
                                text={block.text || "Actual reading text not available offline."}
                                showDropCap
                                contentPaddingHorizontal={HORIZONTAL_PADDING}
                                contentPaddingBottom={36}
                            />
                        </View>
                    );
                })}
            </ScrollView>

            <View
                pointerEvents="box-none"
                style={[
                    styles.floatingActions,
                    {
                        bottom: 76 + insets.bottom,
                        right: HORIZONTAL_PADDING,
                    },
                ]}
            >
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Save reading"
                    activeOpacity={0.85}
                    onPress={handleSaveReading}
                    style={[
                        styles.floatingButton,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.surfaceElevated,
                        },
                    ]}
                >
                    <Ionicons
                        name={isFavourite(`reading-${data.date}`) ? 'bookmark' : 'bookmark-outline'}
                        size={20}
                        color={colors.accent}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Share reading"
                    activeOpacity={0.85}
                    onPress={handleShare}
                    style={[
                        styles.floatingButton,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.surfaceElevated,
                        },
                    ]}
                >
                    <Ionicons name="share-social" size={20} color={colors.accent} />
                </TouchableOpacity>
            </View>

            <OfflineBanner />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    floatingActions: {
        position: 'absolute',
        zIndex: 20,
        alignItems: 'center',
        gap: 12,
    },
    floatingButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    gospelAcclamationCard: {
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 20,
        marginBottom: 16,
    },
    gospelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    headerRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 8,
    },
    headerShell: {
        paddingBottom: 16,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 8,
        paddingTop: 10,
    },
    psalmVerseRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 24,
    },
    scrollView: {
        flex: 1,
    },
    tabButton: {
        minHeight: 44,
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 11,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    tabsRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        paddingBottom: 16,
    },
    titleBlock: {
        flex: 1,
        paddingRight: 16,
    },
});