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

    // Each block is returned inside a keyed fragment. (A debug mode that wrapped every block in a
    // dashed border + type label was previously left enabled in production — see audit #10.)
    const renderWrappedBlock = (idx: number, _type: string, content: React.ReactNode) => (
        <React.Fragment key={`block-${idx}`}>{content}</React.Fragment>
    );

    return (
        <View style={styles.container}>
            {blocks.map((block, idx) => {
                switch (block.type) {
                    case 'heading':
                        return renderWrappedBlock(idx, 'heading',
                            <View style={styles.headingRow}>
                                <Text style={[styles.headingText, { color: accentColor, fontSize: 11 * textScale }]}>
                                    {block.text?.toUpperCase()}
                                </Text>
                            </View>
                        );
                    case 'opening':
                    case 'invitatory':
                    case 'prayer':
                    case 'concluding_prayer':
                    case 'dismissal':
                        return renderWrappedBlock(idx, block.type,
                            <View style={styles.prayerBlock}>
                                <Text style={[styles.prayerText, { color: colors.textPrimary, fontSize: baseSize, lineHeight: baseLine }]}>
                                    {block.text}
                                </Text>
                            </View>
                        );
                    case 'rubric':
                        return renderWrappedBlock(idx, 'rubric',
                            <View style={styles.prayerBlock}>
                                <Text style={[styles.prayerText, { color: colors.textMuted, fontFamily: 'NotoSerif-Italic', fontSize: baseSize - 2, textAlign: 'center', lineHeight: baseLine }]}>
                                    {block.text}
                                </Text>
                            </View>
                        );
                    case 'hymn':
                        return renderWrappedBlock(idx, 'hymn',
                            <View>
                                {block.verses && (
                                    <HymnBlock
                                        verses={block.verses}
                                        accentColor={accentColor}
                                        attribution={block.attribution}
                                    />
                                )}
                                <SectionDivider color={accentColor} />
                            </View>
                        );
                    case 'antiphon':
                        return renderWrappedBlock(idx, 'antiphon',
                            <View style={styles.antiphonBlock}>
                                <Text style={[styles.antiphonText, { color: accentColor, fontSize: baseSize, lineHeight: baseLine }]}>
                                    <Text style={{ fontFamily: 'NotoSerif-BoldItalic' }}>Ant. </Text>
                                    <Text style={{ fontFamily: 'NotoSerif-Regular' }}>{block.text}</Text>
                                </Text>
                            </View>
                        );
                    case 'psalm_title':
                        return renderWrappedBlock(idx, 'psalm_title',
                            <View style={styles.psalmTitleBlock}>
                                <Text style={[styles.psalmTitle, { color: accentColor, fontSize: baseSize }]}>
                                    {block.text}
                                </Text>
                            </View>
                        );
                    case 'psalm_summary':
                        return renderWrappedBlock(idx, 'psalm_summary',
                            <View style={styles.psalmSummaryBlock}>
                                <Text style={[styles.psalmSummary, { color: colors.textSecondary, fontSize: baseSize - 2 }]}>
                                    {block.text}
                                </Text>
                            </View>
                        );
                    case 'psalm_body':
                    case 'gospel_canticle':
                    case 'psalm':
                        return renderWrappedBlock(idx, block.type,
                            <View>
                                {block.content && block.content.length > 0 ? (
                                    <PsalmBlock 
                                        content={block.content}
                                        title={block.title || ""}
                                        antiphon={block.antiphon}
                                        psalmPrayer={block.psalmPrayer}
                                        accentColor={accentColor} 
                                    />
                                ) : (
                                    <Text style={[styles.prayerText, { color: colors.textPrimary, fontSize: baseSize, padding: 28 }]}>
                                        {block.text}
                                    </Text>
                                )}
                            </View>
                        );
                    case 'glory_be':
                        return renderWrappedBlock(idx, 'glory_be',
                            <View style={styles.gloryBeBlock}>
                                <Text style={[styles.gloryBeText, { color: colors.textPrimary, fontSize: baseSize, lineHeight: baseLine }]}>
                                    {block.text}
                                </Text>
                            </View>
                        );
                    case 'reading_1':
                    case 'reading_2':
                    case 'reading':
                        return renderWrappedBlock(idx, block.type,
                            <View>
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
                    case 'responsory_1':
                    case 'responsory_2':
                    case 'responsory':
                        return renderWrappedBlock(idx, block.type,
                            <View style={styles.responsoryBlock}>
                                {block.lines?.map((line, lidx) => (
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
                    case 'intercessions':
                        return renderWrappedBlock(idx, 'intercessions',
                            <View style={styles.intercessionBlock}>
                                {block.items?.map((item, iidx) => (
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
                    case 'our_father':
                        return renderWrappedBlock(idx, 'our_father',
                            <View style={styles.prayerBlock}>
                                <Text style={[styles.prayerText, { color: colors.textPrimary, fontSize: baseSize, lineHeight: baseLine }]}>
                                    {block.text}
                                </Text>
                            </View>
                        );
                    default:
                        // Fallback generic renderer
                        return renderWrappedBlock(idx, block.type || 'unknown',
                            <View style={styles.prayerBlock}>
                                <Text style={[styles.prayerText, { color: colors.textPrimary, fontSize: baseSize, lineHeight: baseLine }]}>
                                    {block.text}
                                </Text>
                            </View>
                        );
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
    psalmTitleBlock: {
        alignItems: 'center',
        paddingHorizontal: 28,
        marginTop: 16,
        marginBottom: 8,
    },
    psalmTitle: {
        fontFamily: 'NotoSerif-Regular',
        textAlign: 'center',
    },
    psalmSummaryBlock: {
        paddingHorizontal: 28,
        marginBottom: 16,
    },
    psalmSummary: {
        fontFamily: 'NotoSerif-Italic',
        textAlign: 'center',
    },
    antiphonBlock: {
        paddingHorizontal: 28,
        marginVertical: 12,
    },
    antiphonText: {
        textAlign: 'center',
    },
    gloryBeBlock: {
        paddingHorizontal: 28,
        marginVertical: 16,
    },
    gloryBeText: {
        fontFamily: 'NotoSerif-Italic',
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
