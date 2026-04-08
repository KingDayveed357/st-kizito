import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface HymnBlockProps {
    verses: string[];
    accentColor: string;
}

export const HymnBlock: React.FC<HymnBlockProps> = ({ verses, accentColor }) => {
    const { colors, textScale, lineHeightScale } = useTheme();
    const baseSize = 17 * textScale;
    const baseLine = 28 * textScale * lineHeightScale;

    return (
        <View style={styles.container}>
            <View style={styles.hymnContent}>
                {verses.map((verse, idx) => (
                    <Text key={idx} style={[styles.hymnVerse, {
                        fontFamily: 'NotoSerif-Italic',
                        color: colors.textPrimary,
                        fontSize: baseSize,
                        lineHeight: baseLine,
                        textAlign: 'center',
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
        paddingHorizontal: 32,
        marginVertical: 20,
    },
    hymnContent: {
        alignItems: 'center',
        gap: 4,
    },
    hymnVerse: {
        marginBottom: 2,
    },
});
