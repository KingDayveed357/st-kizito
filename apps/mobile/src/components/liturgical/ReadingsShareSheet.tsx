/**
 * ReadingsShareSheet — Premium share experience for the Readings screen.
 *
 * Architecture:
 *   Readings screen (data already loaded)
 *         ↓
 *   ReadingsShareSheet (this component)  ←  local state only, no global mutations
 *         ↓
 *   shareReadings.ts (pure formatter)
 *         ↓
 *   Native Share.share() / Clipboard
 *
 * The sheet never re-fetches readings. All content is derived from the `blocksToRender`
 * prop passed in from useCelebration, which is already in memory.
 *
 * State isolation guarantee: this component manages only its own internal view state
 * (which reading is previewed, clipboard feedback). It does not mutate selectedDate,
 * active celebration, bookmarks, or any other global application state.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AccessibilityInfo,
    Animated,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import type { LiturgicalBlock } from '../../types/readings.types';
import {
    buildShareOptions,
    formatAllReadings,
    formatSingleReading,
    getShareableBlocks,
    type ShareOption,
} from '../../utils/shareReadings';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReadingsShareSheetProps {
    visible: boolean;
    onDismiss: () => void;
    /** Already-loaded blocks from useCelebration — no additional fetch occurs. */
    blocksToRender: LiturgicalBlock[];
    /** Natural-casing celebration title, e.g. "Saint Jean Vianney, Priest". */
    celebrationTitle: string;
    /** Formatted date string, e.g. "Thursday, 7 August". */
    formattedDate: string;
    /** Liturgical accent colour for the current celebration. */
    accentColor: string;
}

// ---------------------------------------------------------------------------
// Icon mapping per reading type
// ---------------------------------------------------------------------------

