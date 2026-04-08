import React, { useCallback, useMemo } from 'react';
import {
    View,
    ScrollView,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAppStore } from '../../src/store/useAppStore';
import { TextSizeControl } from '../../src/components/ui/TextSizeControl';
import { PrayerSection, PrayerSectionVariant } from '../../src/components/liturgical/PrayerSection';
import {
    getCalendar,
    getReadings,
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

    return (
        <View style={[styles.header, { backgroundColor: bgTint, borderBottomColor: accentColor + '30' }]}>
            <View style={styles.headerTopRow}>
                <TouchableOpacity
                    onPress={onBack}
                    style={[styles.backButton, { backgroundColor: accentColor + '18' }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="chevron-back" size={20} color={accentColor} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={[styles.headerSubtitle, { color: accentColor, fontFamily: 'Inter-Bold' }]}>
                        {subtitle.toUpperCase()}
                    </Text>
                </View>

                <TextSizeControl />
            </View>

            {/* Icon */}
            <View style={[styles.officeIconWrap, { backgroundColor: accentColor + '18' }]}>
                <Ionicons name={icon as any} size={28} color={accentColor} />
            </View>

            {/* Prayer title */}
            <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'NotoSerif-Bold' }]}>
                {title}
            </Text>

            {/* Celebration name */}
            <View style={[styles.celebrationPill, { backgroundColor: accentColor + '20', borderColor: accentColor + '40' }]}>
                <View style={[styles.celebrationDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.celebrationText, { color: accentColor, fontFamily: 'Inter-Bold' }]}>
                    {celebration}
                </Text>
            </View>
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

    const handleBack = useCallback(() => router.back(), [router]);

    const hasParts = !!detail?.parts;

    // ── Render content sections ───────────────────────────────────────────

    const buildOfficeOfReadingsFallback = useCallback((): PrayerBlock[] => {
        const missal = getReadings(effectiveDate);
        if (!missal) return [];

        const supplemental: PrayerBlock[] = [];
        const first = missal.readings.find((block) => block.type === 'first_reading' && !!block.text);
        const second = missal.readings.find((block) => block.type === 'second_reading' && !!block.text);
        const gospel = missal.readings.find((block) => block.type === 'gospel' && !!block.text);
        const psalm = missal.readings.find((block) => block.type === 'psalm');

        if (first?.text) {
            supplemental.push({ type: 'heading', text: 'First Reading' });
            supplemental.push({
                type: 'reading',
                reference: first.reference ?? undefined,
                text: first.text,
            });
        }

        if (psalm?.response || (psalm?.verses && psalm.verses.length > 0)) {
            const lines = [
                ...(psalm.response ? [psalm.response] : []),
                ...((psalm.verses ?? []).map((verse) => verse.text)),
            ]
                .map((line) => line.trim())
                .filter(Boolean)
                .slice(0, 4)
                .map((line, index) => ({ leader: index === 0, text: line }));

            if (lines.length > 0) {
                supplemental.push({ type: 'heading', text: 'Responsory' });
                supplemental.push({ type: 'responsory', lines });
            }
        }

        if (second?.text) {
            supplemental.push({ type: 'heading', text: 'Second Reading' });
            supplemental.push({
                type: 'reading',
                reference: second.reference ?? undefined,
                text: second.text,
            });
        } else if (gospel?.text) {
            supplemental.push({ type: 'heading', text: 'Scripture Reading' });
            supplemental.push({
                type: 'reading',
                reference: gospel.reference ?? undefined,
                text: gospel.text,
            });
        }

        return supplemental;
    }, [effectiveDate]);

    const prayerBlocks = useMemo(() => {
        if (!detail?.parts) return [];
        const parsed = parseDivineOffice(detail.parts);

        if (prayerKey === 'officeOfReadings') {
            const readingCount = parsed.filter((block) => block.type === 'reading').length;
            if (readingCount < 2) {
                const supplemental = buildOfficeOfReadingsFallback();
                if (supplemental.length > 0) {
                    return [...parsed, ...supplemental];
                }
            }
        }

        return parsed;
    }, [buildOfficeOfReadingsFallback, detail, prayerKey]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={isDark ? SEASON_DARK_TINT[season] : SEASON_TINT[season]}
            />

            {/* Header */}
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

            {/* Prayer body */}
            <ScrollView
                style={{ flex: 1, backgroundColor: bgColor }}
                contentContainerStyle={{ paddingTop: 28, paddingBottom: 64 }}
                showsVerticalScrollIndicator={false}
            >
                {hasParts ? (
                    <PrayerBlockRenderer blocks={prayerBlocks} accentColor={accentColor} />
                ) : (
                    <EmptyState accentColor={accentColor} colors={colors} />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: {
        paddingTop: 8,
        paddingBottom: 24,
        paddingHorizontal: 24,
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
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerSubtitle: {
        fontSize: 10,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
    },
    officeIconWrap: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    headerTitle: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 32,
    },
    celebrationPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
    },
    celebrationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    celebrationText: {
        fontSize: 11,
        letterSpacing: 0.6,
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
