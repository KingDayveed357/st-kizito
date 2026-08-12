import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

/**
 * A render error must never white-screen the app mid-prayer (audit P1-3/NEW-6). This boundary catches
 * uncaught render errors anywhere in the screen tree and shows a calm, recoverable fallback. Kept
 * deliberately dependency-light (plain View, centered — no SafeAreaView/provider reliance) so the
 * fallback itself cannot fail. `componentDidCatch` is the single hook for crash reporting (P0-2).
 */
const ErrorFallback: React.FC<{ onReset: () => void }> = ({ onReset }) => {
    const { colors } = useTheme();
    return (
        <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <View
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${colors.accent}18`,
                    marginBottom: 20,
                }}
            >
                <Ionicons name="alert-circle-outline" size={36} color={colors.accent} />
            </View>
            <Text style={{ color: colors.textPrimary, textAlign: 'center', marginBottom: 10 }} className="font-serif font-bold text-2xl">
                Something went wrong
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 28 }} className="font-sans text-[15px] leading-6">
                We hit an unexpected problem. Your saved readings and prayers are safe — please try again.
            </Text>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Try again"
                onPress={onReset}
                activeOpacity={0.85}
                style={{
                    backgroundColor: colors.accent,
                    paddingHorizontal: 28,
                    height: 50,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Single place to report render crashes. Wire crash reporting (Sentry) here (audit P0-2).
        console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
    }

    reset = () => this.setState({ hasError: false });

    render() {
        if (this.state.hasError) {
            return <ErrorFallback onReset={this.reset} />;
        }
        return this.props.children;
    }
}