const blockTypeIcon = (type: LiturgicalBlock['type']): React.ComponentProps<typeof Ionicons>['name'] => {
    switch (type) {
        case 'first_reading':
        case 'vigil_reading':
        case 'supplemental_reading':
        case 'reading':
            return 'book-outline';
        case 'psalm':
            return 'musical-notes-outline';
        case 'second_reading':
            return 'documents-outline';
        case 'gospel':
        case 'procession_gospel':
            return 'sparkles-outline';
        default:
            return 'book-outline';
    }
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Top drag handle — purely visual affordance for the bottom sheet. */
const DragHandle: React.FC<{ color: string }> = ({ color }) => (
    <View style={[styles.dragHandle, { backgroundColor: color }]} />
);

/** One row in the individual readings section. */
const ReadingOptionRow: React.FC<{
    option: ShareOption;
    accentColor: string;
    onPress: (option: ShareOption) => void;
}> = React.memo(({ option, accentColor, onPress }) => {
    const { colors } = useTheme();
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Share ${option.label}`}
            accessibilityHint={
                option.reference
                    ? `Shares the ${option.label}, ${option.reference}`
                    : `Shares the ${option.label}`
            }
            activeOpacity={0.75}
            onPress={() => onPress(option)}
            style={[styles.optionRow, { backgroundColor: colors.surfaceElevated }]}
        >
            <View style={[styles.optionIconWell, { backgroundColor: `${accentColor}18` }]}>
                <Ionicons
                    name={blockTypeIcon(option.block.type)}
                    size={18}
                    color={accentColor}
                />
            </View>
            <View style={styles.optionTextBlock}>
                <Text
                    style={{ color: colors.textPrimary }}
                    className="font-sans text-[14px] font-semibold"
                    numberOfLines={1}
                >
                    {option.label}
                </Text>
                {!!option.reference && (
                    <Text
                        style={{ color: colors.textMuted }}
                        className="font-serif text-[12px] italic"
                        numberOfLines={1}
                    >
                        {option.reference}
                    </Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
    );
});

/** Preview card shown after selecting a reading or "Today's Readings". */
const SharePreview: React.FC<{
    title: string;
    subtitle: string;
    previewText: string;
    accentColor: string;
    onShare: () => void;
    onCopy: () => void;
    onBack: () => void;
    copyState: 'idle' | 'copying' | 'copied';
}> = ({ title, subtitle, previewText, accentColor, onShare, onCopy, onBack, copyState }) => {
    const { colors } = useTheme();

    return (
        <View>
            {/* Back navigation */}
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Back to reading options"
                onPress={onBack}
                style={styles.backRow}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
                <Text
                    style={{ color: colors.textSecondary }}
                    className="font-sans text-[13px] ml-1"
                >
                    Back
                </Text>
            </TouchableOpacity>

            {/* Section header */}
            <View style={styles.previewHeader}>
                <Text
                    style={{ color: accentColor }}
                    className="font-sans text-[10px] font-bold uppercase tracking-[1.8px]"
                    numberOfLines={1}
                >
                    {title}
                </Text>
                <Text
                    style={{ color: colors.textSecondary }}
                    className="font-serif text-[13px] italic mt-1"
                    numberOfLines={1}
                >
                    {subtitle}
                </Text>
            </View>

            {/* Preview card */}
            <View
                style={[
                    styles.previewCard,
                    {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: `${accentColor}28`,
                    },
                ]}
            >
                <Text
                    style={{ color: colors.textPrimary }}
                    className="font-serif text-[14px] leading-6"
                    numberOfLines={6}
                >
                    {previewText}
                </Text>
                <Text style={{ color: colors.textMuted }} className="font-sans text-[11px] mt-2">
                    Preview — full text will be shared
                </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actionRow}>
                {/* Secondary: Copy */}
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={
                        copyState === 'copied' ? 'Copied to clipboard' : 'Copy to clipboard'
                    }
                    activeOpacity={0.8}
                    onPress={onCopy}
                    style={[
                        styles.actionButton,
                        styles.actionButtonSecondary,
                        {
                            backgroundColor: colors.surfaceElevated,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <Ionicons
                        name={copyState === 'copied' ? 'checkmark-outline' : 'copy-outline'}
                        size={16}
                        color={copyState === 'copied' ? colors.accent : colors.textSecondary}
                        style={{ marginRight: 6 }}
                    />
                    <Text
                        style={{
                            color:
                                copyState === 'copied' ? colors.accent : colors.textSecondary,
                        }}
                        className="font-sans text-[14px] font-semibold"
                    >
                        {copyState === 'copied' ? 'Copied' : 'Copy'}
                    </Text>
                </TouchableOpacity>

                {/* Primary: Share */}
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Share this reading"
                    activeOpacity={0.85}
                    onPress={onShare}
                    style={[
                        styles.actionButton,
                        styles.actionButtonPrimary,
                        { backgroundColor: accentColor },
                    ]}
                >
                    <Ionicons
                        name="share-outline"
                        size={16}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                    />
                    <Text className="font-sans text-[14px] font-semibold" style={{ color: '#FFFFFF' }}>
                        Share
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/** View state for the two-step share flow. */
type SheetView =
    | { step: 'options' }
    | { step: 'preview'; option: ShareOption | 'all' };

export const ReadingsShareSheet: React.FC<ReadingsShareSheetProps> = ({
    visible,
    onDismiss,
    blocksToRender,
    celebrationTitle,
    formattedDate,
    accentColor,
}) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    // Animation refs
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const sheetTranslateY = useRef(new Animated.Value(400)).current;
    // Track whether the sheet has ever been opened so we can unmount before the first open.
    const hasBeenOpened = useRef(false);

    // Internal view state — never touches global state
    const [view, setView] = useState<SheetView>({ step: 'options' });
    const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied'>('idle');
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const ctx = useMemo(
        () => ({ celebrationTitle, formattedDate }),
        [celebrationTitle, formattedDate],
    );

    // Pre-compute options from already-loaded data — no additional fetch
    const shareOptions = useMemo(
        () => buildShareOptions(blocksToRender, ctx),
        [blocksToRender, ctx],
    );

    const hasShareableContent = useMemo(
        () => getShareableBlocks(blocksToRender).length > 0,
        [blocksToRender],
    );

    // "Today's Readings" preview text — first ~120 chars of the first available block
    const allReadingsPreview = useMemo(() => {
        const first = shareOptions[0];
        if (!first) return '';
        return first.previewText;
    }, [shareOptions]);

    // ---------------------------------------------------------------------------
    // Animation
    // ---------------------------------------------------------------------------

    useEffect(() => {
        if (visible) {
            // Reset internal view each time the sheet opens
            hasBeenOpened.current = true;
            setView({ step: 'options' });
            setCopyState('idle');

            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                }),
                Animated.spring(sheetTranslateY, {
                    toValue: 0,
                    damping: 28,
                    stiffness: 320,
                    mass: 0.8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(sheetTranslateY, {
                    toValue: 400,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, overlayOpacity, sheetTranslateY]);

    // Clean up copy timer on unmount
    useEffect(() => {
        return () => {
            if (copyTimer.current) clearTimeout(copyTimer.current);
        };
    }, []);

    // ---------------------------------------------------------------------------
    // Handlers
    // ---------------------------------------------------------------------------

    const handleDismiss = useCallback(() => {
        onDismiss();
    }, [onDismiss]);

    const handleSelectAll = useCallback(() => {
        void Haptics.selectionAsync();
        setView({ step: 'preview', option: 'all' });
    }, []);

    const handleSelectOption = useCallback((option: ShareOption) => {
        void Haptics.selectionAsync();
        setView({ step: 'preview', option });
    }, []);

    const handleBack = useCallback(() => {
        setView({ step: 'options' });
        setCopyState('idle');
    }, []);

    const getShareText = useCallback(
        (option: ShareOption | 'all'): string => {
            if (option === 'all') {
                return formatAllReadings(blocksToRender, ctx);
            }
            return formatSingleReading(option.block, ctx);
        },
        [blocksToRender, ctx],
    );

    const handleShare = useCallback(async () => {
        const option = view.step === 'preview' ? view.option : null;
        if (!option) return;

        const message = getShareText(option);
        if (!message) return;

        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await Share.share(
                {
                    message,
                    // title is used on Android as the share sheet title; iOS ignores it.
                    title: option === 'all' ? "Today's Readings" : (option as ShareOption).label,
                },
                {
                    // Suppress the default subject line on some Android targets
                    subject:
                        option === 'all'
                            ? `Daily Readings — ${celebrationTitle}`
                            : `${(option as ShareOption).label} — ${celebrationTitle}`,
                },
            );
            // Dismiss only after the native sheet is done (Share.share resolves after user action)
            handleDismiss();
        } catch {
            // User cancelled or platform error — stay on preview
        }
    }, [view, getShareText, celebrationTitle, handleDismiss]);

    const handleCopy = useCallback(async () => {
        const option = view.step === 'preview' ? view.option : null;
        if (!option) return;

        const text = getShareText(option);
        if (!text) return;

        setCopyState('copying');
        try {
            await Clipboard.setStringAsync(text);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCopyState('copied');
            // Announce to screen reader
            AccessibilityInfo.announceForAccessibility('Copied to clipboard');
            // Reset after 2.5 seconds
            copyTimer.current = setTimeout(() => {
                setCopyState('idle');
            }, 2500);
        } catch {
            setCopyState('idle');
        }
    }, [view, getShareText]);

    // ---------------------------------------------------------------------------
    // Preview data
    // ---------------------------------------------------------------------------

    const previewTitle =
        view.step === 'preview'
            ? view.option === 'all'
                ? "Today's Readings"
                : view.option.label.toUpperCase()
            : '';

    const previewSubtitle =
        view.step === 'preview'
            ? view.option === 'all'
                ? `${celebrationTitle} · ${formattedDate}`
                : view.option.reference || formattedDate
            : '';

    const previewText =
        view.step === 'preview'
            ? view.option === 'all'
                ? allReadingsPreview
                : view.option.previewText
            : '';

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    if (!visible && !hasBeenOpened.current) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleDismiss} // Android back button
            statusBarTranslucent
            accessibilityViewIsModal
        >
            {/* Dim overlay */}
            <Animated.View
                style={[styles.overlay, { opacity: overlayOpacity }]}
                pointerEvents="box-none"
            >
                <Pressable
                    style={StyleSheet.absoluteFillObject}
                    onPress={handleDismiss}
                    accessibilityRole="button"
                    accessibilityLabel="Close share sheet"
                />
            </Animated.View>

            {/* Sheet card — slides up from bottom */}
            <Animated.View
                style={[
                    styles.sheetWrapper,
                    { transform: [{ translateY: sheetTranslateY }] },
                ]}
                pointerEvents="box-none"
            >
                <View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: colors.surface,
                            paddingBottom: Math.max(insets.bottom + 16, 24),
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <DragHandle color={colors.surfaceElevated} />

                    {/* Close button (top-right) */}
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                        onPress={handleDismiss}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={[styles.closeButton, { backgroundColor: colors.surfaceElevated }]}
                    >
                        <Ionicons name="close" size={16} color={colors.textMuted} />
                    </TouchableOpacity>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                        style={styles.sheetScroll}
                        contentContainerStyle={styles.sheetContent}
                    >
                        {view.step === 'options' ? (
                            /* ── OPTIONS VIEW ── */
                            <>
                                {/* Sheet title */}
                                <Text
                                    style={{ color: colors.textPrimary }}
                                    className="font-serif text-[20px] font-bold"
                                    accessibilityRole="header"
                                >
                                    Share Today's Readings
                                </Text>
                                <Text
                                    style={{ color: colors.textSecondary }}
                                    className="font-sans text-[13px] mt-1 mb-6"
                                    numberOfLines={2}
                                >
                                    {celebrationTitle} · {formattedDate}
                                </Text>

                                {hasShareableContent ? (
                                    <>
                                        {/* PRIMARY: Today's Readings */}
                                        <TouchableOpacity
                                            accessibilityRole="button"
                                            accessibilityLabel="Share today's readings"
                                            accessibilityHint="Shares all available readings for today"
                                            activeOpacity={0.82}
                                            onPress={handleSelectAll}
                                            style={[
                                                styles.primaryOption,
                                                {
                                                    backgroundColor: `${accentColor}12`,
                                                    borderColor: `${accentColor}30`,
                                                },
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.primaryIconWell,
                                                    { backgroundColor: `${accentColor}20` },
                                                ]}
                                            >
                                                <Ionicons
                                                    name="library-outline"
                                                    size={22}
                                                    color={accentColor}
                                                />
                                            </View>
                                            <View style={styles.primaryTextBlock}>
                                                <Text
                                                    style={{ color: colors.textPrimary }}
                                                    className="font-sans text-[15px] font-bold"
                                                >
                                                    Today's Readings
                                                </Text>
                                                <Text
                                                    style={{ color: colors.textSecondary }}
                                                    className="font-sans text-[12px] mt-0.5"
                                                    numberOfLines={1}
                                                >
                                                    All available readings for today
                                                </Text>
                                            </View>
                                            <Ionicons
                                                name="chevron-forward"
                                                size={16}
                                                color={accentColor}
                                            />
                                        </TouchableOpacity>

                                        {/* SECONDARY: Individual readings */}
                                        {shareOptions.length > 1 && (
                                            <>
                                                <Text
                                                    style={{ color: colors.textMuted }}
                                                    className="font-sans text-[10px] font-bold uppercase tracking-[1.6px] mb-3 mt-6"
                                                >
                                                    Share a specific reading
                                                </Text>

                                                <View style={styles.optionList}>
                                                    {shareOptions.map((option) => (
                                                        <ReadingOptionRow
                                                            key={option.block.id}
                                                            option={option}
                                                            accentColor={accentColor}
                                                            onPress={handleSelectOption}
                                                        />
                                                    ))}
                                                </View>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    /* No shareable content */
                                    <View style={styles.emptyState}>
                                        <Ionicons
                                            name="book-outline"
                                            size={32}
                                            color={colors.textMuted}
                                            style={{ marginBottom: 10 }}
                                        />
                                        <Text
                                            style={{ color: colors.textMuted }}
                                            className="font-sans text-[14px] text-center"
                                        >
                                            No readings are available to share for this day.
                                        </Text>
                                    </View>
                                )}
                            </>
                        ) : (
                            /* ── PREVIEW VIEW ── */
                            <SharePreview
                                title={previewTitle}
                                subtitle={previewSubtitle}
                                previewText={previewText}
                                accentColor={accentColor}
                                onShare={handleShare}
                                onCopy={handleCopy}
                                onBack={handleBack}
                                copyState={copyState}
                            />
                        )}
                    </ScrollView>
                </View>
            </Animated.View>
        </Modal>
    );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheetWrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
    },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        // Elevation for Android
        elevation: 16,
        // Shadow for iOS
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.10,
        shadowRadius: 20,
    },
    sheetScroll: {
        flexGrow: 0,
    },
    sheetContent: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 8,
    },
    dragHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 20,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    // Primary "Today's Readings" option
    primaryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 14,
    },
    primaryIconWell: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryTextBlock: {
        flex: 1,
    },
    // Individual reading option rows
    optionList: {
        gap: 10,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 12,
        minHeight: 56,
    },
    optionIconWell: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionTextBlock: {
        flex: 1,
        gap: 2,
    },
    // Preview view
    backRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        paddingTop: 4,
    },
    previewHeader: {
        marginBottom: 14,
    },
    previewCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 20,
    },
    // Action buttons
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        paddingVertical: 14,
        minHeight: 52,
    },
    actionButtonSecondary: {
        borderWidth: 1,
        flex: 0.85,
    },
    actionButtonPrimary: {
        flex: 1.15,
    },
    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },

    // Platform-specific: Android needs slightly more bottom clearance
    ...(Platform.OS === 'android' ? { sheet: { paddingBottom: 8 } } : {}),
});
