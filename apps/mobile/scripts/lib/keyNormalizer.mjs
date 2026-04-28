/**
 * keyNormalizer.mjs
 *
 * Bidirectional key alias resolution for the Divine Office dataset.
 *
 * The system has two key "namespaces":
 *
 *   CALENDAR FORMAT (used by calendar/2026.json, readings.json, and
 *   liturgicalData.ts getCalendar() for sub-week grouping):
 *     Easter_Week1_Monday, Lent_Week6_Saturday, etc.
 *
 *   STORAGE FORMAT (used as JSON keys in divineOfficeComplete.json,
 *     and defined in canonicalKeys.mjs):
 *     EasterOctave_Monday, HolySaturday, etc.
 *
 * This module provides:
 *   CALENDAR_TO_STORAGE_MAP  — calendar format → storage format aliases
 *   STORAGE_TO_CALENDAR_MAP  — reverse (storage → possible calendar format)
 *   normalizeToStorage(key)  — resolves a calendar-format key to storage format
 *   normalizeToCalendar(key) — resolves a storage-format key to calendar format
 *
 * Usage contexts:
 *   divineOfficeEngine.ts  : normalizeToStorage() when looking up office data
 *   audit-coverage.mjs     : normalizeToStorage() to find aliased hits
 *   migrate-keys.mjs       : both maps, for data repair
 *
 * SYNC POINT: Keep in sync with KEY_OFFICE_ALIAS_MAP in liturgicalCalendar.ts.
 *   Both maps must always contain the same entries.
 */

/**
 * Maps calendar-format keys to the canonical storage-format keys used in
 * divineOfficeComplete.json. 
 *
 * Only keys that differ between the two formats are listed here.
 * If a key appears the same in both formats, it is NOT listed (identity mapping).
 */
export const CALENDAR_TO_STORAGE_MAP = Object.freeze({
  // ── Easter Octave ──────────────────────────────────────────────────────────
  // calendar/2026.json uses Easter_Week1_* for the octave;
  // divineOfficeComplete.json uses the more liturgically precise EasterOctave_*.
  'Easter_Week1_Sunday':    'EasterSunday',
  'Easter_Week1_Monday':    'EasterOctave_Monday',
  'Easter_Week1_Tuesday':   'EasterOctave_Tuesday',
  'Easter_Week1_Wednesday': 'EasterOctave_Wednesday',
  'Easter_Week1_Thursday':  'EasterOctave_Thursday',
  'Easter_Week1_Friday':    'EasterOctave_Friday',
  'Easter_Week1_Saturday':  'EasterOctave_Saturday',

  // ── Holy Week ──────────────────────────────────────────────────────────────
  // calendar/2026.json counts Holy Week as Lent Week 6;
  // divineOfficeComplete.json uses dedicated HolyWeek_* keys.
  'Lent_Week6_Sunday':    'HolyWeek_Sunday',
  'Lent_Week6_Monday':    'HolyWeek_Monday',
  'Lent_Week6_Tuesday':   'HolyWeek_Tuesday',
  'Lent_Week6_Wednesday': 'HolyWeek_Wednesday',
  'Lent_Week6_Thursday':  'HolyThursday',
  'Lent_Week6_Friday':    'GoodFriday',
  'Lent_Week6_Saturday':  'HolySaturday',

  // ── Ash Week legacy forms ──────────────────────────────────────────────────
  // Some older scripts used Lent_Week0_* for the ash week days.
  'Lent_Week0_Wednesday': 'Lent_AshWeek_Wednesday',
  'Lent_Week0_Thursday':  'Lent_AshWeek_Thursday',
  'Lent_Week0_Friday':    'Lent_AshWeek_Friday',
  'Lent_Week0_Saturday':  'Lent_AshWeek_Saturday',

  // ── Feasts and Solemnities Aliasing ────────────────────────────────────────
  'OrdinaryTime_Week1_Sunday':  'BaptismOfTheLord',
  'OrdinaryTime_Week34_Sunday': 'ChristTheKing',
  'Easter_Week7_Sunday':        'PentecostSunday',
});

/**
 * Reverse map: storage format → calendar format.
 * Used when you have a storage key and need the corresponding calendar key
 * (e.g. for readings lookup after finding office data).
 */
export const STORAGE_TO_CALENDAR_MAP = Object.freeze(
  Object.fromEntries(
    Object.entries(CALENDAR_TO_STORAGE_MAP).map(([cal, store]) => [store, cal])
  )
);

/**
 * Resolves a key from calendar format to storage format.
 * Idempotent: if the key is already in storage format, it is returned unchanged.
 *
 * Use this when looking up data in divineOfficeComplete.json.
 *
 * @param {string} key
 * @returns {string}
 */
export function normalizeToStorage(key) {
  return CALENDAR_TO_STORAGE_MAP[key] ?? key;
}

/**
 * Resolves a key from storage format to calendar format.
 * Idempotent: if the key has no calendar alias, it is returned unchanged.
 *
 * Use this when you need to look up the key in calendar/YYYY.json or readings.json.
 *
 * @param {string} key
 * @returns {string}
 */
export function normalizeToCalendar(key) {
  return STORAGE_TO_CALENDAR_MAP[key] ?? key;
}

/**
 * Returns true if the key maps to a different key in the storage format.
 * Useful for filtering only aliased keys.
 *
 * @param {string} key
 * @returns {boolean}
 */
export function isAliasedKey(key) {
  return Object.prototype.hasOwnProperty.call(CALENDAR_TO_STORAGE_MAP, key);
}

/**
 * Returns every key that is an alias for the given canonical storage key.
 * Usually returns an array with 0 or 1 elements.
 *
 * @param {string} storageKey
 * @returns {string[]}
 */
export function aliasesFor(storageKey) {
  return Object.entries(CALENDAR_TO_STORAGE_MAP)
    .filter(([, v]) => v === storageKey)
    .map(([k]) => k);
}
