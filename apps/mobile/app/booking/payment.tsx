import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Header } from '../../src/components/ui/Header';
import { KeyboardAwareForm } from '../../src/components/ui/KeyboardAwareForm';
import { useTheme } from '../../src/hooks/useTheme';
import { usePaymentDetails } from '../../src/hooks/usePaymentDetails';
import { useOfflineStatus } from '../../src/hooks/useOfflineStatus';
import { submitBooking } from '../../src/services/offline/syncService';
import { addRequestHistoryItem } from '../../src/services/requests/requestStore';
import { BookingDraft } from '../../src/types/booking.types';
import { BookingInsert } from '../../src/types/api.types';
import { Button } from '../../src/components/ui/Button';
import { useToast } from '../../src/components/ui/ToastProvider';
import { StatusModal } from '../../src/components/ui/StatusModal';
import { generateClientRequestId } from '../../src/utils/requestId';
import { uploadReceipt, type ReceiptAsset } from '../../src/services/api/receipts';
import { ReceiptPicker } from '../../src/components/ui/ReceiptPicker';
import { FormHelpLink } from '../../src/components/ui/FormHelpLink';

const naira = (amount: number) => `₦${amount.toLocaleString('en-NG')}`;

const parseDraftParam = (rawDraft: string | string[] | undefined): BookingDraft | null => {
    const value = Array.isArray(rawDraft) ? rawDraft[0] : rawDraft;
    if (!value) return null;

    try {
        const parsed = JSON.parse(value) as BookingDraft;
        if (!parsed.fullName || !parsed.startDate || !parsed.endDate || !parsed.note || !parsed.intentionType) {
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
    // The whole asset is kept, not just the URI: the upload needs the base64 payload the picker
    // produced. Re-reading the file later is what used to yield zero bytes on Android.
    const [receipt, setReceipt] = useState<ReceiptAsset | null>(null);
    const [receiptError, setReceiptError] = useState<string | null>(null);
    /** Set only by an explicit "submit without the receipt" choice after an upload failure. */
    const [skipReceipt, setSkipReceipt] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const { showToast } = useToast();

    /**
     * Whether the form is in a state that can succeed.
     *
     * One expression, used both to enable the button and (implicitly) to describe what is missing —
     * so the button can never invite a tap that `handleSubmit` will immediately reject.
     */
    const canSubmit =
        !!draft &&
        !!paymentName.trim() &&
        !loadingPaymentDetails &&
        !isSubmitting &&
        !completed;


    const copyField = async (label: string, value?: string | null) => {
        if (!value) {
            showToast(`${label} is unavailable.`, 'error');
            return;
        }

        await Clipboard.setStringAsync(value);
        showToast(`${label} copied`, 'success');
    };

    const pickReceipt = async () => {
        // expo-image-picker is a NATIVE module. Load it lazily (not as a top-level import) so a build
        // that doesn't include it — Expo Go or an older dev client — degrades gracefully instead of
        // throwing at module-eval time (which previously broke this route's default export).
        let ImagePicker: typeof import('expo-image-picker');
        try {
            ImagePicker = require('expo-image-picker');
        } catch {
            showToast('Attaching a receipt needs the latest app build — you can still submit with your transfer name/reference.', 'info');
            return;
        }

        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                showToast('Photo permission is needed to attach a receipt.', 'error');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.6,
                // Required: the upload path decodes this directly. Without it the file has to be
                // re-read from the URI, which is where zero-byte receipts came from.
                base64: true,
            });
            if (result.canceled || !result.assets?.[0]) return;

            const asset = result.assets[0];
            if (!asset.base64) {
                setReceiptError('That image could not be read from your device. Please try another one.');
                showToast('That receipt could not be read.', 'error');
                return;
            }

            setReceipt({
                uri: asset.uri,
                base64: asset.base64,
                mimeType: asset.mimeType ?? null,
                fileName: asset.fileName ?? null,
            });
            setReceiptError(null);
            showToast('Receipt attached.', 'success');
        } catch {
            showToast('Could not open the photo library.', 'error');
        }
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
            const clientRequestId = generateClientRequestId('bk');

            // Upload the receipt BEFORE the booking row is written.
            //
            // A failure here used to be swallowed with an info toast and the booking submitted
            // anyway — so a parishioner who attached a receipt believed the parish had it, while
            // the row carried no path at all. The upload now stops the submission and asks: retry,
            // or continue deliberately without it. Either way the row only ever stores a path that
            // storage actually acknowledged.
            //
            // Offline: no upload is attempted; the transfer name/reference still lets the parish
            // match the payment.
            let receiptPath: string | null = null;
            if (receipt && !isOffline && !skipReceipt) {
                const upload = await uploadReceipt(receipt, 'bookings', clientRequestId);
                if (!upload.path) {
                    setReceiptError(
                        `${upload.error ?? 'The receipt could not be uploaded.'} ${
                            upload.retryable
                                ? 'Check your connection and try again.'
                                : 'Please attach a different image.'
                        }`,
                    );
                    setError('Your booking was not submitted, so nothing has been recorded twice.');
                    setIsSubmitting(false);
                    return;
                }
                receiptPath = upload.path;
            }

            const payload: BookingInsert = {
                client_request_id: clientRequestId,
                name: draft.fullName,
                type: draft.intentionType,
                intention: draft.note,
                start_date: draft.startDate,
                end_date: draft.endDate,
                amount: draft.amount,
                preferred_mass_time: draft.massTimeLabel ?? null,
                payment_name: paymentName.trim(),
                payment_reference: paymentReference.trim() || null,
                payment_receipt_url: receiptPath,
                status: 'pending' as const,
            };

            const result = await submitBooking(payload, isOffline);
            if ((result as any)?.duplicateBlocked) {
                showToast('Submission already in progress.', 'info');
                return;
            }

            if ((result as any)?.error) {
                throw new Error((result as any).error.message || 'Unable to submit now.');
            }

            await addRequestHistoryItem({
                id: `booking-${Date.now()}`,
                type: draft.intentionType === 'thanksgiving' ? 'thanksgiving' : 'mass booking',
                date: draft.startDate,
                status: 'pending',
                clientRequestId,
                source: 'booking',
                details: {
                    submittedBy: draft.fullName,
                    range: draft.startDate === draft.endDate ? draft.startDate : `${draft.startDate} → ${draft.endDate}`,
                    days: draft.days,
                    amount: draft.amount,
                    massTime: draft.massTimeLabel ?? null,
                    paymentName: paymentName.trim(),
                    paymentReference: paymentReference.trim() || null,
                    // Records what the parish actually received, not what the user selected.
                    receiptAttached: !!receiptPath,
                    note: draft.note,
                },
            });

            setCompleted(true);
            setShowStatusModal(true);
            showToast(isOffline ? 'Saved offline and queued for sync.' : 'Submitted for parish verification.', 'success');
        } catch (submissionError) {
            const message = submissionError instanceof Error ? submissionError.message : 'Unable to submit now. Please try again.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const accent = allColors.liturgical.ordinaryTime;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="Payment Instructions" />

            {/*
              * This screen collects the transfer name/reference near the BOTTOM of a long page, so it
              * needs the same keyboard handling as the booking form — it previously used a bare
              * ScrollView and those fields sat under the keyboard.
              */}
            <KeyboardAwareForm contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14 }}>
                <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
                    <View style={{ paddingVertical: 4, backgroundColor: `${accent}14`, borderRadius: 10, paddingHorizontal: 10 }}>
                        <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                            {completed ? 'STEP 3 OF 3' : 'STEP 2 OF 3'}
                        </Text>
                    </View>
                </View>

                {!draft ? (
                    <View style={{ borderRadius: 18, borderWidth: 1, borderColor: '#B5303C', backgroundColor: `${'#B5303C'}12`, padding: 16 }}>
                        <Text style={{ color: '#B5303C', fontSize: 14, fontWeight: '600' }}>
                            Missing booking context. Please return to Book a Mass and continue again.
                        </Text>
                    </View>
                ) : null}

                {draft ? (
                    <View
                        style={{
                            borderRadius: 22,
                            backgroundColor: colors.surfaceElevated,
                            borderWidth: 1,
                            borderColor: colors.border,
                            padding: 18,
                            marginBottom: 16,
                        }}
                    >
                        <Text style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 8 }}>
                            Offering Summary
                        </Text>
                        <Text style={{ color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 18, fontWeight: '700' }}>
                            {draft.days} {draft.days === 1 ? 'Mass' : 'Masses'}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                            {draft.startDate === draft.endDate ? draft.startDate : `${draft.startDate} → ${draft.endDate}`}
                            {draft.massTimeLabel ? ` · ${draft.massTimeLabel}` : ''}
                        </Text>
                        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                                Amount to transfer
                            </Text>
                            <Text style={{ color: accent, fontSize: 22, fontWeight: '800' }}>{naira(draft.amount)}</Text>
                        </View>
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
                        // Editing a field mid-submission would change what the user believes was
                        // sent without changing what actually was.
                        editable={!isSubmitting && !completed}
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
                        editable={!isSubmitting && !completed}
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
                            marginBottom: 16,
                        }}
                    />

                    <ReceiptPicker
                        receipt={receipt}
                        onPick={pickReceipt}
                        onRemove={() => {
                            setReceipt(null);
                            setReceiptError(null);
                            setSkipReceipt(false);
                        }}
                        error={receiptError}
                        onSkip={() => {
                            setSkipReceipt(true);
                            setReceiptError(null);
                            setError(null);
                            showToast('The receipt will not be sent.', 'info');
                        }}
                        skipped={skipReceipt}
                        // Locked once submission starts: changing the attachment mid-flight would
                        // mean the row and the uploaded object disagree about what was sent.
                        disabled={isSubmitting || completed}
                        isUploading={isSubmitting && !!receipt && !skipReceipt && !isOffline}
                        isOffline={isOffline}
                    />

                    {error ? <Text style={{ color: '#B5303C', fontSize: 12, marginTop: 10 }}>{error}</Text> : null}
                </View>

                {!completed ? (
                    <>
                        {/*
                          Disabled until the form can actually succeed, rather than accepting the
                          tap and answering with a validation error. `canSubmit` is the single
                          expression that decides this, so the button's state and the guard inside
                          `handleSubmit` cannot disagree.
                        */}
                        <Button onPress={handleSubmit} disabled={!canSubmit}>
                            {isSubmitting ? 'Submitting...' : 'I Have Paid'}
                        </Button>
                        {!isSubmitting && !paymentName.trim() ? (
                            <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                                Enter the name used for your transfer to continue.
                            </Text>
                        ) : null}
                        <FormHelpLink context="booking a Mass" />
                    </>
                ) : (
                    <Button onPress={() => router.replace('/requests')}>View My Requests</Button>
                )}
            </KeyboardAwareForm>

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

        </SafeAreaView>
    );
}
