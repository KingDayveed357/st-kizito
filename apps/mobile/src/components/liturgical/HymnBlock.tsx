import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface HymnBlockProps {
    /** Hymn stanzas. Each entry may itself contain `\n`-separated poetic lines. */
    verses: string[];
    accentColor: string;
    /**
     * Recording credits, if the source supplied any.
     *
     * These used to be the last "stanza" of the hymn — same serif italic, same size as the prayer —
     * because the scraper captured them inside the hymn text. They are shown, because the source
     * licenses its recordings on condition the credit appears, but as a caption that reads as
     * metadata rather than as something to pray.
     */
    attribution?: string;
}

/**
 * Office hymn.
 *
 * Hymns are metrical poetry: each line is deliberate and should begin at the same left edge so the
 * eye can drop cleanly from line to line while praying. Centring them (the previous behaviour) gives
 * every line a different starting x-position, which makes a stanza ragged on BOTH edges and hard to
 * scan — the "hymn formatting feels poor" report.
 *
 * Each poetic line is rendered as its own `Text` so the source's line breaks are honoured and only
 * genuinely over-long lines wrap.
 */
export const HymnBlock: React.FC<HymnBlockProps> = ({ verses, accentColor, attribution }) => {
    const { colors, textScale, lineHeightScale } = useTheme();
    const baseSize = 17 * textScale;
    const baseLine = 30 * textScale * lineHeightScale;

    // A stanza may arrive as one string containing several lines.
    const stanzas = verses
        .map((verse) => verse.split('\n').map((line) => line.trim()).filter(Boolean))
        .filter((lines) => lines.length > 0);

    return (
        <View style={styles.container}>
            {stanzas.map((lines, stanzaIndex) => (
                <View
                    key={`hymn-stanza-${stanzaIndex}`}
                    style={[
                        styles.stanza,
                        stanzaIndex > 0 && styles.stanzaSpacing,
                        // A restrained accent rail marks the hymn as sung text without shouting.
                        { borderLeftColor: `${accentColor}33` },
                    ]}
                >
                    {lines.map((line, lineIndex) => (
                        <Text
                            key={`hymn-line-${lineIndex}`}
                            style={[
                                styles.line,
                                {
                                    fontFamily: 'NotoSerif-Italic',
                                    color: colors.textPrimary,
                                    fontSize: baseSize,
                                    lineHeight: baseLine,
                                },
                            ]}
                        >
                            {line}
                        </Text>
                    ))}
                </View>
            ))}

            {attribution ? (
                <Text
                    // Not part of the prayer: excluded from the reading flow a screen reader
                    // follows, and visually quiet enough that the eye skips it while praying.
                    accessibilityLabel={`Hymn credits: ${attribution}`}
                    style={[
                        styles.attribution,
                        {
                            color: colors.textMuted,
                            fontSize: 11 * textScale,
                            lineHeight: 16 * textScale * lineHeightScale,
                        },
                    ]}
                >
                    {attribution}
                </Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        marginVertical: 20,
    },
    stanza: {
        borderLeftWidth: 2,
        paddingLeft: 16,
    },
    stanzaSpacing: {
        marginTop: 32,
    },
    line: {
        textAlign: 'left',
    },
    attribution: {
        marginTop: 18,
        paddingLeft: 18,
        fontStyle: 'italic',
    },
});
