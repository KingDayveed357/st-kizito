import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { BookingStatus } from '../../types/booking.types';
import { Button } from './Button';

interface StatusModalProps {
    visible: boolean;
    status: BookingStatus;
    title: string;
    message?: string;
    onClose: () => void;
    actionLabel?: string;
    onAction?: () => void;
}

const DEFAULT_PENDING_MESSAGE = 'Thank you. Your request has been submitted and is awaiting verification by the parish office.';

const getStatusColors = (
    status: BookingStatus,
    colors: ReturnType<typeof useTheme>['colors'],
    allColors: ReturnType<typeof useTheme>['allColors']
) => {
    if (status === 'approved') {
        return {
            tint: allColors.success,
            soft: `${allColors.success}1A`,
            icon: 'checkmark-circle-outline' as const,
        };
    }

    if (status === 'rejected') {
        return {
            tint: '#A95555',
            soft: '#A9555515',
            icon: 'close-circle-outline' as const,
        };
    }

    return {
        tint: allColors.warning,
        soft: `${allColors.warning}18`,
        icon: 'time-outline' as const,
    };
};

export const StatusModal: React.FC<StatusModalProps> = ({
    visible,
    status,
    title,
    message,
    onClose,
    actionLabel = 'Done',
    onAction,
}) => {
    const { colors, allColors } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(16)).current;

    useEffect(() => {
        if (!visible) {
            fadeAnim.setValue(0);
            slideAnim.setValue(16);
            return;
        }

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 260,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, visible]);

    const tone = getStatusColors(status, colors, allColors);

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <Animated.View
                style={{
                    flex: 1,
                    backgroundColor: colors.overlay,
                    opacity: fadeAnim,
                    justifyContent: 'center',
                    paddingHorizontal: 24,
                }}
            >
                <Pressable style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} onPress={onClose} />
                <Animated.View
                    style={{
                        transform: [{ translateY: slideAnim }],
                        borderRadius: 24,
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 24,
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.12,
                        shadowRadius: 18,
                        elevation: 6,
                    }}
                >
                    <View
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: tone.soft,
                            marginBottom: 14,
                        }}
                    >
                        <Ionicons name={tone.icon} size={26} color={tone.tint} />
                    </View>

                    <Text style={{ color: colors.textPrimary, fontSize: 22, lineHeight: 30, marginBottom: 10 }} className="font-serif font-bold">
                        {title}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: 20 }} className="font-sans">
                        {message?.trim() || DEFAULT_PENDING_MESSAGE}
                    </Text>

                    <Button onPress={onAction ?? onClose}>{actionLabel}</Button>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};
