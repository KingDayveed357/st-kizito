import React, { useState } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { fromIsoDate, toIsoDate } from '../../utils/dateFormat';

// Load the native module defensively. In a dev client built BEFORE this native module was added,
// importing it throws at load time (`RNCDatePicker` not in the binary), which would crash the
// whole screen. When unavailable we fall back to manual YYYY-MM-DD entry; after a rebuild the
// native dialog is used automatically. (require in try/catch so the throw is contained.)
let NativeDateTimePicker: any = null;
let AndroidPicker: { open: (options: any) => void; dismiss: (mode: string) => void } | null = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require('@react-native-community/datetimepicker');
    NativeDateTimePicker = module.default;
    AndroidPicker = module.DateTimePickerAndroid ?? null;
} catch {
    NativeDateTimePicker = null;
    AndroidPicker = null;
}

interface DatePickerFieldProps {
    label: string;
    /** ISO date 'YYYY-MM-DD' or '' when unset. */
    value: string;
    onChange: (isoDate: string) => void;
    minimumDate?: Date;
    maximumDate?: Date;
    required?: boolean;
    error?: boolean;
    helperText?: string;
    placeholder?: string;
    /**
     * Render the Android picker as scrollable year/month/day wheels instead of a month calendar.
     *
     * Android's default `DatePickerDialog` opens on the current month, and reaching a date years in
     * the past means either tapping the small header to reveal a year list or paging month by
     * month. For a field like "Date of Baptism", where the answer is routinely decades ago, that
     * reads as "it will only let me pick today". The spinner puts the year directly under the
     * user's thumb.
     *
     * iOS already uses a spinner, so this changes nothing there.
     */
    preferYearFirst?: boolean;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
    label,
    value,
    onChange,
    minimumDate,
    maximumDate,
    required,
    error,
    helperText,
    placeholder = 'Select a date',
    preferYearFirst = false,
}) => {
    const { colors } = useTheme();
    const [show, setShow] = useState(false);
    const [iosTemp, setIosTemp] = useState<Date | null>(null);
    /**
     * A fixed "now" for this mount.
     *
     * Any `new Date()` evaluated during render is a different object with a different timestamp
     * every time, which is precisely what made the Android dialog reset itself. Freezing it once
     * removes the whole hazard rather than leaving it for the next person to re-introduce.
     */
    const [stableFallbackTime] = useState(() => Date.now());
    const nativeAvailable = !!NativeDateTimePicker;

    const current = fromIsoDate(value);
    const display = current
        ? current.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : placeholder;

    const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
        setShow(false);
        if (event.type === 'set' && selected) onChange(toIsoDate(selected));
    };

    /**
     * Android opens the dialog IMPERATIVELY. This is the fix for "the picker only lets me choose
     * today".
     *
     * The declarative `<DateTimePicker />` component on Android is a thin wrapper whose internal
     * `showOrUpdatePicker` effect is keyed on `value.getTime()`
     * (node_modules/@react-native-community/datetimepicker/src/datetimepicker.android.js). Passing a
     * freshly constructed `new Date()` as the fallback value — which is what this component did, and
     * the obvious thing to write — produces a NEW timestamp on every render. Every re-render
     * therefore re-fired that effect and re-opened the dialog at today, discarding whatever year the
     * user had scrolled to. The dialog looked stuck on today because it was being reset underneath
     * them.
     *
     * `DateTimePickerAndroid.open()` is a one-shot call with no render coupling, so nothing can
     * reset it mid-interaction. It is also what the library documents for Android.
     */
    const openAndroidPicker = () => {
        if (!AndroidPicker) return;
        AndroidPicker.open({
            value: initialDate(),
            mode: 'date',
            display: preferYearFirst ? 'spinner' : 'default',
            minimumDate,
            maximumDate,
            onChange: handleAndroidChange,
        });
    };

    /**
     * Where the picker opens when no date has been chosen yet.
     *
     * `new Date()` is wrong for a bounded field: on a past-only field the dialog would open on a
     * date that is itself outside the allowed range, which Android renders as a calendar where
     * nothing is selectable — the clearest way to make a working picker look broken. Clamp the
     * starting point into the permitted range instead.
     */
    const initialDate = (): Date => {
        if (current) return current;
        const today = new Date();
        if (maximumDate && today.getTime() > maximumDate.getTime()) return maximumDate;
        if (minimumDate && today.getTime() < minimumDate.getTime()) return minimumDate;
        return today;
    };

    const openPicker = () => {
        if (Platform.OS === 'android') {
            openAndroidPicker();
            return;
        }
        setIosTemp(initialDate());
        setShow(true);
    };

    /** Validation for the manual-entry fallback only; the native picker enforces bounds itself. */
    const fallbackError = ((): string | null => {
        if (nativeAvailable || !value) return null;
        const parsed = fromIsoDate(value);
        if (!parsed) return 'Enter the date as YYYY-MM-DD, for example 1998-04-23.';
        if (minimumDate && parsed.getTime() < minimumDate.getTime()) {
            return `Enter a date on or after ${minimumDate.toLocaleDateString()}.`;
        }
        if (maximumDate && parsed.getTime() > maximumDate.getTime()) {
            return `Enter a date on or before ${maximumDate.toLocaleDateString()}.`;
        }
        return null;
    })();

    return (
        <View>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                {label}
            </Text>

            {nativeAvailable ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${label}. ${current ? display : 'No date selected'}. Double tap to choose a date.`}
                    onPress={openPicker}
                    style={{
                        minHeight: 52,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: error ? '#B5303C' : colors.border,
                        backgroundColor: colors.surface,
                        paddingHorizontal: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: helperText ? 4 : 18,
                    }}
                >
                    <Text style={{ color: current ? colors.textPrimary : colors.textMuted, fontSize: 15 }}>{display}</Text>
                    <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                </Pressable>
            ) : (
                // Fallback (native module not in this build): manual entry, no crash.
                <>
                    <TextInput
                        accessibilityLabel={`${label}. Enter the date as year, month, day.`}
                        value={value}
                        onChangeText={onChange}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="numbers-and-punctuation"
                        maxLength={10}
                        style={{
                            minHeight: 52,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: error || fallbackError ? '#B5303C' : colors.border,
                            backgroundColor: colors.surface,
                            paddingHorizontal: 14,
                            color: colors.textPrimary,
                            marginBottom: fallbackError || helperText ? 4 : 18,
                        }}
                    />
                    {/*
                      Without this the fallback accepted anything at all — "31/02/90", a date
                      centuries out of range — and the form only found out when the submission was
                      rejected. The bounds enforced here are the same ones the native picker
                      applies, so the two paths behave alike.
                    */}
                    {fallbackError ? (
                        <Text style={{ color: '#B5303C', fontSize: 12, marginBottom: 14 }}>{fallbackError}</Text>
                    ) : null}
                </>
            )}

            {helperText ? (
                <Text style={{ color: error ? '#B5303C' : colors.textMuted, fontSize: 12, marginBottom: 14 }}>{helperText}</Text>
            ) : null}

            {/* iOS: spinner inside a modal with a confirm action */}
            {show && nativeAvailable && Platform.OS === 'ios' && (
                <Modal transparent animationType="slide" visible onRequestClose={() => setShow(false)}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 24 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
                                <Pressable onPress={() => setShow(false)}>
                                    <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancel</Text>
                                </Pressable>
                                <Pressable onPress={() => { if (iosTemp) onChange(toIsoDate(iosTemp)); setShow(false); }}>
                                    <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '700' }}>Done</Text>
                                </Pressable>
                            </View>
                            {/* `iosTemp` is state, so this is a stable object across renders —
                                the same requirement that broke Android when it was `new Date()`. */}
                            <NativeDateTimePicker
                                value={iosTemp ?? new Date(stableFallbackTime)}
                                mode="date"
                                display="spinner"
                                minimumDate={minimumDate}
                                maximumDate={maximumDate}
                                onChange={(_e: DateTimePickerEvent, selected?: Date) => selected && setIosTemp(selected)}
                            />
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};
