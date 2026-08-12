import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useTabBarClearance } from '../../src/hooks/useTabBarClearance';
import { Header } from '../../src/components/ui/Header';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AnnouncementCard } from '../../src/components/parish/AnnouncementCard';
import { EventCard } from '../../src/components/parish/EventCard';
import { MassTimeRow } from '../../src/components/parish/MassTimeRow';
import { GalleryGrid } from '../../src/components/parish/GalleryGrid';
import { GalleryViewer } from '../../src/components/parish/GalleryViewer';
import { UpcomingLiturgyCard } from '../../src/components/parish/UpcomingLiturgyCard';
import { useToast } from '../../src/components/ui/ToastProvider';
import { useAnnouncements } from '../../src/hooks/useAnnouncements';
import { useEvents } from '../../src/hooks/useEvents';
import { useMassTimes } from '../../src/hooks/useMassTimes';
import { useGallery } from '../../src/hooks/useGallery';
import { useUpcomingLiturgy } from '../../src/hooks/useUpcomingLiturgy';
import { OfflineBanner } from '../../src/components/ui/OfflineBanner';
import { SectionState } from '../../src/components/ui/SectionState';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTodayIso } from '../../src/services/liturgicalData';

const PARISH_TABS = ['Announcements', 'Events', 'Mass Times', 'Gallery'] as const;

