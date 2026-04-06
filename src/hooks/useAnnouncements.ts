import React, { useState, useEffect, useCallback, useRef } from 'react';
import { parishService } from '../services/api/parishService';
import { withDb, withDbWriteTransaction } from '../services/offline/database';
import { reportNetworkSuccess } from './useOfflineStatus';

export const useAnnouncements = () => {
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
                (db) => db.getAllAsync('SELECT * FROM announcements_cache ORDER BY created_at DESC'),
                'Load announcements cache'
            );
            
            const formatted = result.map((row: any) => ({
                id: row.id,
                title: row.title,
                excerpt: row.content, // Using content directly or could substring
                date: new Date(row.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase(),
                pinned: false,
                author: 'Parish Office',
                authorInitials: 'PO',
            }));
            
            if (isMounted.current) setData(formatted);
        } catch (error) {
            console.error('Failed to load local announcements:', error);
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, []);

    const fetchRemote = useCallback(async () => {
        try {
            const { data: remoteData, error } = await parishService.fetchAnnouncements();
            if (error || !remoteData) return;
            reportNetworkSuccess();

            await withDbWriteTransaction(async (db) => {
                await db.runAsync('DELETE FROM announcements_cache');
                for (const item of remoteData) {
                    await db.runAsync(
                        'INSERT INTO announcements_cache (id, title, content, type, published, created_at, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        item.id,
                        item.title,
                        item.content ?? '',
                        item.type ?? null,
                        item.published ? 1 : 0,
                        item.created_at,
                        Date.now()
                    );
                }
            }, 'Sync announcements cache');

            // Refresh UI from local cache
            await fetchLocal();
        } catch (error) {
            console.error('Failed to sync announcements:', error);
        }
    }, [fetchLocal]);

    useEffect(() => {
        fetchLocal().then(() => {
            if (isMounted.current) fetchRemote();
        });
    }, [fetchLocal, fetchRemote]);

    return { data, isLoading, refetch: fetchRemote };
};
