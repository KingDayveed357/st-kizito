import React, { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { Header } from '../../src/components/ui/Header';
import { Button } from '../../src/components/ui/Button';
import { KeyboardAwareForm } from '../../src/components/ui/KeyboardAwareForm';
import { DatePickerField } from '../../src/components/ui/DatePickerField';
import { StatusModal } from '../../src/components/ui/StatusModal';
import { useToast } from '../../src/components/ui/ToastProvider';
import { useSacramentTypes } from '../../src/hooks/useSacramentTypes';
import { useOfflineStatus } from '../../src/hooks/useOfflineStatus';
import { submitSacramentRequest } from '../../src/services/offline/syncService';
import { addSacramentRequest } from '../../src/services/requests/sacramentRequestStore';
import { generateClientRequestId } from '../../src/utils/requestId';
import type { SacramentField } from '../../src/types/sacrament.types';
import { resolveDateBounds } from '../../src/utils/sacramentDateBounds';
import { FormHelpLink } from '../../src/components/ui/FormHelpLink';

const inputStyle = (colors: any, invalid?: boolean, multiline?: boolean) => ({
    minHeight: multiline ? 100 : 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: invalid ? '#B5303C' : colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingTop: multiline ? 12 : 0,
    paddingBottom: multiline ? 12 : 0,
    color: colors.textPrimary,
    textAlignVertical: multiline ? ('top' as const) : ('center' as const),
    marginBottom: 16,
});

const Label = ({ text, colors }: { text: string; colors: any }) => (
    <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
        {text}
    </Text>
);

export default function SacramentRequestScreen() {
    const { colors, allColors } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams<{ type?: string }>();
    const typeKey = Array.isArray(params.type) ? params.type[0] : params.type;
    const { types } = useSacramentTypes();
    const { isOffline } = useOfflineStatus();

    const config = useMemo(() => types.find((t) => t.type === typeKey), [types, typeKey]);
    const accent = allColors.liturgical.ordinaryTime;

    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [values, setValues] = useState<Record<string, string>>({});
    const [supportingInfo, setSupportingInfo] = useState('');
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [submitting, setSubmitting] = useState(false);
    const [showDone, setShowDone] = useState(false);
    const { showToast } = useToast();

    /**
     * Every required field answered, and nothing already in flight.
     *
     * The button previously accepted a tap on an empty form and replied with "Please complete the
     * required fields" — making the user hunt for which one. Disabling it instead, with the count
     * shown below, says what is outstanding before they reach for it.
     */
    const missingRequired = config
        ? config.required_fields.filter((f) => f.required && !(values[f.key] ?? '').trim()).length +
          (fullName.trim() ? 0 : 1)
        : 0;
    const canSubmit = !submitting && missingRequired === 0;

    if (!config) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
                <Header showBack title="Sacramental Request" />
                <View style={{ padding: 24 }}>
                    <Text style={{ color: colors.textSecondary }}>This request is not available right now.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const setField = (key: string, value: string) => {
        setValues((c) => ({ ...c, [key]: value }));
        if (errors[key]) setErrors((c) => ({ ...c, [key]: false }));
    };

    const validate = () => {
        const next: Record<string, boolean> = {};
        if (!fullName.trim()) next.full_name = true;
        config.required_fields.forEach((f) => {
            if (f.required && !(values[f.key] ?? '').trim()) next[f.key] = true;
        });
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            showToast('Please complete the required fields.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const clientRequestId = generateClientRequestId('sc');
            const payload = {
                type: config.type,
                client_request_id: clientRequestId,
                full_name: fullName.trim(),
                contact_phone: phone.trim() || null,
                payload: Object.fromEntries(
                    config.required_fields.map((f) => [f.key, (values[f.key] ?? '').trim()]),
                ),
                attachment_url: supportingInfo.trim() || null,
                is_free: config.is_free,
                amount_due: config.is_free ? 0 : config.amount,
                status: 'pending' as const,
            };

            const result: any = await submitSacramentRequest(payload, isOffline);
            if (result?.duplicateBlocked) {
                showToast('Submission already in progress.', 'error');
                return;
            }
            if (result?.error) {
                throw new Error(result.error.message || 'Unable to submit now.');
            }

            const queued = result?.queued === true;
            await addSacramentRequest({
                id: `sacrament-${Date.now()}`,
                clientRequestId,
                type: config.type,
                typeTitle: config.title,
                fullName: fullName.trim(),
                status: 'pending',
                adminNote: null,
                amountDue: config.is_free ? 0 : config.amount,
                isFree: config.is_free,
                queuedOffline: queued,
            });

            setShowDone(true);
        } catch (e) {
            showToast(e instanceof Error ? e.message : 'Unable to submit now. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (f: SacramentField) => {
        const labelText = `${f.label}${f.required ? '' : ' (optional)'}`;

        if (f.type === 'date') {
            /*
             * Date bounds come from the field config, not from this screen.
             *
             * Previously `DatePickerField` was rendered with no `minimumDate`/`maximumDate` at all.
             * That left the Baptismal Card's "Date of Baptism" unbounded — a future baptism date
             * was accepted — while the Android dialog opened on the current month, where reaching a
             * date decades earlier means finding the small year affordance in the header. The
             * practical effect for a parishioner was a picker that appeared stuck on today.
             *
             * `datePreset: 'past'` now supplies max = today, `minDate` supplies the floor, and
             * `preferYearFirst` swaps the Android calendar for year/month/day wheels so the year is
             * the first thing you touch.
             */
            const bounds = resolveDateBounds(f);
            return (
                <DatePickerField
                    key={f.key}
                    label={labelText}
                    value={values[f.key] ?? ''}
                    onChange={(iso) => setField(f.key, iso)}
                    error={errors[f.key]}
                    helperText={errors[f.key] ? 'This date is required.' : (f.helperText ?? undefined)}
                    minimumDate={bounds.minimumDate}
                    maximumDate={bounds.maximumDate}
                    preferYearFirst={bounds.preferYearFirst}
                />
            );
        }

        if (f.type === 'select' && f.options && f.options.length > 0) {
            return (
                <View key={f.key} style={{ marginBottom: 16 }}>
                    <Label text={labelText} colors={colors} />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {f.options.map((opt) => {
                            const active = (values[f.key] ?? '') === opt;
                            return (
                                <Text
                                    key={opt}
                                    onPress={() => setField(f.key, opt)}
                                    accessibilityRole="button"
                                    style={{
                                        overflow: 'hidden',
                                        borderRadius: 999,
                                        borderWidth: 1,
                                        borderColor: active ? accent : colors.border,
                                        backgroundColor: active ? accent : colors.surface,
                                        color: active ? '#FFFFFF' : colors.textPrimary,
                                        paddingHorizontal: 14,
                                        paddingVertical: 10,
                                        fontSize: 13,
                                        fontWeight: '600',
                                    }}
                                >
                                    {opt}
                                </Text>
                            );
                        })}
                    </View>
                    {errors[f.key] ? <Text style={{ color: '#B5303C', fontSize: 12, marginTop: 6 }}>This field is required.</Text> : null}
                    {f.helperText ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>{f.helperText}</Text> : null}
                </View>
            );
        }

        const multiline = f.type === 'longtext';
        return (
            <View key={f.key}>
                <Label text={labelText} colors={colors} />
                <TextInput
                    editable={!submitting}
                    value={values[f.key] ?? ''}
                    onChangeText={(v) => setField(f.key, v)}
                    placeholder={f.placeholder ?? ''}
                    placeholderTextColor={colors.textMuted}
                    keyboardType={f.type === 'phone' ? 'phone-pad' : f.type === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={f.type === 'email' ? 'none' : 'sentences'}
                    multiline={multiline}
                    numberOfLines={multiline ? 4 : 1}
                    style={inputStyle(colors, errors[f.key], multiline)}
                />
                {f.helperText ? (
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: -8, marginBottom: 14 }}>{f.helperText}</Text>
                ) : null}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <Header showBack title={config.title} />
            <KeyboardAwareForm contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12 }}>
                    {/* Intro / fee card */}
                    <View style={{ borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 20 }}>
                        {config.description ? (
                            <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 12 }}>
                                {config.description}
                            </Text>
                        ) : null}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: `${accent}18` }}>
                                <Text style={{ color: accent, fontSize: 11, fontWeight: '800' }}>
                                    {config.is_free ? 'FREE' : `FEE: ${config.currency}${config.amount.toLocaleString()}`}
                                </Text>
                            </View>
                        </View>

                        {/* Admin-configured payment details (shown when the request has a fee) */}
                        {!config.is_free && (
                            <View style={{ marginTop: 14, borderRadius: 14, borderWidth: 1, borderColor: `${accent}33`, backgroundColor: `${accent}0D`, padding: 14 }}>
                                <Text style={{ color: accent, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 }}>
                                    Payment Details
                                </Text>
                                {config.payment_instructions ? (
                                    <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 10 }}>{config.payment_instructions}</Text>
                                ) : null}
                                {[
                                    ['Bank', config.bank_name],
                                    ['Account Name', config.account_name],
                                    ['Account Number', config.account_number],
                                ].filter(([, v]) => !!v).map(([label, v]) => (
                                    <View key={label as string} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
                                        <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right', marginLeft: 12 }}>{v}</Text>
                                    </View>
                                ))}
                                {config.payment_notes ? (
                                    <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 6, fontStyle: 'italic' }}>{config.payment_notes}</Text>
                                ) : null}
                                {!config.bank_name && !config.account_number && !config.payment_instructions ? (
                                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>The parish office will advise on payment after review.</Text>
                                ) : null}
                            </View>
                        )}
                    </View>

                    <Label text="Full Name" colors={colors} />
                    <TextInput
                        editable={!submitting}
                        value={fullName}
                        onChangeText={(v) => { setFullName(v); if (errors.full_name) setErrors((c) => ({ ...c, full_name: false })); }}
                        placeholder="Your full name"
                        placeholderTextColor={colors.textMuted}
                        style={inputStyle(colors, errors.full_name)}
                    />

                    <Label text="Phone (optional)" colors={colors} />
                    <TextInput
                        editable={!submitting}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="e.g. 080..."
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                        style={inputStyle(colors)}
                    />

                    {config.required_fields.map(renderField)}

                    {config.allow_attachment && (
                        <>
                            <Label text="Supporting Information (optional)" colors={colors} />
                            <TextInput
                                editable={!submitting}
                                value={supportingInfo}
                                onChangeText={setSupportingInfo}
                                placeholder="Reference to any supporting document, or extra details"
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={3}
                                style={inputStyle(colors, false, true)}
                            />
                        </>
                    )}

                    {isOffline && (
                        <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 14 }}>
                            You're offline — your request will be saved and submitted automatically once you reconnect.
                        </Text>
                    )}

                    <Button onPress={handleSubmit} disabled={!canSubmit}>
                        {submitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                    {!submitting && missingRequired > 0 ? (
                        <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
                            {missingRequired === 1
                                ? '1 required field still to complete.'
                                : `${missingRequired} required fields still to complete.`}
                        </Text>
                    ) : null}
                    <FormHelpLink context={`your ${config.title.toLowerCase()} request`} />
            </KeyboardAwareForm>

            <StatusModal
                visible={showDone}
                status="pending"
                title={isOffline ? 'Saved Offline' : 'Request Submitted'}
                onClose={() => setShowDone(false)}
                onAction={() => { setShowDone(false); router.replace('/sacraments'); }}
                actionLabel="View My Requests"
            />
        </SafeAreaView>
    );
}
