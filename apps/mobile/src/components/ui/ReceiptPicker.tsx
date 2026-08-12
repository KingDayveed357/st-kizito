import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import type { ReceiptAsset } from '../../services/api/receipts';

interface ReceiptPickerProps {
    receipt: ReceiptAsset | null;
    onPick: () => void;
    onRemove: () => void;
    /** Upload failure text, with guidance on what to do next. */
    error?: string | null;
    /** Offered after a failure, so the user can proceed deliberately without the receipt. */
    onSkip?: () => void;
    skipped?: boolean;
    /** Locks the control while the submission is in flight. */
    disabled?: boolean;
    isUploading?: boolean;
    isOffline?: boolean;
}

/**
 * Attach a payment receipt, with a preview of what will be sent.
 *
 * The preview is the point. Previously the control said "Receipt attached — tap to change" and
 * showed nothing, so a parishioner who picked the wrong screenshot from a crowded gallery had no
 * way to notice before submitting — and no way to notice afterwards either, since the app never
 * showed it back. Given that the parish approves a booking by looking at that image, sending the
 * wrong one costs a phone call. Showing a thumbnail is a few lines of layout against a real and
 * recurring failure.
 *
 * The preview renders the LOCAL file, not the uploaded object, so it appears instantly and works
 * with no connection.
 */
export const ReceiptPicker: React.FC<ReceiptPickerProps> = ({
    receipt,
    onPick,
    onRemove,
    error,
    onSkip,
    skipped = false,
    disabled = false,
    isUploading = false,
    isOffline = false,
}) => {
    const { colors, allColors } = useTheme();
    const accent = allColors.liturgical.ordinaryTime;

    return (
        <View>
            <Text
                style={{
                    color: colors.textMuted,
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 1.7,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                }}
            >
                Payment Receipt (optional)
            </Text>

            {receipt ? (
                <View
                    style={{
                        flexDirection: 'row',
                        gap: 12,
                        padding: 12,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: error ? '#B5303C' : `${accent}44`,
                        backgroundColor: `${accent}0D`,
                        // Communicates "locked" during submission without hiding what was attached.
                        opacity: disabled ? 0.6 : 1,
                    }}
                >
                    <View>
                        <Image
                            source={{ uri: receipt.uri }}
                            style={{ width: 62, height: 82, borderRadius: 10, backgroundColor: colors.surfaceElevated }}
                            contentFit="cover"
                            transition={120}
                            accessibilityLabel="Preview of the payment receipt you attached"
                        />
                        {isUploading ? (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 10,
                                    backgroundColor: 'rgba(0,0,0,0.35)',
                                }}
                            >
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            </View>
                        ) : null}
                    </View>

                    <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: 2 }}>
                        <View>
                            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                                {isUploading ? 'Sending receipt…' : 'Receipt attached'}
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 2 }} numberOfLines={1}>
                                {receipt.fileName ?? 'Check this is the right screenshot.'}
                            </Text>
                        </View>

                        {!disabled ? (
                            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    accessibilityLabel="Choose a different receipt"
                                    onPress={onPick}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Text style={{ color: accent, fontSize: 13, fontWeight: '700' }}>Change</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    accessibilityRole="button"
                                    accessibilityLabel="Remove the attached receipt"
                                    onPress={onRemove}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>
                                        Remove
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                </View>
            ) : (
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Attach a screenshot of your transfer"
                    accessibilityState={{ disabled }}
                    disabled={disabled}
                    activeOpacity={0.85}
                    onPress={onPick}
                    style={{
                        minHeight: 56,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: error ? '#B5303C' : colors.border,
                        backgroundColor: colors.surfaceElevated,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingHorizontal: 14,
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
                    <Ionicons name="cloud-upload-outline" size={18} color={accent} />
                    <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                        Attach a screenshot of your transfer
                    </Text>
                </TouchableOpacity>
            )}

            {error ? (
                <View style={{ marginTop: 8 }}>
                    <Text style={{ color: '#B5303C', fontSize: 12, lineHeight: 17 }}>{error}</Text>
                    {onSkip && !disabled ? (
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Submit without the receipt"
                            onPress={onSkip}
                            style={{ marginTop: 8, alignSelf: 'flex-start' }}
                        >
                            <Text style={{ color: accent, fontSize: 13, fontWeight: '700' }}>
                                Submit without the receipt
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : null}

            {skipped && receipt ? (
                <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>
                    Submitting without the receipt. The parish will match your transfer using the name and
                    reference above.
                </Text>
            ) : null}

            {isOffline && receipt ? (
                <Text style={{ color: colors.textMuted, fontSize: 11.5, marginTop: 6, lineHeight: 16 }}>
                    You are offline — the receipt will not upload, but your transfer name and reference still
                    let the parish match it.
                </Text>
            ) : null}
        </View>
    );
};
