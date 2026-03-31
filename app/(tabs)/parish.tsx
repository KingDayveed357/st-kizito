import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const PARISH_TABS = ['Announcements', 'Events', 'Mass Times', 'Gallery'] as const;
const MASS_TABLE_COLUMNS = {
    day: { width: '30%' as const },
    morning: { width: '35%' as const },
    evening: { width: '35%' as const },
};

export default function ParishScreen() {
    const { colors, allColors } = useTheme();
    const [activeTab, setActiveTab] = useState<(typeof PARISH_TABS)[number]>('Announcements');
    const router = useRouter();

    const { data: announcements, isLoading: loadingA } = useAnnouncements();
    const { data: events, isLoading: loadingE } = useEvents();
    const { data: massTimes, isLoading: loadingM } = useMassTimes();
    const { data: gallery, isLoading: loadingG } = useGallery();

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
                                <Text style={{ color: allColors.liturgical.adventLent }} className="font-sans font-bold text-[10px] tracking-widest uppercase mb-1">UPCOMING LITURGY</Text>
                                <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-lg leading-tight mb-1">Evening Benediction & Vespers</Text>
                                <Text style={{ color: colors.textSecondary }} className="font-sans text-[11px]">Starts in 45 minutes • Main Sanctuary</Text>
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
                                    aspectRatio: 1,
                                    overflow: 'hidden',
                                }}
                                className="ml-4"
                            >
                                <Ionicons name="notifications" size={20} color="#FFFFFF" />
                            </View>
                        </View>

                        <View className="flex-row justify-between items-end mb-4">
                            <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-2xl leading-none">Latest{'\n'}Announcements</Text>
                            <TouchableOpacity className="flex-row items-center mb-1">
                                <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-sans font-bold text-xs uppercase mr-1">View{'\n'}Archive</Text>
                                <Ionicons name="arrow-forward" size={14} color={allColors.liturgical.ordinaryTime} />
                            </TouchableOpacity>
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
                            Clear service times for weekdays, vigil, and Sunday celebrations.
                        </Text>
                        <View
                            style={{ backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surfaceElevated }}
                            className="mb-3 overflow-hidden"
                        >
                            <View
                                className="flex-row px-5 py-4"
                                style={{ backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.surfaceElevated }}
                            >
                                <View style={MASS_TABLE_COLUMNS.day} className="pr-3">
                                    <Text style={{ color: '#8C827A' }} className="font-sans font-bold text-[10px] tracking-[1.5px] uppercase">Day</Text>
                                </View>
                                <View style={MASS_TABLE_COLUMNS.morning} className="pr-3">
                                    <Text style={{ color: '#8C827A' }} className="font-sans font-bold text-[10px] tracking-[1.5px] uppercase">Morning</Text>
                                </View>
                                <View style={MASS_TABLE_COLUMNS.evening}>
                                    <Text style={{ color: '#8C827A' }} className="font-sans font-bold text-[10px] tracking-[1.5px] uppercase">Evening</Text>
                                </View>
                            </View>
                            {loadingM ? <View className="h-40" /> : massTimes.map((massTime, index) => (
                                <MassTimeRow key={massTime.id} massTime={massTime} isLast={index === massTimes.length - 1} />
                            ))}
                        </View>
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
                            <TouchableOpacity className="flex-row items-center">
                                <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-sans font-bold text-xs uppercase mr-1">See All</Text>
                                <Ionicons name="grid" size={12} color={allColors.liturgical.ordinaryTime} />
                            </TouchableOpacity>
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
                centerElement={<Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-serif font-bold text-xl text-center">St. Kizito{'\n'}Parish</Text>}
                rightElement={
                    <TouchableOpacity onPress={() => router.push('/calendar')} className="p-2 mr-2">
                        <Ionicons name="calendar-outline" size={24} color={allColors.liturgical.ordinaryTime} />
                    </TouchableOpacity>
                }
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
                refreshControl={<RefreshControl refreshing={false} onRefresh={() => { }} />}
            >
                {renderContent()}
                <View className="h-20" />
            </ScrollView>

            <OfflineBanner />
        </SafeAreaView>
    );
}
