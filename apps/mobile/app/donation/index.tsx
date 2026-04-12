import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { Button } from '../../src/components/ui/Button';
import { useRouter } from 'expo-router';
import { DonationDraft } from '../../src/types/booking.types';

export default function DonationScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [amount, setAmount] = useState('');
    const [purpose, setPurpose] = useState('');
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<{ fullName?: string; amount?: string }>({});

    const accent = allColors.liturgical.ordinaryTime;

    const handleContinue = () => {
        const nextErrors: { fullName?: string; amount?: string } = {};
        const numericAmount = Number(amount.replace(/[^0-9]/g, '')) || 0;

        if (!fullName.trim()) nextErrors.fullName = 'Full name is required.';
        if (numericAmount <= 0) nextErrors.amount = 'Enter a valid donation amount.';

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        const draft: DonationDraft = {
            fullName: fullName.trim(),
            amount: numericAmount,
            purpose: purpose.trim() || undefined,
            message: message.trim() || undefined,
        };

        router.push({
            pathname: '/donation/payment',
            params: {
                draft: JSON.stringify(draft),
            },
        });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                title="Donations"
                rightElement={
                    <View style={{ paddingRight: 20, paddingVertical: 4, backgroundColor: `${accent}14`, borderRadius: 10, paddingHorizontal: 10 }}>
                        <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                            STEP 1 OF 3
                        </Text>
                    </View>
                }
            />
               
         <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 52 }} showsVerticalScrollIndicator={false}>
                <View
                    style={{
                        borderRadius: 22,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 18,
                        marginBottom: 20,
                    }}
                >
                    <Text style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 8 }}>
                        Pending Payment Flow
                    </Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 18, fontFamily: 'Georgia', fontWeight: '700', lineHeight: 26, marginBottom: 6 }}>
                        Share your donation intent, then complete transfer confirmation.
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
                        Every donation starts as pending and is approved after manual verification.
                    </Text>
                </View>

                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                    Full Name
                </Text>
                <TextInput
                    value={fullName}
                    onChangeText={(value) => {
                        setFullName(value);
                        if (errors.fullName) setErrors((current) => ({ ...current, fullName: undefined }));
                    }}
                    placeholder="e.g. Chinedu Eze"
                    placeholderTextColor={colors.textMuted}
                    style={{
                        minHeight: 52,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: errors.fullName ? '#B5303C' : colors.border,
                        backgroundColor: colors.surface,
                        paddingHorizontal: 14,
                        color: colors.textPrimary,
                        marginBottom: errors.fullName ? 4 : 18,
                    }}
                />
                {errors.fullName ? <Text style={{ color: '#B5303C', fontSize: 12, marginBottom: 14 }}>{errors.fullName}</Text> : null}

                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                    Amount (NGN)
                </Text>
                <TextInput
                    keyboardType="number-pad"
                    value={amount}
                    onChangeText={(value) => {
                        setAmount(value);
                        if (errors.amount) setErrors((current) => ({ ...current, amount: undefined }));
                    }}
                    placeholder="e.g. 5000"
                    placeholderTextColor={colors.textMuted}
                    style={{
                        minHeight: 52,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: errors.amount ? '#B5303C' : colors.border,
                        backgroundColor: colors.surface,
                        paddingHorizontal: 14,
                        color: colors.textPrimary,
                        marginBottom: errors.amount ? 4 : 18,
                    }}
                />
                {errors.amount ? <Text style={{ color: '#B5303C', fontSize: 12, marginBottom: 14 }}>{errors.amount}</Text> : null}

                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                    Purpose (optional)
                </Text>
                <TextInput
                    value={purpose}
                    onChangeText={setPurpose}
                    placeholder="e.g. Sunday Offering"
                    placeholderTextColor={colors.textMuted}
                    style={{
                        minHeight: 52,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        paddingHorizontal: 14,
                        color: colors.textPrimary,
                        marginBottom: 18,
                    }}
                />

                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                    Message (optional)
                </Text>
                <TextInput
                    multiline
                    numberOfLines={4}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Share a short message with this donation"
                    placeholderTextColor={colors.textMuted}
                    style={{
                        minHeight: 100,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        paddingHorizontal: 14,
                        paddingTop: 12,
                        paddingBottom: 12,
                        color: colors.textPrimary,
                        textAlignVertical: 'top',
                        marginBottom: 20,
                    }}
                />

                <Button onPress={handleContinue}>Continue</Button>
            </ScrollView>
    </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