export default function ParishScreen() {
    const { colors, allColors } = useTheme();
    const tabBarClearance = useTabBarClearance();
    const router = useRouter();
    /*
      The home screen's Parish Pulse cards deep-link straight to the section they preview, so
      tapping "Upcoming Event" lands on Events rather than on Announcements with the user left to
      find it. An unrecognised value falls back rather than rendering a blank tab.
    */
    const { tab: requestedTab } = useLocalSearchParams<{ tab?: string }>();
    const initialTab = PARISH_TABS.includes(requestedTab as (typeof PARISH_TABS)[number])
        ? (requestedTab as (typeof PARISH_TABS)[number])
        : 'Announcements';
    const [activeTab, setActiveTab] = useState<(typeof PARISH_TABS)[number]>(initialTab);
    const { showToast } = useToast();

    const {
        event: upcomingLiturgy,
        isLoading: loadingUpcomingLiturgy,
        reminderEnabled,
        isTogglingReminder,
        toggleReminder,
    } = useUpcomingLiturgy(getTodayIso());


    const { data: announcements, isLoading: loadingA, refetch: refetchAnnouncements } = useAnnouncements();
    const { data: events, isLoading: loadingE, refetch: refetchEvents } = useEvents();
    const { data: massTimes, isLoading: loadingM, refetch: refetchMassTimes } = useMassTimes();
    const {
        albums: galleryAlbums,
        images: galleryImages,
        isLoading: loadingG,
        refetch: refetchGallery,
    } = useGallery();
    /** Index into `galleryImages` of the photograph open full-screen; null when closed. */
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.allSettled([
                refetchAnnouncements(),
                refetchEvents(),
                refetchMassTimes(),
                refetchGallery(),
            ]);
        } finally {
            setIsRefreshing(false);
        }
    }, [refetchAnnouncements, refetchEvents, refetchMassTimes, refetchGallery]);

    const onToggleLiturgyReminder = useCallback(async () => {
        const result = await toggleReminder();
        if (!result) return;

        if (result.reason) {
            showToast(result.reason, 'error');
            return;
        }

        showToast(
            result.scheduled ? 'Reminder scheduled for 6:00 AM.' : 'Reminder removed.',
            result.scheduled ? 'success' : 'info',
        );
    }, [toggleReminder, showToast]);

    const renderContent = () => {
        switch (activeTab) {
            case 'Announcements':
                return (
                    <View>
                        <UpcomingLiturgyCard
                            event={upcomingLiturgy}
                            isLoading={loadingUpcomingLiturgy}
                            reminderEnabled={reminderEnabled}
                            isTogglingReminder={isTogglingReminder}
                            onToggleReminder={onToggleLiturgyReminder}
                            onPressDetails={() => {
                                if (!upcomingLiturgy) return;
                                router.push({
                                    pathname: '/readings/[date]',
                                    params: { date: upcomingLiturgy.date },
                                });
                            }}
                        />

                        {/*
                          Was "Latest{\n}Announcements" — a hardcoded line break that forced two
                          lines regardless of the space available, and with `leading-none` the
                          descenders collided with the card below it.
                        */}
                        <View className="mb-4">
                            <Text
                                style={{ color: colors.textPrimary, fontSize: 22, lineHeight: 28 }}
                                className="font-serif font-bold"
                            >
                                Latest Announcements
                            </Text>
                        </View>

                        <SectionState
                            isLoading={loadingA}
                            isEmpty={announcements.length === 0}
                            emptyIcon="megaphone-outline"
                            emptyTitle="No announcements yet"
                            emptySubtitle="When the parish office publishes news, it will appear here and stay available offline."
                            onRetry={refetchAnnouncements}
                        >
                            {announcements.map((announcement) => (
                                <AnnouncementCard key={announcement.id} announcement={announcement} />
                            ))}
                        </SectionState>
                    </View>
                );
            case 'Events':
                return (
                    <View>
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-2xl leading-none mb-6">Upcoming Events</Text>
                        <SectionState
                            isLoading={loadingE}
                            isEmpty={events.length === 0}
                            emptyIcon="calendar-outline"
                            emptyTitle="No upcoming events"
                            emptySubtitle="Nothing is on the parish calendar at the moment. Check back after the next bulletin."
                            onRetry={refetchEvents}
                        >
                            {events.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </SectionState>
                    </View>
                );
            case 'Mass Times':
                return (
                    <View>
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-2xl leading-none mb-2">Weekly Mass Schedule</Text>
                        <Text style={{ color: colors.textSecondary }} className="font-sans text-[13px] leading-[20px] mb-6">
                            Grouped by day for clear, comfortable reading.
                        </Text>

                        <SectionState
                            isLoading={loadingM}
                            isEmpty={massTimes.length === 0}
                            emptyIcon="time-outline"
                            emptyTitle="The Mass schedule isn't available"
                            emptySubtitle="It hasn't been published to the app yet. Please contact the parish office for current Mass times."
                            onRetry={refetchMassTimes}
                        >
                            {massTimes.map((massTime) => (
                                <MassTimeRow key={massTime.id} massTime={massTime} />
                            ))}
                        </SectionState>

                        {massTimes.length > 0 ? (
                            <Text style={{ color: colors.textSecondary }} className="font-sans text-[11px] leading-[16px] mb-8">
                                * Saturday evening is the Sunday vigil Mass.
                            </Text>
                        ) : null}
                    </View>
                );
            case 'Gallery':
                return (
                    <View>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-2xl leading-none">Parish Gallery</Text>
                        </View>
                        <SectionState
                            isLoading={loadingG}
                            isEmpty={galleryAlbums.length === 0}
                            emptyIcon="images-outline"
                            emptyTitle="No photographs yet"
                            emptySubtitle="Photographs from parish celebrations — baptisms, harvests, feast days — will be shared here."
                            onRetry={refetchGallery}
                            skeletonCount={2}
                            skeletonHeight={140}
                        >
                            <GalleryGrid
                                albums={galleryAlbums}
                                onImagePress={(image) => {
                                    // The viewer pages across the whole gallery, so the index has to
                                    // be resolved against the flattened list rather than the album.
                                    const index = galleryImages.findIndex((i) => i.id === image.id);
                                    setViewerIndex(index >= 0 ? index : 0);
                                }}
                            />
                        </SectionState>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} >
            <Header 
                showBack
                centerElement={<Text style={{ color: allColors.liturgical.ordinaryTime, fontSize: 20 }} className="font-serif font-bold  text-center ">St. Kizito Parish</Text>}
            />

            <View className="px-screen pt-3 pb-2">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        padding: 4,
                        borderRadius: 18,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.surfaceElevated,
                        gap: 8,
                    }}
                >
                    {PARISH_TABS.map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                className="px-4 py-3 rounded-2xl"
                                style={{ borderBottomWidth: isActive ? 2 : 0, borderBottomColor: isActive ? allColors.liturgical.ordinaryTime : 'transparent' }}
                            >
                                <Text
                                    style={{ color: isActive ? allColors.liturgical.ordinaryTime : colors.textSecondary }}
                                    className="font-sans text-[14px] font-bold"
                                >
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView
                className="flex-1 px-screen pt-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: tabBarClearance }}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            >
                {renderContent()}
            </ScrollView>

            <OfflineBanner />

            <GalleryViewer
                images={galleryImages}
                initialIndex={viewerIndex}
                onClose={() => setViewerIndex(null)}
            />
        </SafeAreaView>
    );
}
