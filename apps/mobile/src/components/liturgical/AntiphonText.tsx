import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface AntiphonProps {
    text: string;
    accentColor: string;
    isRepeat?: boolean;
}

export const AntiphonText: React.FC<AntiphonProps> = ({ text, accentColor, isRepeat }) => {
    const { colors, textScale, lineHeightScale } = useTheme();
    const baseSize = 17 * textScale;
    const baseLine = 26 * textScale * lineHeightScale;

    return (
        <View style={styles.container}>
            <View style={[styles.labelRow, { marginBottom: 8 }]}>
                <View style={styles.labelLine} />
                <View style={[styles.labelPill, { backgroundColor: accentColor + '18' }]}>
                    <Text style={[styles.labelText, { color: accentColor, fontFamily: 'Inter-Bold', fontSize: 10 * textScale }]}>
                        {isRepeat ? 'ANTIPHON (REPEATED)' : 'ANTIPHON'}
                    </Text>
                </View>
                <View style={styles.labelLine} />
            </View>
            <View style={[styles.antiphonBox, { backgroundColor: accentColor + '08', borderLeftColor: accentColor }]}>
                <Text style={{
                    fontFamily: isRepeat ? 'NotoSerif-Italic' : 'NotoSerif-Italic',
                    color: colors.textPrimary,
                    fontSize: baseSize,
                    lineHeight: baseLine,
                    textAlign: 'center',
                }}>
                    {text}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        marginVertical: 12,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    labelLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C8C0B0',
    },
    labelPill: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginHorizontal: 10,
    },
    labelText: {
        letterSpacing: 1.6,
    },
    antiphonBox: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
    },
});
