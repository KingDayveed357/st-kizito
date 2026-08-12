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

/** How often to re-check connectivity while the app is in the foreground. */
const POLL_INTERVAL_MS = 15000;

const startPolling = () => {
    if (intervalId) return;
    intervalId = setInterval(() => {
        refreshStatus();
    }, POLL_INTERVAL_MS);
};

const stopPolling = () => {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
};

const ensureMonitoring = () => {
    if (monitoringStarted) return;
    monitoringStarted = true;

    refreshStatus();
    startPolling();

    appStateSub = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
            // Coming back to the foreground is the moment the answer is most likely to have
            // changed, so check immediately rather than waiting out the interval.
            refreshStatus();
            startPolling();
            return;
        }

        // Backgrounded: stop polling.
        //
        // The interval previously kept running while the app was in the background, firing a
        // network request every 15 seconds until the OS froze the process. On Android that is real
        // battery and — for parishioners on metered data — real money, spent answering a question
        // nobody is on screen to see the answer to.
        stopPolling();
    });
};

const teardownMonitoring = () => {
    if (listeners.size > 0) return;
    stopPolling();
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
