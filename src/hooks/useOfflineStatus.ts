import { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { checkInternetConnection } from '../services/network/connectivity';

let currentIsOffline = false;
const listeners = new Set<(value: boolean) => void>();
let monitoringStarted = false;
let intervalId: ReturnType<typeof setInterval> | null = null;
let appStateSub: { remove: () => void } | null = null;
let refreshInFlight: Promise<void> | null = null;

const emit = (value: boolean) => {
    currentIsOffline = value;
    listeners.forEach((listener) => {
        listener(value);
    });
};

export const reportNetworkSuccess = () => {
    emit(false);
};

const refreshStatus = async () => {
    if (refreshInFlight) {
        return refreshInFlight;
    }

    refreshInFlight = (async () => {
        const isOnline = await checkInternetConnection();
        emit(!isOnline);
    })().finally(() => {
        refreshInFlight = null;
    });

    return refreshInFlight;
};

const ensureMonitoring = () => {
    if (monitoringStarted) return;
    monitoringStarted = true;

    refreshStatus();
    intervalId = setInterval(() => {
        refreshStatus();
    }, 15000);
    appStateSub = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
            refreshStatus();
        }
    });
};

const teardownMonitoring = () => {
    if (listeners.size > 0) return;
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    if (appStateSub) {
        appStateSub.remove();
        appStateSub = null;
    }
    monitoringStarted = false;
};

export const useOfflineStatus = () => {
    const [isOffline, setIsOffline] = useState(currentIsOffline);

    useEffect(() => {
        listeners.add(setIsOffline);
        ensureMonitoring();

        return () => {
            listeners.delete(setIsOffline);
            teardownMonitoring();
        };
    }, []);

    return { isOffline };
};
