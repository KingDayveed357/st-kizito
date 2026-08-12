import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
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
import { CalendarIconButton } from '../../src/components/ui/CalendarIconButton';
import { ReadingSection } from '../../src/components/liturgical/ReadingSection';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { OfflineBanner } from '../../src/components/ui/OfflineBanner';
import { useTabBarClearance } from '../../src/hooks/useTabBarClearance';
import { useFavourites } from '../../src/hooks/useFavourites';
import { useAppStore } from '../../src/store/useAppStore';
import { getCalendar, getDatePresentation, getTodayIso } from '../../src/services/liturgicalData';
import { useCelebration } from '../../src/hooks/useCelebration';
import { CelebrationSelector } from '../../src/components/liturgical/CelebrationSelector';
import { getLiturgicalClosing } from '../../src/utils/liturgicalClosings';
import { selectPsalmBodyVerses } from '../../src/utils/psalm';
import { useReadingChrome } from '../../src/hooks/useReadingChrome';
import { ReadingsSkeleton } from '../../src/components/liturgical/LiturgicalSkeletons';
import { ReadingsShareSheet } from '../../src/components/liturgical/ReadingsShareSheet';
import { getShareableBlocks } from '../../src/utils/shareReadings';

const HORIZONTAL_PADDING = 24;
const SECTION_SCROLL_OFFSET = 148;

