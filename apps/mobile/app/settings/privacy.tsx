import React from 'react';
import { Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { useParishContacts } from '../../src/hooks/useParishContacts';

/**
 * Your Data & Privacy.
 *
 * The app had no privacy disclosure of any kind, while collecting names, phone numbers, Mass
 * intentions, payment references and photographs of bank transfers. Google Play's Data Safety
 * declaration requires both a privacy policy and a route by which a user can request deletion of
 * what has been collected.
 *
 * What is described here is derived from the actual schema (`infra/supabase/schema.sql` and the
 * migrations in `apps/web/db/`) rather than from a template, so it states what the app really
 * stores. A parishioner has no account, so there is nothing to "delete an account" — the deletion
 * route is a request to the parish office, which is the body that holds the records.
 *
 * NOTE FOR THE PARISH: a hosted privacy-policy URL is still required for the Play Console listing.
 * This screen is the in-app disclosure, not a substitute for that. See docs/APP-MAINTENANCE.md.
 */

interface Section {
    heading: string;
    body: string;
}

const SECTIONS: Section[] = [
    {
        heading: 'You do not need an account',
        body:
            'There is no sign-in. The app does not ask for your name or number unless you choose to ' +
            'book a Mass, make an offering, or request a parish record.',
    },
    {
        heading: 'What is stored when you make a request',
        body:
            'When you book a Mass, make an offering, or request a sacramental record, the parish ' +
            'receives what you typed on the form: your name, the intention or purpose, the name and ' +
            'reference used for your bank transfer, and — if you attach one — the photograph of your ' +
            'transfer receipt. Requests for parish records also include the details asked for on that ' +
            'form, such as a date and place of baptism.',
    },
    {
        heading: 'Who can see it',
        body:
            'Only the parish administrators can read what you submit. Receipts are held in private ' +
            'storage that cannot be read without an administrator signing in. Other parishioners ' +
            'cannot see your requests.',
    },
    {
        heading: 'What stays only on your phone',
        body:
            'Your saved readings and prayers, your reminder times, your reading text size, and the ' +
            'daily readings and prayers held for offline use never leave your device. Removing the ' +
            'app removes all of it.',
    },
    {
        heading: 'Notifications',
        body:
            'Prayer reminders are scheduled by your phone, not sent from a server. Nothing is ' +
            'transmitted when a reminder appears, and you can turn any of them off at any time in ' +
            'Prayer Reminders.',
    },
    {
        heading: 'Photographs',
        body:
            'The app asks for access to your photo library only when you choose to attach a transfer ' +
            'receipt, and only reads the single image you select.',
    },
];

export default function PrivacyScreen() {
    const { colors, allColors } = useTheme();
    const { data: contacts } = useParishContacts();
    const accent = allColors.liturgical.ordinaryTime;

    // Deletion requests go to a real person. The parish office is the body that actually holds the
    // records, so routing this anywhere else would be theatre.
    const office = contacts?.find((c) => c.phone) ?? null;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="Your Data & Privacy" />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: 26 }}>
                    What St. Kizito Parish collects through this app, and what stays on your phone.
                </Text>

                {SECTIONS.map((section) => (
                    <View key={section.heading} style={{ marginBottom: 22 }}>
                        <Text
                            style={{ color: colors.textPrimary, fontSize: 16, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 6 }}
                        >
                            {section.heading}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21 }}>
                            {section.body}
                        </Text>
                    </View>
                ))}

                <View
                    style={{
                        borderRadius: 20,
                        backgroundColor: `${accent}10`,
                        borderWidth: 1,
                        borderColor: `${accent}33`,
                        padding: 18,
                        marginTop: 8,
                    }}
                >
                    <Text style={{ color: colors.textPrimary, fontSize: 16, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 6 }}>
                        Asking for your records to be removed
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: 14 }}>
                        You can ask the parish office to delete the requests and receipts you have
                        submitted. Please give the name you used so the records can be found.
                        {'\n\n'}
                        Some records may be kept where the parish is required to — for example a
                        sacramental record that has already been entered in the parish register.
                    </Text>

                    {office ? (
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={`Call the parish office on ${office.phone}`}
                            activeOpacity={0.85}
                            onPress={() => Linking.openURL(`tel:${office.phone}`)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                minHeight: 48,
                                borderRadius: 14,
                                backgroundColor: accent,
                            }}
                        >
                            <Ionicons name="call-outline" size={17} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                                Call the parish office
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 19 }}>
                            Contact details are on the More tab, under Parish Contacts.
                        </Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
