import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// ─── Types ─────────────────────────────────────────────────────────────────
export type PrayerSectionVariant =
    | 'introduction'   // Opening versicle — smaller, centered, muted
    | 'hymn'           // Hymn verses — italicised, centered, serif
    | 'antiphon'       // Antiphon — highlighted pill, italic
    | 'psalm'          // Psalm body — baseline serif, left-aligned
    | 'reading'        // Scripture reading — left-aligned, slightly larger
    | 'reference'      // Scripture reference badge
    | 'responsory'     // R/ V/ style call-and-response
    | 'canticle'       // Benedictus/Magnificat/Nunc Dimittis
    | 'intercessions'  // Call-and-response petitions
    | 'lordsPrayer'    // Lord's Prayer — centered, slightly larger
    | 'concludingPrayer' // Collect — left-aligned, amen in small caps
    | 'rubric'         // Italic liturgical instruction (e.g. "All stand")
    | 'default';       // Generic

interface PrayerSectionProps {
    label?: string | null;
    text: string;
    variant?: PrayerSectionVariant;
    /** Season-tinted accent color for the label badge */
    accentColor?: string;
    /** Whether this is the "antiphon repeat" at the end of a psalm (italicised differently) */
    isRepeat?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Splits responsory text on lines starting with V. / R. / —
 * and returns styled spans so each part gets the right visual treatment.
 */
function parseResponsoryLines(text: string): { leader: boolean; line: string }[] {
    return text.split('\n').map(line => {
        const trimmed = line.trim();
        const isResponse = /^[R—]\.|^—/.test(trimmed);
        return { leader: !isResponse, line: trimmed };
    });
}

// ─── Component ─────────────────────────────────────────────────────────────

export const PrayerSection: React.FC<PrayerSectionProps> = ({
    label,
    text,
    variant = 'default',
    accentColor,
    isRepeat = false,
}) => {
    const { colors, textScale, lineHeightScale } = useTheme();

    // Dynamic sizing driven by textScale
    const baseSize = 17 * textScale;
    const baseLine = 30 * textScale * lineHeightScale;
    const serifFont = 'NotoSerif-Regular';
    const serifBoldFont = 'NotoSerif-Bold';
    const serifItalicFont = 'NotoSerif-Italic';
    const sansFont = 'Inter-Regular';
    const sansBoldFont = 'Inter-Bold';

    const accent = accentColor ?? colors.accent;

    // ── Label badge ────────────────────────────────────────────────────────
    const renderLabel = () => {
        if (!label) return null;

        const isRubric = variant === 'rubric';
        const isAntiphon = variant === 'antiphon';
        const isReference = variant === 'reference';

        if (isReference) {
            // Reference badge: pill with scripture ref
            return (
                <View style={[styles.referencePill, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
                    <Text style={[styles.referenceText, { color: accent, fontFamily: serifItalicFont, fontSize: 12 * textScale }]}>
                        {label}
                    </Text>
                </View>
            );
        }

        if (isRubric) {
            return (
                <Text style={[styles.rubricLabel, { color: colors.textMuted, fontFamily: serifItalicFont, fontSize: 12 * textScale }]}>
                    {label}
                </Text>
            );
        }

        return (
            <View style={styles.labelRow}>
                <View style={styles.labelLine} />
                <View style={[styles.labelPill, { backgroundColor: isAntiphon ? accent + '18' : colors.surfaceElevated }]}>
                    <Text style={[
                        styles.labelText,
                        {
                            color: isAntiphon ? accent : colors.textMuted,
                            fontFamily: sansBoldFont,
                            fontSize: 10 * textScale,
                            letterSpacing: 1.6,
                        }
                    ]}>
                        {label}
                    </Text>
                </View>
                <View style={styles.labelLine} />
            </View>
        );
    };

    // ── Text body rendering ────────────────────────────────────────────────

    const renderBody = () => {
        switch (variant) {
            case 'introduction':
                return (
                    <Text style={{
                        fontFamily: serifItalicFont,
                        color: colors.textSecondary,
                        fontSize: (baseSize - 1),
                        lineHeight: baseLine,
                        textAlign: 'center',
                    }}>
                        {text}
                    </Text>
                );

            case 'hymn':
                return (
                    <Text style={{
                        fontFamily: serifItalicFont,
                        color: colors.textPrimary,
                        fontSize: baseSize,
                        lineHeight: baseLine,
                        textAlign: 'center',
                    }}>
                        {text}
                    </Text>
                );

            case 'antiphon':
                return (
                    <View style={[styles.antiphonBox, {
                        backgroundColor: accent + '12',
                        borderLeftColor: accent,
                        borderLeftWidth: 3,
                    }]}>
                        <Text style={{
                            fontFamily: isRepeat ? serifItalicFont : serifFont,
                            color: colors.textPrimary,
                            fontSize: baseSize,
                            lineHeight: baseLine,
                        }}>
                            {text}
                        </Text>
                    </View>
                );

            case 'psalm':
            case 'canticle':
                // Split on double newlines (stanza breaks) and single newlines (verse lines)
                const stanzas = text.split(/\n\n+/);
                return (
                    <View>
                        {stanzas.map((stanza, si) => (
                            <View key={si} style={{ marginBottom: si < stanzas.length - 1 ? 12 : 0 }}>
                                {stanza.split('\n').map((line, li) => (
                                    <Text key={li} style={{
                                        fontFamily: serifFont,
                                        color: colors.textPrimary,
                                        fontSize: baseSize,
                                        lineHeight: baseLine,
                                        // Indent continuation lines slightly (liturgical convention)
                                        paddingLeft: li > 0 && !line.startsWith(' ') ? 0 : 0,
                                    }}>
                                        {line}
                                    </Text>
                                ))}
                            </View>
                        ))}
                    </View>
                );

            case 'reading':
                return (
                    <Text style={{
                        fontFamily: serifFont,
                        color: colors.textPrimary,
                        fontSize: baseSize + 1,
                        lineHeight: baseLine + 2,
                    }}>
                        {text}
                    </Text>
                );

            case 'responsory':
                const lines = parseResponsoryLines(text);
                return (
                    <View>
                        {lines.map((item, idx) => (
                            <Text key={idx} style={{
                                fontFamily: item.leader ? serifFont : serifItalicFont,
                                color: item.leader ? colors.textPrimary : colors.textSecondary,
                                fontSize: baseSize,
                                lineHeight: baseLine,
                                marginBottom: 2,
                            }}>
                                {item.line}
                            </Text>
                        ))}
                    </View>
                );

            case 'intercessions':
                const intercessionLines = text.split('\n');
                return (
                    <View>
                        {intercessionLines.map((line, idx) => {
                            const isResponse = /^[R—]\.|^—/.test(line.trim());
                            return (
                                <Text key={idx} style={{
                                    fontFamily: isResponse ? serifBoldFont : serifFont,
                                    color: isResponse ? accent : colors.textPrimary,
                                    fontSize: baseSize,
                                    lineHeight: baseLine,
                                    marginBottom: isResponse ? 8 : 2,
                                    fontStyle: isResponse ? 'italic' : 'normal',
                                }}>
                                    {line}
                                </Text>
                            );
                        })}
                    </View>
                );

            case 'lordsPrayer':
                return (
                    <Text style={{
                        fontFamily: serifFont,
                        color: colors.textPrimary,
                        fontSize: baseSize + 1,
                        lineHeight: baseLine + 2,
                        textAlign: 'center',
                    }}>
                        {text}
                    </Text>
                );

            case 'concludingPrayer':
                return (
                    <Text style={{
                        fontFamily: serifFont,
                        color: colors.textPrimary,
                        fontSize: baseSize,
                        lineHeight: baseLine,
                        fontStyle: 'italic',
                    }}>
                        {text}
                    </Text>
                );

            case 'rubric':
                return (
                    <Text style={{
                        fontFamily: serifItalicFont,
                        color: colors.textMuted,
                        fontSize: (baseSize - 2),
                        lineHeight: (baseLine - 4),
                        textAlign: 'center',
                    }}>
                        {text}
                    </Text>
                );

            default:
                return (
                    <Text style={{
                        fontFamily: serifFont,
                        color: colors.textPrimary,
                        fontSize: baseSize,
                        lineHeight: baseLine,
                    }}>
                        {text}
                    </Text>
                );
        }
    };

    return (
        <View style={[
            styles.container,
            variant === 'antiphon' && { paddingHorizontal: 20 },
            variant === 'introduction' && { paddingHorizontal: 32 },
            variant === 'rubric' && { paddingHorizontal: 32, paddingBottom: 12 },
        ]}>
            {renderLabel()}
            {renderBody()}
        </View>
    );
};

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingBottom: 8,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 4,
    },
    labelLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C8C0B0',
    },
    labelPill: {
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
        marginHorizontal: 10,
    },
    labelText: {
        textTransform: 'uppercase',
    },
    referencePill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 14,
    },
    referenceText: {
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    rubricLabel: {
        textAlign: 'center',
        marginBottom: 6,
    },
    antiphonBox: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        marginVertical: 4,
    },
});
