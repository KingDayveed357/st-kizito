import { useMemo } from 'react';
import { parishService } from '../services/api/parishService';
import { useCachedData } from './useCachedData';
import { STORAGE_KEYS } from '../utils/constants';
import {
    DEFAULT_MIN_AMOUNT_PER_MASS_PER_DAY,
    DEFAULT_MAX_BOOKING_DAYS,
    DEFAULT_PAYMENT_AMOUNT_CEILING,
    type BookingLimits,
} from '../utils/bookingRules';

/**
 * Server-owned business rules (`parish_settings`).
 *
 * The Mass-offering minimum used to be a constant compiled into the app, which meant the parish
 * could not change it without shipping a new APK — and, worse, that the database had no idea what
 * the rule was. It now lives in `parish_settings` and is enforced by a Postgres trigger; this hook
 * reads the same row so the amount the form suggests matches the amount the server will accept.
 *
 * Offline-first: `useCachedData` serves the last known values immediately and refreshes in the
 * background, and every getter falls back to the compiled-in default. A parishioner with no network
 * on first launch still gets a working, correct-by-default booking form.
 */

type SettingsRow = { key: string; value: unknown };

const toNumber = (value: unknown, fallback: number): number => {
    // `value` is jsonb: a bare number arrives as a number, but a value entered through the admin
    // UI or SQL editor can arrive as a quoted string.
    const parsed = typeof value === 'number' ? value : Number(String(value ?? '').replace(/"/g, ''));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const useParishSettings = () => {
    const { data, isLoading, refresh } = useCachedData<SettingsRow[]>(
        STORAGE_KEYS.parishSettings,
        async () => {
            const { data: remote, error } = await parishService.fetchParishSettings();
            if (error || !Array.isArray(remote)) {
                throw new Error('Unable to load parish settings');
            }
            return remote as SettingsRow[];
        },
    );

    const limits = useMemo<BookingLimits>(() => {
        const map = new Map((data ?? []).map((row) => [row.key, row.value]));
        return {
            minPerDay: toNumber(map.get('mass_booking_min_per_day'), DEFAULT_MIN_AMOUNT_PER_MASS_PER_DAY),
            maxDays: toNumber(map.get('mass_booking_max_days'), DEFAULT_MAX_BOOKING_DAYS),
            ceiling: toNumber(map.get('payment_amount_ceiling'), DEFAULT_PAYMENT_AMOUNT_CEILING),
        };
    }, [data]);

    return { limits, isLoading, refetch: refresh };
};
