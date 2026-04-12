import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Share, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { useAppStore } from '../../src/store/useAppStore';
import { getCalendar, getDailyInspiration, getTodayIso } from '../../src/services/liturgicalData';
import { useFavourites } from '../../src/hooks/useFavourites';

const { width } = Dimensions.get('window');

interface Verse {
    id: string;
    text: string;
    reference: string;
}

interface Reflection {
    id: string;
    verse: string;
    reference: string;
    reflection: string;
    theme: 'peace' | 'strength' | 'faith' | 'hope' | 'love';
}

interface SaintQuote {
    quote: string;
    saint: string;
    initials: string;
}

const THEME_CONFIG = {
    peace: {
        bg: ['#F3E8FF', '#E9D5FF'],
        accent: '#7E22CE',
        icon: 'sparkles-outline' as const,
    },
    strength: {
        bg: ['#DCFCE7', '#BBF7D0'],
        accent: '#15803D',
        icon: 'fitness-outline' as const,
    },
    faith: {
        bg: ['#FEF3C7', '#FDE68A'],
        accent: '#B45309',
        icon: 'flame-outline' as const,
    },
    hope: {
        bg: ['#DBEAFE', '#BFDBFE'],
        accent: '#1D4ED8',
        icon: 'sunny-outline' as const,
    },
    love: {
        bg: ['#FFE4E6', '#FECDD3'],
        accent: '#BE123C',
        icon: 'heart-outline' as const,
    },
} as const;

export default function InspirationScreen() {
    const { colors, allColors, isDark } = useTheme();
    const router = useRouter();
    const { selectedDate, setSource } = useAppStore();
    const { isFavourite, toggleFavourite } = useFavourites('inspiration');

    const effectiveDate = getCalendar(selectedDate) ? selectedDate : getTodayIso();
    const inspiration = useMemo(() => getDailyInspiration(effectiveDate), [effectiveDate]);

    useEffect(() => {
        setSource('inspirations');
    }, []);

    const handleShare = (text: string, ref: string) => {
        Share.share({ message: `"${text}" - ${ref}\n\nShared from St. Kizito` });
    };

    if (!inspiration) return null;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                title="Daily Inspiration"
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Card */}
                <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="chatbubbles-outline" size={32} color={allColors.liturgical.christmasEaster} style={{ opacity: 0.2, marginBottom: -10 }} />
                    <Text style={[styles.heroText, { color: colors.textPrimary }]} className="font-serif">
                        {inspiration.heroVerse.text}
                    </Text>
                    <Text style={[styles.heroRef, { color: colors.accent }]}>
                        {inspiration.heroVerse.reference}
                    </Text>

                    <View style={styles.heroActions}>
                        <TouchableOpacity
                            onPress={() => handleShare(inspiration.heroVerse.text, inspiration.heroVerse.reference)}
                            style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated }]}
                        >
                            <Ionicons name="share-social-outline" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => toggleFavourite({
                                id: `insp-hero-${effectiveDate}`,
                                category: 'inspiration',
                                title: inspiration.heroVerse.reference,
                                subtitle: inspiration.title,
                                body: inspiration.heroVerse.text,
                                accentColor: colors.accent,
                                route: '/inspiration',
                                sourceLabel: 'Inspiration'
                            })}
                            style={[styles.actionBtn, { backgroundColor: isFavourite(`insp-hero-${effectiveDate}`) ? '#FECDD3' : colors.surfaceElevated }]}
                        >
                            <Ionicons
                                name={isFavourite(`insp-hero-${effectiveDate}`) ? "heart" : "heart-outline"}
                                size={18}
                                color={isFavourite(`insp-hero-${effectiveDate}`) ? "#BE123C" : colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Celebration Banner */}
                <View style={styles.celebrationRow}>
                    <View style={[styles.dot, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.celebrationText, { color: colors.textSecondary }]}>
                        {inspiration.title.toUpperCase()}
                    </Text>
                </View>

                {/* Reflections */}
                {inspiration.reflections.map((item: any, idx: number) => {
                    const cfg = THEME_CONFIG[item.theme as keyof typeof THEME_CONFIG] || THEME_CONFIG.peace;
                    return (
                        <View
                            key={item.id}
                            style={[styles.reflectionCard, { backgroundColor: isDark ? colors.surfaceElevated : cfg.bg[0] }]}
                        >
                            <View style={styles.reflectionHeader}>
                                <Ionicons name={cfg.icon} size={20} color={cfg.accent} />
                                <Text style={[styles.reflectionTheme, { color: cfg.accent }]}>
                                    {item.theme.toUpperCase()}
                                </Text>
                            </View>
                            <Text style={[styles.reflectionVerse, { color: colors.textPrimary }]} className="font-serif">
                                {item.verse}
                            </Text>
                            <Text style={[styles.reflectionText, { color: colors.textSecondary }]}>
                                {item.reflection}
                            </Text>
                        </View>
                    );
                })}

                {/* Saint Quote */}
                <View style={[styles.saintCard, { borderLeftColor: allColors.liturgical.ordinaryTime }]}>
                    <Text style={[styles.saintQuote, { color: colors.textPrimary }]} className="font-serif">
                        "{inspiration.saintQuote.quote}"
                    </Text>
                    <View style={styles.saintFooter}>
                        <View style={[styles.saintInitials, { backgroundColor: `${allColors.liturgical.ordinaryTime}20` }]}>
                            <Text style={{ color: allColors.liturgical.ordinaryTime, fontWeight: 'bold', fontSize: 10 }}>
                                {inspiration.saintQuote.initials}
                            </Text>
                        </View>
                        <Text style={[styles.saintName, { color: allColors.liturgical.ordinaryTime }]}>
                            {inspiration.saintQuote.saint}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    heroCard: {
        borderRadius: 32,
        padding: 28,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    heroText: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 34,
        marginBottom: 16,
    },
    heroRef: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 2,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    heroActions: {
        flexDirection: 'row',
        marginTop: 24,
        gap: 12,
    },
    actionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    celebrationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingLeft: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    celebrationText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    reflectionCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
    },
    reflectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    reflectionTheme: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    reflectionVerse: {
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 26,
        marginBottom: 10,
    },
    reflectionText: {
        fontSize: 14,
        lineHeight: 22,
    },
    saintCard: {
        marginTop: 10,
        paddingLeft: 20,
        borderLeftWidth: 4,
        paddingVertical: 10,
    },
    saintQuote: {
        fontSize: 16,
        fontStyle: 'italic',
        lineHeight: 26,
        marginBottom: 12,
        opacity: 0.9,
    },
    saintFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    saintInitials: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saintName: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});


