import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { BookingSummary } from '../../store/useBookingStore';

interface BookingConfirmationModalProps {
    booking: BookingSummary | null;
    visible: boolean;
    onClose: () => void;
    onBookAnother: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
    booking,
    visible,
    onClose,
    onBookAnother,
}) => {
    const { colors, mode, textScale, lineHeightScale } = useTheme();
    const router = useRouter();

    if (!booking) {
        return null;
    }

    const summaryBackground = mode === 'high-contrast' ? '#101010' : mode === 'dark' ? '#171B24' : '#F5EFE1';

    return (
        <Modal animationType="slide" presentationStyle="fullScreen" visible={visible} onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <View className="flex-row items-center justify-between px-6 py-2">
                    <TouchableOpacity activeOpacity={0.8} onPress={onClose} className="p-2 -ml-2">
                        <Ionicons name="close" size={20} color={colors.accent} />
                    </TouchableOpacity>
                    <Text style={{ color: colors.accent }} className="font-serif text-[22px] font-bold">
                        St. Kizito Parish
                    </Text>
                    <View style={{ width: 32 }} />
                </View>

                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 44 }} showsVerticalScrollIndicator={false}>
                    <View className="items-center">
                        <View
                            style={{
                                width: 86,
                                height: 86,
                                borderRadius: 43,
                                backgroundColor: mode === 'high-contrast' ? '#1A1A1A' : '#EFE1B5',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20,
                            }}
                        >
                            <Ionicons name="checkmark" size={36} color={colors.accent} />
                        </View>
                        <Text
                            style={{
                                color: colors.textPrimary,
                                fontSize: 21 * textScale,
                                lineHeight: 28 * textScale * lineHeightScale,
                            }}
                            className="font-serif font-bold text-center"
                        >
                            Mass Booked Successfully
                        </Text>
                        <Text
                            style={{
                                color: colors.textSecondary,
                                fontSize: 14 * textScale,
                                lineHeight: 22 * textScale * lineHeightScale,
                                marginTop: 8,
                                maxWidth: 280,
                            }}
                            className="font-sans text-center"
                        >
                            Your intention has been offered and added to the parish calendar.
                        </Text>
                    </View>

                    <View
                        style={{
                            marginTop: 28,
                            borderRadius: 24,
                            backgroundColor: summaryBackground,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: 20,
                            overflow: 'hidden',
                        }}
                    >
                        <View
                            style={{
                                position: 'absolute',
                                right: -40,
                                top: -30,
                                width: 140,
                                height: 140,
                                borderRadius: 70,
                                backgroundColor: '#F3B48C',
                                opacity: mode === 'dark' ? 0.18 : 0.45,
                            }}
                        />
                        <View
                            style={{
                                position: 'absolute',
                                left: -30,
                                bottom: -45,
                                width: 130,
                                height: 130,
                                borderRadius: 65,
                                backgroundColor: '#8ED0D2',
                                opacity: mode === 'dark' ? 0.16 : 0.45,
                            }}
                        />

                        <Text style={{ color: colors.accent }} className="font-sans text-[11px] font-bold uppercase tracking-[1.8px]">
                            Booking Summary
                        </Text>

                        <View className="mt-6">
                            <Text style={{ color: colors.textMuted }} className="font-sans text-[11px] font-bold uppercase tracking-[1.6px]">
                                Date & Time
                            </Text>
                            <Text style={{ color: colors.textPrimary }} className="font-serif text-[24px] font-bold mt-2">
                                {booking.dateLabel}
                            </Text>
                            <Text style={{ color: colors.textSecondary }} className="font-sans text-[14px] mt-1">
                                {booking.timeLabel}
                            </Text>
                        </View>

                        <View className="mt-5">
                            <Text style={{ color: colors.textMuted }} className="font-sans text-[11px] font-bold uppercase tracking-[1.6px]">
                                Intention For
                            </Text>
                            <Text style={{ color: colors.textPrimary }} className="font-serif text-[18px] font-bold mt-2">
                                {booking.notes || booking.serviceCategory}
                            </Text>
                        </View>

                        <View className="mt-5 flex-row items-end justify-between">
                            <View>
                                <Text style={{ color: colors.textMuted }} className="font-sans text-[11px] font-bold uppercase tracking-[1.6px]">
                                    Offering Amount
                                </Text>
                                <Text style={{ color: colors.accent }} className="font-serif text-[34px] font-bold mt-2">
                                    {booking.amountLabel}
                                </Text>
                            </View>
                            <View
                                style={{
                                    borderRadius: 999,
                                    backgroundColor: mode === 'high-contrast' ? '#1C1C1C' : 'rgba(255,255,255,0.48)',
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                }}
                            >
                                <Text style={{ color: colors.textPrimary }} className="font-sans text-[11px] font-semibold uppercase tracking-[1.2px]">
                                    Confirmed
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={onBookAnother}
                        style={{
                            marginTop: 24,
                            minHeight: 54,
                            borderRadius: 16,
                            backgroundColor: colors.accent,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text className="font-sans text-[16px] font-bold text-white">Book Another Mass</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.82}
                        onPress={() => {
                            onClose();
                            router.push('/');
                        }}
                        style={{
                            marginTop: 12,
                            minHeight: 54,
                            borderRadius: 16,
                            backgroundColor: colors.surfaceElevated,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ color: colors.accent }} className="font-sans text-[16px] font-semibold">
                            Back to Home
                        </Text>
                    </TouchableOpacity>

                    <Text style={{ color: colors.textMuted }} className="font-sans text-[12px] text-center uppercase tracking-[1.4px] mt-6">
                        Confirmation ID: {booking.confirmationId}
                    </Text>

                    <View
                        style={{
                            marginTop: 28,
                            borderRadius: 22,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: 20,
                        }}
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="mail-outline" size={18} color={colors.accent} />
                            <Text style={{ color: colors.textPrimary }} className="font-serif text-[22px] font-bold ml-2">
                                Email Confirmation
                            </Text>
                        </View>
                        <Text style={{ color: colors.textSecondary }} className="font-sans text-[14px] leading-[22px] mt-4">
                            A receipt and booking details have been sent to your parish profile and are ready for follow-up if needed.
                        </Text>
                    </View>

                    <View
                        style={{
                            marginTop: 16,
                            borderRadius: 22,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: 20,
                        }}
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="leaf-outline" size={18} color={colors.accent} />
                            <Text style={{ color: colors.textPrimary }} className="font-serif text-[22px] font-bold ml-2">
                                The Offering&apos;s Impact
                            </Text>
                        </View>
                        <Text style={{ color: colors.textSecondary }} className="font-sans text-[14px] leading-[22px] mt-4">
                            Your Mass stipend supports parish mission, liturgical preparation, and the welfare of clergy serving the community.
                        </Text>
                    </View>

                    <View
                        style={{
                            marginTop: 24,
                            borderRadius: 20,
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: 20,
                        }}
                    >
                        <Text style={{ color: colors.textMuted }} className="font-serif text-[26px] text-center">
                            "
                        </Text>
                        <Text
                            style={{
                                color: colors.textPrimary,
                                fontSize: 18 * textScale,
                                lineHeight: 29 * textScale * lineHeightScale,
                            }}
                            className="font-serif italic text-center mt-2"
                        >
                            The Holy Mass is the most perfect form of prayer.
                        </Text>
                        <Text style={{ color: colors.accent }} className="font-sans text-[12px] font-bold uppercase tracking-[1.8px] text-center mt-4">
                            Pope Paul VI
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};
