import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, Linking, Image, useWindowDimensions } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParishContact, useParishContacts } from '../../src/hooks/useParishContacts';
import { useTabBarClearance } from '../../src/hooks/useTabBarClearance';

// ─── Data ────────────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
    {
        // The "Essentials" heading below promised "daily tools for your prayer life" while linking
        // to no prayers at all — the only prayer texts in the app were inside the Divine Office.
        title: 'Prayers',
        subtitle: 'Angelus, Rosary & devotions',
        icon: 'book-outline' as const,
        route: '/prayers',
        accent: '#4A7C59',
    },
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
        title: 'Settings',
        subtitle: 'Theme & preferences',
        icon: 'options-outline' as const,
        route: '/settings',
        accent: '#5E6F8E',
    },
];

const PARISH_SERVICES = [
    {
        id: 'sacraments',
        title: 'Sacramental Requests',
        subtitle: 'Request a baptismal card & more',
        icon: 'water-outline' as const,
        route: '/sacraments',
        accent: '#4A7C59',
    },
    {
        id: 'requests',
        title: 'My Requests',
        subtitle: 'Track donation and booking status',
        icon: 'time-outline' as const,
        route: '/requests',
        accent: '#5E6F8E',
    },
    {
        id: 'mass',
        title: 'Book a Mass',
        subtitle: 'Mass intentions & thanksgiving',
        icon: 'flame-outline' as const,
        route: '/booking',
        accent: '#4A7C59',
    },
    {
        id: 'donations',
        title: 'Donations',
        subtitle: 'Give with confidence',
        icon: 'gift-outline' as const,
        route: '/donation',
        accent: '#4A7C59',
    },
    // {
    //     id: 'history',
    //     title: 'Parish History',
    //     subtitle: 'Our story, witness & growth',
    //     icon: 'library-outline' as const,
    //     route: '/history',
    //     accent: '#C9A84C',
    // },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * An Essentials tile.
 *
 * The previous version set `borderRadius: 0` against an app of soft 20–24px corners, sat in a
 * `gap-6 flex-wrap` row at `width: 48.5%` (so the two columns did not add up and the grid drifted),
 * and used `minHeight` — which left every tile a different height wherever a subtitle wrapped to
 * two lines, producing the ragged bottom edge in the screenshot.
 *
 * It is now a fixed-height tile on a measured two-column grid, so the block reads as one aligned
 * unit. `width` is passed in rather than hardcoded as a percentage: the parent measures the screen
 * once, which keeps the columns exact on a 320dp phone and on a tablet.
 */
const QuickActionCard = ({
    title,
    subtitle,
    icon,
    accent,
    onPress,
    colors,
    width,
}: {
    title: string;
    subtitle: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    accent: string;
    onPress: () => void;
    colors: ReturnType<typeof useTheme>['colors'];
    width: number;
}) => (
    <TouchableOpacity
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
        onPress={onPress}
        style={{
            width,
            // Fixed, not minimum: equal-height tiles are what make the grid read as a grid.
            height: 148,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            justifyContent: 'space-between',
        }}
    >
        <View
            style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: `${accent}18`,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Ionicons name={icon} size={21} color={accent} />
        </View>

        <View>
            <Text
                numberOfLines={1}
                style={{ color: colors.textPrimary, fontSize: 15.5, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 3 }}
            >
                {title}
            </Text>
            {/* Two lines maximum, so a longer subtitle cannot make one tile taller than its
                neighbour and break the grid's baseline. */}
            <Text numberOfLines={2} style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 16 }}>
                {subtitle}
            </Text>
        </View>
    </TouchableOpacity>
);

