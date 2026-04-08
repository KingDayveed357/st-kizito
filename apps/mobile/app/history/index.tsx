import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/hooks/useTheme';
import { parishHistorySections } from '../../src/data/moreContent';

export default function HistoryScreen() {
    const { colors, textScale, lineHeightScale } = useTheme();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="Parish History" />

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 56 }} showsVerticalScrollIndicator={false}>
                <View
                    style={{
                        borderRadius: 32,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 24,
                    }}
                >
                    <Text style={{ color: colors.accent }} className="font-sans text-[11px] font-bold uppercase tracking-[2px]">
                        ST. KIZITO PARISH
                    </Text>
                    <Text
                        style={{
                            color: colors.textPrimary,
                            fontSize: 30 * textScale,
                            lineHeight: 38 * textScale * lineHeightScale,
                            marginTop: 12,
                        }}
                        className="font-serif font-bold"
                    >
                        A community shaped by worship, service, and steady growth.
                    </Text>
                    <Text
                        style={{
                            color: colors.textSecondary,
                            fontSize: 15 * textScale,
                            lineHeight: 25 * textScale * lineHeightScale,
                            marginTop: 14,
                        }}
                        className="font-sans"
                    >
                        Our parish history is more than a timeline. It is a record of people who kept faith visible through prayer, generosity, and commitment to one another.
                    </Text>
                </View>

                <View className="mt-10">
                    {parishHistorySections.map((section, index) => (
                        <View key={section.id} style={{ marginBottom: index === parishHistorySections.length - 1 ? 0 : 28 }}>
                            <Text style={{ color: colors.accent }} className="font-sans text-[11px] font-bold uppercase tracking-[2px]">
                                {section.eyebrow}
                            </Text>
                            <Text
                                style={{
                                    color: colors.textPrimary,
                                    fontSize: 24 * textScale,
                                    lineHeight: 32 * textScale * lineHeightScale,
                                    marginTop: 10,
                                }}
                                className="font-serif font-bold"
                            >
                                {section.title}
                            </Text>
                            <Text
                                style={{
                                    color: colors.textSecondary,
                                    fontSize: 16 * textScale,
                                    lineHeight: 28 * textScale * lineHeightScale,
                                    marginTop: 12,
                                }}
                                className="font-serif"
                            >
                                {section.body}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
