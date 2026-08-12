/**
 * Shared date/time formatting for the admin portal.
 *
 * Two problems this solves:
 *  1. Recent Activity showed "31 days ago" / "120 days ago" — technically true, humanly useless.
 *     Relative time is only meaningful for the recent past; beyond ~a week an absolute date is
 *     clearer and stops drifting as the page ages.
 *  2. Every admin page formatted dates differently (`toLocaleDateString()` with no locale, with
 *     "en-US", with `undefined`, …), so the same timestamp rendered differently per screen and
 *     followed whatever timezone the viewer's browser happened to be in.
 *
 * All formatting is pinned to the PARISH timezone so an admin abroad sees the same day a parishioner
 * in Nigeria does — a booking made late on the 5th must not read as the 4th (or 6th) elsewhere.
 */

/** The parish's operating timezone. Change here if the parish ever operates elsewhere. */
export const PARISH_TIME_ZONE = 'Africa/Lagos'

/** Locale used for all admin date rendering (day-first, unambiguous month name). */
const LOCALE = 'en-GB'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Beyond this, show an absolute date instead of a relative one. */
const RELATIVE_CUTOFF_DAYS = 7

const parse = (value: string | number | Date | null | undefined): Date | null => {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Absolute date in the parish timezone, e.g. "08 Apr 2026".
 */
export function formatDate(value: string | number | Date | null | undefined): string {
  const date = parse(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: PARISH_TIME_ZONE,
  }).format(date)
}

/**
 * Absolute date including weekday, e.g. "Wed, 08 Apr 2026". Used where the day of week matters
 * (events, Mass schedules).
 *
 * Pinning the timezone also fixes a latent bug for DATE-only columns (`events.start_date`): plain
 * `new Date('2026-08-05')` parses as UTC midnight, so an admin in a timezone behind UTC would see
 * the previous day. Formatting in the parish timezone keeps the date stable for every viewer.
 */
export function formatDateWithWeekday(value: string | number | Date | null | undefined): string {
  const date = parse(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: PARISH_TIME_ZONE,
  }).format(date)
}

/**
 * Absolute date + time in the parish timezone, e.g. "08 Apr 2026, 18:30".
 */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  const date = parse(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: PARISH_TIME_ZONE,
  }).format(date)
}

/** Calendar-day difference in the parish timezone (not a raw 24h division, so "yesterday" is correct). */
const parishDayIndex = (date: Date): number => {
  // en-CA gives YYYY-MM-DD, which sorts and parses reliably.
  const iso = new Intl.DateTimeFormat('en-CA', { timeZone: PARISH_TIME_ZONE }).format(date)
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / DAY)
}

/**
 * Human relative time for recent events, falling back to an absolute date once it stops being useful:
 *
 *   < 1 min      → "just now"
 *   < 1 hour     → "5 minutes ago"
 *   < 24 hours   → "3 hours ago"
 *   yesterday    → "yesterday"
 *   < 7 days     → "4 days ago"
 *   otherwise    → "08 Apr 2026"
 *
 * Future timestamps (clock skew, scheduled records) degrade to the absolute date rather than
 * rendering nonsense like "-3 minutes ago".
 */
export function formatRelativeTime(
  value: string | number | Date | null | undefined,
  now: Date = new Date(),
): string {
  const date = parse(value)
  if (!date) return '—'

  const diffMs = now.getTime() - date.getTime()
  if (diffMs < 0) return formatDate(date)

  if (diffMs < MINUTE) return 'just now'

  if (diffMs < HOUR) {
    const minutes = Math.floor(diffMs / MINUTE)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  }

  if (diffMs < DAY) {
    const hours = Math.floor(diffMs / HOUR)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  }

  // Use calendar days in the parish timezone so "yesterday" means the previous parish day.
  const dayDelta = parishDayIndex(now) - parishDayIndex(date)
  if (dayDelta <= 1) return 'yesterday'
  if (dayDelta < RELATIVE_CUTOFF_DAYS) return `${dayDelta} days ago`

  return formatDate(date)
}
