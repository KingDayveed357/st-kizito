import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/hooks/useTheme';
import { parishHistorySections } from '../../src/data/moreContent';

/**
 * Parish History — redesigned as a vertical timeline with a restrained Catholic aesthetic
 * (serif display type, an ornamental divider, an accent rail with milestone nodes). Content is
 * still sourced from `parishHistorySections`; real dates, names and photographs should be
 * supplied by the parish (see the PARISH-SUPPLIED markers) rather than invented here.
 */

const Ornament = ({ color }: { color: string }) => (
    <View style={styles.ornamentRow}>
        <View style={[styles.ornamentLine, { backgroundColor: color + '55' }]} />
        <View style={[styles.ornamentDiamond, { backgroundColor: color }]} />
        <View style={[styles.ornamentLine, { backgroundColor: color + '55' }]} />
    </View>
);

export default function HistoryScreen() {
    const { colors, textScale, lineHeightScale } = useTheme();
    const scale = (size: number, line: number) => ({
        fontSize: size * textScale,
        lineHeight: line * textScale * lineHeightScale,
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="Parish History" />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 64 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ─── Hero ─────────────────────────────────────────────── */}
                <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.eyebrow, { color: colors.accent }]}>ST. KIZITO PARISH</Text>
                    <Ornament color={colors.accent} />
                    <Text style={[styles.heroTitle, { color: colors.textPrimary }, scale(28, 36)]} className="font-serif">
                        A community shaped by worship, service, and steady growth.
                    </Text>
                    <Text style={[styles.heroBody, { color: colors.textSecondary }, scale(15, 25)]}>
                        Our parish history is more than a timeline. It is a record of people who kept
                        faith visible through prayer, generosity, and commitment to one another.
                    </Text>
                </View>

                {/* ─── Timeline ─────────────────────────────────────────── */}
                <View style={styles.timeline}>
                    {parishHistorySections.map((section, index) => {
                        const isLast = index === parishHistorySections.length - 1;
                        return (
                            <View key={section.id} style={styles.node}>
                                {/* Rail: milestone dot + connector line */}
                                <View style={styles.rail}>
                                    <View style={[styles.dotOuter, { borderColor: colors.accent }]}>
                                        <View style={[styles.dotInner, { backgroundColor: colors.accent }]} />
                                    </View>
                                    {!isLast && <View style={[styles.connector, { backgroundColor: colors.border }]} />}
                                </View>

                                {/* Content */}
                                <View style={[styles.nodeContent, { marginBottom: isLast ? 0 : 28 }]}>
                                    <Text style={[styles.phase, { color: colors.accent }]}>{section.eyebrow}</Text>
                                    <Text style={[styles.nodeTitle, { color: colors.textPrimary }, scale(22, 30)]} className="font-serif">
                                        {section.title}
                                    </Text>
                                    <Text style={[styles.nodeBody, { color: colors.textSecondary }, scale(16, 27)]} className="font-serif">
                                        {section.body}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* ─── Closing scripture ────────────────────────────────── */}
                <View style={[styles.verseCard, { borderLeftColor: colors.accent, backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.verseText, { color: colors.textPrimary }, scale(16, 26)]} className="font-serif">
                        "Unless the Lord builds the house, those who build it labour in vain."
                    </Text>
                    <Text style={[styles.verseRef, { color: colors.accent }]}>PSALM 127:1</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    hero: {
        borderRadius: 28,
        borderWidth: 1,
        padding: 24,
        marginBottom: 36,
        alignItems: 'center',
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    heroTitle: {
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 4,
    },
    heroBody: {
        textAlign: 'center',
        marginTop: 14,
    },
    ornamentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    ornamentLine: {
        width: 40,
        height: StyleSheet.hairlineWidth,
    },
    ornamentDiamond: {
        width: 7,
        height: 7,
        transform: [{ rotate: '45deg' }],
        marginHorizontal: 10,
    },
    timeline: {
        paddingLeft: 4,
    },
    node: {
        flexDirection: 'row',
    },
    rail: {
        width: 28,
        alignItems: 'center',
    },
    dotOuter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    dotInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    connector: {
        flex: 1,
        width: 2,
        marginTop: 4,
        marginBottom: 2,
    },
    nodeContent: {
        flex: 1,
        paddingLeft: 16,
    },
    phase: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    nodeTitle: {
        fontWeight: '700',
        marginTop: 8,
    },
    nodeBody: {
        marginTop: 10,
    },
    verseCard: {
        marginTop: 36,
        borderLeftWidth: 3,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 18,
    },
    verseText: {
        fontStyle: 'italic',
    },
    verseRef: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginTop: 10,
    },
});
