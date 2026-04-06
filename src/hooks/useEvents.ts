import React, { useState, useEffect, useCallback, useRef } from 'react';
import { parishService } from '../services/api/parishService';
import { withDb, withDbWriteTransaction } from '../services/offline/database';
import { reportNetworkSuccess } from './useOfflineStatus';

export const useEvents = () => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchLocal = useCallback(async () => {
        try {
            const result = await withDb(
                (db) => db.getAllAsync('SELECT * FROM events_cache ORDER BY start_date ASC'),
                'Load events cache'
            );
            
            const formatted = result.map((row: any) => {
                const dateObj = new Date(row.start_date);
                return {
                    id: row.id,
                    title: row.title,
                    day: dateObj.getDate().toString(),
                    month: dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
                    time: 'All Day', // Schema currently lacks time
                    location: row.location,
                    description: row.description || '',
                };
            });
            
            if (isMounted.current) setData(formatted);
        } catch (error) {
            console.error('Failed to load local events:', error);
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, []);

    const fetchRemote = useCallback(async () => {
        try {
            const { data: remoteData, error } = await parishService.fetchEvents();
            if (error || !remoteData) return;
            reportNetworkSuccess();

            await withDbWriteTransaction(async (db) => {
                await db.runAsync('DELETE FROM events_cache');
                for (const item of remoteData) {
                    await db.runAsync(
                        'INSERT INTO events_cache (id, title, description, start_date, end_date, location, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        item.id,
                        item.title,
                        item.description ?? '',
                        item.start_date,
                        item.end_date ?? null,
                        item.location ?? null,
                        Date.now()
                    );
                }
            }, 'Sync events cache');

            if (isMounted.current) await fetchLocal();
        } catch (error) {
            console.error('Failed to sync events:', error);
        }
    }, [fetchLocal]);

    useEffect(() => {
        fetchLocal().then(() => {
            if (isMounted.current) fetchRemote();
        });
    }, [fetchLocal, fetchRemote]);

    return { data, isLoading, refetch: fetchRemote };
};
