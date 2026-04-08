import React, { useState, useEffect, useCallback, useRef } from 'react';
import { parishService } from '../services/api/parishService';
import { withDb, withDbWriteTransaction } from '../services/offline/database';
import { MassTime } from '../components/parish/MassTimeRow';
import { reportNetworkSuccess } from './useOfflineStatus';

type RawMassTime = {
  id: string;
  day_of_week: string;
  time: string;
  location: string | null;
  type: string | null;
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const appendSlot = (existing: string | null | undefined, nextTime: string) => {
    if (!existing) return nextTime;
    return `${existing}\n${nextTime}`;
};

const normalizeMassTimes = (rows: RawMassTime[]): (MassTime & { id: string })[] => {
    const grouped = new Map<string, MassTime & { id: string }>();

    for (const row of rows) {
        const dayLabel = row.day_of_week ?? 'Unknown';
        const current = grouped.get(dayLabel) ?? {
            id: dayLabel,
            day: dayLabel,
            morning: null,
            evening: null,
            hasSubscript: false,
            isHighlighted: false,
        };

        const normalizedType = (row.type ?? '').toLowerCase();
        const shouldUseEvening = normalizedType.includes('evening') || normalizedType.includes('vigil');
        if (shouldUseEvening) {
            current.evening = appendSlot(current.evening, row.time);
            if (normalizedType.includes('vigil')) {
                current.hasSubscript = true;
            }
        } else {
            current.morning = appendSlot(current.morning, row.time);
        }

        grouped.set(dayLabel, current);
    }

    return Array.from(grouped.values()).sort((a, b) => {
        const aIndex = DAY_ORDER.indexOf(a.day);
        const bIndex = DAY_ORDER.indexOf(b.day);
        const normalizedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
        const normalizedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
        return normalizedA - normalizedB;
    });
};

export const useMassTimes = () => {
    const [data, setData] = useState<(MassTime & { id: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchLocal = useCallback(async () => {
        try {
            const result = await withDb(
                (db) => db.getAllAsync('SELECT * FROM mass_times_cache ORDER BY day_of_week, time'),
                'Load mass times cache'
            );
            if (isMounted.current) setData(normalizeMassTimes(result as RawMassTime[]));
        } catch (error) {
            console.error('Failed to load local mass times:', error);
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, []);

    const fetchRemote = useCallback(async () => {
        try {
            const { data: remoteData, error } = await parishService.fetchMassTimes();
            if (error || !remoteData) return;
            reportNetworkSuccess();

            await withDbWriteTransaction(async (db) => {
                await db.runAsync('DELETE FROM mass_times_cache');
                for (const item of remoteData) {
                    await db.runAsync(
                        'INSERT INTO mass_times_cache (id, day_of_week, time, location, type, synced_at) VALUES (?, ?, ?, ?, ?, ?)',
                        item.id,
                        item.day_of_week,
                        item.time,
                        item.location ?? null,
                        item.type ?? null,
                        Date.now()
                    );
                }
            }, 'Sync mass times cache');

            if (isMounted.current) await fetchLocal();
        } catch (error) {
            console.error('Failed to sync mass times:', error);
        }
    }, [fetchLocal]);

    useEffect(() => {
        fetchLocal().then(() => {
            if (isMounted.current) fetchRemote();
        });
    }, [fetchLocal, fetchRemote]);

    return { data, isLoading, refetch: fetchRemote };
};
