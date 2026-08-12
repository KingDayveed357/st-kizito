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
import { submitDonation } from '../../src/services/offline/syncService';
import { addRequestHistoryItem } from '../../src/services/requests/requestStore';
import { DonationDraft } from '../../src/types/booking.types';
import { Button } from '../../src/components/ui/Button';
import { useToast } from '../../src/components/ui/ToastProvider';
import { StatusModal } from '../../src/components/ui/StatusModal';
import { generateClientRequestId } from '../../src/utils/requestId';
import { uploadReceipt, type ReceiptAsset } from '../../src/services/api/receipts';
import { ReceiptPicker } from '../../src/components/ui/ReceiptPicker';
import { FormHelpLink } from '../../src/components/ui/FormHelpLink';

const parseDraftParam = (rawDraft: string | string[] | undefined): DonationDraft | null => {
    const value = Array.isArray(rawDraft) ? rawDraft[0] : rawDraft;
    if (!value) return null;

    try {
        const parsed = JSON.parse(value) as DonationDraft;
        if (!parsed.fullName || typeof parsed.amount !== 'number' || parsed.amount <= 0) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

export default function DonationPaymentScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams<{ draft?: string }>();

    const draft = useMemo(() => parseDraftParam(params.draft), [params.draft]);
    const { data: paymentDetails, isLoading: loadingPaymentDetails, isRefreshing, refetch } = usePaymentDetails();
    const { isOffline } = useOfflineStatus();

    // Payment can only be confirmed if we actually have an account number to transfer to —
    // whether it came from the network or the offline cache. Without it, showing "I Have Paid"
    // is a dead-end (the user has nowhere to send money). See audit #7.
    const hasVerifiableDetails = !!paymentDetails?.account_number;
    const detailsUnavailable = !loadingPaymentDetails && !hasVerifiableDetails;

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

    /** See the note in the booking payment screen — one expression gates the button. */
    const canSubmit =
        !!draft &&
        !!paymentName.trim() &&
        !loadingPaymentDetails &&
        hasVerifiableDetails &&
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
        // expo-image-picker is a NATIVE module: load it lazily so a build without it degrades
        // gracefully instead of throwing at module-eval time (which would break this route entirely).
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
            setError('Donation details are missing. Please restart from the donation form.');
            return;
        }

        if (!paymentName.trim()) {
            setError('Name used for transfer is required.');
            return;
        }

        setIsSubmitting(true);
        try {
            const clientRequestId = generateClientRequestId('dn');

            // Upload the receipt BEFORE the donation row is written.
            //
            // A failure here used to be swallowed with an info toast and the donation submitted
            // anyway — so a donor who attached a receipt believed the parish had it, while the row
            // carried no path at all. The upload now stops the submission and asks: retry, or
            // continue deliberately without it. The row only ever stores a path storage
            // acknowledged. Offline uploads are skipped entirely.
            let receiptPath: string | null = null;
            if (receipt && !isOffline && !skipReceipt) {
                const upload = await uploadReceipt(receipt, 'donations', clientRequestId);
                if (!upload.path) {
                    setReceiptError(
                        `${upload.error ?? 'The receipt could not be uploaded.'} ${
                            upload.retryable
                                ? 'Check your connection and try again.'
                                : 'Please attach a different image.'
                        }`,
                    );
                    setError('Your donation was not submitted, so nothing has been recorded twice.');
                    setIsSubmitting(false);
                    return;
                }
                receiptPath = upload.path;
            }

            const payload = {
                client_request_id: clientRequestId,
                amount: draft.amount,
                is_anonymous: false,
                donor_name: draft.fullName,
                payment_name: paymentName.trim(),
                payment_reference: paymentReference.trim() || null,
                payment_receipt_url: receiptPath,
                purpose: draft.purpose ?? null,
                message: draft.message ?? null,
                status: 'pending' as const,
            };

            const result = await submitDonation(payload, isOffline);
            if ((result as any)?.duplicateBlocked) {
                showToast('Submission already in progress.', 'info');
                return;
            }

            if ((result as any)?.error) {
                throw new Error((result as any).error.message || 'Unable to submit now.');
            }

            await addRequestHistoryItem({
                id: `donation-${Date.now()}`,
                type: 'donation',
                date: new Date().toISOString().slice(0, 10),
                amount: draft.amount,
                status: 'pending',
                clientRequestId,
                source: 'donation',
                details: {
                    submittedBy: draft.fullName,
                    paymentName: paymentName.trim(),
                    paymentReference: paymentReference.trim() || null,
                    // Records what the parish actually received, not what the user selected.
                    receiptAttached: !!receiptPath,
                    purpose: draft.purpose ?? null,
                    message: draft.message ?? null,
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

            {/* Transfer name/reference sit near the bottom of a long page — same keyboard handling
              * as every other form (this screen previously used a bare ScrollView). */}
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
                            Missing donation context. Please return to Donations and continue again.
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
                    ) : detailsUnavailable ? (
                        <View>
                            <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 6 }}>
                                {isOffline ? "You're offline" : "Details unavailable"}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 14 }}>
                                {isOffline
                                    ? 'Connect to the internet to load the parish account details. Once loaded, they stay available offline.'
                                    : 'We could not load the parish account details right now. Please check your connection and try again.'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => { void refetch(); }}
                                disabled={isRefreshing}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    alignSelf: 'flex-start',
                                    gap: 8,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: `${accent}55`,
                                    backgroundColor: `${accent}12`,
                                    paddingHorizontal: 14,
                                    paddingVertical: 10,
                                    opacity: isRefreshing ? 0.6 : 1,
                                }}
                            >
                                <Ionicons name="refresh" size={16} color={accent} />
                                <Text style={{ color: accent, fontSize: 13, fontWeight: '700' }}>
                                    {isRefreshing ? 'Retrying…' : 'Retry'}
                                </Text>
                            </TouchableOpacity>
                        </View>
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
                        Enter the transfer name and optional reference so the parish can verify this donation and update the status.
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
                        <FormHelpLink context="making a donation" />
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
