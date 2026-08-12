/**
 * Mass-booking business rules (client-side source of truth).
 *
 * Product rules (from the parish requirements):
 *  - A Mass intention may span a RANGE of days (schema `bookings.start_date`..`end_date`).
 *  - ₦500 per Mass, per day is the MINIMUM offering. A parishioner may offer more.
 *  - A single booking may not exceed one month (capped here at 31 days, inclusive).
 *
 * These are pure functions with no I/O so they can be unit-tested and reused by both the booking
 * form (live validation + amount preview) and the payment step (final amount). Keep all money/day
 * logic here — never re-derive it inline in a screen.
 *
 * IMPORTANT — these functions are a user-experience convenience, NOT a control. The authority is
 * the database: `validate_booking_amount()` in apps/web/db/2026_08_security_hardening.sql rejects
 * an under-minimum or over-ceiling amount regardless of what any client sends. The limits below are
 * defaults; the live values come from the `parish_settings` table via `useParishSettings`, so the
 * parish can change the minimum without shipping a new build.
 */

/** Fallback minimum offering per Mass, per day, in Naira. Mirrors `mass_booking_min_per_day`. */
export const DEFAULT_MIN_AMOUNT_PER_MASS_PER_DAY = 500;

/** Fallback maximum booking span, inclusive of both start and end day. `mass_booking_max_days`. */
export const DEFAULT_MAX_BOOKING_DAYS = 31;

/** Fallback absolute ceiling on a single booking or donation. `payment_amount_ceiling`. */
export const DEFAULT_PAYMENT_AMOUNT_CEILING = 5_000_000;

/**
 * Retained under their original names so existing call sites and tests keep working. New code
 * should prefer the `limits` argument, sourced from `useParishSettings()`.
 */
export const MIN_AMOUNT_PER_MASS_PER_DAY = DEFAULT_MIN_AMOUNT_PER_MASS_PER_DAY;
export const MAX_BOOKING_DAYS = DEFAULT_MAX_BOOKING_DAYS;

export interface BookingLimits {
    minPerDay: number;
    maxDays: number;
    ceiling: number;
}

export const DEFAULT_BOOKING_LIMITS: BookingLimits = {
    minPerDay: DEFAULT_MIN_AMOUNT_PER_MASS_PER_DAY,
    maxDays: DEFAULT_MAX_BOOKING_DAYS,
    ceiling: DEFAULT_PAYMENT_AMOUNT_CEILING,
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse an ISO `YYYY-MM-DD` to a UTC-noon Date (noon avoids DST/timezone day-shifts). */
const parseIsoDay = (iso: string): Date | null => {
    if (!ISO_DATE.test(iso)) return null;
    const d = new Date(`${iso}T12:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Today's date as `YYYY-MM-DD` (local), for min-date checks. */
export const todayIso = (): string => new Date().toISOString().slice(0, 10);

/**
 * Inclusive day count between two ISO dates. `2026-01-10 .. 2026-01-10` = 1 day;
 * `2026-01-10 .. 2026-01-12` = 3 days. Returns 0 for invalid or reversed ranges.
 */
export const countBookingDays = (startIso: string, endIso: string): number => {
    const start = parseIsoDay(startIso);
    const end = parseIsoDay(endIso);
    if (!start || !end) return 0;
    const diff = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
    if (diff < 0) return 0;
    return diff + 1;
};

/**
 * Minimum offering (₦) for a booking spanning `startIso..endIso` inclusive:
 * `days × minPerDay`. Returns 0 for an invalid range.
 */
export const getMinimumBookingAmount = (
    startIso: string,
    endIso: string,
    minPerDay: number = DEFAULT_MIN_AMOUNT_PER_MASS_PER_DAY,
): number => countBookingDays(startIso, endIso) * minPerDay;

export interface BookingRangeValidation {
    valid: boolean;
    /** Inclusive day count (0 when invalid). */
    days: number;
    /** Minimum required offering in ₦ (0 when invalid). */
    minimumAmount: number;
    /** Human-readable reason when `valid` is false. */
    error?: string;
}

/**
 * Validate a booking date range against the business rules. `minStartIso` defaults to today —
 * bookings cannot start in the past.
 */
export const validateBookingRange = (
    startIso: string,
    endIso: string,
    minStartIso: string = todayIso(),
    limits: BookingLimits = DEFAULT_BOOKING_LIMITS,
): BookingRangeValidation => {
    const start = parseIsoDay(startIso);
    const end = parseIsoDay(endIso);
    const invalid = (error: string): BookingRangeValidation => ({
        valid: false,
        days: 0,
        minimumAmount: 0,
        error,
    });

    if (!start) return invalid('Enter a valid start date.');
    if (!end) return invalid('Enter a valid end date.');

    const min = parseIsoDay(minStartIso);
    if (min && start.getTime() < min.getTime()) {
        return invalid('The start date cannot be in the past.');
    }

    if (end.getTime() < start.getTime()) {
        return invalid('The end date must be on or after the start date.');
    }

    const days = countBookingDays(startIso, endIso);
    if (days > limits.maxDays) {
        return invalid(`A booking can cover at most one month (${limits.maxDays} days).`);
    }

    return {
        valid: true,
        days,
        minimumAmount: days * limits.minPerDay,
    };
};

/** Format naira for display. Kept here so the form, payment step and receipts agree. */
export const formatNaira = (amount: number): string => `₦${Math.round(amount).toLocaleString('en-NG')}`;

/**
 * Turn what the user typed into a number of naira.
 *
 * Accepts the grouping separators and currency symbol people naturally type ("₦2,000", "2 000")
 * and rejects anything else. Offerings are whole naira — kobo are not collected — so a decimal
 * part is truncated rather than silently rounded up into a larger offering than intended.
 * Returns `null` when the input cannot be read as a number at all.
 */
export const parseAmountInput = (raw: string): number | null => {
    const cleaned = raw.replace(/[₦,\s]/g, '');
    if (cleaned === '') return null;
    if (!/^\d*\.?\d*$/.test(cleaned)) return null;
    const value = Number(cleaned);
    if (!Number.isFinite(value)) return null;
    return Math.floor(value);
};

/**
 * Validate the amount the user is offering: at least the computed minimum for the range, and no
 * more than the abuse ceiling. The user MAY offer more (a larger free-will offering) but never less.
 *
 * This deliberately does NOT apply the "start cannot be in the past" rule — that belongs to the
 * form's range validation. Here we only need a well-ordered range to derive the per-day minimum,
 * so the amount check stays independent of the current date (and unit-testable without mocking it).
 */
export const validateOfferedAmount = (
    startIso: string,
    endIso: string,
    offered: number,
    limits: BookingLimits = DEFAULT_BOOKING_LIMITS,
): { valid: boolean; error?: string; minimumAmount: number } => {
    const days = countBookingDays(startIso, endIso);
    if (days === 0) {
        return { valid: false, error: 'Enter a valid booking date range.', minimumAmount: 0 };
    }
    const minimumAmount = days * limits.minPerDay;

    if (!Number.isFinite(offered)) {
        return { valid: false, error: 'Enter the amount you wish to offer.', minimumAmount };
    }
    if (offered < minimumAmount) {
        return {
            valid: false,
            error: `The minimum offering for ${days} day(s) is ${formatNaira(minimumAmount)}.`,
            minimumAmount,
        };
    }
    if (offered > limits.ceiling) {
        return {
            valid: false,
            error: `For an offering above ${formatNaira(limits.ceiling)}, please speak to the parish office.`,
            minimumAmount,
        };
    }
    return { valid: true, minimumAmount };
};
