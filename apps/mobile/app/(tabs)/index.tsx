import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { CalendarIconButton } from '../../src/components/ui/CalendarIconButton';
import { Card } from '../../src/components/ui/Card';
import { LiturgicalBadge } from '../../src/components/liturgical/LiturgicalBadge';
import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/store/useAppStore';
import { getCalendar, getDatePresentation, getReadings, getTodayIso } from '../../src/services/liturgicalData';
import { useAnnouncements } from '../../src/hooks/useAnnouncements';
import { useEvents } from '../../src/hooks/useEvents';
import { useTabBarClearance } from '../../src/hooks/useTabBarClearance';
import { useFavourites } from '../../src/hooks/useFavourites';
import { getInspirationForDate } from '../../src/utils/dailyInspiration';
import { VerseOfTheDayCard } from '../../src/components/liturgical/VerseOfTheDayCard';
import { AnnouncementCard } from '../../src/components/parish/AnnouncementCard';
import { EventCard } from '../../src/components/parish/EventCard';
import { SkeletonLoader } from '../../src/components/ui/SkeletonLoader';

/**
 * Placeholder for a Pulse card while it loads.
 *
 * Matches the real card's footprint so the section does not jump in height when data arrives —
 * the previous version showed a line of "Loading announcements..." text and then reflowed.
 */
const PulseSkeleton = ({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) => (
    <View
        accessibilityLabel="Loading"
        style={{
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 12,
        }}
    >
        <SkeletonLoader width="42%" height={12} />
        <View style={{ height: 12 }} />
        <SkeletonLoader width="85%" height={17} />
        <View style={{ height: 10 }} />
        <SkeletonLoader width="60%" height={13} />
    </View>
);

/** Quiet empty state, sized like a card so the section keeps its rhythm. */
const PulseEmpty = ({
    colors,
    icon,
    message,
}: {
    colors: ReturnType<typeof useTheme>['colors'];
    icon: React.ComponentProps<typeof Ionicons>['name'];
    message: string;
}) => (
    <View
        style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.border,
            paddingVertical: 20,
            paddingHorizontal: 16,
            marginBottom: 12,
        }}
    >
        <Ionicons name={icon} size={18} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, fontSize: 13, flex: 1 }}>{message}</Text>
    </View>
);

