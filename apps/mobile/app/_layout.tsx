import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { seedDatabaseIfNeeded } from '../src/services/offline/seed';
import { initSyncManager } from '../src/services/sync/syncManager';
import { configureNotificationHandler } from '../src/services/notifications/notificationService';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../src/hooks/useTheme';
import '../global.css';

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default function RootLayout() {
    const [appIsReady, setAppIsReady] = useState(false);
    const { colors, isDark } = useTheme();

    useEffect(() => {
        configureNotificationHandler();
    }, []);

    useEffect(() => {
        async function prepare() {
            try {
                await seedDatabaseIfNeeded();
            } catch (e) {
                console.warn(e);
            } finally {
                setAppIsReady(true);
                await SplashScreen.hideAsync();
            }
        }
        prepare();
    }, []);

    useEffect(() => {
        const cleanup = initSyncManager();
        return cleanup;
    }, []);

    if (!appIsReady) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
            <QueryClientProvider client={queryClient}>
                <StatusBar style={isDark ? 'light' : 'dark'} translucent={false} backgroundColor={colors.background} />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: colors.background },
                    }}
                />
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
