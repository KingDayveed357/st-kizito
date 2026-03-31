import { AppState, AppStateStatus } from 'react-native';
import { getDb } from '../offline/database';
// import NetInfo from '@react-native-community/netinfo';
import { useAppStore } from '../../store/useAppStore';

let isSyncing = false;

const startSync = async () => {
    if (isSyncing) return;

    // const netInfo = await NetInfo.fetch();
    // if (!netInfo.isConnected) return;

    isSyncing = true;
    console.log('[Sync] Starting background sync...');

    try {
        const db = await getDb();
        const now = Date.now();

        // Stub:
        // 1. Fetch from API
        // const response = await apiClient.get('/readings/sync', { params: { window: 30 } });
        // 2. Upsert to DB
        // await db.execAsync(...)

        useAppStore.getState().setLastSyncTime(now);
        console.log('[Sync] Sync complete.');
    } catch (err) {
        console.error('[Sync] Sync failed:', err);
    } finally {
        isSyncing = false;
    }
};

export const initSyncManager = () => {
    let appState = AppState.currentState;

    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (appState.match(/inactive|background/) && nextAppState === 'active') {
            startSync();
        }
        appState = nextAppState;
    });

    // initial sync on launch
    startSync();
};