import React, { useState, useEffect, useCallback, useRef } from 'react';
import { parishService } from '../services/api/parishService';
import { withDb, withDbWriteTransaction } from '../services/offline/database';
import { reportNetworkSuccess } from './useOfflineStatus';
import { buildExcerpt, normalizeTitle } from '../utils/parishContent';

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
            
            /*
             * Raw row → display model.
             *
             * Previously this pre-formatted a day/month pair, uppercased the month, and hardcoded
             * `time: 'All Day'` — presented to the user as though it were real information when the
             * schema simply has no time column. A card cannot distinguish "all day" from "we don't
             * know" if the hook has already invented an answer.
             *
             * Dates now stay ISO so the card formats them in context, and a missing end date or
             * location is `null` rather than a fabricated value.
             */
            const formatted = result.map((row: any) => ({
                id: row.id,
                title: normalizeTitle(row.title),
                startDate: row.start_date ?? null,
                endDate: row.end_date ?? null,
                location: row.location ? normalizeTitle(row.location) : null,
                description: buildExcerpt(row.description, row.title),
            }));
            
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
