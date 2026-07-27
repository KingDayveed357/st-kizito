import React, { useCallback, useMemo, useRef } from 'react';
import {
    View,
    ScrollView,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { ScrollToTopButton } from '../../src/components/ui/ScrollToTopButton';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAppStore } from '../../src/store/useAppStore';
import { TextSizeControl } from '../../src/components/ui/TextSizeControl';
import { PrayerSection, PrayerSectionVariant } from '../../src/components/liturgical/PrayerSection';
import {
    getCalendar,
    getDivineOfficePrayer,
    getTodayIso,
} from '../../src/services/liturgicalData';
import { DivineOfficePrayer, PrayerBlock } from '../../src/types/divineOffice.types';
import { parseDivineOffice } from '../../src/utils/divineOfficeParser';
import { PrayerBlockRenderer } from '../../src/components/liturgical/PrayerBlockRenderer';
// ─── Season → accent color + background tint ──────────────────────────────

const SEASON_ACCENT: Record<string, string> = {
    Advent:       '#6B4E8A',   // Purple
    Lent:         '#6B4E8A',   // Purple
    Christmas:    '#C9A84C',   // Gold
    Easter:       '#C9A84C',   // Gold
    OrdinaryTime: '#4A7C59',   // Green
    default:      '#4A7C59',
};

const SEASON_TINT: Record<string, string> = {
    Advent:       '#F4F0F8',
    Lent:         '#F5F0F4',
    Christmas:    '#FBF7EE',
    Easter:       '#FDFAF2',
    OrdinaryTime: '#F2F7F4',
    default:      '#F2F7F4',
};

const SEASON_DARK_TINT: Record<string, string> = {
    Advent:       '#1A1525',
    Lent:         '#1A1520',
    Christmas:    '#1E1A10',
    Easter:       '#1A1E10',
    OrdinaryTime: '#101A12',
    default:      '#101A12',
};

// ─── Office title metadata ─────────────────────────────────────────────────

const OFFICE_META: Record<string, { icon: string; subtitle: string }> = {
    officeOfReadings: { icon: 'book-outline',         subtitle: 'Office of Readings' },
    morningPrayer:    { icon: 'sunny-outline',         subtitle: 'Lauds' },
    midMorningPrayer: { icon: 'time-outline',          subtitle: 'Terce' },
    middayPrayer:     { icon: 'sunny',                 subtitle: 'Sext' },
    afternoonPrayer:  { icon: 'time',                  subtitle: 'None' },
    eveningPrayer:    { icon: 'partly-sunny-outline',  subtitle: 'Vespers' },
    nightPrayer:      { icon: 'moon-outline',          subtitle: 'Compline' },
};

// ─── Section divider ──────────────────────────────────────────────────────

const SectionDivider = ({ color }: { color: string }) => (
    <View style={{ marginHorizontal: 32, marginVertical: 28, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 20, height: StyleSheet.hairlineWidth, backgroundColor: color + '60' }} />
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color + '80', marginHorizontal: 6 }} />
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, marginHorizontal: 2 }} />
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color + '80', marginHorizontal: 6 }} />
            <View style={{ width: 20, height: StyleSheet.hairlineWidth, backgroundColor: color + '60' }} />
        </View>
    </View>
);

// ─── Header ───────────────────────────────────────────────────────────────

interface PrayerHeaderProps {
    title: string;
    subtitle: string;
    celebration: string;
    icon: string;
    season: string;
    accentColor: string;
    isDark: boolean;
    onBack: () => void;
}

const PrayerHeader: React.FC<PrayerHeaderProps> = ({
    title, subtitle, celebration, icon, season, accentColor, isDark, onBack,
}) => {
    const { colors } = useTheme();
    const bgTint = isDark ? SEASON_DARK_TINT[season] ?? SEASON_DARK_TINT.default : SEASON_TINT[season] ?? SEASON_TINT.default;
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.header,
                {
                    backgroundColor: bgTint,
                    borderBottomColor: accentColor + '25',
                    paddingTop: Math.max(insets.top, 16) + 12,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.25 : 0.05,
                    shadowRadius: 10,
                    elevation: 4,
                },
            ]}
        >
            <View style={styles.headerTopRow}>
                <View style={{ zIndex: 2 }}>
                    <TouchableOpacity
                        onPress={onBack}
                        style={[styles.backButton, { backgroundColor: accentColor + '15', borderColor: accentColor + '30', borderWidth: 1 }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={20} color={accentColor} />
                    </TouchableOpacity>
                </View>

                {/* <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
                    <Text style={[styles.headerSubtitle, { color: accentColor, fontFamily: 'Inter-Bold' }]}>
                        {subtitle.toUpperCase()}
                    </Text>
                </View> */}

                <View style={{ zIndex: 2, marginLeft: 'auto' }}>
                    <TextSizeControl />
                </View>
            </View>

            {/* Icon Medallion */}
            <View style={[styles.iconOuterRing, { backgroundColor: accentColor + '10', borderColor: accentColor + '25' }]}>
                <View style={[styles.iconInnerRing, { backgroundColor: accentColor + '18', borderColor: accentColor + '40' }]}>
                    <Ionicons name={icon as any} size={28} color={accentColor} />
                </View>
            </View>

            {/* Prayer title */}
            <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'NotoSerif-Bold' }]}>
                {title}
            </Text>

            {/* Celebration name */}
            {celebration ? (
                <View style={[styles.celebrationPill, { backgroundColor: accentColor + '15', borderColor: accentColor + '35' }]}>
                    <View style={[styles.celebrationDot, { backgroundColor: accentColor }]} />
                    <Text style={[styles.celebrationText, { color: accentColor, fontFamily: 'Inter-Bold' }]}>
                        {celebration}
                    </Text>
                </View>
            ) : null}
        </View>
    );
};

