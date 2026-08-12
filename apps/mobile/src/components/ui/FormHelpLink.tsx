import React, { useMemo, useState } from 'react';
import { Linking, Modal, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useParishContacts } from '../../hooks/useParishContacts';

interface FormHelpLinkProps {
    /** What the parishioner is in the middle of, used to pre-fill the WhatsApp message. */
    context: string;
}

/**
 * "Need help with this?" — a way out of a form that is going wrong.
 *
 * Every form in the app was a dead end when something did not make sense: no phone number, no
 * explanation, nothing but a validation message and a back gesture. For a parish whose members will
 * quite reasonably ring the office rather than persevere with a form, that is the difference
 * between a request being made and being abandoned.
 *
 * Contacts come from the same cached `parish_contacts` the More tab uses, so this works offline and
 * there is no second copy of the parish's phone number to fall out of date.
 *
 * WhatsApp is offered first because it is how this parish is actually reached, and the message is
 * pre-filled with what the person was doing — sparing them explaining it from scratch.
 */
export const FormHelpLink: React.FC<FormHelpLinkProps> = ({ context }) => {
    const { colors, allColors } = useTheme();
    const { data: contacts } = useParishContacts();
    const [open, setOpen] = useState(false);
    const accent = allColors.liturgical.ordinaryTime;

    // The parish office first if it is listed; otherwise whoever is at the top of the contact order.
    const contact = useMemo(() => {
        if (!contacts || contacts.length === 0) return null;
        return (
            contacts.find((c) => /office|secretar|admin/i.test(c.role ?? '')) ??
            contacts.find((c) => !!c.phone) ??
            null
        );
    }, [contacts]);

    const whatsappNumber = contact?.whatsapp_phone ?? contact?.phone ?? null;

    const openWhatsapp = () => {
        if (!whatsappNumber) return;
        const digits = whatsappNumber.replace(/[^\d]/g, '');
        const message = encodeURIComponent(`Hello, I need help with ${context} on the St. Kizito app.`);
        // `wa.me` opens the app when installed and the browser when not, so there is no need to
        // detect WhatsApp — and no dead end if it is absent.
        Linking.openURL(`https://wa.me/${digits}?text=${message}`).catch(() => {});
    };

    const call = () => {
        if (!contact?.phone) return;
        Linking.openURL(`tel:${contact.phone}`).catch(() => {});
    };

    return (
        <>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Get help with ${context}`}
                onPress={() => setOpen(true)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    minHeight: 44,
                    marginTop: 4,
                }}
            >
                <Ionicons name="help-circle-outline" size={17} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                    Need help with this?
                </Text>
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    onPress={() => setOpen(false)}
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
                >
                    {/* Stops a tap inside the sheet from closing it. */}
                    <Pressable
                        onPress={(event) => event.stopPropagation()}
                        style={{
                            backgroundColor: colors.background,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            padding: 24,
                            paddingBottom: Platform.OS === 'ios' ? 40 : 28,
                        }}
                    >
                        <View
                            style={{
                                width: 40,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: colors.border,
                                alignSelf: 'center',
                                marginBottom: 20,
                            }}
                        />

                        <Text
                            style={{ color: colors.textPrimary, fontSize: 20, fontFamily: 'Georgia', fontWeight: '700' }}
                        >
                            Need a hand?
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 20 }}>
                            The parish office can help you with {context}. Your answers stay on this screen while
                            you ask.
                        </Text>

                        {whatsappNumber ? (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Message the parish office on WhatsApp"
                                activeOpacity={0.86}
                                onPress={openWhatsapp}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 12,
                                    minHeight: 56,
                                    paddingHorizontal: 16,
                                    borderRadius: 16,
                                    backgroundColor: `${accent}14`,
                                    marginBottom: 10,
                                }}
                            >
                                <Ionicons name="logo-whatsapp" size={22} color={accent} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
                                        Message on WhatsApp
                                    </Text>
                                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{whatsappNumber}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                            </TouchableOpacity>
                        ) : null}

                        {contact?.phone ? (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel={`Call the parish office on ${contact.phone}`}
                                activeOpacity={0.86}
                                onPress={call}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 12,
                                    minHeight: 56,
                                    paddingHorizontal: 16,
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    marginBottom: 10,
                                }}
                            >
                                <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>
                                        Call the parish
                                    </Text>
                                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                                        {contact.name ?? contact.phone}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ) : null}

                        {!contact ? (
                            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21 }}>
                                Parish contact details have not been downloaded yet. Connect to the internet and
                                open the More tab to load them.
                            </Text>
                        ) : null}

                        <TouchableOpacity
                            accessibilityRole="button"
                            onPress={() => setOpen(false)}
                            style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}
                        >
                            <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '600' }}>Close</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
};
