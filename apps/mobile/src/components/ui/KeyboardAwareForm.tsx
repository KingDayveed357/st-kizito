import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ScrollViewProps,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAwareFormProps extends Omit<ScrollViewProps, 'contentContainerStyle'> {
    children: React.ReactNode;
    contentContainerStyle?: StyleProp<ViewStyle>;
    /** Extra space below the last field so the submit button always clears the keyboard. */
    extraBottomInset?: number;
    /**
     * iOS only. Height of any fixed chrome above this form (e.g. a `Header`). Without it,
     * `KeyboardAvoidingView` measures from the window top and leaves a gap — or overlaps the last
     * field — on screens that render a header above the form.
     */
    keyboardVerticalOffset?: number;
}

/**
 * The single keyboard-safe form container. Every screen with text input should use this rather than
 * a bare `ScrollView`, so keyboard behaviour is solved once instead of per screen.
 *
 * Platform strategy (deliberately ONE mechanism per platform — using two double-counts the offset):
 *
 *  • **Android** — `softwareKeyboardLayoutMode: "resize"` (app.json) shrinks the window when the
 *    keyboard opens, and React Native scrolls the focused input into the smaller viewport. No
 *    `KeyboardAvoidingView` is needed; wrapping in one with `behavior="padding"` on Android is a
 *    known source of jumpy/clipped layouts.
 *  • **iOS** — `KeyboardAvoidingView` with `behavior="padding"`. `automaticallyAdjustKeyboardInsets`
 *    was previously enabled *as well*, and since both add inset for the keyboard the content was
 *    pushed roughly twice as far as needed (fields over-scrolling, extra dead space under the form).
 *
 * `keyboardShouldPersistTaps="handled"` keeps a single tap on a button working while the keyboard is
 * open — otherwise the first tap only dismisses the keyboard and users must tap submit twice.
 */
export const KeyboardAwareForm = React.forwardRef<ScrollView, KeyboardAwareFormProps>(
    (
        {
            children,
            contentContainerStyle,
            extraBottomInset = 48,
            keyboardVerticalOffset = 0,
            ...scrollViewProps
        },
        ref,
    ) => {
        const insets = useSafeAreaInsets();
        const isIOS = Platform.OS === 'ios';

        return (
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={isIOS ? 'padding' : undefined}
                keyboardVerticalOffset={isIOS ? keyboardVerticalOffset : 0}
            >
                <ScrollView
                    ref={ref}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    {...scrollViewProps}
                    contentContainerStyle={[
                        { paddingBottom: insets.bottom + extraBottomInset },
                        contentContainerStyle,
                    ]}
                >
                    {children}
                </ScrollView>
            </KeyboardAvoidingView>
        );
    },
);

KeyboardAwareForm.displayName = 'KeyboardAwareForm';
