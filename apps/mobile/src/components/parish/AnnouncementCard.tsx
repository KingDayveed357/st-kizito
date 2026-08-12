import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { describeWhen, extractSchedule, formatParishDate } from '../../utils/parishContent';

export interface AnnouncementType {
    id: string;
    title: string;
    /** Body with any repeated title already removed (see `buildExcerpt`). */
    excerpt: string;
    /** ISO timestamp. The card formats it; the hook must not. */
    publishedAt: string | null;
    type?: 'liturgical' | 'parish';
    author?: string;
    authorInitials?: string;
}

interface AnnouncementCardProps {
    announcement: AnnouncementType;
    onPress?: () => void;
    /**
     * `compact` is the Home-screen preview: fewer body lines, no author row. The card is otherwise
     * identical, so the two screens cannot drift into different designs for the same data.
     */
    compact?: boolean;
}

const TYPE_META = {
    liturgical: { label: 'Liturgical', icon: 'flame-outline' as const },
    parish: { label: 'Parish notice', icon: 'megaphone-outline' as const },
};

/**
 * A parish announcement.
 *
 * The previous card gave every piece of information the same weight: an uppercase date chip, the
 * title, then two lines of body that were usually the title repeated in capitals. Nothing told the
 * reader what kind of notice it was, or when it applied.
 *
 * The hierarchy here is deliberate, in reading order:
 *   1. what kind of notice it is, and how recent
 *   2. the title
 *   3. any schedule the notice carries ("Masses: 6.00 am and 6.00 pm") — lifted out of the prose,
 *      because it is the thing a parishioner is usually looking for
 *   4. the remaining body
 *
 * Every block is omitted rather than shown empty, so a notice with only a title is a short clean
 * card rather than a tall one with gaps.
 */
export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
    announcement,
    onPress,
    compact = false,
}) => {
    const { colors, allColors } = useTheme();
    const accent = allColors.liturgical.ordinaryTime;

    const meta = TYPE_META[announcement.type ?? 'parish'];

    // Splitting the schedule out is presentation, not data, so it happens here rather than in the
    // hook — a future detail screen may well want the body intact.
    const { schedule, rest } = useMemo(
        () => extractSchedule(announcement.excerpt ?? ''),
        [announcement.excerpt],
    );

    const relative = describeWhen(announcement.publishedAt);
    const absolute = formatParishDate(announcement.publishedAt, { includeYear: false });
    const dateLabel = relative ?? absolute;

    const Container: React.ComponentType<any> = onPress ? TouchableOpacity : View;

    return (
        <Container
            {...(onPress
                ? {
                      onPress,
                      activeOpacity: 0.9,
                      accessibilityRole: 'button',
                      accessibilityLabel: `${announcement.title}. ${meta.label}${dateLabel ? `, ${dateLabel}` : ''}.`,
                  }
                : {})}
            style={{
                borderRadius: 20,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 16,
                marginBottom: 12,
            }}
        >
            {/* 1 — kind of notice, and when */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <View
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 9,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${accent}18`,
                    }}
                >
                    <Ionicons name={meta.icon} size={15} color={accent} />
                </View>

                <Text
                    numberOfLines={1}
                    style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', flexShrink: 1 }}
                >
                    {meta.label}
                </Text>

                {dateLabel ? (
                    <>
                        <View
                            style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted }}
                        />
                        {/* `flexShrink: 0` — the date is short and must never be the thing that
                            truncates when the label is long. */}
                        <Text style={{ color: colors.textMuted, fontSize: 12, flexShrink: 0 }}>
                            {dateLabel}
                        </Text>
                    </>
                ) : null}

                <View style={{ flex: 1 }} />
                {onPress ? <Ionicons name="chevron-forward" size={15} color={colors.textMuted} /> : null}
            </View>

            {/* 2 — the title */}
            <Text
                numberOfLines={compact ? 2 : 3}
                style={{
                    color: colors.textPrimary,
                    fontSize: 17,
                    lineHeight: 23,
                    fontFamily: 'Georgia',
                    fontWeight: '700',
                }}
            >
                {announcement.title}
            </Text>

            {/* 3 — the schedule, if the notice carries one */}
            {schedule ? (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 7,
                        alignSelf: 'flex-start',
                        marginTop: 10,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 10,
                        backgroundColor: `${accent}12`,
                        maxWidth: '100%',
                    }}
                >
                    <Ionicons name="time-outline" size={13} color={accent} />
                    <Text
                        numberOfLines={1}
                        style={{ color: accent, fontSize: 12, fontWeight: '600', flexShrink: 1 }}
                    >
                        {schedule}
                    </Text>
                </View>
            ) : null}

            {/* 4 — the rest of the body */}
            {rest ? (
                <Text
                    numberOfLines={compact ? 2 : 4}
                    style={{ color: colors.textSecondary, fontSize: 13.5, lineHeight: 20, marginTop: 10 }}
                >
                    {rest}
                </Text>
            ) : null}

            {!compact && announcement.author ? (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 14,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                    }}
                >
                    <View
                        style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `${accent}20`,
                        }}
                    >
                        <Text style={{ color: accent, fontSize: 9, fontWeight: '800' }}>
                            {announcement.authorInitials ?? 'PO'}
                        </Text>
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{announcement.author}</Text>

                    {absolute && relative ? (
                        <>
                            <View style={{ flex: 1 }} />
                            {/* Once the header shows "Today", the absolute date still has a place —
                                just a quieter one. */}
                            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{absolute}</Text>
                        </>
                    ) : null}
                </View>
            ) : null}
        </Container>
    );
};
