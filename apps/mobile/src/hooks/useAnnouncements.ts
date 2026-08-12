import React, { useState, useEffect, useCallback, useRef } from 'react';
import { parishService } from '../services/api/parishService';
import { withDb, withDbWriteTransaction } from '../services/offline/database';
import { reportNetworkSuccess } from './useOfflineStatus';
import { buildExcerpt, normalizeTitle } from '../utils/parishContent';

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
            
            /*
             * Raw row → display model.
             *
             * This used to hand the card `excerpt: row.content` (the ENTIRE body) and a
             * pre-uppercased "JUL 27", then hardcode `pinned: false` and an author. The card had no
             * way to lay anything out sensibly: it received one undifferentiated blob of shouted
             * text and a string that was already a design decision.
             *
             * The mapping now keeps the raw values (`publishedAt`, `type`) so the card can decide
             * how to present them, and normalises the admin's ALL-CAPS input once, here, rather
             * than in every component that renders it.
             */
            const formatted = result.map((row: any) => {
                const title = normalizeTitle(row.title);
                return {
                    id: row.id,
                    title,
                    // Drops the title where the admin repeated it as the body's first line.
                    excerpt: buildExcerpt(row.content, row.title),
                    // ISO, not a formatted string: the card formats for its own context.
                    publishedAt: row.created_at ?? null,
                    // `type` exists in the schema ('liturgical' | 'parish') and was simply discarded.
                    type: row.type === 'liturgical' ? 'liturgical' : 'parish',
                    author: 'Parish Office',
                    authorInitials: 'PO',
                };
            });
            
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
