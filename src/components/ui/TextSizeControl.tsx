import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useThemeStore } from '../../store/useThemeStore';

interface TextSizeControlProps {
    onIncrease?: () => void;
    onDecrease?: () => void;
    min?: number;
    max?: number;
    step?: number;
}

export const TextSizeControl: React.FC<TextSizeControlProps> = ({
    onDecrease,
    onIncrease,
    min = 0.8,
    max = 1.4,
    step = 0.1,
}) => {
    const { colors } = useTheme();
    const { textScale, setTextScale } = useThemeStore();

    const canDecrease = textScale > min;
    const canIncrease = textScale < max;

    const handleDecrease = () => {
        if (onDecrease) {
            onDecrease();
            return;
        }

        setTextScale(Math.max(min, Number((textScale - step).toFixed(2))));
    };

    const handleIncrease = () => {
        if (onIncrease) {
            onIncrease();
            return;
        }

        setTextScale(Math.min(max, Number((textScale + step).toFixed(2))));
    };

    return (
        <View
            style={[styles.shell, { backgroundColor: colors.surfaceElevated }]}
            className="rounded-full"
        >
            <TouchableOpacity
                accessibilityLabel="Decrease text size"
                accessibilityRole="button"
                accessibilityState={{ disabled: !canDecrease }}
                activeOpacity={0.8}
                disabled={!canDecrease}
                onPress={handleDecrease}
                style={styles.button}
            >
                <Text
                    style={{ color: canDecrease ? colors.textPrimary : colors.textMuted }}
                    className="font-sans text-[14px] font-bold"
                >
                    A-
                </Text>
            </TouchableOpacity>

            {/* <View style={styles.scalePill}>
                <Text style={{ color: colors.textSecondary }} className="font-sans text-[11px] font-bold uppercase tracking-[1.4px]">
                    
                </Text>
            </View> */}

            <TouchableOpacity
                accessibilityLabel="Increase text size"
                accessibilityRole="button"
                accessibilityState={{ disabled: !canIncrease }}
                activeOpacity={0.8}
                disabled={!canIncrease}
                onPress={handleIncrease}
                style={styles.button}
            >
                <Text
                    style={{ color: canIncrease ? colors.textPrimary : colors.textMuted }}
                    className="font-sans text-[16px] font-bold"
                >
                    A+
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        minWidth: 52,
        paddingHorizontal: 10,
    },
    scalePill: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,
        paddingHorizontal: 8,
    },
    shell: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
});
