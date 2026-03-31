import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { PrayerSection } from '../../src/components/liturgical/PrayerSection';
import { Ionicons } from '@expo/vector-icons';
import {SafeAreaView} from "react-native-safe-area-context";
import { TextSizeControl } from '../../src/components/ui/TextSizeControl';

export default function PrayerDetailScreen() {
    const { prayer } = useLocalSearchParams();
    const { colors } = useTheme();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                title="Morning Prayer (Lauds)"
                rightElement={
                    <View className="flex-row items-center">
                        <TextSizeControl />
                        <View style={{ marginLeft: 8 }}>
                            <Ionicons name="volume-high" size={22} color={colors.textMuted} />
                        </View>
                    </View>
                }
            />

            <ScrollView
                contentContainerStyle={{ paddingTop: 24, paddingBottom: 48 }}
                className="flex-1"
                showsVerticalScrollIndicator={false}
            >
                <PrayerSection
                    label="OPENING VERSE"
                    text={`V. O Lord, open my lips.\nR. And my mouth will declare your praise.\n\nGlory to the Father, and to the Son, and to the Holy Spirit:\nas it was in the beginning, is now, and will be for ever. Amen. Alleluia.`}
                />

                <View style={{ backgroundColor: colors.surfaceElevated, marginHorizontal: 24, marginVertical: 32, height: 1 }} />

                <PrayerSection
                    label="HYMN"
                    text={`Dawn sprinkles all the East with light,\nDay o'er the earth is gliding bright,\nMorn's glittering rays their course begin;\nFarewell to darkness and to sin!\n\nEach phantom of the night depart,\nEach thought of guilt forsake the heart;\nLet every ill that darkness brought\nBeneath its shade, now come to naught.`}
                />

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}