// ─── Empty / loading state ─────────────────────────────────────────────────

const EmptyState = ({ accentColor, colors }: { accentColor: string; colors: any }) => (
    <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: accentColor + '15' }]}>
            <Ionicons name="book-outline" size={36} color={accentColor} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontFamily: 'NotoSerif-Bold' }]}>
            Prayer Being Prepared
        </Text>
        <Text style={[styles.emptyBody, { color: colors.textSecondary, fontFamily: 'NotoSerif-Italic' }]}>
            "Lord, teach us to pray." — Luke 11:1{'\n\n'}
            The text for this hour will appear once the liturgical data has been downloaded.
        </Text>
    </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function PrayerDetailScreen() {
    const { prayer } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const selectedDate = useAppStore((state) => state.selectedDate);

    const prayerKey = Array.isArray(prayer) ? prayer[0] : prayer;
    const effectiveDate = getCalendar(selectedDate) ? selectedDate : getTodayIso();
    const detail: DivineOfficePrayer | null = prayerKey ? getDivineOfficePrayer(effectiveDate, prayerKey) : null;

    const calendar = getCalendar(effectiveDate);
    const season = calendar?.season ?? 'OrdinaryTime';
    const accentColor = SEASON_ACCENT[season] ?? SEASON_ACCENT.default;
    const bgColor = isDark
        ? SEASON_DARK_TINT[season] ?? SEASON_DARK_TINT.default
        : colors.background;

    const officeMeta = OFFICE_META[prayerKey ?? ''] ?? { icon: 'book-outline', subtitle: 'Prayer' };

    // The header now scrolls naturally with the content (it is the first child of the scroll view),
    // rather than being an absolute overlay. A shared scroll offset drives the Scroll-to-Top button.
    const scrollRef = useRef<ScrollView>(null);
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((e) => {
        scrollY.value = e.contentOffset.y;
    });
    const scrollToTop = useCallback(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, []);

    const handleBack = useCallback(() => router.back(), [router]);

    const hasParts = !!detail?.parts;

    // ── Render content sections ───────────────────────────────────────────
    const prayerBlocks = useMemo(() => {
        if (!detail?.parts) return [];
        return parseDivineOffice(detail.parts);
    }, [detail]);

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: bgColor }}>
            <StatusBar
                style={isDark ? 'light' : 'dark'}
                translucent={true}
                backgroundColor="transparent"
            />

            {/* Prayer body — the header is the first child so it scrolls naturally with the text. */}
            <Animated.ScrollView
                ref={scrollRef as never}
                style={{ flex: 1, backgroundColor: bgColor }}
                contentContainerStyle={{ paddingBottom: 64 }}
                showsVerticalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
            >
                <PrayerHeader
                    title={detail?.title ?? 'Prayer'}
                    subtitle={officeMeta.subtitle}
                    celebration={detail?.celebration ?? calendar?.celebration ?? ''}
                    icon={officeMeta.icon}
                    season={season}
                    accentColor={accentColor}
                    isDark={isDark ?? false}
                    onBack={handleBack}
                />

                {hasParts ? (
                    <PrayerBlockRenderer blocks={prayerBlocks} accentColor={accentColor} />
                ) : (
                    <EmptyState accentColor={accentColor} colors={colors} />
                )}
            </Animated.ScrollView>

            <ScrollToTopButton scrollY={scrollY} onPress={scrollToTop} bottomOffset={24} />
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: {
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerSubtitle: {
        fontSize: 10,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
    },
    iconOuterRing: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    iconInnerRing: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 26,
        textAlign: 'center',
        marginBottom: 14,
        lineHeight: 34,
        letterSpacing: -0.4,
        paddingHorizontal: 12,
    },
    celebrationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
    },
    celebrationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    celebrationText: {
        fontSize: 11,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        marginBottom: 16,
        textAlign: 'center',
    },
    emptyBody: {
        fontSize: 16,
        lineHeight: 26,
        textAlign: 'center',
        opacity: 0.8,
    },
});
