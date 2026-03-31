import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../src/components/ui/Header';
import { useTheme } from '../../src/hooks/useTheme';
import { Button } from '../../src/components/ui/Button';
import { BookingConfirmationModal } from '../../src/components/more/BookingConfirmationModal';
import { useBookingStore } from '../../src/store/useBookingStore';
import { Ionicons } from '@expo/vector-icons';

// ─── Data ─────────────────────────────────────────────────────────────────────

const MASS_TYPES = [
    { id: 'thanksgiving', label: 'Thanksgiving', icon: 'sunny-outline' as const },
    { id: 'mass-intention', label: 'Mass Intention', icon: 'flame-outline' as const },
] as const;

const MASS_DATES = [
    { id: 'thu-apr-3', label: 'Thu, Apr 3', helper: 'Weekday', isSunday: false },
    { id: 'fri-apr-4', label: 'Fri, Apr 4', helper: 'Weekday', isSunday: false },
    { id: 'sun-apr-6', label: 'Sun, Apr 6', helper: 'Sunday', isSunday: true },
    { id: 'sun-apr-13', label: 'Sun, Apr 13', helper: 'Sunday', isSunday: true },
];

const WEEKDAY_TIMES = [
    { id: 'morning', label: 'Morning Mass', helper: '6:30 AM', icon: 'sunny-outline' as const },
    { id: 'evening', label: 'Evening Mass', helper: '6:00 PM', icon: 'moon-outline' as const },
];

const SUNDAY_TIMES = [
    { id: 'sunday-8', label: 'First Mass', helper: '8:00 AM', icon: 'sunny-outline' as const },
    { id: 'sunday-9', label: 'Second Mass', helper: '9:00 AM', icon: 'partly-sunny-outline' as const },
];

const AMOUNT_PRESETS = [500, 1000, 2000] as const;

// Staff who handle "Other Services" — same data as More screen for consistency
const OTHER_SERVICES_CONTACTS = [
    {
        id: 'secretary',
        category: 'ADMINISTRATION',
        title: 'Sacramental Documents',
        description: 'Baptism, confirmation, and marriage record processing.',
        contactName: 'Mrs. Adaeze Okonkwo',
        role: 'Parish Secretary',
        phone: '+2348012345678',
        accent: '#5E6F8E',
        icon: 'document-text-outline' as const,
    },
    {
        id: 'counselling',
        category: 'CARE',
        title: 'Pastoral Counselling',
        description: 'A calm, private session with a priest or counsellor.',
        contactName: 'Fr. Emmanuel Nwosu',
        role: 'Pastoral Counsellor',
        phone: '+2348023456789',
        accent: '#B5303C',
        icon: 'heart-circle-outline' as const,
    },
];

const buildConfirmationId = () => `BK-${Date.now().toString().slice(-6)}`;

// ─── Reusable pill selector ────────────────────────────────────────────────────

