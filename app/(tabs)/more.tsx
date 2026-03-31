import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, Linking, Image } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Data ────────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
    {
        title: 'Inspirations',
        subtitle: 'Scripture & reflections',
        icon: 'sunny-outline' as const,
        route: '/inspiration',
        accent: '#C9A84C',
    },
    {
        title: 'Favourites',
        subtitle: 'Saved readings & prayers',
        icon: 'heart-outline' as const,
        route: '/favourites',
        accent: '#B5303C',
    },
    {
        title: 'Donations',
        subtitle: 'Give with confidence',
        icon: 'gift-outline' as const,
        route: '/donation',
        accent: '#4A7C59',
    },
    {
        title: 'Settings',
        subtitle: 'Theme & preferences',
        icon: 'options-outline' as const,
        route: '/settings',
        accent: '#5E6F8E',
    },
];

const PARISH_SERVICES = [
    {
        id: 'mass',
        title: 'Book a Mass',
        subtitle: 'Mass intentions & thanksgiving',
        icon: 'flame-outline' as const,
        route: '/booking',
        accent: '#4A7C59',
    },
    {
        id: 'history',
        title: 'Parish History',
        subtitle: 'Our story, witness & growth',
        icon: 'time-outline' as const,
        route: '/history',
        accent: '#C9A84C',
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface QuickActionCardProps {
    title: string;
    subtitle: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    accent: string;
    onPress: () => void;
    colors: ReturnType<ReturnType<typeof useTheme>['colors']['background'] extends string ? never : typeof useTheme>['colors'];
}

const QuickActionCard = ({
    title,
    subtitle,
    icon,
    accent,
    onPress,
    colors,
}: {
    title: string;
    subtitle: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    accent: string;
    onPress: () => void;
    colors: ReturnType<typeof useTheme>['colors'];
}) => (
    <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={{
            width: '48.5%',
            borderRadius: 0,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
            minHeight: 140,
        }}
    >
        <View
            style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: `${accent}18`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
            }}
        >
            <Ionicons name={icon} size={22} color={accent} />
        </View>
        <Text style={{ color: colors.textPrimary, fontSize: 16, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 4 }}>
            {title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17 }}>
            {subtitle}
        </Text>
    </TouchableOpacity>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MoreScreen() {
    const { colors, allColors, mode } = useTheme();
    const router = useRouter();

    const isDarkMode = mode === 'dark' || mode === 'high-contrast';
    const parishBadgeBg = isDarkMode ? colors.surfaceElevated : '#E8F0E6';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header title="More" />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Parish identity card ── */}
                <TouchableOpacity
                    activeOpacity={0.88}
                    style={{
                        borderRadius: 24,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 16,
                    }}
                >
                    <View>
                        <Image
                            style={{ width: 52, height: 52, borderRadius: 22 }}
                            source={require('../../assets/favicon.png')}
                            resizeMode="cover"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: allColors.liturgical.ordinaryTime, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 3 }}>
                            Parish Profile
                        </Text>
                        <Text style={{ color: colors.textPrimary, fontSize: 18, fontFamily: 'Georgia', fontWeight: '700' }}>
                            St. Kizito Parish
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3, lineHeight: 17 }}>
                            Port harcourt • Catholic Diocese
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>

                {/* ── Section: Essentials ── */}
                <View style={{ marginTop: 28, marginBottom: 14 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 20, fontFamily: 'Georgia', fontWeight: '700' }}>
                        Essentials
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                        Daily tools for your prayer life.
                    </Text>
                </View>

                <View className='flex justify-between flex-row flex-wrap gap-3 mb-28'>
                    {QUICK_ACTIONS.map((item) => (
                        <QuickActionCard
                            key={item.title}
                            {...item}
                            onPress={() => router.push(item.route as never)}
                            colors={colors}
                        />
                    ))}
                </View>

                {/* ── Section: Parish Services ── */}
                <View style={{ marginTop: 28, marginBottom: 14 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 20, fontFamily: 'Georgia', fontWeight: '700' }}>
                        Parish Services
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                        Request sacraments, Masses, and more.
                    </Text>
                </View>

                <View
                    style={{
                        borderRadius: 24,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        overflow: 'hidden',
                    }}
                >
                    {PARISH_SERVICES.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.86}
                            onPress={() => router.push(item.route as never)}
                            style={{
                                paddingHorizontal: 18,
                                paddingVertical: 16,
                                borderBottomWidth: index === PARISH_SERVICES.length - 1 ? 0 : 1,
                                borderBottomColor: colors.border,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 14,
                            }}
                        >
                            <View
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 14,
                                    backgroundColor: `${item.accent}18`,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name={item.icon} size={22} color={item.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: colors.textPrimary, fontSize: 16, fontFamily: 'Georgia', fontWeight: '700' }}>
                                    {item.title}
                                </Text>
                                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                                    {item.subtitle}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ── Section: Contact the Parish ── */}
                <View style={{ marginTop: 28, marginBottom: 14 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 20, fontFamily: 'Georgia', fontWeight: '700' }}>
                        Contact the Parish
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                        Reach the right person directly.
                    </Text>
                </View>

                <ContactSection colors={colors} allColors={allColors} />

                {/* ── Footer ── */}
                <View style={{ marginTop: 32, alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600' }}>
                        St. Kizito Catholic Church
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                        Port harcourt, Rivers State, Nigeria
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Contact Section ──────────────────────────────────────────────────────────

const CONTACTS = [
    {
        id: 'secretary',
        role: 'Parish Secretary',
        name: 'Mrs. Adaeze Okonkwo',
        detail: 'Sacramental documents & certificates',
        phone: '+2348012345678',
        icon: 'document-text-outline' as const,
        accent: '#5E6F8E',
    },
    {
        id: 'catechist',
        role: 'Catechist',
        name: 'Mr. Chukwuemeka Eze',
        detail: 'RCIA, baptism prep & faith formation',
        phone: '+2348087654321',
        icon: 'book-outline' as const,
        accent: '#C9A84C',
    },
    {
        id: 'counselling',
        role: 'Pastoral Counsellor',
        name: 'Fr. Emmanuel Nwosu',
        detail: 'Private sessions with a priest',
        phone: '+2348023456789',
        icon: 'heart-circle-outline' as const,
        accent: '#B5303C',
    },
];

function ContactSection({
    colors,
    allColors,
}: {
    colors: ReturnType<typeof useTheme>['colors'];
    allColors: ReturnType<typeof useTheme>['allColors'];
}) {
    return (
        <View
            style={{
                borderRadius: 24,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
            }}
        >
            {CONTACTS.map((contact, index) => (
                <View
                    key={contact.id}
                    style={{
                        borderBottomWidth: index === CONTACTS.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                        paddingHorizontal: 18,
                        paddingVertical: 16,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                        <View
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                backgroundColor: `${contact.accent}18`,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 2,
                            }}
                        >
                            <Ionicons name={contact.icon} size={21} color={contact.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: contact.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>
                                {contact.role}
                            </Text>
                            <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: 'Georgia', fontWeight: '700' }}>
                                {contact.name}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 }}>
                                {contact.detail}
                            </Text>

                            {/* Action buttons */}
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 5,
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderRadius: 12,
                                        backgroundColor: `${contact.accent}18`,
                                    }}
                                >
                                    <Ionicons name="call-outline" size={14} color={contact.accent} />
                                    <Text style={{ color: contact.accent, fontSize: 12, fontWeight: '700' }}>
                                        Call
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => Linking.openURL(`https://wa.me/${contact.phone.replace('+', '')}`)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 5,
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderRadius: 12,
                                        backgroundColor: `${allColors.liturgical.ordinaryTime}14`,
                                    }}
                                >
                                    <Ionicons name="logo-whatsapp" size={14} color={allColors.liturgical.ordinaryTime} />
                                    <Text style={{ color: allColors.liturgical.ordinaryTime, fontSize: 12, fontWeight: '700' }}>
                                        WhatsApp
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
}