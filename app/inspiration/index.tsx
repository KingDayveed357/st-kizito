import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { useAppStore } from '../../src/store/useAppStore';
import { getCalendar, getDailyInspiration, getTodayIso } from '../../src/services/liturgicalData';
import { useFavourites } from '../../src/hooks/useFavourites';

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
        bg: { light: '#EDE9F6', dark: '#2A2440' },
        text: { light: '#6B4E8A', dark: '#C9B8E8' },
        icon: 'sparkles-outline' as const,
    },
    strength: {
        bg: { light: '#E6F2EC', dark: '#1E2D26' },
        text: { light: '#2F6A46', dark: '#7EC99A' },
        icon: 'partly-sunny-outline' as const,
    },
    faith: {
        bg: { light: '#FBF3E4', dark: '#2C2515' },
        text: { light: '#9A7A43', dark: '#D4A853' },
        icon: 'flame-outline' as const,
    },
    hope: {
        bg: { light: '#E6EFF9', dark: '#1A2535' },
        text: { light: '#3A6EA5', dark: '#7AAED6' },
        icon: 'sunny-outline' as const,
    },
    love: {
        bg: { light: '#FAEAEC', dark: '#2C1A1D' },
        text: { light: '#B5303C', dark: '#E07880' },
        icon: 'heart-outline' as const,
    },
} as const;

function HeroVerseCard({
    verse,
    colors,
    allColors,
    isDark,
    isFavourited,
    onToggleFavourite,
}: {
    verse: Verse;
    colors: ReturnType<typeof useTheme>['colors'];
    allColors: ReturnType<typeof useTheme>['allColors'];
    isDark: boolean;
    isFavourited: boolean;
    onToggleFavourite: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const accent = allColors.liturgical.christmasEaster;

    useEffect(() => {
        if (!copied) return;
        const timeout = setTimeout(() => setCopied(false), 1200);
        return () => clearTimeout(timeout);
    }, [copied]);

    const handleShare = () => {
        Share.share({ message: `"${verse.text}" - ${verse.reference}` });
    };

    const handleCopy = async () => {
        await Clipboard.setStringAsync(`"${verse.text}" - ${verse.reference}`);
        setCopied(true);
    };

    return (
        <View
            style={{
                borderRadius: 28,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 28,
                paddingTop: 32,
                paddingBottom: 28,
                alignItems: 'center',
                marginBottom: 28,
            }}
        >
            <Text style={{ color: accent, fontSize: 48, fontFamily: 'Georgia', lineHeight: 48, marginBottom: 8, opacity: 0.7 }}>
                "
            </Text>

            <Text
                style={{
                    color: colors.textPrimary,
                    fontSize: 26,
                    fontFamily: 'Georgia',
                    fontWeight: '700',
                    textAlign: 'center',
                    lineHeight: 36,
                    marginBottom: 20,
                }}
            >
                {verse.text}
            </Text>

            <Text style={{ color: allColors.liturgical.ordinaryTime, fontSize: 11, fontWeight: '700', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 10 }}>
                {verse.reference}
            </Text>
            <View style={{ width: 40, height: 2, borderRadius: 1, backgroundColor: accent, marginBottom: 24 }} />

            <View style={{ flexDirection: 'row', gap: 14 }}>
                <ActionButton
                    icon={isFavourited ? 'heart' : 'heart-outline'}
                    color={isFavourited ? '#B5303C' : colors.textSecondary}
                    bg={isFavourited ? '#FAEAEC' : colors.surfaceElevated}
                    onPress={onToggleFavourite}
                    isDark={isDark}
                />
                <ActionButton
                    icon="share-social-outline"
                    color={colors.textSecondary}
                    bg={colors.surfaceElevated}
                    onPress={handleShare}
                    isDark={isDark}
                />
                <ActionButton
                    icon="copy-outline"
                    color="#FFFFFF"
                    bg={allColors.liturgical.ordinaryTime}
                    onPress={handleCopy}
                    isDark={isDark}
                    filled
                    label={copied ? 'Copied!' : undefined}
                />
            </View>
        </View>
    );
}

function ActionButton({
    icon,
    color,
    bg,
    onPress,
    filled = false,
    isDark,
    label,
}: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    bg: string;
    onPress: () => void;
    filled?: boolean;
    isDark: boolean;
    label?: string;
}) {
    return (
        <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={onPress}
                style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: filled ? 0 : 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                }}
            >
                <Ionicons name={icon} size={22} color={color} />
            </TouchableOpacity>
            {label ? (
                <View
                    style={{
                        marginTop: 6,
                        backgroundColor: '#1F2937',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                    }}
                >
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{label}</Text>
                </View>
            ) : null}
        </View>
    );
}

