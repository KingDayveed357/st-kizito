import React, { useCallback, useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import { AnnouncementCard } from '../../src/components/parish/AnnouncementCard';
import { EventCard } from '../../src/components/parish/EventCard';
import { MassTimeRow } from '../../src/components/parish/MassTimeRow';
import { GalleryGrid } from '../../src/components/parish/GalleryGrid';
import { useAnnouncements } from '../../src/hooks/useAnnouncements';
import { useEvents } from '../../src/hooks/useEvents';
import { useMassTimes } from '../../src/hooks/useMassTimes';
import { useGallery } from '../../src/hooks/useGallery';
import { OfflineBanner } from '../../src/components/ui/OfflineBanner';
import { SafeAreaView } from 'react-native-safe-area-context';

const PARISH_TABS = ['Announcements', 'Events', 'Mass Times', 'Gallery'] as const;

export default function ParishScreen() {
    const { colors, allColors } = useTheme();
    const [activeTab, setActiveTab] = useState<(typeof PARISH_TABS)[number]>('Announcements');

    const { data: announcements, isLoading: loadingA, refetch: refetchAnnouncements } = useAnnouncements();
    const { data: events, isLoading: loadingE, refetch: refetchEvents } = useEvents();
    const { data: massTimes, isLoading: loadingM, refetch: refetchMassTimes } = useMassTimes();
    const { data: gallery, isLoading: loadingG, refetch: refetchGallery } = useGallery();
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

    const renderContent = () => {
        switch (activeTab) {
            case 'Announcements':
                return (
                    <View>
                        <View
                            className="rounded-card p-4 shadow-sm mb-6 flex-row items-center justify-between border-l-4"
                            style={{ backgroundColor: colors.surface, borderLeftColor: allColors.liturgical.ordinaryTime, borderLeftWidth: 4 }}
                        >
                            <View className="flex-1">
                                <Text style={{ color: allColors.liturgical.adventLent }} className="font-sans font-bold text-[10px] tracking-widest uppercase mb-1">Upcoming Liturgy</Text>
                                <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-lg leading-tight mb-1">Evening Benediction and Vespers</Text>
                                <Text style={{ color: colors.textSecondary }} className="font-sans text-[11px]">Starts in 45 minutes, Main Sanctuary</Text>
                            </View>
                            <View
                                style={{
                                    backgroundColor: allColors.liturgical.ordinaryTime,
                                    width: 36,
                                    height: 36,
                                    borderRadius: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    alignSelf: 'center',
                                }}
                                className="ml-4"
                            >
                                <Ionicons name="notifications" size={20} color="#FFFFFF" />
                            </View>
                        </View>

                        <View className="flex-row justify-between items-end mb-4">
                            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-2xl leading-none">Latest{`\n`}Announcements</Text>
                        </View>

                        {loadingA ? <View className="h-40" /> : announcements.map((announcement) => (
                            <AnnouncementCard key={announcement.id} announcement={announcement} />
                        ))}
                    </View>
                );
            case 'Events':
                return (
                    <View>
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-2xl leading-none mb-6">Upcoming Events</Text>
                        {loadingE ? <View className="h-40" /> : events.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </View>
                );
            case 'Mass Times':
                return (
                    <View>
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-2xl leading-none mb-2">Weekly Mass Schedule</Text>
                        <Text style={{ color: colors.textSecondary }} className="font-sans text-[13px] leading-[20px] mb-6">
                            Grouped by day for clear, comfortable reading.
                        </Text>

                        {loadingM ? <View className="h-40" /> : massTimes.map((massTime) => (
                            <MassTimeRow key={massTime.id} massTime={massTime} />
                        ))}

                        <Text style={{ color: colors.textSecondary }} className="font-sans text-[11px] leading-[16px] mb-8">
                            * Saturday evening is the Sunday vigil Mass.
                        </Text>
                    </View>
                );
            case 'Gallery':
                return (
                    <View>
                        <View className="flex-row justify-between items-center mb-6">
                            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-2xl leading-none">Parish Gallery</Text>
                        </View>
                        {loadingG ? <View className="h-40" /> : <GalleryGrid items={gallery} onImagePress={() => { }} />}
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                centerElement={<Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-serif font-bold text-xl text-center">St. Kizito{`\n`}Parish</Text>}
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
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            >
                {renderContent()}
                <View className="h-20" />
            </ScrollView>

            <OfflineBanner />
        </SafeAreaView>
    );
}
