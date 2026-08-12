import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';

interface ErrorStateProps {
    /** What failed, in the parishioner's terms — never a network or Postgres message. */
    title: string;
    /**
     * What it means for them and what to do next. An error that only says "something went wrong"
     * leaves someone stuck on a screen with no idea whether to wait, retry, or ring the parish.
     */
    subtitle?: string;
    onRetry?: () => void;
    retryLabel?: string;
    /**
     * Set when the cause is a missing connection. Changes the icon and softens the tone: being
     * offline is an expected state in this app, not a fault.
     */
    isOffline?: boolean;
    compact?: boolean;
}

/**
 * The shared error state.
 *
 * Roughly half the app's routes had no error branch at all — a failed fetch left an empty screen
 * that was indistinguishable from "there is nothing here", so a parishioner could not tell whether
 * the parish had published nothing or the request had simply failed. `EmptyState` covers the first
 * case; this covers the second, and always offers a way forward.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
    title,
    subtitle,
    onRetry,
    retryLabel = 'Try again',
    isOffline = false,
    compact = false,
}) => {
    const { colors, allColors } = useTheme();

    return (
        <View
            accessibilityRole="alert"
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 24,
                paddingVertical: compact ? 28 : 56,
            }}
        >
            <View
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isOffline ? `${colors.textMuted}1A` : `${allColors.error}14`,
                    marginBottom: 14,
                }}
            >
                <Ionicons
                    name={isOffline ? 'cloud-offline-outline' : 'alert-circle-outline'}
                    size={26}
                    color={isOffline ? colors.textMuted : allColors.error}
                />
            </View>

            <Text
                style={{ color: colors.textPrimary, textAlign: 'center', marginBottom: 6 }}
                className="font-serif font-bold text-lg"
            >
                {title}
            </Text>

            {subtitle ? (
                <Text
                    style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: onRetry ? 18 : 0 }}
                    className="font-sans text-sm"
                >
                    {subtitle}
                </Text>
            ) : null}

            {onRetry ? (
                <Button onPress={onRetry} variant="outline" size="md">
                    {retryLabel}
                </Button>
            ) : null}
        </View>
    );
};