function SectionLabel({ label, colors }: { label: string; colors: ReturnType<typeof useTheme>['colors'] }) {
    return (
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
            {label}
        </Text>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookingScreen() {
    const { colors, allColors } = useTheme();
    const { currentBooking, setBooking, clearBooking } = useBookingStore();
    const [massType, setMassType] = useState<(typeof MASS_TYPES)[number]['id']>('thanksgiving');
    const [selectedDateId, setSelectedDateId] = useState(MASS_DATES[0].id);
    const [selectedTimeId, setSelectedTimeId] = useState(WEEKDAY_TIMES[0].id);
    const [amountInput, setAmountInput] = useState(String(AMOUNT_PRESETS[2]));
    const [intention, setIntention] = useState('');
    const [errors, setErrors] = useState<{ intention?: string; amount?: string }>({});
    const [confirmationVisible, setConfirmationVisible] = useState(false);

    const accent = allColors.liturgical.ordinaryTime;

    const selectedDate = useMemo(
        () => MASS_DATES.find((d) => d.id === selectedDateId) ?? MASS_DATES[0],
        [selectedDateId]
    );
    const availableTimes = selectedDate.isSunday ? SUNDAY_TIMES : WEEKDAY_TIMES;
    const selectedTime = useMemo(
        () => availableTimes.find((t) => t.id === selectedTimeId) ?? availableTimes[0],
        [availableTimes, selectedTimeId]
    );
    const amountValue = Number(amountInput.replace(/[^0-9]/g, '')) || 0;

    const handleDateSelect = (dateId: string) => {
        const nextDate = MASS_DATES.find((d) => d.id === dateId) ?? MASS_DATES[0];
        const nextTimes = nextDate.isSunday ? SUNDAY_TIMES : WEEKDAY_TIMES;
        setSelectedDateId(dateId);
        setSelectedTimeId(nextTimes[0].id);
    };

    const handleContinue = () => {
        const nextErrors: { intention?: string; amount?: string } = {};
        if (!intention.trim()) nextErrors.intention = 'Please enter the Mass intention or thanksgiving note.';
        if (amountValue < 500) nextErrors.amount = 'Minimum stipend is ₦500.';
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setBooking({
            serviceId: 'mass-booking',
            serviceTitle: massType === 'thanksgiving' ? 'Thanksgiving Mass' : 'Mass Intention',
            serviceCategory: massType === 'thanksgiving' ? 'Thanksgiving' : 'Mass Intention',
            dateLabel: selectedDate.label,
            timeLabel: `${selectedTime.label} – ${selectedTime.helper}`,
            amountLabel: `₦${amountValue.toLocaleString()}`,
            notes: intention.trim(),
            confirmationId: buildConfirmationId(),
        });
        setConfirmationVisible(true);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header
                showBack
                title="Book a Mass"
                rightElement={
                    <View style={{ paddingRight: 20, paddingVertical: 4, backgroundColor: `${accent}14`, borderRadius: 10, paddingHorizontal: 10 }}>
                        <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                            STEP 1 OF 2
                        </Text>
                    </View>
                }
            />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero card ── */}
                <View
                    style={{
                        borderRadius: 24,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 20,
                        marginBottom: 28,
                    }}
                >
                    <Text style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 8 }}>
                        Spiritual Offering
                    </Text>
                    <Text style={{ color: colors.textPrimary, fontSize: 19, fontFamily: 'Georgia', fontWeight: '700', lineHeight: 28, marginBottom: 8 }}>
                        Request a Mass with clarity and reverence.
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
                        Choose the type, add your intention, pick a date and time, then confirm the offering.
                    </Text>
                </View>

                {/* ── Mass type ── */}
                <SectionLabel label="Mass Type" colors={colors} />
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
                    {MASS_TYPES.map((item) => {
                        const active = item.id === massType;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.85}
                                onPress={() => setMassType(item.id)}
                                style={{
                                    flex: 1,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 7,
                                    minHeight: 50,
                                    borderRadius: 16,
                                    backgroundColor: active ? accent : colors.surface,
                                    borderWidth: 1,
                                    borderColor: active ? accent : colors.border,
                                }}
                            >
                                <Ionicons name={item.icon} size={16} color={active ? '#FFF' : colors.textSecondary} />
                                <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Intention ── */}
                <SectionLabel label="Your Mass Intention" colors={colors} />
                <TextInput
                    multiline
                    numberOfLines={4}
                    placeholder={
                        massType === 'thanksgiving'
                            ? 'e.g. Thanksgiving for a successful surgery, for a new baby...'
                            : 'e.g. For the repose of the soul of John Doe...'
                    }
                    placeholderTextColor={colors.textMuted}
                    value={intention}
                    onChangeText={(v) => {
                        setIntention(v);
                        if (errors.intention) setErrors((e) => ({ ...e, intention: undefined }));
                    }}
                    style={{
                        minHeight: 110,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: errors.intention ? '#B5303C' : colors.border,
                        backgroundColor: colors.surface,
                        paddingHorizontal: 16,
                        paddingTop: 14,
                        paddingBottom: 14,
                        textAlignVertical: 'top',
                        color: colors.textPrimary,
                        fontSize: 14,
                        lineHeight: 22,
                        marginBottom: errors.intention ? 6 : 28,
                    }}
                />
                {!!errors.intention && (
                    <Text style={{ color: '#B5303C', fontSize: 12, marginBottom: 20 }}>{errors.intention}</Text>
                )}

                {/* ── Date ── */}
                <SectionLabel label="Mass Date" colors={colors} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
                    {MASS_DATES.map((item) => {
                        const active = item.id === selectedDateId;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.85}
                                onPress={() => handleDateSelect(item.id)}
                                style={{
                                    width: '48%',
                                    borderRadius: 16,
                                    backgroundColor: active ? accent : colors.surface,
                                    borderWidth: 1,
                                    borderColor: active ? accent : colors.border,
                                    paddingHorizontal: 16,
                                    paddingVertical: 13,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <View>
                                    <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                                        {item.label}
                                    </Text>
                                    <Text style={{ color: active ? 'rgba(255,255,255,0.75)' : colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                                        {item.helper}
                                    </Text>
                                </View>
                                {item.isSunday && (
                                    <Ionicons name="star" size={12} color={active ? 'rgba(255,255,255,0.8)' : allColors.liturgical.christmasEaster} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Time ── */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
                        Preferred Time
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                        {selectedDate.isSunday ? 'Sunday options' : 'Weekday options'}
                    </Text>
                </View>
                <View style={{ gap: 10, marginBottom: 28 }}>
                    {availableTimes.map((item) => {
                        const active = item.id === selectedTimeId;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.85}
                                onPress={() => setSelectedTimeId(item.id)}
                                style={{
                                    borderRadius: 16,
                                    backgroundColor: active ? accent : colors.surface,
                                    borderWidth: 1,
                                    borderColor: active ? accent : colors.border,
                                    paddingHorizontal: 16,
                                    paddingVertical: 14,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 12,
                                }}
                            >
                                <Ionicons name={item.icon} size={18} color={active ? '#FFF' : colors.textSecondary} />
                                <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontSize: 14, fontWeight: '600', flex: 1 }}>
                                    {item.label}
                                </Text>
                                <Text style={{ color: active ? 'rgba(255,255,255,0.8)' : colors.textSecondary, fontSize: 13 }}>
                                    {item.helper}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Stipend ── */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
                        Stipend Amount
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>Min: ₦500</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                    {AMOUNT_PRESETS.map((amount) => {
                        const active = amountValue === amount;
                        return (
                            <TouchableOpacity
                                key={amount}
                                activeOpacity={0.85}
                                onPress={() => {
                                    setAmountInput(String(amount));
                                    if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
                                }}
                                style={{
                                    flex: 1,
                                    minHeight: 48,
                                    borderRadius: 14,
                                    backgroundColor: active ? accent : colors.surface,
                                    borderWidth: 1,
                                    borderColor: active ? accent : colors.border,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Text style={{ color: active ? '#FFF' : colors.textPrimary, fontSize: 13, fontWeight: '700' }}>
                                    ₦{amount.toLocaleString()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <TextInput
                    keyboardType="number-pad"
                    placeholder="Or enter a custom amount"
                    placeholderTextColor={colors.textMuted}
                    value={amountInput}
                    onChangeText={(v) => {
                        setAmountInput(v);
                        if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
                    }}
                    style={{
                        minHeight: 52,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: errors.amount ? '#B5303C' : colors.border,
                        backgroundColor: colors.surface,
                        paddingHorizontal: 16,
                        color: colors.textPrimary,
                        fontSize: 15,
                        marginBottom: errors.amount ? 6 : 0,
                    }}
                />
                {!!errors.amount && (
                    <Text style={{ color: '#B5303C', fontSize: 12, marginBottom: 4 }}>{errors.amount}</Text>
                )}

                {/* ── Quote ── */}
                <View
                    style={{
                        marginTop: 24,
                        borderRadius: 20,
                        borderLeftWidth: 3,
                        borderLeftColor: accent,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 18,
                    }}
                >
                    <Text style={{ color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 15, fontStyle: 'italic', lineHeight: 24 }}>
                        "The celebration of Holy Mass is as valuable as the death of Jesus on the cross."
                    </Text>
                    <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginTop: 12 }}>
                        St. Thomas Aquinas
                    </Text>
                </View>

                {/* ── Summary ── */}
                <View
                    style={{
                        marginTop: 20,
                        borderRadius: 22,
                        backgroundColor: colors.surfaceElevated,
                        padding: 20,
                        marginBottom: 20,
                        gap: 6,
                    }}
                >
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 4 }}>
                        Booking Summary
                    </Text>
                    <Text style={{ color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 22, fontWeight: '700' }}>
                        {massType === 'thanksgiving' ? 'Thanksgiving Mass' : 'Mass Intention'}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                        {selectedDate.label} • {selectedTime.label} ({selectedTime.helper})
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Offering:</Text>
                        <Text style={{ color: accent, fontSize: 15, fontWeight: '700' }}>
                            ₦{amountValue.toLocaleString()}
                        </Text>
                    </View>
                </View>

                <Button  onPress={handleContinue}>
                    Continue
                </Button>

                {/* ── Other Services — with contact CTAs ── */}
                <View style={{ marginTop: 36, marginBottom: 14 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 20, fontFamily: 'Georgia', fontWeight: '700' }}>
                        Other Services
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                        Contact the right person at the parish office directly.
                    </Text>
                </View>

                <View
                    style={{
                        borderRadius: 24,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        overflow: 'hidden',
                    }}
                >
                    {OTHER_SERVICES_CONTACTS.map((service, index) => (
                        <View
                            key={service.id}
                            style={{
                                paddingHorizontal: 18,
                                paddingVertical: 18,
                                borderBottomWidth: index === OTHER_SERVICES_CONTACTS.length - 1 ? 0 : 1,
                                borderBottomColor: colors.border,
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 13 }}>
                                <View
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 13,
                                        backgroundColor: `${service.accent}18`,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginTop: 2,
                                    }}
                                >
                                    <Ionicons name={service.icon} size={20} color={service.accent} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: service.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>
                                        {service.category}
                                    </Text>
                                    <Text style={{ color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 16, fontWeight: '700' }}>
                                        {service.title}
                                    </Text>
                                    <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 3, marginBottom: 12 }}>
                                        {service.description}
                                    </Text>

                                    {/* Contact person chip */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${service.accent}20`, alignItems: 'center', justifyContent: 'center' }}>
                                            <Ionicons name="person-outline" size={14} color={service.accent} />
                                        </View>
                                        <View>
                                            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>
                                                {service.contactName}
                                            </Text>
                                            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                                                {service.role}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* CTA buttons */}
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => Linking.openURL(`tel:${service.phone}`)}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 5,
                                                paddingHorizontal: 14,
                                                paddingVertical: 9,
                                                borderRadius: 12,
                                                backgroundColor: `${service.accent}18`,
                                            }}
                                        >
                                            <Ionicons name="call-outline" size={14} color={service.accent} />
                                            <Text style={{ color: service.accent, fontSize: 12, fontWeight: '700' }}>Call</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => Linking.openURL(`https://wa.me/${service.phone.replace('+', '')}`)}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 5,
                                                paddingHorizontal: 14,
                                                paddingVertical: 9,
                                                borderRadius: 12,
                                                backgroundColor: `${allColors.liturgical.ordinaryTime}14`,
                                            }}
                                        >
                                            <Ionicons name="logo-whatsapp" size={14} color={allColors.liturgical.ordinaryTime} />
                                            <Text style={{ color: allColors.liturgical.ordinaryTime, fontSize: 12, fontWeight: '700' }}>WhatsApp</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <BookingConfirmationModal
                booking={currentBooking}
                visible={confirmationVisible}
                onClose={() => { setConfirmationVisible(false); clearBooking(); }}
                onBookAnother={() => {
                    setConfirmationVisible(false);
                    clearBooking();
                    setIntention('');
                    setAmountInput(String(AMOUNT_PRESETS[2]));
                    setErrors({});
                }}
            />
        </SafeAreaView>
    );
}