/** Screen padding either side, and the gutter between the two columns. */
const SCREEN_PADDING = 20;
const GRID_GAP = 12;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MoreScreen() {
    const { colors, allColors, mode } = useTheme();
    const tabBarClearance = useTabBarClearance();
    const router = useRouter();
    const { data: contacts, isLoading: contactsLoading } = useParishContacts();
    const { width: screenWidth } = useWindowDimensions();

    // Measured once, so both columns are exact rather than approximated with a percentage.
    // `Math.floor` avoids a sub-pixel remainder that would round one column a hair wider.
    const tileWidth = Math.floor((screenWidth - SCREEN_PADDING * 2 - GRID_GAP) / 2);

    const isDarkMode = mode === 'dark' || mode === 'high-contrast';
    const parishBadgeBg = isDarkMode ? colors.surfaceElevated : '#E8F0E6';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header title="More" />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: tabBarClearance + 16 }}
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

                {/*
                  A measured two-column grid.

                  The previous `flex-wrap gap-6` row with `width: 48.5%` tiles could not add up:
                  two 48.5% columns plus a 24px gap overflow the row, so the second column crept
                  and the last tile sat alone against a ragged edge. Deriving the tile width from
                  the actual content width means the columns are exact at any screen size, and the
                  trailing odd tile simply occupies the left column at the same width as the rest.
                */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP, marginBottom: 8 }}>
                    {QUICK_ACTIONS.map((item) => (
                        <QuickActionCard
                            key={item.title}
                            {...item}
                            width={tileWidth}
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

                <ContactSection colors={colors} allColors={allColors} contacts={contacts} isLoading={contactsLoading} />

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

const DEFAULT_CONTACT_ICON: React.ComponentProps<typeof Ionicons>['name'] = 'call-outline';
const ALLOWED_CONTACT_ICONS = new Set<React.ComponentProps<typeof Ionicons>['name']>([
    'document-text-outline',
    'book-outline',
    'heart-circle-outline',
    'call-outline',
    'person-outline',
    'people-outline',
]);

const resolveContactIcon = (icon: string | null) => {
    if (!icon) return DEFAULT_CONTACT_ICON;
    if (ALLOWED_CONTACT_ICONS.has(icon as React.ComponentProps<typeof Ionicons>['name'])) {
        return icon as React.ComponentProps<typeof Ionicons>['name'];
    }
    return DEFAULT_CONTACT_ICON;
};

function ContactSection({
    colors,
    allColors,
    contacts,
    isLoading,
}: {
    colors: ReturnType<typeof useTheme>['colors'];
    allColors: ReturnType<typeof useTheme>['allColors'];
    contacts: ParishContact[];
    isLoading: boolean;
}) {
    if (isLoading) {
        return (
            <View
                style={{
                    borderRadius: 24,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 18,
                }}
            >
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Loading parish contacts...</Text>
            </View>
        );
    }

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
            {contacts.map((contact, index) => (
                <View
                    key={contact.id}
                    style={{
                        borderBottomWidth: index === contacts.length - 1 ? 0 : 1,
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
                                backgroundColor: `${contact.accent ?? allColors.liturgical.ordinaryTime}18`,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 2,
                            }}
                        >
                            <Ionicons name={resolveContactIcon(contact.icon)} size={21} color={contact.accent ?? allColors.liturgical.ordinaryTime} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: contact.accent ?? allColors.liturgical.ordinaryTime, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>
                                {contact.role}
                            </Text>
                            <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: 'Georgia', fontWeight: '700' }}>
                                {contact.name}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 }}>
                                {contact.detail ?? 'Contact parish office for support.'}
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
                                        backgroundColor: `${contact.accent ?? allColors.liturgical.ordinaryTime}18`,
                                    }}
                                >
                                    <Ionicons name="call-outline" size={14} color={contact.accent ?? allColors.liturgical.ordinaryTime} />
                                    <Text style={{ color: contact.accent ?? allColors.liturgical.ordinaryTime, fontSize: 12, fontWeight: '700' }}>
                                        Call
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => Linking.openURL(`https://wa.me/${(contact.whatsapp_phone ?? contact.phone).replace('+', '')}`)}
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

