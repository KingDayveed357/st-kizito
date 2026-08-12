import React from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface VerseOfTheDayCardProps {
    text: string;
    reference: string;
    saved: boolean;
    onToggleSave: () => void;
    onPress?: () => void;
}

/**
 * Verse of the Day.
 *
 * Keeps the quote-card treatment — the oversized opening quotation mark, the italic serif setting,
 * the heart in the corner — but the heart is now a real control rather than decoration. The card it
 * replaces (`ScriptureQuote`) rendered a filled pink `Ionicons` heart that was not a button and
 * saved nothing; tapping it did precisely nothing.
 *
 * ── On the type size ────────────────────────────────────────────────────────
 * The verse is the largest text on the home screen, and deliberately so: this is the one thing on
 * the page meant to be read slowly, often by someone holding the phone at arm's length.
 *
 * It scales on two axes:
 *   - the user's own setting (`textScale` from the in-app text-size control), so someone who has
 *     turned text up gets a larger verse everywhere, and
 *   - the width of the device, so the verse is generous on a large phone without overflowing a
 *     narrow one. A fixed 24px looks right on the reviewer's handset and cramped or clipped
 *     elsewhere.
 *
 * The result is clamped: never smaller than 19px (the floor at which this face stays comfortable
 * for older eyes) and never larger than 30px (beyond which a long verse pushes the Parish Pulse
 * entirely off the first screen).
 */
export const VerseOfTheDayCard: React.FC<VerseOfTheDayCardProps> = ({
    text,
    reference,
    saved,
    onToggleSave,
    onPress,
}) => {
    const { colors, allColors, textScale, lineHeightScale } = useTheme();
    const { width } = useWindowDimensions();

    // 375dp (a standard phone) is the reference width at which the base size is exactly 22.
    const responsive = 22 * (width / 375);
    const fontSize = Math.min(30, Math.max(19, responsive)) * textScale;
    const lineHeight = fontSize * 1.45 * lineHeightScale;

    const Container: React.ComponentType<any> = onPress ? TouchableOpacity : View;

    return (
        <Container
            {...(onPress
                ? {
                      onPress,
                      activeOpacity: 0.92,
                      accessibilityRole: 'button',
                      accessibilityLabel: `Verse of the day. ${text} ${reference}. Opens the full reflection.`,
                  }
                : {})}
            style={{
                backgroundColor: colors.surface,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 22,
                paddingTop: 18,
                paddingBottom: 22,
                marginBottom: 28,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Text
                    // Decorative: the heading below carries the meaning for a screen reader.
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                    style={{
                        color: allColors.liturgical.christmasEaster,
                        fontSize: 40,
                        lineHeight: 44,
                        fontFamily: 'Georgia',
                        fontWeight: '700',
                        marginBottom: -14,
                    }}
                >
                    &ldquo;
                </Text>

                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={
                        saved ? 'Remove this verse from your saved items' : 'Save this verse to your favourites'
                    }
                    accessibilityState={{ selected: saved }}
                    // Generous hit area: the icon itself is well under a comfortable touch target.
                    hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                    onPress={onToggleSave}
                >
                    <Ionicons name={saved ? 'heart' : 'heart-outline'} size={24} color="#E9A8A0" />
                </TouchableOpacity>
            </View>

            <Text
                style={{
                    color: colors.textPrimary,
                    fontSize,
                    lineHeight,
                    fontFamily: 'Georgia',
                    fontStyle: 'italic',
                    marginBottom: 14,
                }}
            >
                {text}
            </Text>

            <Text
                style={{
                    color: colors.textSecondary,
                    fontSize: Math.max(11, 12 * textScale),
                    fontWeight: '700',
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                }}
            >
                {reference}
            </Text>
        </Container>
    );
};
