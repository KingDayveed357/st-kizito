import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { Button } from '../../src/components/ui/Button';
import { useRouter } from 'expo-router';
import { BookingDraft, BookingIntentionType } from '../../src/types/booking.types';

const intentionOptions: Array<{ label: string; value: BookingIntentionType }> = [
    { label: 'Mass Intention', value: 'mass_intention' },
    { label: 'Thanksgiving', value: 'thanksgiving' },
];

const todayISO = new Date().toISOString().slice(0, 10);

const isValidISODate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export default function BookingScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [intentionType, setIntentionType] = useState<BookingIntentionType>('mass_intention');
    const [date, setDate] = useState(todayISO);
    const [note, setNote] = useState('');
    const [errors, setErrors] = useState<{ fullName?: string; date?: string; note?: string }>({});

    const accent = allColors.liturgical.ordinaryTime;
    const selectedIntentionLabel = useMemo(
        () => intentionOptions.find((option) => option.value === intentionType)?.label ?? 'Mass Intention',
        [intentionType]
    );

    const handleContinue = () => {
        const nextErrors: { fullName?: string; date?: string; note?: string } = {};

        if (!fullName.trim()) nextErrors.fullName = 'Full name is required.';
        if (!isValidISODate(date)) nextErrors.date = 'Use YYYY-MM-DD format for the date.';
        if (!note.trim()) nextErrors.note = 'Please enter your intention note.';

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        const draft: BookingDraft = {
            fullName: fullName.trim(),
            intentionType,
            date,
            note: note.trim(),
        };

        router.push({
            pathname: '/booking/payment',
            params: {
                draft: JSON.stringify(draft),
            },
        });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                title="Book a Mass"
                rightElement={
                    <View style={{ paddingRight: 20, paddingVertical: 4, backgroundColor: `${accent}14`, borderRadius: 10, paddingHorizontal: 10 }}>
                        <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                            STEP 1 OF 3
                        </Text>
                    </View>
                }
            />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    automaticallyAdjustKeyboardInsets
                >
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
                            Submit your Mass intention, then complete transfer details.
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
                            Every request is submitted with status pending until the parish team verifies payment.
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
                        placeholder="e.g. Adaeze Okonkwo"
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
                        Intention Type
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                        {intentionOptions.map((option) => {
                            const isActive = option.value === intentionType;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    activeOpacity={0.86}
                                    onPress={() => setIntentionType(option.value)}
                                    style={{
                                        flex: 1,
                                        minHeight: 48,
                                        borderRadius: 14,
                                        borderWidth: 1,
                                        borderColor: isActive ? accent : colors.border,
                                        backgroundColor: isActive ? accent : colors.surface,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Text style={{ color: isActive ? '#FFFFFF' : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>{option.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                        Date (YYYY-MM-DD)
                    </Text>
                    <TextInput
                        value={date}
                        onChangeText={(value) => {
                            setDate(value);
                            if (errors.date) setErrors((current) => ({ ...current, date: undefined }));
                        }}
                        placeholder="2026-04-20"
                        placeholderTextColor={colors.textMuted}
                        style={{
                            minHeight: 52,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: errors.date ? '#B5303C' : colors.border,
                            backgroundColor: colors.surface,
                            paddingHorizontal: 14,
                            color: colors.textPrimary,
                            marginBottom: errors.date ? 4 : 18,
                        }}
                    />
                    {errors.date ? <Text style={{ color: '#B5303C', fontSize: 12, marginBottom: 14 }}>{errors.date}</Text> : null}

                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                        Note / Description
                    </Text>
                    <TextInput
                        multiline
                        numberOfLines={4}
                        value={note}
                        onChangeText={(value) => {
                            setNote(value);
                            if (errors.note) setErrors((current) => ({ ...current, note: undefined }));
                        }}
                        placeholder={
                            intentionType === 'mass_intention'
                                ? 'e.g. For the repose of the soul of John Doe'
                                : 'e.g. Thanksgiving for safe delivery and family health'
                        }
                        placeholderTextColor={colors.textMuted}
                        style={{
                            minHeight: 108,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: errors.note ? '#B5303C' : colors.border,
                            backgroundColor: colors.surface,
                            paddingHorizontal: 14,
                            paddingTop: 12,
                            paddingBottom: 12,
                            color: colors.textPrimary,
                            textAlignVertical: 'top',
                            marginBottom: errors.note ? 4 : 18,
                        }}
                    />
                    {errors.note ? <Text style={{ color: '#B5303C', fontSize: 12, marginBottom: 14 }}>{errors.note}</Text> : null}

                    <View
                        style={{
                            borderRadius: 18,
                            backgroundColor: colors.surfaceElevated,
                            padding: 16,
                            marginBottom: 20,
                        }}
                    >
                        <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 6 }}>
                            Request Summary
                        </Text>
                        <Text style={{ color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 19, fontWeight: '700' }}>{selectedIntentionLabel}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>{date}</Text>
                    </View>

                    <Button onPress={handleContinue}>Continue</Button>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