export default function HomeScreen() {
    const { colors, allColors } = useTheme();
    const tabBarClearance = useTabBarClearance();
    const router = useRouter();
    const { selectedDate, setSource } = useAppStore();

    const effectiveDate = getCalendar(selectedDate) ? selectedDate : getTodayIso();
    const presentation = getDatePresentation(effectiveDate);
    const readings = getReadings(effectiveDate);

    const { data: announcements, isLoading: loadingAnnouncements } = useAnnouncements();
    const { data: events, isLoading: loadingEvents } = useEvents();
    const latestAnnouncement = announcements[0];
    const upcomingEvent = events[0];

    const firstReadingBlock = readings?.readings.find(
        (r) => r.type === 'first_reading' || r.type === 'reading' || r.type === 'vigil_reading'
    );

    const dailyInspiration = getInspirationForDate(effectiveDate);
    const { toggleFavourite, isFavourite } = useFavourites('inspiration');
    const isInspirationSaved = !!dailyInspiration && isFavourite(dailyInspiration.id);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                centerElement={
                    <View className="items-center" style={{ flexShrink: 1 }}>
                        <Text
                            numberOfLines={2}
                            ellipsizeMode="tail"
                            style={{ color: allColors.liturgical.ordinaryTime }}
                            className="font-serif font-bold text-center text-lg leading-snug"
                        >
                            {readings?.feastName ?? 'Daily Readings'}
                        </Text>
                        <Text style={{ color: colors.textSecondary }} className="font-sans font-bold text-[10px] uppercase tracking-widest mt-2">
                            {presentation?.shortMeta ?? effectiveDate}
                        </Text>
                    </View>
                }
               rightElement={
                    <CalendarIconButton
                        color={allColors.liturgical.ordinaryTime}
                        onPress={() => {
                            setSource('readings');
                            router.push('/calendar');
                        }}
                    />
                }
            />

            <ScrollView className="flex-1 px-screen pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: tabBarClearance }}>
                <Card accentColor={allColors.liturgical.ordinaryTime} className="mb-8" elevated>
                    <View className="flex-row justify-between items-start mb-4">
                        <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-sans font-bold text-[10px] tracking-widest uppercase">
                            FIRST READING
                        </Text>
                        <LiturgicalBadge
                            label={
                                readings?.liturgicalSeason === 'lent'
                                    ? 'Lent'
                                    : readings?.liturgicalSeason === 'easter'
                                      ? 'Easter'
                                      : 'Ordinary Time'
                            }
                            color="green"
                        />
                    </View>

                    {/*
                      * Truncate by LINES, not characters. `slice(0, 92)` cut mid-word with no
                      * ellipsis, so the card looked broken/incomplete rather than deliberately
                      * shortened. `numberOfLines` ends on a natural boundary and appends "…", and
                      * the "Read Now" button below is the explicit way to see the whole reading.
                      */}
                    <Text
                        numberOfLines={4}
                        ellipsizeMode="tail"
                        style={{ color: colors.textPrimary }}
                        className="font-serif italic font-bold text-[22px] leading-[28px] mb-4"
                    >
                        "{firstReadingBlock?.text ?? 'Daily reading unavailable.'}"
                    </Text>

                    <Text style={{ color: colors.textSecondary }} className="font-sans text-[14px] leading-[20px] mb-6">
                        {firstReadingBlock?.reference ?? 'Reference unavailable'}
                    </Text>

                    <Button
                        onPress={() => {
                            setSource('readings');
                            router.push('/readings');
                        }}
                        rightIcon={<Ionicons name="arrow-forward" size={16} color="#FFFFFF" />}
                        size="md"
                        className="w-full"
                    >
                        Read Now
                    </Button>
                </Card>

                <Text style={{ color: colors.textPrimary }} className="font-sans font-bold text-[10px] tracking-widest uppercase mb-4">
                    LITURGICAL ACTIONS
                </Text>
                {/*
                  Horizontally scrolling, so adding a fifth action does not crowd the screen — the
                  row already extends past the right edge.
                */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 flex-row pr-screen">
                    <Chip
                        label="Divine Office"
                        icon="book-outline"
                        accessibilityLabel="Divine Office. Open the Liturgy of the Hours."
                        onPress={() => {
                            setSource('divineOffice');
                            router.push('/divine-office');
                        }}
                    />
                    <Chip
                        label="Mass Time"
                        icon="time-outline"
                        accessibilityLabel="Mass times. Open the parish Mass schedule."
                        onPress={() => router.push('/parish')}
                    />
                    <Chip
                        label="Book Mass"
                        icon="calendar-outline"
                        accessibilityLabel="Book a Mass intention."
                        onPress={() => router.push('/booking')}
                    />
                    {/*
                      Sacramental Requests was previously reachable only by knowing the route — it
                      had no entry point from the home screen at all.
                    */}
                    <Chip
                        label="Sacramental Requests"
                        icon="document-text-outline"
                        accessibilityLabel="Sacramental requests. Request a baptismal card or other parish record."
                        onPress={() => router.push('/sacraments')}
                    />
                    <Chip
                        label="Support the Parish"
                        icon="heart-outline"
                        accessibilityLabel="Support the parish with a donation."
                        onPress={() => router.push('/donation')}
                    />
                </ScrollView>

                {/*
                  Verse of the Day.

                  Keeps the quote-card treatment the parish preferred — big italic serif, the
                  oversized quotation mark, the pink heart — but the heart now actually saves. The
                  content is the day's verse from the 366-entry bank, resolved offline, rather than
                  an excerpt of the Gospel (which duplicated the reading card directly above it).
                */}
                {dailyInspiration ? (
                    <VerseOfTheDayCard
                        text={dailyInspiration.text}
                        reference={dailyInspiration.reference}
                        saved={isInspirationSaved}
                        onToggleSave={() =>
                            // Keyed on `inspiration-<date>`, so toggling twice cannot leave two
                            // copies in Favourites.
                            toggleFavourite({
                                id: dailyInspiration.id,
                                category: 'inspiration',
                                title: dailyInspiration.reference,
                                subtitle: presentation?.formattedDate ?? effectiveDate,
                                body: dailyInspiration.text,
                                accentColor: colors.accent,
                                route: '/inspiration',
                                sourceLabel: 'Verse of the Day',
                            })
                        }
                        onPress={() => {
                            setSource('inspirations');
                            router.push('/inspiration');
                        }}
                    />
                ) : null}

                {/*
                  Both Pulse cards were hand-rolled inline here, with a second, differently-styled
                  copy of the same data living on the Parish tab. They now render the SAME
                  components the Parish tab uses, in `compact` form — so an improvement to an
                  announcement card cannot silently apply to one screen and not the other.
                */}
                {loadingAnnouncements ? (
                    <PulseSkeleton colors={colors} />
                ) : latestAnnouncement ? (
                    <AnnouncementCard
                        announcement={latestAnnouncement}
                        compact
                        onPress={() => router.push({ pathname: '/parish', params: { tab: 'Announcements' } })}
                    />
                ) : (
                    <PulseEmpty
                        colors={colors}
                        icon="megaphone-outline"
                        message="No announcements yet."
                    />
                )}

                {loadingEvents ? (
                    <PulseSkeleton colors={colors} />
                ) : upcomingEvent ? (
                    <EventCard
                        event={upcomingEvent}
                        compact
                        onPress={() => router.push({ pathname: '/parish', params: { tab: 'Events' } })}
                    />
                ) : (
                    <PulseEmpty
                        colors={colors}
                        icon="calendar-outline"
                        message="Nothing on the parish calendar yet."
                    />
                )}

            </ScrollView>
        </SafeAreaView>
    );
}
