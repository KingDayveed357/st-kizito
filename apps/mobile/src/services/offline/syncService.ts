import { withDb, withDbWriteTransaction } from './database';
import { parishService } from '../api/parishService';
import { BookingStatus } from '../../types/booking.types';

const submissionLocks = new Set<string>();

const getSubmissionKey = (prefix: 'booking' | 'donation', payload: object) =>
    `${prefix}:${JSON.stringify(payload)}`;

const withSubmissionLock = async <T>(key: string, fn: () => Promise<T>) => {
    if (submissionLocks.has(key)) {
        return { duplicateBlocked: true } as T;
    }

    submissionLocks.add(key);
    try {
        return await fn();
    } finally {
        setTimeout(() => submissionLocks.delete(key), 3000);
    }
};

/**
 * Flush all pending bookings and donations from the local SQLite
 * queue to Supabase. Should be called whenever the app comes online.
 */
export const syncPendingSubmissions = async () => {
    // Flush pending bookings.
    const pendingBookings = await withDb(
        (db) => db.getAllAsync('SELECT * FROM pending_bookings ORDER BY created_at ASC'),
        'Load pending bookings'
    );

    for (const row of pendingBookings as any[]) {
        try {
            const data = JSON.parse(row.data_json);
            const { error } = await parishService.submitBooking(data);

            if (!error) {
                await withDb(
                    (db) => db.runAsync('DELETE FROM pending_bookings WHERE local_id = ?', row.local_id),
                    'Delete synced booking queue item'
                );
                console.log(`[Sync] Synced booking ${row.local_id}`);
            } else {
                console.warn(`[Sync] Booking ${row.local_id} failed:`, error.message);
            }
        } catch (e) {
            console.error(`[Sync] Error syncing booking ${row.local_id}:`, e);
        }
    }

    // Flush pending donations.
    const pendingDonations = await withDb(
        (db) => db.getAllAsync('SELECT * FROM pending_donations ORDER BY created_at ASC'),
        'Load pending donations'
    );

    for (const row of pendingDonations as any[]) {
        try {
            const data = JSON.parse(row.data_json);
            const { error } = await parishService.submitDonation(data);

            if (!error) {
                await withDb(
                    (db) => db.runAsync('DELETE FROM pending_donations WHERE local_id = ?', row.local_id),
                    'Delete synced donation queue item'
                );
                console.log(`[Sync] Synced donation ${row.local_id}`);
            } else {
                console.warn(`[Sync] Donation ${row.local_id} failed:`, error.message);
            }
        } catch (e) {
            console.error(`[Sync] Error syncing donation ${row.local_id}:`, e);
        }
    }
};

/**
 * Read locally cached parish payment details.
 */
export const getCachedPaymentDetails = async () => {
    return withDb(
        (db) =>
            db.getFirstAsync<{
                id: string;
                bank_name: string | null;
                account_name: string | null;
                account_number: string | null;
                synced_at: number;
            }>('SELECT * FROM payment_details_cache ORDER BY synced_at DESC LIMIT 1'),
        'Load payment details cache'
    );
};

/**
 * Fetch payment details from Supabase and mirror to SQLite cache.
 * Falls back to local cache when offline or remote fetch fails.
 */
export const syncPaymentDetails = async (isOffline: boolean) => {
    if (isOffline) {
        return getCachedPaymentDetails();
    }

    const { data, error } = await parishService.fetchPaymentDetails();
    if (error || !data) {
        console.warn('[Sync] Failed to fetch remote payment details, using cache.', error);
        return getCachedPaymentDetails();
    }

    await withDbWriteTransaction(async (db) => {
        await db.runAsync('DELETE FROM payment_details_cache');
        await db.runAsync(
            'INSERT INTO payment_details_cache (id, bank_name, account_name, account_number, synced_at) VALUES (?, ?, ?, ?, ?)',
            data.id,
            data.bank_name ?? null,
            data.account_name ?? null,
            data.account_number ?? null,
            Date.now()
        );
    }, 'Sync payment details cache');

    return data;
};

/**
 * Submit a booking - goes direct to Supabase if online, or queues locally if offline.
 * @param data Booking payload matching the bookings schema
 * @param isOffline Current network state from useOfflineStatus
 */
export const submitBooking = async (data: object, isOffline: boolean) => {
    const payload = { ...data, status: 'pending' as BookingStatus };
    const lockKey = getSubmissionKey('booking', payload);

    return withSubmissionLock(lockKey, async () => {
        if (!isOffline) {
            return parishService.submitBooking(payload);
        }

        // Queue locally.
        const localId = `booking_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await withDb(
            (db) =>
                db.runAsync(
                    'INSERT INTO pending_bookings (local_id, data_json, created_at) VALUES (?, ?, ?)',
                    localId,
                    JSON.stringify(payload),
                    Date.now()
                ),
            'Queue booking submission'
        );
        return { localId, queued: true };
    });
};

/**
 * Submit a donation - goes direct to Supabase if online, or queues locally if offline.
 * @param data Donation payload matching the donations schema
 * @param isOffline Current network state from useOfflineStatus
 */
export const submitDonation = async (data: object, isOffline: boolean) => {
    const payload = { ...data, status: 'pending' as BookingStatus };
    const lockKey = getSubmissionKey('donation', payload);

    return withSubmissionLock(lockKey, async () => {
        if (!isOffline) {
            return parishService.submitDonation(payload);
        }

        // Queue locally.
        const localId = `donation_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await withDb(
            (db) =>
                db.runAsync(
                    'INSERT INTO pending_donations (local_id, data_json, created_at) VALUES (?, ?, ?)',
                    localId,
                    JSON.stringify(payload),
                    Date.now()
                ),
            'Queue donation submission'
        );
        return { localId, queued: true };
    });
};
