import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface PsalmBlockProps {
    content: string[];
    title: string;
    antiphon?: string;
    accentColor: string;
}

export const PsalmBlock: React.FC<PsalmBlockProps> = ({ content, title, antiphon, accentColor }) => {
    const { colors, textScale, lineHeightScale } = useTheme();
    const baseSize = 18 * textScale;
    const bodyLineHeight = 28 * textScale * lineHeightScale;
    const antiphonSize = 16 * textScale;
    const antiphonLineHeight = 24 * textScale * lineHeightScale;

    return (
        <View style={styles.container}>
            {/* 1. Psalm Title */}
            <View style={styles.titleRow}>
                <View style={[styles.titleLine, { backgroundColor: accentColor + '40', height: 1 }]} />
                <Text style={[styles.titleText, { color: accentColor, fontFamily: 'Inter-Bold', fontSize: 10 * textScale }]}>
                    {title.toUpperCase()}
                </Text>
                <View style={[styles.titleLine, { backgroundColor: accentColor + '40', height: 1 }]} />
            </View>

            {/* 2. Antiphon (Primary, under title) */}
            {antiphon && (
                <View style={[styles.antiphonContainer, { backgroundColor: accentColor + '08', borderLeftColor: accentColor }]}>
                    <Text style={[styles.antiphonLabel, { color: accentColor, fontSize: 9 * textScale }]}>ANTIPHON</Text>
                    <Text style={{
                        fontFamily: 'NotoSerif-Italic',
                        color: colors.textPrimary,
                        fontSize: antiphonSize,
                        lineHeight: antiphonLineHeight,
                    }}>
                        {antiphon}
                    </Text>
                </View>
            )}

            {/* 3. Psalm Body (Verses) */}
            <View style={[styles.versesContainer, { marginTop: antiphon ? 12 : 8 }]}>
                {content.map((verse, idx) => (
                    <Text key={idx} style={[styles.verseText, {
                        fontFamily: 'NotoSerif-Regular',
                        color: colors.textPrimary,
                        fontSize: baseSize,
                        lineHeight: bodyLineHeight,
                        paddingLeft: verse[0] && verse[0] === verse[0].toLowerCase() ? 12 : 0,
                    }]}>
                        {verse}
                    </Text>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 28,
        marginVertical: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8, // Tight spacing to antiphon
    },
    titleLine: {
        flex: 1,
    },
    titleText: {
        marginHorizontal: 12,
        letterSpacing: 2,
    },
    antiphonContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 4,
        borderLeftWidth: 3,
        marginTop: 4,
    },
    antiphonLabel: {
        fontFamily: 'Inter-Bold',
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    versesContainer: {
        gap: 6,
    },
    verseText: {
        marginBottom: 2,
    },
});
