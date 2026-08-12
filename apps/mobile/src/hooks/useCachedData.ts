import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CACHE_STALE_TIME_MS } from '../utils/constants';

type CachedEnvelope<T> = {
    data: T;
    updatedAt: number;
};

const parseCachedEnvelope = <T>(raw: string | null): CachedEnvelope<T> | null => {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as CachedEnvelope<T>;
        if (!parsed || typeof parsed.updatedAt !== 'number' || parsed.data === undefined) {
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

export const useCachedData = <T>(
    key: string,
    fetchFunction: () => Promise<T>,
    staleTime = DEFAULT_CACHE_STALE_TIME_MS
) => {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<number | null>(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const persistCache = useCallback(async (nextData: T) => {
        const payload: CachedEnvelope<T> = {
            data: nextData,
            updatedAt: Date.now(),
        };
        await AsyncStorage.setItem(key, JSON.stringify(payload));
        if (mountedRef.current) {
            setLastUpdated(payload.updatedAt);
        }
    }, [key]);

    const refresh = useCallback(async () => {
        // Guard the synchronous state write with the same mountedRef used for async writes below.
        // Without this, strict-mode double-invoke and rapid navigation unmount the component
        // before the async response arrives, but setIsRefreshing(true) has already fired —
        // producing the "Can't perform a React state update on a component that hasn't mounted" warning.
        if (!mountedRef.current) return null;
        setIsRefreshing(true);
        try {
            const remote = await fetchFunction();
            if (mountedRef.current) {
                setData(remote);
            }
            await persistCache(remote);
            return remote;
        } catch {
            return null;
        } finally {
            if (mountedRef.current) {
                setIsRefreshing(false);
            }
        }
    }, [fetchFunction, persistCache]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const cachedRaw = await AsyncStorage.getItem(key);
                const cached = parseCachedEnvelope<T>(cachedRaw);

                if (cancelled || !mountedRef.current) return;

                if (cached) {
                    setData(cached.data);
                    setLastUpdated(cached.updatedAt);
                }

                const shouldRefresh = !cached || Date.now() - cached.updatedAt > staleTime;
                if (shouldRefresh) {
                    await refresh();
                } else if (!cancelled) {
                    // Silent background refresh to keep data fresh without causing flicker.
                    // The `cancelled` guard prevents a stale effect invocation (strict-mode
                    // double-invoke or dep change) from firing refresh() after cleanup has run.
                    refresh();
                }
            } finally {
                if (!cancelled && mountedRef.current) {
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [key, refresh, staleTime]);

    return useMemo(() => ({
        data,
        isLoading,
        isRefreshing,
        lastUpdated,
        refresh,
    }), [data, isLoading, isRefreshing, lastUpdated, refresh]);
};
