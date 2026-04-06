import { AppState, AppStateStatus } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { syncPendingSubmissions, syncPaymentDetails } from '../offline/syncService';
import { checkInternetConnection } from '../network/connectivity';

let isSyncing = false;

const startSync = async () => {
    if (isSyncing) return;

    const isOnline = await checkInternetConnection();
    if (!isOnline) {
        return;
    }

    isSyncing = true;
    console.log('[Sync] Starting background sync...');

    try {
        await syncPendingSubmissions();
        await syncPaymentDetails(false);

        useAppStore.getState().setLastSyncTime(Date.now());
        console.log('[Sync] Sync complete.');
    } catch (err) {
        console.error('[Sync] Sync failed:', err);
    } finally {
        isSyncing = false;
    }
};

export const initSyncManager = () => {
    let appState = AppState.currentState;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (appState.match(/inactive|background/) && nextAppState === 'active') {
            startSync();
        }
        appState = nextAppState;
    });

    // initial sync on launch
    startSync();

    return () => {
        subscription.remove();
    };
};
