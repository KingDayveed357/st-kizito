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
}

/**
 * Reusable keyboard-friendly form scroll container built ONLY from React Native primitives.
 *
 * The real Android fix is `softwareKeyboardLayoutMode: "resize"` in app.json (was "pan", which
 * pushed the whole window up and hid fields/buttons). With resize, the window shrinks and RN
 * auto-scrolls the focused input into the smaller viewport. This component then guarantees the
 * submit button/last field are reachable above the keyboard and standardizes the behavior so no
 * screen has to re-solve it.
 */
export const KeyboardAwareForm = React.forwardRef<ScrollView, KeyboardAwareFormProps>(
    ({ children, contentContainerStyle, extraBottomInset = 32, ...scrollViewProps }, ref) => {
        const insets = useSafeAreaInsets();

        return (
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    ref={ref}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    automaticallyAdjustKeyboardInsets
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