export default function ReadingsScreen(
    { showBack = false, dateOverride }: { showBack?: boolean; dateOverride?: string } = {}
) {
    const { colors, allColors, textScale, lineHeightScale } = useTheme();
    const insets = useSafeAreaInsets();
    // Single source for how far the tab bar reaches up; see useBottomChromeOffset.
    const tabBarClearance = useTabBarClearance();

    // Responsorial Psalm text scaling (audit #6/#11): the inline psalm previously used hardcoded
    // NativeWind sizes and so ignored the text-size control, unlike readings/gospel.
    const psalmBodySize = 18 * textScale;
    const psalmVerseSize = 16 * textScale;
    const psalmLineHeight = 28 * textScale * lineHeightScale;
    const psalmMarkerSize = 18 * textScale;
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const { toggleFavourite, isFavourite } = useFavourites();
    const { selectedDate, setSource } = useAppStore();
    const readingChrome = useReadingChrome();

    // `dateOverride` (from the dated `/readings/[date]` route — bookmarks, history, deep links) makes
    // this screen a *controlled, read-only* view of one specific day. It must NOT read or write the
    // global `selectedDate`, otherwise opening a bookmarked reading poisons the Readings and Divine
    // Office tabs with that date (the P1 "shared state" bugs). Only the live tab (no override) tracks
    // the global date, which the Calendar — the deliberate date-browsing surface — owns.
    const baseDate = dateOverride ?? selectedDate;
    const effectiveDate = getCalendar(baseDate) ? baseDate : getTodayIso();
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
    // Section Y-offsets are stored in a ref, NOT state: onLayout refires when custom fonts finish
    // loading (text metrics change), and writing that to state caused a re-render → layout shift →
    // active-pill oscillation loop (the "flicker", see audit #2). A ref updates silently.
    const sectionOffsetsRef = useRef<Record<string, number>>({});
    // While a tab-press animates the scroll, ignore scroll-spy so intermediate sections don't
    // briefly steal the active pill (e.g. psalm flashing selected on the way to gospel).
    const programmaticScrollRef = useRef(false);
    const programmaticScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (programmaticScrollTimer.current) clearTimeout(programmaticScrollTimer.current);
    }, []);

    // Reset tab selection and section offsets when the date changes. This covers two cases:
    //  1. The tab screen: user picks a new date from the calendar → effectiveDate changes.
    //  2. The stack `/readings/[date]` screen: Expo Router may reuse this component instance
    //     with a different `dateOverride`, so the old `activeTabId` could reference a block ID
    //     that doesn't exist in the new date's readings, or (worse) accidentally match one that
    //     does, silently leaving the wrong section highlighted (Bug #3 / Bug #2 tab artifact).
    useEffect(() => {
        setActiveTabId(null);
        sectionOffsetsRef.current = {};
    }, [effectiveDate]);

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
        sectionOffsetsRef.current[id] = event.nativeEvent.layout.y;
    };

    const handleTabPress = (id: string) => {
        setActiveTabId(id);
        const offset = sectionOffsetsRef.current[id];
        if (offset !== undefined) {
            // Lock scroll-spy for the duration of the animated scroll.
            programmaticScrollRef.current = true;
            if (programmaticScrollTimer.current) clearTimeout(programmaticScrollTimer.current);
            programmaticScrollTimer.current = setTimeout(() => {
                programmaticScrollRef.current = false;
            }, 500);
            scrollViewRef.current?.scrollTo({
                y: Math.max(0, offset - SECTION_SCROLL_OFFSET),
                animated: true,
            });
        }
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        // Ignore scroll events triggered by a tab-press animation — the target pill is already set.
        if (programmaticScrollRef.current) return;

        // Drive the immersive tab bar (hide on scroll down, reveal on scroll up). This only writes
        // to a shared value — no re-render — so the scroll-spy below is unaffected.
        readingChrome.onScroll(event.nativeEvent.contentOffset.y);

        const currentY = event.nativeEvent.contentOffset.y + SECTION_SCROLL_OFFSET;

        let nextActiveId = activeTabId;
        let minDiff = Infinity;

        // Find closest section
        for (const [id, offset] of Object.entries(sectionOffsetsRef.current)) {
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

    // Share sheet — local state only; never mutates date, liturgy, or bookmark state.
    const [shareSheetVisible, setShareSheetVisible] = useState(false);

    // Whether there is any content worth sharing (disables the button if not).
    const hasShareableContent = useMemo(
        () => getShareableBlocks(blocksToRender).length > 0,
        [blocksToRender],
    );

    // The share context is derived from data already loaded by useCelebration.
    // Memoised so the sheet doesn't rebuild its options on every parent render.
    const shareCelebrationTitle = useMemo(
        () => activeCelebration?.title ?? data?.feastName ?? 'Daily Readings',
        [activeCelebration, data],
    );

    const shareFormattedDate = useMemo(
        () => presentation?.formattedDate ?? effectiveDate,
        [presentation, effectiveDate],
    );

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
        return <ReadingsSkeleton />;
    }

    if (!data) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                {showBack && (
                    <View style={[styles.headerRow, { paddingHorizontal: HORIZONTAL_PADDING }]}>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                            onPress={() => router.back()}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
                        >
                            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                )}
                <EmptyState
                    icon={<Ionicons name="book-outline" size={44} color={colors.textMuted} />}
                    title="No Readings Available"
                    subtitle="We couldn't find the readings for this day. Try choosing another date from the calendar."
                    actionLabel="Open Calendar"
                    onAction={() => {
                        setSource('readings');
                        router.push('/calendar');
                    }}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={styles.headerShell}>
                <View style={[styles.headerRow, { paddingHorizontal: HORIZONTAL_PADDING }]}>
                    {showBack && (
                        // Opened as a stack screen (from Favourites/Calendar) there is no tab bar,
                        // so provide an explicit, accessible way back — otherwise users are stranded
                        // with only the system gesture (audit #3).
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                            onPress={() => router.back()}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={[styles.backButton, { backgroundColor: colors.surfaceElevated }]}
                        >
                            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                    )}
                    <View style={styles.titleBlock}>
                        {/*
                          * The DAY'S CELEBRATION is the identity of the page and leads the
                          * hierarchy; the date is supporting context. Previously the date was the
                          * 22px headline and the celebration was an 11px uppercase meta line, so
                          * "Saint Jean Vianney (the Curé of Ars), Priest" was the least prominent
                          * text on the screen.
                          *
                          * The date had then over-corrected to 11px uppercase — legible for someone
                          * with sharp eyes, not for the congregation this app is actually for. It
                          * is now 15px sentence case: clearly readable, still subordinate to the
                          * celebration below it.
                          *
                          * `flexShrink` on the container plus `numberOfLines={1}` is what keeps a
                          * long date ("Wednesday, 24 September 2026") from pushing the text-size
                          * control and calendar button off the right edge on a 320dp screen at
                          * textScale 1.4 — it truncates instead of displacing the controls.
                          */}
                        <Text
                            numberOfLines={1}
                            style={{
                                color: colors.textSecondary,
                                fontSize: 15 * textScale,
                                lineHeight: 20 * textScale * lineHeightScale,
                            }}
                            className="font-sans font-semibold"
                        >
                            {presentation?.formattedDate ?? effectiveDate}
                        </Text>
                    </View>
                    {/* `flexShrink: 0` — the controls keep their full touch targets regardless of
                        how long the date string is or how far the user has scaled text up. */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
                        <TextSizeControl />
                        <CalendarIconButton
                            accessibilityLabel="Open calendar"
                            color={accentColor}
                            onPress={() => {
                                setSource('readings');
                                router.push('/calendar');
                            }}
                            style={{ marginLeft: 12 }}
                        />
                    </View>
                </View>

                <View style={[styles.metaRow, { paddingHorizontal: HORIZONTAL_PADDING }]}>
                    {/* Liturgical colour rail — ties the celebration to its season at a glance. */}
                    <View
                        style={{
                            backgroundColor: accentColor,
                            width: 3,
                            borderRadius: 999,
                            alignSelf: 'stretch',
                            minHeight: 26,
                        }}
                    />
                    <Text
                        style={{
                            color: colors.textPrimary,
                            flex: 1,
                            fontSize: 20 * textScale,
                            lineHeight: 27 * textScale * lineHeightScale,
                        }}
                        className="font-serif font-bold"
                    >
                        {activeCelebration?.title ?? data.feastName ?? 'Daily Readings'}
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
                    // Was a bare `140 + insets.bottom`: a magic number that would silently drift
                    // from `spacing.tabBarHeight`. The extra 75 is this screen's own floating
                    // save/share cluster, which sits above the tab bar.
                    paddingBottom: tabBarClearance + 75,
                }}
                onScroll={handleScroll}
                onMomentumScrollEnd={() => { programmaticScrollRef.current = false; }}
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

                                    {/*
                                      * Structured rendering: the refrain is stated once, then each
                                      * stanza is followed by the refrain — which is how the psalm is
                                      * actually prayed. Previously the refrain repetitions arrived
                                      * inside the verse list and were drawn as sibling blocks, so a
                                      * 3-stanza psalm rendered as 8–9 fragments.
                                      */}
                                    {block.response && (
                                        <View className="mt-7 items-center">
                                            <Text style={{ color: colors.accent, fontSize: psalmMarkerSize }} className="font-serif font-bold italic">
                                                R/
                                            </Text>
                                            <Text style={{ color: colors.textPrimary, fontSize: psalmBodySize, lineHeight: psalmLineHeight }} className="mt-2 text-center font-serif font-bold">
                                                {block.response}
                                            </Text>
                                        </View>
                                    )}

                                    {block.stanzas?.length
                                        ? block.stanzas.map((stanza, stanzaIndex) => (
                                              <View key={`stanza-${stanzaIndex}`}>
                                                  <View style={styles.psalmStanza}>
                                                      {/* Each poetic line is its own Text so the
                                                        * source's line breaks are preserved and only
                                                        * over-long lines wrap. */}
                                                      {stanza.lines.map((line, lineIndex) => (
                                                          <Text
                                                              key={`line-${lineIndex}`}
                                                              style={{
                                                                  color: colors.textPrimary,
                                                                  fontSize: psalmVerseSize,
                                                                  lineHeight: psalmLineHeight,
                                                              }}
                                                              className="font-serif"
                                                          >
                                                              {line}
                                                          </Text>
                                                      ))}
                                                  </View>

                                                  {block.response && (
                                                      <View style={styles.psalmRefrainRepeat}>
                                                          <Text
                                                              style={{ color: colors.accent, fontSize: psalmVerseSize }}
                                                              className="font-serif font-bold italic"
                                                          >
                                                              R/{' '}
                                                          </Text>
                                                          <Text
                                                              style={{
                                                                  color: colors.textSecondary,
                                                                  fontSize: psalmVerseSize,
                                                                  lineHeight: psalmLineHeight,
                                                                  flex: 1,
                                                              }}
                                                              className="font-serif italic"
                                                          >
                                                              {block.response}
                                                          </Text>
                                                      </View>
                                                  )}
                                              </View>
                                          ))
                                        : /* Legacy fallback: flat verse list (Divine Office / older data). */
                                          selectPsalmBodyVerses(block.verses).map((verse, index) => (
                                              <View key={`${verse.text}-${index}`} style={styles.psalmVerseRow}>
                                                  <Text style={{ color: colors.accent, marginTop: 3, fontSize: psalmMarkerSize }} className="mr-3 font-serif font-bold italic">
                                                      {verse.type === 'response' ? 'R/' : 'V/'}
                                                  </Text>
                                                  <Text style={{ color: colors.textPrimary, flex: 1, fontSize: psalmVerseSize, lineHeight: psalmLineHeight }} className="font-serif">
                                                      {verse.text}
                                                  </Text>
                                              </View>
                                          ))}

                                    {!block.stanzas?.length && !block.verses?.length && block.text && (
                                        <Text style={{ color: colors.textPrimary, fontSize: psalmVerseSize, lineHeight: psalmLineHeight }} className="mt-4 text-center font-serif">
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
                                closing={block.text ? getLiturgicalClosing(block.type) : null}
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
                        bottom: tabBarClearance + 11,
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
                    accessibilityLabel="Share today's readings"
                    accessibilityHint="Opens share options for the liturgical readings"
                    accessibilityState={{ disabled: !hasShareableContent }}
                    activeOpacity={0.85}
                    disabled={!hasShareableContent}
                    onPress={() => setShareSheetVisible(true)}
                    style={[
                        styles.floatingButton,
                        {
                            backgroundColor: colors.surface,
                            borderColor: hasShareableContent ? accentColor : colors.surfaceElevated,
                            opacity: hasShareableContent ? 1 : 0.4,
                        },
                    ]}
                >
                    <Ionicons name="share-social" size={20} color={accentColor} />
                </TouchableOpacity>
            </View>

            <OfflineBanner />

            {/* Share sheet — rendered outside the scroll, isolated from reading state */}
            <ReadingsShareSheet
                visible={shareSheetVisible}
                onDismiss={() => setShareSheetVisible(false)}
                blocksToRender={blocksToRender}
                celebrationTitle={shareCelebrationTitle}
                formattedDate={shareFormattedDate}
                accentColor={accentColor}
            />
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
        alignItems: 'center',
        gap: 12,
        paddingTop: 12,
    },
    psalmVerseRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 24,
    },
    psalmStanza: {
        marginTop: 26,
    },
    psalmRefrainRepeat: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(128,128,128,0.25)',
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
        // Explicit: `flex: 1` alone lets a long single-line date force the row wider than the
        // screen rather than truncating, which is how the controls got pushed off-screen.
        flexShrink: 1,
        minWidth: 0,
        paddingRight: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
});
