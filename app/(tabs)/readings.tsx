import React, { useMemo, useRef, useState } from 'react';
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
import { useTheme } from '../../src/hooks/useTheme';
import { useReadings } from '../../src/hooks/useReadings';
import { TextSizeControl } from '../../src/components/ui/TextSizeControl';
import { ReadingSection } from '../../src/components/liturgical/ReadingSection';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { OfflineBanner } from '../../src/components/ui/OfflineBanner';
import { useFavourites } from '../../src/hooks/useFavourites';

type ReadingTab = 'First Reading' | 'Psalm' | 'Gospel';

const HORIZONTAL_PADDING = 24;
const SECTION_SCROLL_OFFSET = 148;
const TAB_ORDER: ReadingTab[] = ['First Reading', 'Psalm', 'Gospel'];

export default function ReadingsScreen() {
    const { colors, allColors } = useTheme();
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);
    const [activeTab, setActiveTab] = useState<ReadingTab>('First Reading');
    const { toggleFavourite, isFavourite } = useFavourites();
    const [sectionOffsets, setSectionOffsets] = useState<Record<ReadingTab, number>>({
        'First Reading': 0,
        Psalm: 0,
        Gospel: 0,
    });
    const { data, isLoading } = useReadings('2024-06-27');

    const tabPills = useMemo(
        () =>
            TAB_ORDER.map((tab) => ({
                key: tab,
                label: tab,
                isActive: tab === activeTab,
            })),
        [activeTab]
    );

    const handleSectionLayout = (tab: ReadingTab) => (event: LayoutChangeEvent) => {
        const { y } = event.nativeEvent.layout;
        setSectionOffsets((current) => ({ ...current, [tab]: y }));
    };

    const handleTabPress = (tab: ReadingTab) => {
        setActiveTab(tab);
        scrollViewRef.current?.scrollTo({
            y: Math.max(0, sectionOffsets[tab] - SECTION_SCROLL_OFFSET),
            animated: true,
        });
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentY = event.nativeEvent.contentOffset.y + SECTION_SCROLL_OFFSET;
        const nextActiveTab = TAB_ORDER.reduce<ReadingTab>((closestTab, tab) => {
            return currentY >= sectionOffsets[tab] ? tab : closestTab;
        }, 'First Reading');

        if (nextActiveTab !== activeTab) {
            setActiveTab(nextActiveTab);
        }
    };

    const handleShare = async () => {
        if (!data) return;

        await Share.share({
            title: 'Daily Readings',
            message: `${data.feastName}\n${data.gospel.reference}\n\n${data.gospel.text}`,
        });
    };

    const handleSaveReading = () => {
        if (!data) {
            return;
        }

        toggleFavourite({
            id: `reading-${data.date}`,
            category: 'reading',
            title: data.feastName,
            subtitle: data.gospel.reference,
            body: data.gospel.text.slice(0, 180),
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
                            Thursday, June 27
                        </Text>
                    </View>
                    <TextSizeControl />
                </View>

                <View style={[styles.metaRow, { paddingHorizontal: HORIZONTAL_PADDING }]}>
                    <View
                        style={{
                            backgroundColor: allColors.liturgical.ordinaryTime,
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
                        ST. CYRIL OF ALEXANDRIA, BISHOP & DOCTOR
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
                {tabPills.map((tab) => (
                    <Pressable
                        key={tab.key}
                        accessibilityRole="button"
                        accessibilityState={{ selected: tab.isActive }}
                        onPress={() => handleTabPress(tab.key)}
                        style={[
                            styles.tabButton,
                            {
                                backgroundColor: tab.isActive ? allColors.liturgical.ordinaryTime : colors.surfaceElevated,
                            },
                        ]}
                    >
                        <Text
                            style={{ color: tab.isActive ? '#FFFFFF' : colors.textPrimary }}
                            className="font-sans text-[13px] font-semibold"
                        >
                            {tab.label}
                        </Text>
                    </Pressable>
                ))}
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
                <View onLayout={handleSectionLayout('First Reading')}>
                    <ReadingSection
                        label="FIRST READING"
                        reference={data.firstReading.reference}
                        text={data.firstReading.text}
                        showDropCap
                        contentPaddingHorizontal={HORIZONTAL_PADDING}
                        contentPaddingBottom={36}
                    />
                </View>

                <View onLayout={handleSectionLayout('Psalm')} style={{ paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 36 }}>
                    <View
                        style={{ backgroundColor: colors.surfaceElevated }}
                        className="rounded-[30px] px-6 py-8"
                    >
                        <Text
                            style={{ color: colors.accent }}
                            className="text-center font-sans text-[11px] font-bold uppercase tracking-[2px]"
                        >
                            RESPONSORIAL PSALM
                        </Text>
                        <Text
                            style={{ color: colors.textSecondary }}
                            className="mt-2 text-center font-serif text-[13px] italic"
                        >
                            {data.psalm.reference}
                        </Text>

                        <View className="mt-7 items-center">
                            <Text style={{ color: colors.accent }} className="font-serif text-[18px] font-bold italic">
                                R/
                            </Text>
                            <Text
                                style={{ color: colors.textPrimary }}
                                className="mt-2 text-center font-serif text-[18px] font-bold leading-8"
                            >
                                {data.psalm.verses[0].text}
                            </Text>
                        </View>

                        {data.psalm.verses.slice(1).map((verse: { text: string }, index: number) => (
                            <View key={`${verse.text}-${index}`} style={styles.psalmVerseRow}>
                                <Text
                                    style={{ color: colors.accent, marginTop: 3 }}
                                    className="mr-3 font-serif text-[18px] font-bold italic"
                                >
                                    V/
                                </Text>
                                <Text
                                    style={{ color: colors.textPrimary, flex: 1 }}
                                    className="font-serif text-[16px] leading-8"
                                >
                                    {verse.text}
                                </Text>
                            </View>
                        ))}

                        <View className="mt-6 items-center">
                            <Text style={{ color: colors.accent }} className="font-serif text-[18px] font-bold italic">
                                R/
                            </Text>
                            <Text
                                style={{ color: colors.textPrimary }}
                                className="mt-2 text-center font-serif text-[18px] font-bold leading-8"
                            >
                                {data.psalm.verses[0].text}
                            </Text>
                        </View>
                    </View>
                </View>

                <View onLayout={handleSectionLayout('Gospel')}>
                    <View style={{ paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 18 }}>
                        <View style={styles.gospelHeader}>
                            <Text
                                style={{ color: colors.accent }}
                                className="font-sans text-[11px] font-bold uppercase tracking-[2px]"
                            >
                                GOSPEL
                            </Text>
                            <Text style={{ color: colors.textSecondary }} className="font-serif text-[13px] italic">
                                {data.gospel.reference}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.gospelAcclamationCard,
                                { backgroundColor: colors.surfaceElevated },
                            ]}
                        >
                            <Text
                                style={{ color: colors.textPrimary }}
                                className="text-center font-serif text-[16px] italic leading-7"
                            >
                                {data.gospelAcclamation}
                            </Text>
                        </View>
                    </View>

                    <ReadingSection
                        label=""
                        text={data.gospel.text}
                        showDropCap
                        contentPaddingHorizontal={HORIZONTAL_PADDING}
                        contentPaddingBottom={0}
                    />
                </View>
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
    },
    gospelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
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
