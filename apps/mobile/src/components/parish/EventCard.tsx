import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { describeWhen, formatParishDate, splitDateParts } from '../../utils/parishContent';

export interface EventType {
    id: string;
    title: string;
    /** ISO date. The card formats it; the hook must not. */
    startDate: string | null;
    endDate: string | null;
    location: string | null;
    description: string;
}

interface EventCardProps {
    event: EventType;
    onPress?: () => void;
    compact?: boolean;
}

/**
 * A parish event.
 *
 * The date block leads, because "when" is the question an event answers. It is a real calendar
 * chip rather than an uppercase "6 AUG" string baked in the hook, which means it can also show the
 * year when an event is far out, and can be omitted entirely when the date is unusable — the old
 * version would have rendered "NaN Invalid".
 *
 * Everything below the date degrades independently: no location, no description, or a multi-day
 * range all produce a coherent card rather than a gap or an overflow.
 */
export const EventCard: React.FC<EventCardProps> = ({ event, onPress, compact = false }) => {
    const { colors, allColors } = useTheme();
    const accent = allColors.liturgical.adventLent;

    const parts = splitDateParts(event.startDate);
    const relative = describeWhen(event.startDate);

    // A range is only worth spelling out when the end differs from the start.
    const isRange = !!event.endDate && event.endDate !== event.startDate;
    const rangeLabel = isRange
        ? `Until ${formatParishDate(event.endDate, { includeYear: false })}`
        : null;

    const Container: React.ComponentType<any> = onPress ? TouchableOpacity : View;

    return (
        <Container
            {...(onPress
                ? {
                      onPress,
                      activeOpacity: 0.9,
                      accessibilityRole: 'button',
                      accessibilityLabel: `${event.title}${
                          parts ? `, ${formatParishDate(event.startDate)}` : ''
                      }${event.location ? `, at ${event.location}` : ''}.`,
                  }
                : {})}
            style={{
                flexDirection: 'row',
                gap: 14,
                borderRadius: 20,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                marginBottom: 12,
            }}
        >
            {/* The date chip. Fixed width so a column of events aligns down the page. */}
            {parts ? (
                <View
                    style={{
                        width: 54,
                        paddingVertical: 10,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${accent}14`,
                    }}
                >
                    <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 }}>
                        {parts.month}
                    </Text>
                    <Text
                        style={{
                            color: colors.textPrimary,
                            fontSize: 22,
                            fontFamily: 'Georgia',
                            fontWeight: '700',
                            lineHeight: 27,
                        }}
                    >
                        {parts.day}
                    </Text>
                </View>
            ) : (
                <View
                    style={{
                        width: 54,
                        paddingVertical: 10,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.surfaceElevated,
                    }}
                >
                    <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                </View>
            )}

            <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                    numberOfLines={2}
                    style={{
                        color: colors.textPrimary,
                        fontSize: 16,
                        lineHeight: 21,
                        fontFamily: 'Georgia',
                        fontWeight: '700',
                    }}
                >
                    {event.title}
                </Text>

                {/* Metadata row: only the parts that actually exist. */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    {relative ? (
                        <View
                            style={{
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 8,
                                backgroundColor: `${accent}18`,
                            }}
                        >
                            <Text style={{ color: accent, fontSize: 11, fontWeight: '700' }}>{relative}</Text>
                        </View>
                    ) : null}

                    {rangeLabel ? (
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{rangeLabel}</Text>
                    ) : null}
                </View>

                {event.location ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                        <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                        {/* `flex: 1` + `numberOfLines` — a long venue truncates instead of pushing
                            the row wider than the card. */}
                        <Text
                            numberOfLines={1}
                            style={{ color: colors.textSecondary, fontSize: 12.5, flex: 1 }}
                        >
                            {event.location}
                        </Text>
                    </View>
                ) : null}

                {event.description ? (
                    <Text
                        numberOfLines={compact ? 2 : 3}
                        style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 }}
                    >
                        {event.description}
                    </Text>
                ) : null}
            </View>

            {onPress ? (
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ alignSelf: 'center' }} />
            ) : null}
        </Container>
    );
};
