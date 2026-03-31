import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ReadingSectionProps {
    label: string;
    reference?: string;
    text: string;
    showDropCap?: boolean;
    contentPaddingHorizontal?: number;
    contentPaddingBottom?: number;
}

export const ReadingSection: React.FC<ReadingSectionProps> = ({
    label,
    reference,
    text,
    showDropCap = false,
    contentPaddingHorizontal = 24,
    contentPaddingBottom = 24,
}) => {
    const { colors, textScale, lineHeightScale } = useTheme();

    let formattedText = text;
    let dropCap = '';

    if (showDropCap && text.length > 0) {
        dropCap = text.charAt(0);
        formattedText = text.substring(1);
    }

    return (
        <View style={{ paddingHorizontal: contentPaddingHorizontal, paddingBottom: contentPaddingBottom }}>
            <View style={styles.header}>
                {!!label && (
                    <Text style={{ color: colors.accent }} className="font-sans text-[11px] font-bold uppercase tracking-[2px]">
                        {label}
                    </Text>
                )}
                {!!reference && (
                    <Text style={{ color: colors.textSecondary }} className="font-serif text-[13px] italic">
                        {reference}
                    </Text>
                )}
            </View>

            <View style={styles.body}>
                {showDropCap && !!dropCap && (
                    <Text
                        style={{
                            color: colors.accent,
                            fontSize: 40 * textScale,
                            lineHeight: 44 * textScale * lineHeightScale,
                            marginRight: 8,
                            marginTop: 2,
                        }}
                        className="font-serif font-bold"
                    >
                        {dropCap}
                    </Text>
                )}
                <Text
                    style={{
                        color: colors.textPrimary,
                        fontSize: 17 * textScale,
                        lineHeight: 31 * textScale * lineHeightScale,
                        flex: 1,
                    }}
                    className="font-serif"
                >
                    {formattedText}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    body: {
        alignItems: 'flex-start',
        flexDirection: 'row',
    },
    header: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
});
