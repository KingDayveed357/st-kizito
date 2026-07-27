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
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    NativeDateTimePicker = require('@react-native-community/datetimepicker').default;
} catch {
    NativeDateTimePicker = null;
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
}) => {
    const { colors } = useTheme();
    const [show, setShow] = useState(false);
    const [iosTemp, setIosTemp] = useState<Date | null>(null);
    const nativeAvailable = !!NativeDateTimePicker;

    const current = fromIsoDate(value);
    const display = current
        ? current.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : placeholder;

    const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
        setShow(false);
        if (event.type === 'set' && selected) onChange(toIsoDate(selected));
    };

    const openPicker = () => {
        setIosTemp(current ?? new Date());
        setShow(true);
    };

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
                <TextInput
                    accessibilityLabel={label}
                    value={value}
                    onChangeText={onChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    style={{
                        minHeight: 52,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: error ? '#B5303C' : colors.border,
                        backgroundColor: colors.surface,
                        paddingHorizontal: 14,
                        color: colors.textPrimary,
                        marginBottom: helperText ? 4 : 18,
                    }}
                />
            )}

            {helperText ? (
                <Text style={{ color: error ? '#B5303C' : colors.textMuted, fontSize: 12, marginBottom: 14 }}>{helperText}</Text>
            ) : null}

            {/* Android: native dialog rendered on demand */}
            {show && nativeAvailable && Platform.OS === 'android' && (
                <NativeDateTimePicker
                    value={current ?? new Date()}
                    mode="date"
                    display="default"
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    onChange={handleAndroidChange}
                />
            )}

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
                            <NativeDateTimePicker
                                value={iosTemp ?? new Date()}
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
