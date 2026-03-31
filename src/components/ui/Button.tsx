import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onPress: () => void;
    children: React.ReactNode;
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    onPress,
    children,
    className = '',
}) => {
    const { colors } = useTheme();

    const getContainerStyles = (): ViewStyle => {
        switch (variant) {
            case 'primary': return { backgroundColor: colors.accent };
            case 'secondary': return { backgroundColor: colors.surfaceElevated };
            case 'outline': return { borderWidth: 1, borderColor: colors.accent, backgroundColor: 'transparent' };
            case 'ghost': return { backgroundColor: 'transparent' };
        }
    };

    const getTextStyles = (): TextStyle => {
        switch (variant) {
            case 'primary': return { color: '#FFFFFF' };
            case 'secondary': return { color: colors.textPrimary };
            case 'outline': return { color: colors.accent };
            case 'ghost': return { color: colors.accent };
        }
    };

    const heightClass = size === 'sm' ? 'h-10' : size === 'lg' ? 'h-14' : 'h-12';
    const paddingClass = size === 'sm' ? 'px-4' : size === 'lg' ? 'px-8' : 'px-6';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                getContainerStyles(),
                { opacity: disabled ? 0.6 : 1 }
            ]}
            className={`rounded-button flex-row items-center justify-center ${heightClass} ${paddingClass} ${className}`}
        >
            {loading ? (
                <ActivityIndicator color={getTextStyles().color?.toString()} />
            ) : (
                <>
                    {leftIcon && <React.Fragment>{leftIcon}</React.Fragment>}
                    <Text style={getTextStyles()} className="font-sans font-medium text-base mx-2">
                        {children}
                    </Text>
                    {rightIcon && <React.Fragment>{rightIcon}</React.Fragment>}
                </>
            )}
        </TouchableOpacity>
    );
};