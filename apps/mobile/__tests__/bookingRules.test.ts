import {
    countBookingDays,
    getMinimumBookingAmount,
    validateBookingRange,
    validateOfferedAmount,
    parseAmountInput,
    formatNaira,
    MIN_AMOUNT_PER_MASS_PER_DAY,
    MAX_BOOKING_DAYS,
    DEFAULT_PAYMENT_AMOUNT_CEILING,
    type BookingLimits,
} from '../src/utils/bookingRules';

describe('bookingRules', () => {
    const PAST_MIN = '2026-01-01'; // fixed "today" so tests are deterministic

    describe('countBookingDays', () => {
        it('counts a single day as 1 (inclusive)', () => {
            expect(countBookingDays('2026-01-10', '2026-01-10')).toBe(1);
        });
        it('counts an inclusive range', () => {
            expect(countBookingDays('2026-01-10', '2026-01-12')).toBe(3);
        });
        it('spans month boundaries correctly', () => {
            expect(countBookingDays('2026-01-31', '2026-02-02')).toBe(3);
        });
        it('returns 0 for a reversed range', () => {
            expect(countBookingDays('2026-01-12', '2026-01-10')).toBe(0);
        });
        it('returns 0 for malformed input', () => {
            expect(countBookingDays('not-a-date', '2026-01-10')).toBe(0);
        });
    });

    describe('getMinimumBookingAmount', () => {
        it('is ₦500 for one day', () => {
            expect(getMinimumBookingAmount('2026-01-10', '2026-01-10')).toBe(500);
        });
        it('scales at ₦500 per day', () => {
            expect(getMinimumBookingAmount('2026-01-10', '2026-01-12')).toBe(1500);
            expect(getMinimumBookingAmount('2026-01-10', '2026-01-12')).toBe(3 * MIN_AMOUNT_PER_MASS_PER_DAY);
        });
    });

    describe('validateBookingRange', () => {
        it('accepts a valid single-day booking', () => {
            const r = validateBookingRange('2026-06-10', '2026-06-10', PAST_MIN);
            expect(r.valid).toBe(true);
            expect(r.days).toBe(1);
            expect(r.minimumAmount).toBe(500);
        });
        it('accepts exactly one month (31 days)', () => {
            const r = validateBookingRange('2026-03-01', '2026-03-31', PAST_MIN);
            expect(r.days).toBe(31);
            expect(r.valid).toBe(true);
        });
        it('rejects more than one month (32 days)', () => {
            const r = validateBookingRange('2026-03-01', '2026-04-01', PAST_MIN);
            expect(r.valid).toBe(false);
            expect(r.days).toBe(0);
            expect(r.error).toMatch(/at most one month/i);
        });
        it('rejects an end date before the start date', () => {
            const r = validateBookingRange('2026-06-10', '2026-06-09', PAST_MIN);
            expect(r.valid).toBe(false);
            expect(r.error).toMatch(/on or after/i);
        });
        it('rejects a start date in the past', () => {
            const r = validateBookingRange('2025-12-31', '2026-01-02', PAST_MIN);
            expect(r.valid).toBe(false);
            expect(r.error).toMatch(/past/i);
        });
        it('rejects malformed dates', () => {
            expect(validateBookingRange('', '2026-01-02', PAST_MIN).valid).toBe(false);
            expect(validateBookingRange('2026-01-02', 'xx', PAST_MIN).valid).toBe(false);
        });
        it('MAX_BOOKING_DAYS is 31', () => {
            expect(MAX_BOOKING_DAYS).toBe(31);
        });
    });

    describe('validateOfferedAmount', () => {
        it('accepts an amount at the minimum', () => {
            expect(validateOfferedAmount('2026-06-10', '2026-06-12', 1500).valid).toBe(true);
        });
        it('accepts an amount above the minimum (larger offering)', () => {
            expect(validateOfferedAmount('2026-06-10', '2026-06-12', 5000).valid).toBe(true);
        });
        it('rejects an amount below the minimum', () => {
            const r = validateOfferedAmount('2026-06-10', '2026-06-12', 1000);
            expect(r.valid).toBe(false);
            expect(r.minimumAmount).toBe(1500);
            expect(r.error).toMatch(/minimum offering/i);
        });
        it('rejects when the range itself is invalid', () => {
            expect(validateOfferedAmount('2026-06-12', '2026-06-10', 5000).valid).toBe(false);
        });

        // The abuse ceiling exists so a typo (or a script) cannot record a ₦900,000,000 offering.
        // The same bound is enforced by `validate_booking_amount()` in Postgres.
        it('rejects an amount above the ceiling', () => {
            const r = validateOfferedAmount('2026-06-10', '2026-06-10', DEFAULT_PAYMENT_AMOUNT_CEILING + 1);
            expect(r.valid).toBe(false);
            expect(r.error).toMatch(/parish office/i);
        });

        it('accepts an amount exactly at the ceiling', () => {
            expect(
                validateOfferedAmount('2026-06-10', '2026-06-10', DEFAULT_PAYMENT_AMOUNT_CEILING).valid
            ).toBe(true);
        });

        it('rejects a non-finite amount rather than treating it as zero', () => {
            expect(validateOfferedAmount('2026-06-10', '2026-06-10', Number.NaN).valid).toBe(false);
        });
    });

    // The minimum is server-owned (`parish_settings.mass_booking_min_per_day`) so the parish can
    // change it without a new build. These assert the client honours the value it is given rather
    // than the compiled-in default.
    describe('parish-configured limits', () => {
        const limits: BookingLimits = { minPerDay: 1000, maxDays: 7, ceiling: 50_000 };

        it('derives the minimum from the configured per-day amount', () => {
            const r = validateBookingRange('2026-06-10', '2026-06-12', PAST_MIN, limits);
            expect(r.minimumAmount).toBe(3000);
        });

        it('enforces the configured maximum span', () => {
            expect(validateBookingRange('2026-06-01', '2026-06-08', PAST_MIN, limits).valid).toBe(false);
            expect(validateBookingRange('2026-06-01', '2026-06-07', PAST_MIN, limits).valid).toBe(true);
        });

        it('enforces the configured ceiling', () => {
            expect(validateOfferedAmount('2026-06-10', '2026-06-10', 60_000, limits).valid).toBe(false);
        });
    });

    describe('parseAmountInput', () => {
        it('reads a plain figure', () => {
            expect(parseAmountInput('1500')).toBe(1500);
        });
        it('tolerates the separators and symbol people actually type', () => {
            expect(parseAmountInput('₦2,000')).toBe(2000);
            expect(parseAmountInput(' 2 000 ')).toBe(2000);
        });
        // Kobo are not collected. Truncating rather than rounding means a typed "1500.90" can never
        // become a larger offering than the person intended.
        it('truncates a decimal part instead of rounding up', () => {
            expect(parseAmountInput('1500.90')).toBe(1500);
        });
        it('returns null for empty or non-numeric input', () => {
            expect(parseAmountInput('')).toBeNull();
            expect(parseAmountInput('abc')).toBeNull();
            expect(parseAmountInput('12a4')).toBeNull();
        });
        it('returns null for a negative sign rather than a negative amount', () => {
            expect(parseAmountInput('-500')).toBeNull();
        });
    });

    describe('formatNaira', () => {
        it('groups thousands and prefixes the symbol', () => {
            expect(formatNaira(1500)).toBe('₦1,500');
            expect(formatNaira(1_000_000)).toBe('₦1,000,000');
        });
    });
});
