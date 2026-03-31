import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { Button } from '../../src/components/ui/Button';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface GivingOption {
    id: string;
    title: string;
    description: string;
    amount: number;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    accent: string;
    impact: string;
}

const GIVING_OPTIONS: GivingOption[] = [
    {
        id: 'sunday',
        title: 'Sunday Offering',
        description: 'Contributes to parish operations and liturgical preparation.',
        amount: 2000,
        icon: 'sunny-outline',
        accent: '#4A7C59',
        impact: 'Powers weekly worship',
    },
    {
        id: 'family',
        title: 'Support a Family',
        description: 'Helps provide food parcels and outreach visits to vulnerable families.',
        amount: 5000,
        icon: 'people-outline',
        accent: '#3A6EA5',
        impact: 'Feeds a family for a week',
    },
    {
        id: 'community',
        title: 'Community Giving',
        description: 'Supports youth formation, choirs, and parish programs.',
        amount: 10000,
        icon: 'musical-notes-outline',
        accent: '#6B4E8A',
        impact: 'Funds one formation session',
    },
    {
        id: 'intention',
        title: 'Special Intention',
        description: 'A generous gift for mission projects and urgent parish needs.',
        amount: 20000,
        icon: 'flame-outline',
        accent: '#C9A84C',
        impact: 'Supports a mission project',
    },
];

const TRUST_BADGES = [
    // { icon: 'shield-checkmark-outline' as const, label: 'Secure payment' },
    { icon: 'eye-outline' as const, label: 'Transparent giving' },
    { icon: 'checkmark-circle-outline' as const, label: 'Manual verification' },
];

const buildReceiptId = () => `DON-${Date.now().toString().slice(-7)}`;

// ─── Confirmation Modal ────────────────────────────────────────────────────────

interface ConfirmationModalProps {
    visible: boolean;
    option: GivingOption | null;
    amount: number;
    onClose: () => void;
    colors: ReturnType<typeof useTheme>['colors'];
    allColors: ReturnType<typeof useTheme>['allColors'];
}