function ReflectionCard({
    item,
    colors,
    isDark,
    isFavourited,
    onToggleFavourite,
}: {
    item: Reflection;
    colors: ReturnType<typeof useTheme>['colors'];
    isDark: boolean;
    isFavourited: boolean;
    onToggleFavourite: () => void;
}) {
    const cfg = THEME_CONFIG[item.theme];
    const cardBg = isDark ? cfg.bg.dark : cfg.bg.light;
    const accentColor = isDark ? cfg.text.dark : cfg.text.light;

    return (
        <View
            style={{
                borderRadius: 22,
                backgroundColor: cardBg,
                padding: 20,
                marginBottom: 14,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <Ionicons name={cfg.icon} size={22} color={accentColor} />
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onToggleFavourite}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: isFavourited ? '#B5303C' : 'rgba(255,255,255,0.55)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons
                        name={isFavourited ? 'heart' : 'heart-outline'}
                        size={17}
                        color={isFavourited ? '#FFFFFF' : accentColor}
                    />
                </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textPrimary, fontSize: 20, fontFamily: 'Georgia', fontWeight: '700', lineHeight: 30, marginBottom: 8 }}>
                {item.verse}
            </Text>
            <Text style={{ color: accentColor, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                {item.reference}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 21 }}>
                {item.reflection}
            </Text>
        </View>
    );
}

function SaintQuoteCard({
    quote,
    colors,
    allColors,
}: {
    quote: SaintQuote;
    colors: ReturnType<typeof useTheme>['colors'];
    allColors: ReturnType<typeof useTheme>['allColors'];
}) {
    return (
        <View
            style={{
                borderRadius: 22,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 22,
                marginBottom: 8,
            }}
        >
            <Text style={{ color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 16, fontStyle: 'italic', lineHeight: 26, marginBottom: 18 }}>
                "{quote.quote}"
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: `${allColors.liturgical.ordinaryTime}20`,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Text style={{ color: allColors.liturgical.ordinaryTime, fontSize: 12, fontWeight: '700' }}>
                        {quote.initials}
                    </Text>
                </View>
                <Text style={{ color: allColors.liturgical.ordinaryTime, fontSize: 11, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' }}>
                    {quote.saint}
                </Text>
            </View>
        </View>
    );
}

export default function InspirationScreen() {
    const { colors, allColors, isDark } = useTheme();
    const router = useRouter();
    const { selectedDate, setSource } = useAppStore();
    const { isFavourite, toggleFavourite } = useFavourites('inspiration');

    const effectiveDate = getCalendar(selectedDate) ? selectedDate : getTodayIso();
    const inspirationEntry = getDailyInspiration(effectiveDate);

    const heroVerse: Verse = {
        id: 'daily',
        text: inspirationEntry?.heroVerse.text ?? 'The Lord is my shepherd; I shall not want.',
        reference: inspirationEntry?.heroVerse.reference ?? 'PSALM 23:1',
    };

    const reflections: Reflection[] =
        inspirationEntry?.reflections ?? [
            {
                id: 'fallback-1',
                verse: 'Be still, and know that I am God.',
                reference: 'PSALM 46:10',
                reflection: inspirationEntry?.body ?? 'The Lord is present in the quiet places of today.',
                theme: 'peace',
            },
        ];

    const saintQuote: SaintQuote =
        inspirationEntry?.saintQuote ?? {
            quote: 'Pray as though everything depended on God. Work as though everything depended on you.',
            saint: 'St. Augustine',
            initials: 'SA',
        };

    const makeFavouriteId = (scope: 'hero' | 'reflection', id: string) => `inspiration-${effectiveDate}-${scope}-${id}`;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                centerElement={
                    <Text style={{ color: allColors.liturgical.ordinaryTime, fontFamily: 'Georgia', fontSize: 20, fontWeight: '700' }}>
                        Daily Inspiration
                    </Text>
                }

            />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                <HeroVerseCard
                    verse={heroVerse}
                    colors={colors}
                    allColors={allColors}
                    isDark={isDark}
                    isFavourited={isFavourite(makeFavouriteId('hero', heroVerse.id))}
                    onToggleFavourite={() =>
                        toggleFavourite({
                            id: makeFavouriteId('hero', heroVerse.id),
                            category: 'inspiration',
                            title: heroVerse.reference,
                            subtitle: `Daily Inspiration - ${effectiveDate}`,
                            body: heroVerse.text,
                            accentColor: allColors.liturgical.ordinaryTime,
                            route: '/inspiration',
                            sourceLabel: 'Inspiration',
                        })
                    }
                />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                    <View>
                        <Text style={{ color: allColors.liturgical.ordinaryTime, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>
                            Reflections
                        </Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 18, fontFamily: 'Georgia', fontWeight: '700' }}>
                            Grounded in the day's readings
                        </Text>
                    </View>
                    <TouchableOpacity>
                        <Text style={{ color: allColors.liturgical.ordinaryTime, fontSize: 13, fontWeight: '600' }}>
                            View All
                        </Text>
                    </TouchableOpacity>
                </View>

                {reflections.map((item) => (
                    <ReflectionCard
                        key={item.id}
                        item={item}
                        colors={colors}
                        isDark={isDark}
                        isFavourited={isFavourite(makeFavouriteId('reflection', item.id))}
                        onToggleFavourite={() =>
                            toggleFavourite({
                                id: makeFavouriteId('reflection', item.id),
                                category: 'inspiration',
                                title: item.reference,
                                subtitle: `Reflection - ${effectiveDate}`,
                                body: `${item.verse}\n\n${item.reflection}`,
                                accentColor: allColors.liturgical.ordinaryTime,
                                route: '/inspiration',
                                sourceLabel: 'Inspiration',
                            })
                        }
                    />
                ))}

                <View style={{ height: 10 }} />
                <SaintQuoteCard quote={saintQuote} colors={colors} allColors={allColors} />
            </ScrollView>
        </SafeAreaView>
    );
}


