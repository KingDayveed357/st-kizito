import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { TextSizeControl } from '../../src/components/ui/TextSizeControl';
import { useFavourites } from '../../src/hooks/useFavourites';
import { getPrayer } from '../../src/data/prayers';

/**
 * A single prayer.
 *
 * Typography follows the Divine Office reading rules rather than the app's general body style:
 * prayer is read aloud, often by someone whose eyesight is not what it was, so it honours the
 * global text-size control and keeps generous line height. Lead/response pairs are laid out the way
 * the Office renders a responsory, so the alternation is visible rather than inferred.
 */
export default function PrayerScreen() {
    const { colors, allColors, textScale, lineHeightScale } = useTheme();
    const router = useRouter();
    const { slug } = useLocalSearchParams<{ slug?: string }>();
    const { toggleFavourite, isFavourite } = useFavourites('prayer');

    const prayer = slug ? getPrayer(slug) : undefined;
    const accent = allColors.liturgical.ordinaryTime;

    if (!prayer) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <Header showBack title="Prayer" />
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <EmptyState
                        icon={<Ionicons name="book-outline" size={40} color={colors.textMuted} />}
                        title="That prayer could not be found"
                        subtitle="It may have been renamed in a newer version of the app."
                        actionLabel="Back to prayers"
                        onAction={() => router.replace('/prayers')}
                    />
                </View>
            </SafeAreaView>
        );
    }

    const favouriteId = `prayer-${prayer.slug}`;
    const saved = isFavourite(favouriteId);

    const bodySize = 17 * textScale;
    const bodyLine = 28 * textScale * lineHeightScale;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                title={prayer.title}
                rightElement={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TextSizeControl />
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={saved ? 'Remove this prayer from your saved items' : 'Save this prayer'}
                            accessibilityState={{ selected: saved }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            onPress={() =>
                                toggleFavourite({
                                    id: favouriteId,
                                    category: 'prayer',
                                    title: prayer.title,
                                    subtitle: prayer.context,
                                    body: prayer.sections.map((s) => s.body ?? s.lead ?? '').join(' ').slice(0, 160),
                                    accentColor: accent,
                                    route: `/prayers/${prayer.slug}`,
                                    sourceLabel: 'Prayer',
                                })
                            }
                        >
                            <Ionicons
                                name={saved ? 'heart' : 'heart-outline'}
                                size={20}
                                color={saved ? '#BE123C' : colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                }
            />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 22 }}>
                    {prayer.context}
                </Text>

                {prayer.sections.map((section, index) => (
                    <View key={`${prayer.slug}-section-${index}`} style={{ marginBottom: 22 }}>
                        {section.heading ? (
                            <Text
                                style={{
                                    color: accent,
                                    fontSize: 11,
                                    fontWeight: '700',
                                    letterSpacing: 1.6,
                                    textTransform: 'uppercase',
                                    marginBottom: 8,
                                }}
                            >
                                {section.heading}
                            </Text>
                        ) : null}

                        {section.lead ? (
                            <Text
                                style={{
                                    color: colors.textPrimary,
                                    fontSize: bodySize,
                                    lineHeight: bodyLine,
                                    fontFamily: 'Georgia',
                                }}
                            >
                                {section.lead}
                            </Text>
                        ) : null}

                        {section.response ? (
                            <Text
                                style={{
                                    color: colors.textSecondary,
                                    fontSize: bodySize,
                                    lineHeight: bodyLine,
                                    fontFamily: 'Georgia',
                                    fontStyle: 'italic',
                                    // The em dash and indent are how the Office marks a response;
                                    // keeping the same convention means one visual language for
                                    // everything prayed in this app.
                                    paddingLeft: 14,
                                }}
                            >
                                — {section.response}
                            </Text>
                        ) : null}

                        {section.body ? (
                            <Text
                                style={{
                                    color: colors.textPrimary,
                                    fontSize: bodySize,
                                    lineHeight: bodyLine,
                                    fontFamily: 'Georgia',
                                }}
                            >
                                {section.body}
                            </Text>
                        ) : null}
                    </View>
                ))}

                {prayer.reminderKey ? (
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`Set a daily reminder for ${prayer.title}`}
                        activeOpacity={0.85}
                        onPress={() => router.push('/settings/reminder')}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            minHeight: 48,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: `${accent}44`,
                            backgroundColor: `${accent}10`,
                            marginTop: 8,
                        }}
                    >
                        <Ionicons name="alarm-outline" size={17} color={accent} />
                        <Text style={{ color: accent, fontSize: 14, fontWeight: '700' }}>
                            Remind me to pray this
                        </Text>
                    </TouchableOpacity>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