function ConfirmationModal({ visible, option, amount, onClose, colors, allColors }: ConfirmationModalProps) {
    const accent = allColors.liturgical.ordinaryTime;
    const receiptId = buildReceiptId();

    if (!option) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <Pressable
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                onPress={onClose}
            >
                <Pressable onPress={() => {}}>
                    <View
                        style={{
                            backgroundColor: colors.background,
                            borderTopLeftRadius: 32,
                            borderTopRightRadius: 32,
                            paddingHorizontal: 24,
                            paddingTop: 12,
                            paddingBottom: 44,
                        }}
                    >
                        {/* Handle */}
                        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 28 }} />

                        {/* Success icon */}
                        <View style={{ alignItems: 'center', marginBottom: 24 }}>
                            <View
                                style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: 36,
                                    backgroundColor: `${accent}18`,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                }}
                            >
                                <Ionicons name="checkmark-circle" size={40} color={accent} />
                            </View>
                            <Text style={{ color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 6 }}>
                                Thank you for giving!
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 21 }}>
                                Your donation has been received and will be{'\n'}reviewed by the parish team.
                            </Text>
                        </View>

                        {/* Receipt card */}
                        <View
                            style={{
                                borderRadius: 20,
                                backgroundColor: colors.surfaceElevated,
                                padding: 20,
                                marginBottom: 24,
                                gap: 12,
                            }}
                        >
                            <ReceiptRow label="Donation type" value={option.title} colors={colors} />
                            <Divider colors={colors} />
                            <ReceiptRow label="Amount" value={`₦${amount.toLocaleString()}`} colors={colors} valueAccent={accent} />
                            <Divider colors={colors} />
                            <ReceiptRow label="Impact" value={option.impact} colors={colors} />
                            <Divider colors={colors} />
                            <ReceiptRow label="Reference" value={receiptId} colors={colors} mono />
                        </View>

                        {/* Scripture snippet */}
                        <Text style={{ color: colors.textSecondary, fontFamily: 'Georgia', fontSize: 13, fontStyle: 'italic', textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                            "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion,
                            for God loves a cheerful giver." — 2 Cor 9:7
                        </Text>

                        <Button onPress={onClose}>Done</Button>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function ReceiptRow({ label, value, colors, valueAccent, mono }: {
    label: string;
    value: string;
    colors: ReturnType<typeof useTheme>['colors'];
    valueAccent?: string;
    mono?: boolean;
}) {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</Text>
            <Text style={{
                color: valueAccent ?? colors.textPrimary,
                fontSize: 13,
                fontWeight: '700',
                fontFamily: mono ? 'monospace' : undefined,
            }}>
                {value}
            </Text>
        </View>
    );
}

function Divider({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
    return <View style={{ height: 0.5, backgroundColor: colors.border }} />;
}

// ─── Giving Option Card ────────────────────────────────────────────────────────

function GivingCard({
    option,
    selected,
    onSelect,
    colors,
    accent,
}: {
    option: GivingOption;
    selected: boolean;
    onSelect: () => void;
    colors: ReturnType<typeof useTheme>['colors'];
    accent: string;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.88}
            onPress={onSelect}
            style={{
                borderRadius: 20,
                backgroundColor: colors.surface,
                borderWidth: selected ? 1.5 : 1,
                borderColor: selected ? option.accent : colors.border,
                padding: 18,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
            }}
        >
            {/* Icon */}
            <View
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 15,
                    backgroundColor: `${option.accent}18`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Ionicons name={option.icon} size={24} color={option.accent} />
            </View>

            {/* Text */}
            <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 2 }}>
                    {option.title}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginBottom: 6 }}>
                    {option.description}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="leaf-outline" size={11} color={option.accent} />
                    <Text style={{ color: option.accent, fontSize: 11, fontWeight: '600' }}>
                        {option.impact}
                    </Text>
                </View>
            </View>

            {/* Amount + select */}
            <View style={{ alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
                    ₦{option.amount.toLocaleString()}
                </Text>
                <View
                    style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 12,
                        backgroundColor: selected ? option.accent : colors.surfaceElevated,
                    }}
                >
                    <Text style={{ color: selected ? '#FFF' : colors.textSecondary, fontSize: 12, fontWeight: '700' }}>
                        {selected ? 'Selected' : 'Choose'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DonationScreen() {
    const { colors, allColors, isDark } = useTheme();
    const accent = allColors.liturgical.ordinaryTime;

    const [selectedId, setSelectedId] = useState<string | null>('sunday');
    const [customAmount, setCustomAmount] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [submittedOption, setSubmittedOption] = useState<GivingOption | null>(null);
    const [submittedAmount, setSubmittedAmount] = useState(0);

    const selectedOption = GIVING_OPTIONS.find((o) => o.id === selectedId) ?? null;
    const customValue = Number(customAmount.replace(/[^0-9]/g, '')) || 0;
    const effectiveAmount = customValue > 0 ? customValue : (selectedOption?.amount ?? 0);

    const handleContinue = () => {
        if (!selectedOption && customValue === 0) return;
        const optionForModal = selectedOption ?? GIVING_OPTIONS[0];
        setSubmittedOption(optionForModal);
        setSubmittedAmount(effectiveAmount);
        setModalVisible(true);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title="Donations" />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 60 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero ── */}
                <View
                    style={{
                        borderRadius: 24,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 22,
                        marginBottom: 20,
                    }}
                >
                    <Text style={{ color: accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 8 }}>
                        Parish Giving
                    </Text>
                    <Text style={{ color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 26, fontWeight: '700', lineHeight: 34, marginBottom: 12 }}>
                        Give with clarity, trust, and zero pressure.
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 18 }}>
                        Every contribution supports worship, outreach, formation, and parish care. Choose a simple preset or enter your own amount.
                    </Text>

                    {/* Selected amount summary */}
                    {(selectedOption || customValue > 0) && (
                        <View style={{ borderRadius: 14, backgroundColor: colors.surfaceElevated, padding: 14 }}>
                            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
                                Selected Amount
                            </Text>
                            <Text style={{ color: accent, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
                                ₦{effectiveAmount.toLocaleString()}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                <Ionicons name="shield-checkmark-outline" size={12} color={colors.textMuted} />
                                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                                    Secure parish account review and confirmation
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── Trust badges ── */}
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        borderRadius: 16,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        marginBottom: 24,
                        gap: 4,
                    }}
                >
                    {TRUST_BADGES.map((badge) => (
                        <View key={badge.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center' }}>
                            <Ionicons name={badge.icon} size={14} color={accent} />
                            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500' }}>
                                {badge.label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* ── Choose a giving option ── */}
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 14 }}>
                    Choose a giving option
                </Text>

                {GIVING_OPTIONS.map((option) => (
                    <GivingCard
                        key={option.id}
                        option={option}
                        selected={selectedId === option.id}
                        onSelect={() => {
                            setSelectedId(option.id);
                            setCustomAmount('');
                        }}
                        colors={colors}
                        accent={accent}
                    />
                ))}

                {/* ── Custom amount ── */}
                <View
                    style={{
                        borderRadius: 20,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 18,
                        marginBottom: 24,
                        marginTop: 4,
                    }}
                >
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontFamily: 'Georgia', fontWeight: '700', marginBottom: 4 }}>
                        Or enter a custom amount
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 14 }}>
                        Any amount given with a generous heart is a blessing.
                    </Text>
                    <TextInput
                        keyboardType="number-pad"
                        placeholder="e.g. 3500"
                        placeholderTextColor={colors.textMuted}
                        value={customAmount}
                        onChangeText={(v) => {
                            setCustomAmount(v);
                            if (v) setSelectedId(null);
                        }}
                        style={{
                            minHeight: 52,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.surfaceElevated,
                            paddingHorizontal: 16,
                            color: colors.textPrimary,
                            fontSize: 18,
                            fontWeight: '700',
                        }}
                    />
                </View>

                {/* ── Scripture ── */}
                <View
                    style={{
                        borderRadius: 20,
                        borderLeftWidth: 3,
                        borderLeftColor: accent,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 18,
                        marginBottom: 24,
                    }}
                >
                    <Text style={{ color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 14, fontStyle: 'italic', lineHeight: 22 }}>
                        "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion,
                        for God loves a cheerful giver."
                    </Text>
                    <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase', marginTop: 10 }}>
                        2 Corinthians 9:7
                    </Text>
                </View>

                <Button onPress={handleContinue} disabled={!selectedOption && customValue === 0}>
                    Continue with donation
                </Button>
            </ScrollView>

            <ConfirmationModal
                visible={modalVisible}
                option={submittedOption}
                amount={submittedAmount}
                onClose={() => setModalVisible(false)}
                colors={colors}
                allColors={allColors}
            />
        </SafeAreaView>
    );
}