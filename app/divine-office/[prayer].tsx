import React from 'react';
import { View, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { PrayerSection } from '../../src/components/liturgical/PrayerSection';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextSizeControl } from '../../src/components/ui/TextSizeControl';
import { useAppStore } from '../../src/store/useAppStore';
import { getCalendar, getDivineOfficePrayer, getTodayIso } from '../../src/services/liturgicalData';

export default function PrayerDetailScreen() {
    const { prayer } = useLocalSearchParams();
    const { colors } = useTheme();
    const selectedDate = useAppStore((state) => state.selectedDate);
    const prayerKey = Array.isArray(prayer) ? prayer[0] : prayer;
    const effectiveDate = getCalendar(selectedDate) ? selectedDate : getTodayIso();
    const detail = prayerKey ? getDivineOfficePrayer(effectiveDate, prayerKey) : null;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                title={detail?.title ?? 'Prayer'}
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

                {detail?.psalms?.map((psalm: { reference: string; text: string }, index: number) => (
                    <React.Fragment key={`${psalm.reference}-${index}`}>
                        <View style={{ backgroundColor: colors.surfaceElevated, marginHorizontal: 24, marginVertical: 32, height: 1 }} />
                        <PrayerSection label={psalm.reference.toUpperCase()} text={psalm.text} />
                    </React.Fragment>
                ))}

                {!!detail?.readingText && (
                    <>
                        <View style={{ backgroundColor: colors.surfaceElevated, marginHorizontal: 24, marginVertical: 32, height: 1 }} />
                        <PrayerSection
                            label={detail.readingReference ? `READING - ${detail.readingReference.toUpperCase()}` : 'READING'}
                            text={detail.readingText}
                        />
                    </>
                )}

                {!!detail?.antiphon && (
                    <>
                        <View style={{ backgroundColor: colors.surfaceElevated, marginHorizontal: 24, marginVertical: 32, height: 1 }} />
                        <PrayerSection label="ANTIPHON" text={detail.antiphon} />
                    </>
                )}

                {!!detail?.canticleText && (
                    <>
                        <View style={{ backgroundColor: colors.surfaceElevated, marginHorizontal: 24, marginVertical: 32, height: 1 }} />
                        <PrayerSection
                            label={detail.canticleReference ? `GOSPEL CANTICLE - ${detail.canticleReference.toUpperCase()}` : 'GOSPEL CANTICLE'}
                            text={detail.canticleText}
                        />
                    </>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}
