import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, View } from 'react-native';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/hooks/useTheme';
import { useMassTimes } from '../../src/hooks/useMassTimes';
import { MassTimeRow } from '../../src/components/parish/MassTimeRow';

export default function ParishMassTimesScreen() {
    const { colors } = useTheme();
    const { data: massTimes, isLoading } = useMassTimes();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="Mass Times" />

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
                <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 6 }} className="font-serif">
                    Weekly Mass Schedule
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
                    Grouped by day for easier reading and prayerful planning.
                </Text>

                {isLoading ? <View style={{ height: 120 }} /> : massTimes.map((entry) => <MassTimeRow key={entry.id} massTime={entry} />)}

                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
                    * Saturday evening is the Sunday vigil Mass.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}
