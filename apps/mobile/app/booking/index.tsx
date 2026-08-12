import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { Button } from '../../src/components/ui/Button';
import { KeyboardAwareForm } from '../../src/components/ui/KeyboardAwareForm';
import { DatePickerField } from '../../src/components/ui/DatePickerField';
import { useRouter } from 'expo-router';
import { BookingDraft, BookingIntentionType } from '../../src/types/booking.types';
import { useMassTimes } from '../../src/hooks/useMassTimes';
import { useParishSettings } from '../../src/hooks/useParishSettings';
import {
    validateBookingRange,
    validateOfferedAmount,
    parseAmountInput,
    formatNaira,
} from '../../src/utils/bookingRules';

const intentionOptions: Array<{ label: string; value: BookingIntentionType }> = [
    { label: 'Mass Intention', value: 'mass_intention' },
    { label: 'Thanksgiving', value: 'thanksgiving' },
];

const todayISO = new Date().toISOString().slice(0, 10);

const naira = formatNaira;

const MASS_TIME_SEPARATOR = ', ';
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseIsoDate = (iso: string): Date | null => {
    const date = new Date(`${iso}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getWeekdaysInRange = (startIso: string, endIso: string): Set<string> => {
    const start = parseIsoDate(startIso);
    const end = parseIsoDate(endIso);
    const days = new Set<string>();
    if (!start || !end || end.getTime() < start.getTime()) return days;

    for (let time = start.getTime(); time <= end.getTime(); time += MS_PER_DAY) {
        const date = new Date(time);
        days.add(DAY_NAMES[date.getDay()]);
    }
    return days;
};

/**
 * Flatten day-grouped Mass times into de-duplicated options for only the chosen booking dates.
 */
const buildMassTimeOptions = (
    massTimes: Array<{ day: string; morning: string | null; evening: string | null }>,
    startIso: string,
    endIso: string,
): string[] => {
    const allowedDays = getWeekdaysInRange(startIso, endIso);
    const options: string[] = [];
    const seen = new Set<string>();

    for (const row of massTimes) {
        if (!allowedDays.has(row.day)) continue;

        const slots = [row.morning, row.evening]
            .filter(Boolean)
            .flatMap((slot) => (slot as string).split('\n'))
            .map((s) => s.trim())
            .filter(Boolean);

        for (const slot of slots) {
            const label = `${row.day} - ${slot}`;
            if (!seen.has(label)) {
                seen.add(label);
                options.push(label);
            }
        }
    }
    return options;
};

const buildOfferingPresets = (minimumAmount: number): number[] => {
    const step = 1000;
    return [minimumAmount, minimumAmount + step, minimumAmount + step * 2];
};
export default function BookingScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const { data: massTimes } = useMassTimes();
    const { limits } = useParishSettings();

    const [fullName, setFullName] = useState('');
    const [intentionType, setIntentionType] = useState<BookingIntentionType>('mass_intention');
    const [startDate, setStartDate] = useState(todayISO);
    const [endDate, setEndDate] = useState(todayISO);
    const [selectedMassTimeLabels, setSelectedMassTimeLabels] = useState<string[]>([]);
    const [note, setNote] = useState('');
    const [amountInput, setAmountInput] = useState('');
    const [errors, setErrors] = useState<{ fullName?: string; range?: string; note?: string; amount?: string }>({});

    /**
     * Whether the parishioner has typed their own offering.
     *
     * Until they do, the field tracks the computed minimum as the date range changes — so choosing
     * three days shows ₦1,500 without any interaction. Once they have entered a figure of their
     * own it is never silently overwritten; if a later range change makes it too small, validation
     * says so rather than quietly raising what they intended to give.
     */
    const amountTouched = useRef(false);

    const accent = allColors.liturgical.ordinaryTime;
    const selectedIntentionLabel = useMemo(
        () => intentionOptions.find((option) => option.value === intentionType)?.label ?? 'Mass Intention',
        [intentionType]
    );

    const massTimeOptions = useMemo(
        () => buildMassTimeOptions(massTimes ?? [], startDate, endDate),
        [massTimes, startDate, endDate],
    );

    // Live range validation + amount preview (single source of truth: bookingRules).
    const range = useMemo(
        () => validateBookingRange(startDate, endDate, undefined, limits),
        [startDate, endDate, limits],
    );

    // Keep the suggested offering in step with the range until the user takes over the field.
    useEffect(() => {
        if (amountTouched.current) return;
        setAmountInput(range.valid ? String(range.minimumAmount) : '');
    }, [range.valid, range.minimumAmount]);

    useEffect(() => {
        setSelectedMassTimeLabels((current) => current.filter((label) => massTimeOptions.includes(label)));
    }, [massTimeOptions]);

    const offeredAmount = useMemo(() => parseAmountInput(amountInput), [amountInput]);
    const offeringPresets = useMemo(
        () => (range.valid ? buildOfferingPresets(range.minimumAmount) : []),
        [range.valid, range.minimumAmount],
    );
    const selectedMassTimeSummary = selectedMassTimeLabels.length > 0
        ? selectedMassTimeLabels.join(MASS_TIME_SEPARATOR)
        : null;

    const handleContinue = () => {
        const nextErrors: { fullName?: string; range?: string; note?: string; amount?: string } = {};

        if (!fullName.trim()) nextErrors.fullName = 'Full name is required.';
        if (!range.valid) nextErrors.range = range.error;
        if (!note.trim()) nextErrors.note = 'Please enter your intention note.';

        if (range.valid) {
            if (offeredAmount === null) {
                nextErrors.amount = 'Enter the amount you wish to offer.';
            } else {
                const amountCheck = validateOfferedAmount(startDate, endDate, offeredAmount, limits);
                if (!amountCheck.valid) nextErrors.amount = amountCheck.error;
            }
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        const draft: BookingDraft = {
            fullName: fullName.trim(),
            intentionType,
            startDate,
            endDate,
            days: range.days,
            amount: offeredAmount ?? range.minimumAmount,
            massTimeId: null,
            massTimeLabel: selectedMassTimeSummary,
            massTimeLabels: selectedMassTimeLabels,
            note: note.trim(),
        };

        router.push({
            pathname: '/booking/payment',
            params: { draft: JSON.stringify(draft) },
        });
    };

    const labelStyle = {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: '700' as const,
        letterSpacing: 2,
        textTransform: 'uppercase' as const,
        marginBottom: 8,
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                title="Book a Mass"
                rightElement={
                    <View style={{ paddingVertical: 4, backgroundColor: `${accent}14`, borderRadius: 10, paddingHorizontal: 10 }}>
                        <Text numberOfLines={1} style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                            STEP 1 OF 3
                        </Text>
                    </View>
                }
            />

            <KeyboardAwareForm contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14 }}>
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
                        Offer Masses for one day or across a range.
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19 }}>
                        The offering is a minimum of {naira(limits.minPerDay)} per Mass, per day — you are welcome to give
                        more. A booking can span up to one month ({limits.maxDays} days). Every request stays pending
                        until the parish verifies payment.
                    </Text>
                </View>

                <Text style={labelStyle}>Full Name</Text>
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

                <Text style={labelStyle}>Intention Type</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                    {intentionOptions.map((option) => {
                        const isActive = option.value === intentionType;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isActive }}
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

                <DatePickerField
                    label="Start Date"
                    value={startDate}
                    onChange={(iso) => {
                        setStartDate(iso);
                        // Keep the range coherent: never let end fall before start.
                        if (endDate < iso) setEndDate(iso);
                        if (errors.range) setErrors((current) => ({ ...current, range: undefined }));
                    }}
                    minimumDate={new Date()}
                />

                <DatePickerField
                    label="End Date"
                    value={endDate}
                    onChange={(iso) => {
                        setEndDate(iso);
                        if (errors.range) setErrors((current) => ({ ...current, range: undefined }));
                    }}
                    minimumDate={new Date(`${startDate}T12:00:00`)}
                    error={!!errors.range}
                    helperText={errors.range}
                />

                {massTimeOptions.length > 0 ? (
                    <>
                        <Text style={labelStyle}>Preferred Mass Time (optional)</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                            {massTimeOptions.map((option) => {
                                const isActive = selectedMassTimeLabels.includes(option);
                                return (
                                    <TouchableOpacity
                                        key={option}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: isActive }}
                                        activeOpacity={0.86}
                                        onPress={() => {
                                            setSelectedMassTimeLabels((current) =>
                                                current.includes(option)
                                                    ? current.filter((label) => label !== option)
                                                    : [...current, option],
                                            );
                                        }}
                                        style={{
                                            minHeight: 40,
                                            paddingHorizontal: 14,
                                            justifyContent: 'center',
                                            borderRadius: 999,
                                            borderWidth: 1,
                                            borderColor: isActive ? accent : colors.border,
                                            backgroundColor: isActive ? `${accent}18` : colors.surface,
                                        }}
                                    >
                                        <Text style={{ color: isActive ? accent : colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{option}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </>
                ) : null}

                <Text style={labelStyle}>Note / Description</Text>
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

                {/*
                  Offering amount. The parish sets a per-day minimum, not a fixed price — this field
                  is prefilled with that minimum but is the parishioner's to change upward. The
                  database enforces the same floor, so a modified client cannot underpay.
                */}
                <Text style={labelStyle}>Your Offering</Text>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        minHeight: 52,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: errors.amount ? '#B5303C' : colors.border,
                        backgroundColor: colors.surface,
                        paddingHorizontal: 14,
                        marginBottom: 8,
                    }}
                >
                    <Text style={{ color: colors.textSecondary, fontSize: 17, fontWeight: '700', marginRight: 6 }}>₦</Text>
                    <TextInput
                        accessibilityLabel="Offering amount in naira"
                        keyboardType="number-pad"
                        inputMode="numeric"
                        value={amountInput}
                        onChangeText={(value) => {
                            amountTouched.current = true;
                            // Keep only what can be part of a naira figure so the keypad's stray
                            // characters (and paste) cannot produce an unparseable value.
                            setAmountInput(value.replace(/[^\d]/g, ''));
                            if (errors.amount) setErrors((current) => ({ ...current, amount: undefined }));
                        }}
                        placeholder={range.valid ? String(range.minimumAmount) : '0'}
                        placeholderTextColor={colors.textMuted}
                        style={{ flex: 1, color: colors.textPrimary, fontSize: 17, fontWeight: '700', paddingVertical: 12 }}
                    />
                    {offeredAmount !== null && offeredAmount > 0 ? (
                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{naira(offeredAmount)}</Text>
                    ) : null}
                </View>

                {errors.amount ? (
                    <Text style={{ color: '#B5303C', fontSize: 12, marginBottom: 10 }}>{errors.amount}</Text>
                ) : (
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 10 }}>
                        {range.valid
                            ? `Minimum ${naira(range.minimumAmount)} for ${range.days} ${range.days === 1 ? 'Mass' : 'Masses'}. You are welcome to offer more.`
                            : 'Choose your dates to see the minimum offering.'}
                    </Text>
                )}

                {/* Quick amounts above the minimum — a common request at the parish office. */}
                {range.valid ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                        {offeringPresets.map((preset) => {
                            const isActive = offeredAmount === preset;
                            return (
                                <TouchableOpacity
                                    key={`offering-preset-${preset}`}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Offer ${naira(preset)}`}
                                    accessibilityState={{ selected: isActive }}
                                    activeOpacity={0.86}
                                    onPress={() => {
                                        amountTouched.current = true;
                                        setAmountInput(String(preset));
                                        if (errors.amount) setErrors((current) => ({ ...current, amount: undefined }));
                                    }}
                                    style={{
                                        minHeight: 40,
                                        paddingHorizontal: 14,
                                        justifyContent: 'center',
                                        borderRadius: 999,
                                        borderWidth: 1,
                                        borderColor: isActive ? accent : colors.border,
                                        backgroundColor: isActive ? `${accent}18` : colors.surface,
                                    }}
                                >
                                    <Text style={{ color: isActive ? accent : colors.textPrimary, fontSize: 12, fontWeight: '600' }}>
                                        {naira(preset)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : null}

                {/* Live offering summary */}
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
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                        {range.valid
                            ? `${startDate} → ${endDate} · ${range.days} ${range.days === 1 ? 'Mass' : 'Masses'}`
                            : `${startDate} → ${endDate}`}
                    </Text>
                    {selectedMassTimeLabels.map((label) => (
                        <Text key={label} style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>{label}</Text>
                    ))}
                    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Your Offering
                        </Text>
                        <Text style={{ color: accent, fontSize: 22, fontWeight: '800' }}>
                            {range.valid && offeredAmount !== null ? naira(offeredAmount) : '—'}
                        </Text>
                    </View>
                    {range.valid && offeredAmount !== null && offeredAmount > range.minimumAmount ? (
                        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>
                            {naira(range.minimumAmount)} minimum · {naira(offeredAmount - range.minimumAmount)} additional offering
                        </Text>
                    ) : null}
                </View>

                <Button onPress={handleContinue}>Continue</Button>
            </KeyboardAwareForm>
        </SafeAreaView>
    );
}

