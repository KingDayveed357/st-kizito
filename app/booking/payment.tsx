import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/hooks/useTheme';
import { usePaymentDetails } from '../../src/hooks/usePaymentDetails';
import { useOfflineStatus } from '../../src/hooks/useOfflineStatus';
import { submitBooking } from '../../src/services/offline/syncService';
import { addRequestHistoryItem } from '../../src/services/requests/requestStore';
import { BookingDraft } from '../../src/types/booking.types';
import { Button } from '../../src/components/ui/Button';
import { Toast } from '../../src/components/ui/Toast';
import { StatusModal } from '../../src/components/ui/StatusModal';

const parseDraftParam = (rawDraft: string | string[] | undefined): BookingDraft | null => {
    const value = Array.isArray(rawDraft) ? rawDraft[0] : rawDraft;
    if (!value) return null;

    try {
        const parsed = JSON.parse(value) as BookingDraft;
        if (!parsed.fullName || !parsed.date || !parsed.note || !parsed.intentionType) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

export default function BookingPaymentScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams<{ draft?: string }>();

    const draft = useMemo(() => parseDraftParam(params.draft), [params.draft]);
    const { data: paymentDetails, isLoading: loadingPaymentDetails } = usePaymentDetails();
    const { isOffline } = useOfflineStatus();

    const [paymentName, setPaymentName] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 1600);
        return () => clearTimeout(timer);
    }, [toast]);

    const copyField = async (label: string, value?: string | null) => {
        if (!value) {
            setToast({ message: `${label} is unavailable.`, type: 'error' });
            return;
        }

        await Clipboard.setStringAsync(value);
        setToast({ message: `${label} copied`, type: 'success' });
    };

    const handleSubmit = async () => {
        setError(null);

        if (!draft) {
            setError('Booking details are missing. Please restart from the booking form.');
            return;
        }

        if (!paymentName.trim()) {
            setError('Name used for transfer is required.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name: draft.fullName,
                type: draft.intentionType,
                intention: draft.note,
                start_date: draft.date,
                end_date: draft.date,
                payment_name: paymentName.trim(),
                payment_reference: paymentReference.trim() || null,
                status: 'pending' as const,
            };

            const result = await submitBooking(payload, isOffline);
            if ((result as any)?.duplicateBlocked) {
                setToast({ message: 'Submission already in progress.', type: 'info' });
                return;
            }

            if ((result as any)?.error) {
                throw new Error((result as any).error.message || 'Unable to submit now.');
            }

            await addRequestHistoryItem({
                id: `booking-${Date.now()}`,
                type: draft.intentionType === 'thanksgiving' ? 'thanksgiving' : 'mass booking',
                date: draft.date,
                status: 'pending',
            });

            setCompleted(true);
            setShowStatusModal(true);
            setToast({ message: isOffline ? 'Saved offline and queued for sync.' : 'Submitted for parish verification.', type: 'success' });
        } catch {
            setError('Unable to submit now. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const accent = allColors.liturgical.ordinaryTime;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                title="Payment Instructions"
                rightElement={
                    <View style={{ paddingRight: 20, paddingVertical: 4, backgroundColor: `${accent}14`, borderRadius: 10, paddingHorizontal: 10 }}>
                        <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                            {completed ? 'STEP 3 OF 3' : 'STEP 2 OF 3'}
                        </Text>
                    </View>
                }
            />

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 52 }} showsVerticalScrollIndicator={false}>
                {!draft ? (
                    <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#B5303C', backgroundColor: `${'#B5303C'}12`, padding: 16 }}>
                        <Text style={{ color: '#B5303C', fontSize: 14, fontWeight: '600' }}>
                            Missing booking context. Please return to Book a Mass and continue again.
                        </Text>
                    </View>
                ) : null}

                <View
                    style={{
                        borderRadius: 22,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 18,
                        marginBottom: 16,
                    }}
                >
                    <View className="flex-row items-center justify-between mb-10">
                        <Text style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' }}>
                            Parish Transfer Account
                        </Text>
                        <View style={{ borderRadius: 12, backgroundColor: `${accent}15`, paddingHorizontal: 10, paddingVertical: 5 }}>
                            <Text style={{ color: accent, fontSize: 10, fontWeight: '700' }}>Manual Verification</Text>
                        </View>
                    </View>

                    {loadingPaymentDetails ? (
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Loading payment details...</Text>
                    ) : (
                        <>
                            <View style={{ marginBottom: 12 }}>
                                <Text style={{ color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Bank Name</Text>
                                <View className="flex-row items-center justify-between">
                                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{paymentDetails?.bank_name ?? 'Not configured'}</Text>
                                    <TouchableOpacity onPress={() => copyField('Bank name', paymentDetails?.bank_name)}>
                                        <Ionicons name="copy-outline" size={18} color={accent} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={{ marginBottom: 12 }}>
                                <Text style={{ color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Account Name</Text>
                                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700' }}>{paymentDetails?.account_name ?? 'Not configured'}</Text>
                            </View>

                            <View
                                style={{
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: `${accent}44`,
                                    backgroundColor: `${accent}10`,
                                    padding: 14,
                                }}
                            >
                                <Text style={{ color: colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Account Number</Text>
                                <View className="flex-row items-center justify-between">
                                    <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: 1.5 }}>
                                        {paymentDetails?.account_number ?? 'Not configured'}
                                    </Text>
                                    <TouchableOpacity onPress={() => copyField('Account number', paymentDetails?.account_number)}>
                                        <Ionicons name="copy-outline" size={20} color={accent} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </View>

                <View
                    style={{
                        borderRadius: 22,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 18,
                        marginBottom: 18,
                    }}
                >
                    <Text style={{ color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
                        Confirm your transfer
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 14 }}>
                        Enter the exact transfer name and optional narration/reference so the parish can match and approve quickly.
                    </Text>

                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.7, textTransform: 'uppercase', marginBottom: 8 }}>
                        Name used for transfer (required)
                    </Text>
                    <TextInput
                        value={paymentName}
                        onChangeText={setPaymentName}
                        placeholder="e.g. Chidi Okafor"
                        placeholderTextColor={colors.textMuted}
                        style={{
                            minHeight: 50,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.surfaceElevated,
                            paddingHorizontal: 14,
                            color: colors.textPrimary,
                            marginBottom: 14,
                        }}
                    />

                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.7, textTransform: 'uppercase', marginBottom: 8 }}>
                        Reference / Narration (optional)
                    </Text>
                    <TextInput
                        value={paymentReference}
                        onChangeText={setPaymentReference}
                        placeholder="e.g. Last 4 digits / transfer note"
                        placeholderTextColor={colors.textMuted}
                        style={{
                            minHeight: 50,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.surfaceElevated,
                            paddingHorizontal: 14,
                            color: colors.textPrimary,
                            marginBottom: 4,
                        }}
                    />

                    {error ? <Text style={{ color: '#B5303C', fontSize: 12, marginTop: 10 }}>{error}</Text> : null}
                </View>

                {!completed ? (
                    <Button onPress={handleSubmit} disabled={isSubmitting || !draft || loadingPaymentDetails}>
                        {isSubmitting ? 'Submitting...' : 'I Have Paid'}
                    </Button>
                ) : (
                    <Button onPress={() => router.replace('/requests')}>View My Requests</Button>
                )}
            </ScrollView>

            <StatusModal
                visible={showStatusModal}
                status="pending"
                title="Request Submitted"
                onClose={() => setShowStatusModal(false)}
                onAction={() => {
                    setShowStatusModal(false);
                    router.replace('/requests');
                }}
                actionLabel="View My Requests"
            />

            {toast ? <Toast message={toast.message} type={toast.type} /> : null}
        </SafeAreaView>
    );
}
