import { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { seedDatabaseIfNeeded } from '../src/services/offline/seed';
import { initSyncManager } from '../src/services/sync/syncManager';
import { configureNotificationHandler } from '../src/services/notifications/notificationService';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../src/hooks/useTheme';
import { useDailyRefresh } from '../src/hooks/useDailyRefresh';
import { ReadingModeProvider } from '../src/components/reading/ReadingModeProvider';
import { ToastProvider } from '../src/components/ui/ToastProvider';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';
import { WelcomeGuide } from '../src/components/onboarding/WelcomeGuide';
import { useOnboardingStore } from '../src/store/useOnboardingStore';
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => {
    // Native splash might already be hidden in dev reloads.
});

const DEV_SPLASH_MIN_DURATION_MS = 1200;

const queryClient = new QueryClient();

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);
    const { colors, isDark } = useTheme();

    // Show the welcome guide once after install, or whenever the user replays it from Settings.
    // Gated on `hasHydrated` so a returning parishioner never sees it flash while AsyncStorage loads.
    const hasSeenGuide = useOnboardingStore((state) => state.hasSeenGuide);
    const isReplaying = useOnboardingStore((state) => state.isReplaying);
    const guideHydrated = useOnboardingStore((state) => state.hasHydrated);
    const completeGuide = useOnboardingStore((state) => state.completeGuide);
    const showGuide = guideHydrated && (isReplaying || !hasSeenGuide);

    // Keep readings/office on today's date across cold launches and day rollovers (#9).
    useDailyRefresh();

    const onLayoutRootView = useCallback(async () => {
        if (!appIsReady) {
            return;
        }

        await SplashScreen.hideAsync().catch(() => {
            // Ignore repeated hide calls in fast refresh and dev reloads.
        });
    }, [appIsReady]);

    useEffect(() => {
        configureNotificationHandler();
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function prepare() {
            try {
                await seedDatabaseIfNeeded();

                // Keep native splash visible a bit longer in development for visual QA.
                if (__DEV__) {
                    await new Promise((resolve) => setTimeout(resolve, DEV_SPLASH_MIN_DURATION_MS));
                }
            } catch (e) {
                console.warn(e);
            } finally {
                if (isMounted) {
                    setAppIsReady(true);
                }
            }
        }
        prepare();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const cleanup = initSyncManager();
        return cleanup;
    }, []);

    if (!appIsReady) {
        return null;
    }

    return (
        <GestureHandlerRootView onLayout={onLayoutRootView} style={{ flex: 1, backgroundColor: colors.background }}>
            {/*
              SafeAreaProvider was missing entirely. `useSafeAreaInsets()` still returned values
              inside the tab navigator (react-navigation mounts its own compatibility provider), but
              anything rendered here at the root — the toast layer, the welcome guide — saw zeroes
              and sat under the Android gesture bar. Declaring it once at the root makes insets
              correct everywhere, including outside a navigator.
            */}
            <SafeAreaProvider>
                <QueryClientProvider client={queryClient}>
                    <ReadingModeProvider>
                        {/* Inside ReadingModeProvider: the toast tracks the tab bar as it animates. */}
                        <ToastProvider>
                            <StatusBar style={isDark ? 'light' : 'dark'} translucent={false} backgroundColor={colors.background} />
                            <ErrorBoundary>
                                <Stack
                                    screenOptions={{
                                        headerShown: false,
                                        contentStyle: { backgroundColor: colors.background },
                                    }}
                                />
                                <WelcomeGuide visible={showGuide} onFinish={completeGuide} />
                            </ErrorBoundary>
                        </ToastProvider>
                    </ReadingModeProvider>
                </QueryClientProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
