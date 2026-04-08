import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PrayerBlock } from '../../types/divineOffice.types';
import { PsalmBlock } from './PsalmBlock';
import { HymnBlock } from './HymnBlock';
import { useTheme } from '../../hooks/useTheme';

interface PrayerBlockRendererProps {
    blocks: PrayerBlock[];
    accentColor: string;
}

const SectionDivider = ({ color }: { color: string }) => (
    <View style={{ marginHorizontal: 32, marginVertical: 32, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 24, height: StyleSheet.hairlineWidth, backgroundColor: color + '40' }} />
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color + '60', marginHorizontal: 8 }} />
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, marginHorizontal: 2 }} />
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color + '60', marginHorizontal: 8 }} />
            <View style={{ width: 24, height: StyleSheet.hairlineWidth, backgroundColor: color + '40' }} />
        </View>
    </View>
);

export const PrayerBlockRenderer: React.FC<PrayerBlockRendererProps> = ({ blocks, accentColor }) => {
    const { colors, textScale, lineHeightScale } = useTheme();

    const baseSize = 18 * textScale;
    const baseLine = 30 * textScale * lineHeightScale;

    return (
        <View style={styles.container}>
            {blocks.map((block, idx) => {
                switch (block.type) {
                    case 'heading':
                        return (
                            <View key={idx} style={styles.headingRow}>
                                <Text style={[styles.headingText, { color: accentColor, fontSize: 11 * textScale }]}>
                                    {block.text.toUpperCase()}
                                </Text>
                            </View>
                        );
                    case 'psalm':
                        return (
                            <View key={idx}>
                                {idx > 0 && <SectionDivider color={accentColor} />}
                                <PsalmBlock 
                                    content={block.content}
                                    title={block.title}
                                    antiphon={block.antiphon} 
                                    accentColor={accentColor} 
                                />
                            </View>
                        );
                    case 'hymn':
                        return (
                            <View key={idx}>
                                <HymnBlock verses={block.verses} accentColor={accentColor} />
                                <SectionDivider color={accentColor} />
                            </View>
                        );
                    case 'reading':
                        return (
                            <View key={idx}>
                                <SectionDivider color={accentColor} />
                                <View style={styles.readingBlock}>
                                    {block.reference && (
                                        <View style={[styles.refPill, { backgroundColor: accentColor + '18', borderColor: accentColor + '40' }]}>
                                            <Text style={[styles.refText, { color: accentColor, fontSize: 10 * textScale }]}>
                                                {block.reference}
                                            </Text>
                                        </View>
                                    )}
                                    <Text style={[styles.readingText, { 
                                        color: colors.textPrimary, 
                                        fontSize: baseSize + 1, 
                                        lineHeight: baseLine + 2,
                                        fontFamily: 'NotoSerif-Regular' 
                                    }]}>
                                        {block.text}
                                    </Text>
                                </View>
                            </View>
                        );
                    case 'responsory':
                        return (
                            <View key={idx} style={styles.responsoryBlock}>
                                {block.lines.map((line, lidx) => (
                                    <View key={lidx} style={styles.respLine}>
                                        <Text style={{
                                            color: line.leader ? colors.textPrimary : colors.textSecondary,
                                            fontFamily: line.leader ? 'NotoSerif-Regular' : 'NotoSerif-Italic',
                                            fontSize: baseSize,
                                            lineHeight: baseLine,
                                        }}>
                                            {line.text}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        );
                    case 'prayer':
                    case 'rubric':
                        return (
                            <View key={idx} style={styles.prayerBlock}>
                                <Text style={[styles.prayerText, { 
                                    color: block.type === 'rubric' ? colors.textMuted : colors.textPrimary,
                                    fontFamily: block.type === 'rubric' ? 'NotoSerif-Italic' : 'NotoSerif-Regular',
                                    fontSize: block.type === 'rubric' ? baseSize - 2 : baseSize,
                                    textAlign: block.type === 'rubric' ? 'center' : 'left',
                                    lineHeight: baseLine,
                                }]}>
                                    {block.text}
                                </Text>
                            </View>
                        );
                    case 'intercessions':
                        return (
                            <View key={idx} style={styles.intercessionBlock}>
                                {block.items.map((item, iidx) => (
                                    <View key={iidx} style={styles.intercessionItem}>
                                        <Text style={{
                                            color: colors.textPrimary,
                                            fontFamily: 'NotoSerif-Regular',
                                            fontSize: baseSize,
                                            lineHeight: baseLine,
                                        }}>
                                            {item.text}
                                        </Text>
                                        {item.response && (
                                            <Text style={{
                                                color: accentColor,
                                                fontFamily: 'NotoSerif-BoldItalic',
                                                fontSize: baseSize,
                                                lineHeight: baseLine,
                                                marginTop: 4,
                                                paddingLeft: 12,
                                            }}>
                                                – {item.response}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        );
                    default:
                        return null;
                }
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 64,
    },
    headingRow: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 8,
    },
    headingText: {
        fontFamily: 'Inter-Bold',
        letterSpacing: 2.5,
        opacity: 0.6,
    },
    readingBlock: {
        paddingHorizontal: 28,
        marginVertical: 16,
    },
    refPill: {
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    refText: {
        fontFamily: 'Inter-Bold',
        letterSpacing: 1.2,
    },
    readingText: {
        textAlign: 'left',
    },
    responsoryBlock: {
        paddingHorizontal: 28,
        marginVertical: 16,
    },
    respLine: {
        marginBottom: 8,
    },
    prayerBlock: {
        paddingHorizontal: 28,
        marginVertical: 12,
    },
    prayerText: {
        lineHeight: 28,
    },
    intercessionBlock: {
        paddingHorizontal: 28,
        marginVertical: 16,
    },
    intercessionItem: {
        marginBottom: 16,
    },
});
