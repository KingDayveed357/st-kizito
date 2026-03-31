import React from 'react';
import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { LiturgicalBadge } from '../../src/components/liturgical/LiturgicalBadge';
import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import { ScriptureQuote } from '../../src/components/liturgical/ScriptureQuote';
import { AnnouncementCard } from '../../src/components/parish/AnnouncementCard';
import { EventCard } from '../../src/components/parish/EventCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                centerElement={
                    <View className="items-center">
                        <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-serif font-bold text-center text-lg leading-snug mx-4">
                            Thursday of the Twelfth{'\n'}Week in Ordinary Time
                        </Text>
                        <Text style={{ color: colors.textSecondary }} className="font-sans font-bold text-[8px] uppercase tracking-widest mt-2">
                            JUNE 27, 2024 • LECTIONARY 374
                        </Text>
                    </View>
                }
                rightElement={
                    <TouchableOpacity onPress={() => router.push('/calendar')} className="p-2 mr-2">
                        <Ionicons name="calendar-outline" size={24} color={allColors.liturgical.ordinaryTime} />
                    </TouchableOpacity>
                }
            />

            <ScrollView className="flex-1 px-screen pt-4" showsVerticalScrollIndicator={false}>
                {/* Today's Reading Card */}
                <Card accentColor={allColors.liturgical.ordinaryTime} className="mb-8" elevated>
                    <View className="flex-row justify-between items-start mb-4">
                        <Text style={{ color: allColors.liturgical.ordinaryTime }} className="font-sans font-bold text-[10px] tracking-widest uppercase">
                            FIRST READING
                        </Text>
                        <LiturgicalBadge label="Ordinary Time" color="green" />
                    </View>

                    <Text style={{ color: colors.textPrimary }} className="font-serif italic font-bold text-[22px] leading-[28px] mb-4">
                        "The word of the Lord came to me: Son of man, prophesy against the prophets..."
                    </Text>

                    <Text style={{ color: colors.textSecondary }} className="font-sans text-[14px] leading-[20px] mb-6">
                        Thus says the Lord GOD: Woe to the foolish prophets who follow their own spirit and have seen nothing! Your...
                    </Text>

                    <Button
                        onPress={() => router.push('/readings')}
                        rightIcon={<Ionicons name="arrow-forward" size={16} color="#FFFFFF" />}
                        size="md"
                        className="w-full"
                    >
                        Read Now
                    </Button>
                </Card>

                {/* Quick Access */}
                <Text style={{ color: colors.textPrimary }} className="font-sans font-bold text-[10px] tracking-widest uppercase mb-4">
                    LITURGICAL ACTIONS
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 flex-row pr-screen">
                    <Chip label="Divine Office" onPress={() => router.push('/divine-office')} />
                    <Chip label="Mass Time" onPress={() => router.push('/parish')} />
                    <Chip label="Mass Intentions" onPress={() => { }} />
                </ScrollView>

                {/* Daily Verse */}
                <ScriptureQuote
                    text="I can do all things through Christ who strengthens me."
                    reference="PHILIPPIANS 4:13"
                />

                {/* Parish Pulse */}
                <Text style={{ color: colors.textPrimary }} className="font-sans font-bold text-[10px] tracking-widest uppercase mt-4 mb-4">
                    PARISH PULSE
                </Text>

                <View className="flex-row justify-between mb-8">
                    <View style={{ backgroundColor: colors.surface, flex: 1, marginRight: 8, padding: 16, borderRadius: 16 }}>
                        <Ionicons name="megaphone" size={20} color={allColors.liturgical.ordinaryTime} className="mb-4" />
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-[16px] leading-[20px] mb-6">Parish Picnic{'\n'}this Saturday!</Text>
                        <Text style={{ color: colors.textSecondary }} className="font-sans font-bold text-[9px] tracking-widest uppercase">COMMUNITY</Text>
                    </View>
                    <View style={{ backgroundColor: '#F4EBFF', flex: 1, marginLeft: 8, padding: 16, borderRadius: 16 }}>
                        <View className="flex-row justify-between items-start mb-4">
                            <Ionicons name="calendar" size={20} color={allColors.liturgical.adventLent} />
                            <View style={{ backgroundColor: allColors.liturgical.adventLent, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                <Text style={{ color: '#FFFFFF' }} className="font-sans font-bold text-[9px] tracking-widest uppercase">JUN 29</Text>
                            </View>
                        </View>
                        <Text style={{ color: colors.textPrimary }} className="font-serif font-bold text-[16px] leading-[20px] mt-2 mb-1">Evening Mass</Text>
                        <Text style={{ color: colors.textSecondary }} className="font-sans text-[10px]">6:00 PM • Chapel</Text>
                    </View>
                </View>

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}