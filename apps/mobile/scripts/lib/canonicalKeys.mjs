/**
 * canonicalKeys.mjs
 *
 * The single authoritative list of all canonical liturgical keys that are
 * expected to have data in divineOfficeComplete.json.
 *
 * Keys are in STORAGE format — the exact string used as the JSON key in
 * divineOfficeComplete.json. If you are looking up by a "calendar format"
 * key (e.g. Easter_Week1_Monday), use keyNormalizer.mjs to resolve it first.
 *
 * Totals (approximate, as some Christmas post-Epiphany keys vary by year):
 *   Ordinary Time:   238  (Weeks 1–34 × 7 days)
 *   Advent:           36  (Weeks 1–4 × 7 days + Dec 17–24 proper days)
 *   Lent:             46  (AshWeek + Weeks 1–5 + Holy Week + Triduum)
 *   Easter:           50  (EasterSunday + Octave + Weeks 2–7 + Pentecost alias)
 *   Christmas:        19  (Fixed + Octave + variable post-Epiphany days)
 *   Fixed Feasts:     18  (Major solemnities / feasts)
 *   ─────────────────────
 *   Total:           407
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function weekdaysFor(prefix) {
  return WEEKDAYS.map(d => `${prefix}_${d}`);
}

// ─── Ordinary Time ────────────────────────────────────────────────────────────
// Weeks 1–34 × 7 days = 238 keys

export const ORDINARY_TIME_KEYS = Array.from({ length: 34 }, (_, i) =>
  WEEKDAYS.map(d => `OrdinaryTime_Week${i + 1}_${d}`)
).flat(); // 238 keys

// ─── Advent ───────────────────────────────────────────────────────────────────
// Weeks 1–4 × 7 days = 28 keys
// Dec 17–24 proper (O Antiphon days) = 8 additional keys
// Note: Dec 17–24 weekday dates in a real year map to Advent_Dec{N}, not
// to the corresponding Week_Day key. Both sets of keys contain distinct liturgical
// content and must both be populated in the dataset.

export const ADVENT_WEEK_KEYS = Array.from({ length: 4 }, (_, i) =>
  WEEKDAYS.map(d => `Advent_Week${i + 1}_${d}`)
).flat(); // 28 keys

export const ADVENT_DEC_KEYS = [
  'Advent_Dec17', 'Advent_Dec18', 'Advent_Dec19', 'Advent_Dec20',
  'Advent_Dec21', 'Advent_Dec22', 'Advent_Dec23', 'Advent_Dec24',
]; // 8 keys

export const ADVENT_KEYS = [...ADVENT_WEEK_KEYS, ...ADVENT_DEC_KEYS]; // 36 keys

// ─── Lent ─────────────────────────────────────────────────────────────────────
// Ash Week (Wed–Sat only — Sun/Mon/Tue are still OT)  = 4 keys
// Weeks 1–5 × 7 days                                  = 35 keys
// Holy Week (Palm Sunday through Wednesday)            = 4 keys
// Paschal Triduum                                      = 3 keys
// ─────────────────────────────────────────────────────────────────────────────
// Total = 46 keys

export const LENT_ASH_WEEK_KEYS = [
  'Lent_AshWeek_Wednesday',
  'Lent_AshWeek_Thursday',
  'Lent_AshWeek_Friday',
  'Lent_AshWeek_Saturday',
]; // 4 keys

export const LENT_WEEK_KEYS = Array.from({ length: 5 }, (_, i) =>
  WEEKDAYS.map(d => `Lent_Week${i + 1}_${d}`)
).flat(); // 35 keys

export const HOLY_WEEK_KEYS = [
  'HolyWeek_Sunday',   // Palm Sunday
  'HolyWeek_Monday',
  'HolyWeek_Tuesday',
  'HolyWeek_Wednesday',
]; // 4 keys

export const TRIDUUM_KEYS = [
  'HolyThursday',
  'GoodFriday',
  'HolySaturday',
]; // 3 keys

export const LENT_KEYS = [
  ...LENT_ASH_WEEK_KEYS,
  ...LENT_WEEK_KEYS,
  ...HOLY_WEEK_KEYS,
  ...TRIDUUM_KEYS,
]; // 46 keys

// ─── Easter ───────────────────────────────────────────────────────────────────
// Easter Sunday                                        = 1 key
// Easter Octave (Mon–Sat of Octave Week)               = 6 keys
// Easter Sunday of Week 2 (Divine Mercy Sunday)        = 1 key (Easter_Week2_Sunday)
// Weeks 2–7 × 7 days (includes Pentecost Sunday)      = 42 keys
// ─────────────────────────────────────────────────────────────────────────────
// Total = 50 keys
// Note: EasterSunday IS the same date as Easter_Week1_Sunday; only one is stored.
// Note: Easter_Week7_Sunday = Pentecost Sunday (no separate key in this system).

export const EASTER_OCTAVE_KEYS = [
  'EasterSunday',
  'EasterOctave_Monday',
  'EasterOctave_Tuesday',
  'EasterOctave_Wednesday',
  'EasterOctave_Thursday',
  'EasterOctave_Friday',
  'EasterOctave_Saturday',
]; // 7 keys (Easter Sunday + 6 Octave days)

export const EASTER_WEEK_KEYS = Array.from({ length: 6 }, (_, i) =>
  WEEKDAYS.map(d => `Easter_Week${i + 2}_${d}`)
).flat(); // 42 keys (Weeks 2–7)

export const EASTER_KEYS = [...EASTER_OCTAVE_KEYS, ...EASTER_WEEK_KEYS]; // 49 keys

// ─── Christmas ────────────────────────────────────────────────────────────────
// Fixed-date Christmas Octave days                     = 4 keys (Dec 25–28)
// Variable Octave interior days (Dec 29–31)            = 3 keys (varies by year)
// Holy Family Sunday                                   = 1 key
// Mary, Mother of God (Jan 1)                          = 1 key
// Post-Epiphany variable days (Jan 2–BaptismOfLord)    = variable; ~7 stable keys
// Epiphany                                             = 1 key
// Baptism of the Lord                                  = 1 key
// ─────────────────────────────────────────────────────────────────────────────
// Total stable = ~19 keys

export const CHRISTMAS_FIXED_KEYS = [
  'NativityOfTheLord_Christmas',  // Dec 25
  'SaintStephen',                 // Dec 26
  'SaintJohnApostle',             // Dec 27
  'HolyInnocents',                // Dec 28
  'ChristmasOctave_Tuesday',      // Dec 29 (stable — always exists)
  'ChristmasOctave_Wednesday',    // Dec 30 (stable — always exists)
  'ChristmasOctave_Thursday',     // Dec 31 (stable — always exists)
  'HolyFamily',                   // Sunday in octave (variable date)
  'Mary_MotherOfGod',             // Jan 1
  // Post-Epiphany weekday keys — variable by year, but these are worth having data for:
  'MondayAfterEpiphany',
  'TuesdayAfterEpiphany',
  'WednesdayAfterEpiphany',
  'ThursdayAfterEpiphany',
  'FridayAfterEpiphany',
  'SaturdayAfterEpiphany',
  // Epiphany and Baptism
  'EpiphanyOfTheLord',
  'BaptismOfTheLord',
  // Second Sunday after Christmas (only some years have this)
  'Christmas_Sunday_W2',
]; // 19 keys

export const CHRISTMAS_KEYS = [...CHRISTMAS_FIXED_KEYS]; // 19 keys

// ─── Fixed Solemnities & Feasts ───────────────────────────────────────────────
// Fixed-date observances that appear year-round regardless of the 4-week cycle.
// Note: Christmas and New Year feasts are listed under CHRISTMAS_KEYS above
// to avoid double-counting.

export const FIXED_FEAST_KEYS = [
  'PresentationOfTheLord',                // Feb 2
  'SaintJoseph',                          // Mar 19
  'AnnunciationOfTheLord',                // Mar 25 (or Annunciation in readings.json)
  'NativityOfSaintJohnTheBaptist',        // Jun 24
  'SaintsPeterAndPaulApostles',           // Jun 29
  'TransfigurationOfTheLord',             // Aug 6
  'AssumptionOfTheBlessedVirginMary',     // Aug 15
  'ExaltationOfTheHolyCross',             // Sep 14
  'AllSaints',                            // Nov 1
  'AllSouls',                             // Nov 2
  'ImmaculateConception',                 // Dec 8
  // Moveable solemnities (not fixed date but always have a key)
  'AscensionOfTheLord',
  'PentecostSunday',                      // stored separately if needed
  'MostHolyTrinity',
  'CorpusChristi',
  'SacredHeartOfJesus',
  'ChristTheKing',
]; // 17 keys

// ─── Complete canonical set ───────────────────────────────────────────────────

export const ALL_CANONICAL_KEYS = [
  ...ORDINARY_TIME_KEYS,
  ...ADVENT_KEYS,
  ...LENT_KEYS,
  ...EASTER_KEYS,
  ...CHRISTMAS_KEYS,
  ...FIXED_FEAST_KEYS,
];

// De-duplicate (HolyThursday, GoodFriday, HolySaturday appear in TRIDUUM_KEYS;
// Mary_MotherOfGod and other Jan keys are in CHRISTMAS_KEYS only)
export const CANONICAL_KEY_SET = new Set(ALL_CANONICAL_KEYS);

/** Season groupings for audit reporting */
export const SEASON_GROUPS = {
  'Ordinary Time': ORDINARY_TIME_KEYS,
  'Advent':        ADVENT_KEYS,
  'Lent':          LENT_KEYS,
  'Easter':        EASTER_KEYS,
  'Christmas':     CHRISTMAS_KEYS,
  'Fixed Feasts':  FIXED_FEAST_KEYS,
};

export const TOTAL_CANONICAL_KEYS = CANONICAL_KEY_SET.size;
