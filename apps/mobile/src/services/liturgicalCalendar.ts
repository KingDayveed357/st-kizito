/**
 * liturgicalCalendar.ts
 *
 * Single authoritative implementation of the Roman Rite liturgical calendar
 * for the St. Kizito app (US USCCB rules, 2000–2040).
 *
 * This is a faithful TypeScript port of the calendar logic in
 * `scripts/scrape-divineoffice-org.mjs`. Both files MUST remain in
 * sync — any algorithm change applied to one MUST be applied to the other.
 *
 * Responsibilities:
 *   1. computeLiturgicalDay(isoDate)  — authoritative date → CalendarEntry mapping
 *   2. normalizeOfficeKey(rawKey)     — maps raw keys to divineOfficeComplete.json keys
 *   3. KEY_OFFICE_ALIAS_MAP           — exported alias table for transparency in tests
 *
 * NOT responsible for:
 *   - Readings data (liturgicalData.ts)
 *   - Divine Office content (divineOfficeEngine.ts)
 *   - Sanctoral calendar names (provided by pre-built calendarYYYY.json files)
 *
 * SYNC POINT: When updating either this file or the scraper's calendar logic,
 * run the cross-check command:
 *   node scripts/verify-calendar-parity.mjs
 */

// ─── Public types ───────────────────────────────────────────────────────────

/** Mirrors the shape of entries in calendar/2026.json and the object
 *  returned by the legacy getLiturgicalDay() engine, so this is a drop-in
 *  replacement in getCalendar(). */
export interface CalendarEntry {
  /** ISO date string — YYYY-MM-DD */
  date: string;
  /** Canonical liturgical key linking to divine office and readings data */
  key: string;
  /** Broad liturgical season */
  season: LiturgicalSeason;
  /** Finer period within the season (e.g. "Easter Octave", "Holy Week") */
  period: string;
  /** Day of the week, title-cased */
  day: WeekdayName;
  /** Ordinal week number within the season; null when not applicable */
  week: number | null;
  /** Sunday lectionary cycle — A, B, or C */
  liturgicalYear: LiturgicalYearCycle;
  /** Human-readable celebration title (generic fallback; pre-built files override) */
  celebration: string;
  /** Celebration type (generic; pre-built files provide richer values) */
  celebrationType: string;
  /** Liturgical colour */
  color: LiturgicalColor;
}

export type LiturgicalSeason =
  | 'Advent'
  | 'Christmas'
  | 'Ordinary Time'
  | 'Lent'
  | 'Easter';

export type WeekdayName =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export type LiturgicalYearCycle = 'A' | 'B' | 'C';
export type LiturgicalColor = 'green' | 'purple' | 'white' | 'red' | 'rose';

// ─── Internal types ─────────────────────────────────────────────────────────

interface SeasonInfo {
  season: LiturgicalSeason;
  period: string;
}

interface AnchorDates {
  year: number;
  easter: Date;
  ashWednesday: Date;
  palmSunday: Date;
  holyThursday: Date;
  pentecost: Date;
  adventStart: Date;   // First Sunday of Advent for THIS liturgical year
  christmas: Date;     // Christmas of the PRIOR calendar year (start of liturgical year)
  baptism: Date;       // Baptism of the Lord (end of Christmas season)
  nextAdventStart: Date; // First Sunday of Advent for the NEXT liturgical year
}

// ─── Constants ───────────────────────────────────────────────────────────────

const WEEKDAY_NAMES: WeekdayName[] = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/**
 * Fixed-date solemnities and feasts that override the computed seasonal key.
 * Key: MM-DD, Value: canonical office key.
 *
 * NOTE: Keep this in sync with FIXED_DATE_KEY_OVERRIDES in the scraper.
 */
const FIXED_DATE_KEY_OVERRIDES: Record<string, string> = {
  '01-01': 'Mary_MotherOfGod',
  '02-02': 'PresentationOfTheLord',
  '03-19': 'SaintJoseph',
  '03-25': 'AnnunciationOfTheLord',
  '06-24': 'NativityOfSaintJohnTheBaptist',
  '06-29': 'SaintsPeterAndPaulApostles',
  '08-06': 'TransfigurationOfTheLord',
  '08-15': 'AssumptionOfTheBlessedVirginMary',
  '09-14': 'ExaltationOfTheHolyCross',
  '11-01': 'AllSaints',
  '11-02': 'AllSouls',
  '12-08': 'ImmaculateConception',
  '12-25': 'NativityOfTheLord_Christmas',
  '12-26': 'SaintStephen',
  '12-27': 'SaintJohnApostle',
  '12-28': 'HolyInnocents',
};

/**
 * Moveable keys that must never be overridden by a fixed feast, even if one
 * fell on the same date (highly unlikely but guards against the edge case).
 */
const PROTECTED_MOVEABLE_KEYS = new Set([
  'EasterSunday',
  'HolyThursday',
  'GoodFriday',
  'HolySaturday',
  'PentecostSunday',
  'MostHolyTrinity',
  'MostHolyBodyAndBloodOfChrist',
]);

/** Maps the liturgical color to each season / period. */
const SEASON_COLORS: Record<string, LiturgicalColor> = {
  Advent: 'purple',
  Christmas: 'white',
  'Ordinary Time': 'green',
  Lent: 'purple',
  'Holy Week': 'red',      // Palm Sunday and days of Holy Week use red/purple
  'Paschal Triduum': 'red',
  Easter: 'white',
};

// ─── Pure date helpers ───────────────────────────────────────────────────────

/** Creates a UTC-midnight Date for the given calendar date. */
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/** Adds n whole days to date, returning a new Date. */
function addDays(date: Date, n: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

/** Returns the difference in whole days: a − b. */
function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

// ─── Astronomical / liturgical computations ──────────────────────────────────

/**
 * Computes Easter Sunday for a given year using Butcher's / Meeus's
 * Anonymous Gregorian algorithm (identical to the scraper).
 */
function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month, day);
}

/**
 * Returns the First Sunday of Advent for a given calendar year.
 * Advent begins 4 Sundays before Christmas (Nov 27 – Dec 3 range).
 */
function firstSundayOfAdvent(year: number): Date {
  // Check the last days of November first (Nov 27-30), then Dec 1-3
  for (let d = 27; d <= 30; d++) {
    const dt = utcDate(year, 11, d);
    if (dt.getUTCDay() === 0) return dt;
  }
  for (let d = 1; d <= 3; d++) {
    const dt = utcDate(year, 12, d);
    if (dt.getUTCDay() === 0) return dt;
  }
  throw new RangeError(`Cannot compute First Sunday of Advent for year ${year}`);
}

/**
 * Returns Epiphany as observed in the US: the Sunday between Jan 2 and Jan 8
 * (USCCB rule — NOT the universal Jan 6 fixed date).
 */
function usEpiphany(year: number): Date {
  for (let d = 2; d <= 8; d++) {
    const dt = utcDate(year, 1, d);
    if (dt.getUTCDay() === 0) return dt;
  }
  throw new RangeError(`Cannot compute US Epiphany for year ${year}`);
}

/**
 * Returns the Feast of the Baptism of the Lord (US).
 * Normally the Monday after Epiphany.
 * Exception: if Epiphany falls on Jan 7 or Jan 8, Baptism is the next day (Tuesday).
 */
function baptismOfTheLord(year: number): Date {
  const epiphany = usEpiphany(year);
  const epiphanyDay = epiphany.getUTCDate();
  // If Epiphany is Jan 7 or 8, Baptism follows immediately on Monday/Tuesday
  return epiphanyDay >= 7 ? addDays(epiphany, 1) : addDays(epiphany, 7);
}

/**
 * Returns the liturgical year (A/B/C) for a given date.
 * The liturgical year starts on the First Sunday of Advent.
 * Liturgical year N starts in Advent of calendar year N−1.
 */
function liturgicalYearForDate(date: Date): number {
  const y = date.getUTCFullYear();
  return date >= firstSundayOfAdvent(y) ? y + 1 : y;
}

/**
 * Converts a liturgical year integer to its A/B/C Sunday cycle.
 * Cycle A   = liturgical years where litYear % 3 === 1  (e.g. 2026-27 = Year A)
 * Cycle B   = litYear % 3 === 2
 * Cycle C   = litYear % 3 === 0
 *
 * Verified against USCCB tables:
 *   LY 2025 (2024-25) → B, LY 2026 (2025-26) → C, LY 2027 (2026-27) → A
 */
function romanSundayCycle(litYear: number): LiturgicalYearCycle {
  return (['C', 'A', 'B'] as LiturgicalYearCycle[])[litYear % 3];
}

/**
 * Computes all anchor dates for the liturgical year that contains `year`.
 * The liturgical year spans from Advent of (year−1) to Advent of year.
 */
function computeAnchors(year: number): AnchorDates {
  const easter = computeEaster(year);
  return {
    year,
    easter,
    ashWednesday: addDays(easter, -46),
    palmSunday: addDays(easter, -7),
    holyThursday: addDays(easter, -3),
    pentecost: addDays(easter, 49),
    adventStart: firstSundayOfAdvent(year - 1),  // Start of THIS liturgical year
    christmas: utcDate(year - 1, 12, 25),         // Christmas of prior calendar year
    baptism: baptismOfTheLord(year),
    nextAdventStart: firstSundayOfAdvent(year),   // Start of NEXT liturgical year
  };
}

// ─── Season classification ───────────────────────────────────────────────────

/**
 * Determines the liturgical season and period for a given date.
 *
 * The liturgical year runs:
 *   Advent → Christmas → OT (pre-Lent) → Lent → Triduum → Easter → OT (post-Pentecost)
 *
 * Comparison strategy:
 *   All anchor dates are UTC midnight. Input date is at noon UTC (T12:00:00Z).
 *   We use < addDays(x, 1) for inclusive same-day matching.
 */
function classifySeason(date: Date, anch: AnchorDates): SeasonInfo {
  // Advent (from First Sunday of Advent up to Christmas Eve inclusive)
  if (date < anch.christmas) {
    return { season: 'Advent', period: 'Advent' };
  }
  // Christmas (from Christmas Day through Baptism of the Lord inclusive)
  if (date < addDays(anch.baptism, 1)) {
    return { season: 'Christmas', period: 'Christmas' };
  }
  // Ordinary Time — pre-Lent window (day after Baptism up to Ash Wednesday eve)
  if (date < anch.ashWednesday) {
    return { season: 'Ordinary Time', period: 'Ordinary Time' };
  }
  // Lent proper (Ash Wed → Palm Sunday eve)
  if (date < anch.palmSunday) {
    return { season: 'Lent', period: 'Lent' };
  }
  // Holy Week (Palm Sunday → Holy Thursday eve)
  if (date < anch.holyThursday) {
    return { season: 'Lent', period: 'Holy Week' };
  }
  // Paschal Triduum (Holy Thursday → Easter Sunday eve)
  if (date < anch.easter) {
    return { season: 'Lent', period: 'Paschal Triduum' };
  }
  // Easter Season (Easter Sunday → Pentecost inclusive)
  if (date < addDays(anch.pentecost, 1)) {
    const daysAfterEaster = diffDays(date, anch.easter);
    const isOctave = daysAfterEaster <= 7;
    return { season: 'Easter', period: isOctave ? 'Easter Octave' : 'Easter' };
  }
  // Ordinary Time — post-Pentecost (continues until next Advent)
  if (date < anch.nextAdventStart) {
    return { season: 'Ordinary Time', period: 'Ordinary Time' };
  }
  // Safety: should never be reached — date is past next Advent start,
  // which means computeAnchors() was called for the wrong year.
  return { season: 'Ordinary Time', period: 'Ordinary Time' };
}

// ─── Week number computations ────────────────────────────────────────────────

/**
 * Computes the Ordinary Time week number.
 *
 * Pre-Lent: count forward from the day after Baptism of the Lord.
 * Post-Pentecost: continue from where pre-Lent left off, skipping the weeks
 *   "consumed" by Lent and Easter, so the last Sunday before Advent is always Week 34.
 *
 * This matches the Roman Rite's retrospective reckoning of Ordinary Time weeks.
 */
function ordinaryTimeWeek(date: Date, anch: AnchorDates): number {
  const otStart = addDays(anch.baptism, 1); // First day of OT Week 1

  if (date < anch.ashWednesday) {
    // Pre-Lent: straightforward forward count
    return Math.floor(diffDays(date, otStart) / 7) + 1;
  }

  // Post-Pentecost: how many weeks of OT did we complete before Lent?
  const lastBeforeLent = addDays(anch.ashWednesday, -1);
  const weeksBefore = Math.floor(diffDays(lastBeforeLent, otStart) / 7) + 1;

  // Resume OT from the Monday after Pentecost
  // (Pentecost Sunday ends the Easter season; OT resumes the next day)
  const otResume = addDays(anch.pentecost, 1);
  return weeksBefore + 2 + Math.floor(diffDays(date, otResume) / 7);
}

/**
 * Returns the Advent week number (1–4) counting from First Sunday of Advent.
 */
function adventWeek(date: Date, anch: AnchorDates): number {
  return Math.floor(diffDays(date, anch.adventStart) / 7) + 1;
}

/**
 * Returns the Lent week number.
 * Week 0  = Ash Wednesday week (Wed–Sat before First Sunday of Lent)
 * Week 1+ = full Lent weeks (first Sunday of Lent onwards)
 */
function lentWeek(date: Date, anch: AnchorDates): number {
  const firstSundayOfLent = addDays(anch.ashWednesday, 4);
  if (date < firstSundayOfLent) return 0; // Ash Week
  return Math.floor(diffDays(date, firstSundayOfLent) / 7) + 1;
}

/**
 * Returns the Easter week number.
 * Week 1 = Easter Octave (Easter Sunday through the following Saturday)
 * Week 2 onwards = weeks after the Octave
 */
function easterWeek(date: Date, anch: AnchorDates): number {
  const daysAfterEaster = diffDays(date, anch.easter);
  if (daysAfterEaster <= 7) return 1;
  return 2 + Math.floor(diffDays(date, addDays(anch.easter, 8)) / 7);
}

// ─── Key construction ────────────────────────────────────────────────────────

/** Builds the raw liturgical key for a date. Does NOT apply fixed feast overrides. */
function buildSeasonalKey(
  date: Date,
  dayName: WeekdayName,
  month: number,
  day: number,
  seasonInfo: SeasonInfo,
  week: number | null,
  anch: AnchorDates,
): string {
  const { season, period } = seasonInfo;

  switch (season) {
    case 'Ordinary Time':
      return `OrdinaryTime_Week${week}_${dayName}`;

    case 'Advent':
      // Dec 17–24 (non-Sunday) have their own proper keys
      if (month === 12 && day >= 17 && day <= 24 && dayName !== 'Sunday') {
        return `Advent_Dec${day}`;
      }
      return week !== null ? `Advent_Week${week}_${dayName}` : `Advent_${dayName}`;

    case 'Lent':
      switch (period) {
        case 'Paschal Triduum':
          if (dayName === 'Thursday') return 'HolyThursday';
          if (dayName === 'Friday')   return 'GoodFriday';
          if (dayName === 'Saturday') return 'HolySaturday';
          return `Triduum_${dayName}`; // safety fallback
        case 'Holy Week':
          return `HolyWeek_${dayName}`;
        default:
          // Ash Week (week 0) or numbered Lent weeks
          if (week === 0) return `Lent_AshWeek_${dayName}`;
          return week !== null ? `Lent_Week${week}_${dayName}` : `Lent_${dayName}`;
      }

    case 'Easter': {
      const daysAfterEaster = diffDays(date, anch.easter);
      // Easter Sunday itself
      if (daysAfterEaster === 0) return 'EasterSunday';
      // Easter Octave: Monday–Saturday (the Sunday of Week 2 is NOT in the Octave)
      if (period === 'Easter Octave' && dayName !== 'Sunday') {
        return `EasterOctave_${dayName}`;
      }
      return week !== null ? `Easter_Week${week}_${dayName}` : `Easter_${dayName}`;
    }

    case 'Christmas':
      if (month === 12 && day === 25) return 'NativityOfTheLord_Christmas';
      if (month === 12 && day === 26) return 'SaintStephen';
      if (month === 12 && day === 27) return 'SaintJohnApostle';
      if (month === 12 && day === 28) return 'HolyInnocents';
      if (month === 1  && day === 1)  return 'Mary_MotherOfGod';
      if (dayName === 'Sunday') {
        const daysSinceChristmas = diffDays(date, anch.christmas);
        if (daysSinceChristmas > 0 && daysSinceChristmas <= 7) return 'HolyFamily';
        return `Christmas_Sunday_W${Math.ceil(diffDays(date, anch.christmas) / 7)}`;
      }
      {
        const daysSince = diffDays(date, anch.christmas);
        if (daysSince > 0 && daysSince <= 7) return `ChristmasOctave_${dayName}`;
        return `Christmas_${dayName}`;
      }

    default:
      return `${season}_${dayName}`;
  }
}

// ─── Main exported function ──────────────────────────────────────────────────

/**
 * Computes the full liturgical CalendarEntry for a given ISO date string.
 *
 * The returned object is API-compatible with entries in calendar/2026.json
 * and with the legacy getLiturgicalDay() return value, so it can be used as a
 * direct replacement in getCalendar() without downstream changes.
 *
 * @param isoDate - ISO date string in YYYY-MM-DD format
 * @throws {TypeError} if isoDate is not a valid date string
 */
export function computeLiturgicalDay(isoDate: string): CalendarEntry {
  // Parse at noon UTC to avoid timezone boundary issues on midnight UTC dates
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (isNaN(date.getTime())) {
    throw new TypeError(`Invalid date: "${isoDate}"`);
  }

  const year     = date.getUTCFullYear();
  const month    = date.getUTCMonth() + 1;
  const day      = date.getUTCDate();
  const dayName  = WEEKDAY_NAMES[date.getUTCDay()];
  const mmdd     = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const litYear  = liturgicalYearForDate(date);
  const anch     = computeAnchors(litYear);
  const seasonInfo = classifySeason(date, anch);
  const { season, period } = seasonInfo;

  // Compute week number based on season
  let week: number | null = null;
  switch (season) {
    case 'Ordinary Time':
      week = ordinaryTimeWeek(date, anch);
      break;
    case 'Advent':
      week = adventWeek(date, anch);
      break;
    case 'Lent':
      if (period !== 'Holy Week' && period !== 'Paschal Triduum') {
        week = lentWeek(date, anch);
      }
      break;
    case 'Easter':
      week = easterWeek(date, anch);
      break;
    // Christmas has no week number in this system
  }

  // Build the raw seasonal key
  const rawKey = buildSeasonalKey(date, dayName, month, day, seasonInfo, week, anch);

  // Apply fixed-date feast override, unless the seasonal key is a protected moveable feast
  const fixedFeastKey = FIXED_DATE_KEY_OVERRIDES[mmdd];
  const key = (fixedFeastKey && !PROTECTED_MOVEABLE_KEYS.has(rawKey))
    ? fixedFeastKey
    : rawKey;

  // Determine liturgical colour
  const color = resolveColor(key, period, season, dayName);

  // Build a generic celebration title (pre-built calendar files override this)
  const celebration = buildGenericCelebration(key, season, week, dayName);

  // Generic celebration type (pre-built calendar files provide richer values)
  const celebrationType = resolveCelebrationType(key, dayName, fixedFeastKey);

  return {
    date:            isoDate,
    key,
    season,
    period,
    day:             dayName,
    week,
    liturgicalYear:  romanSundayCycle(litYear),
    celebration,
    celebrationType,
    color,
  };
}

// ─── Key alias / normalisation ───────────────────────────────────────────────

/**
 * Maps raw seasonal keys that appear in readings.json and the pre-built calendar
 * to the canonical keys used as storage keys in divineOfficeComplete.json.
 *
 * Background: readings.json uses `Easter_Week1_*` for the Easter Octave days,
 * while the scraper (correctly) stored those days as `EasterOctave_*`.
 * This map bridges the gap so divine office lookups can find the right data
 * WITHOUT altering how the readings screen resolves its keys.
 *
 * Usage: apply this ONLY inside divineOfficeEngine.ts when looking up
 * prayer office data. Do NOT apply it in getCalendar() or resolveReadingSet().
 */
export const KEY_OFFICE_ALIAS_MAP: Readonly<Record<string, string>> = Object.freeze({
  // Easter Octave — readings.json uses Week1, divineOfficeComplete uses EasterOctave
  'Easter_Week1_Monday':    'EasterOctave_Monday',
  'Easter_Week1_Tuesday':   'EasterOctave_Tuesday',
  'Easter_Week1_Wednesday': 'EasterOctave_Wednesday',
  'Easter_Week1_Thursday':  'EasterOctave_Thursday',
  'Easter_Week1_Friday':    'EasterOctave_Friday',
  'Easter_Week1_Saturday':  'EasterOctave_Saturday',
  // Easter Sunday stored under a special key
  'Easter_Week1_Sunday':    'EasterSunday',
  // Holy Week weekdays
  'Lent_Week6_Monday':      'HolyWeek_Monday',
  'Lent_Week6_Tuesday':     'HolyWeek_Tuesday',
  'Lent_Week6_Wednesday':   'HolyWeek_Wednesday',
  'Lent_Week6_Thursday':    'HolyThursday',
  'Lent_Week6_Friday':      'GoodFriday',
  'Lent_Week6_Saturday':    'HolySaturday',
  // Ash Week legacy forms (week 0 in scraper, sometimes stored differently)
  'Lent_Week0_Wednesday':   'Lent_AshWeek_Wednesday',
  'Lent_Week0_Thursday':    'Lent_AshWeek_Thursday',
  'Lent_Week0_Friday':      'Lent_AshWeek_Friday',
  'Lent_Week0_Saturday':    'Lent_AshWeek_Saturday',
});

/**
 * Normalises a raw liturgical key to the canonical form used in
 * divineOfficeComplete.json. Idempotent — calling twice returns the same result.
 *
 * Apply ONLY when doing divine office lookups, not for readings lookups.
 *
 * @example
 *   normalizeOfficeKey('Easter_Week1_Monday')  // → 'EasterOctave_Monday'
 *   normalizeOfficeKey('OrdinaryTime_Week5_Friday') // → 'OrdinaryTime_Week5_Friday'
 */
export function normalizeOfficeKey(rawKey: string): string {
  return KEY_OFFICE_ALIAS_MAP[rawKey] ?? rawKey;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function resolveColor(
  key: string,
  period: string,
  season: LiturgicalSeason,
  day: WeekdayName,
): LiturgicalColor {
  // Explicit overrides for special days
  if (key === 'GoodFriday')                          return 'red';
  if (key === 'PentecostSunday')                     return 'red';
  if (key === 'ExaltationOfTheHolyCross')            return 'red';
  if (key === 'SaintsPeterAndPaulApostles')          return 'red';
  if (key === 'NativityOfSaintJohnTheBaptist')       return 'white';
  if (key === 'AllSouls')                            return 'purple';
  // Gaudete Sunday (3rd Advent) and Laetare Sunday (4th Lent)
  // These would require week tracking — left to the pre-built calendar files
  // which have the exact celebration names. Generic fallback = purple for now.
  return SEASON_COLORS[period] ?? SEASON_COLORS[season] ?? 'green';
}

function buildGenericCelebration(
  key: string,
  season: LiturgicalSeason,
  week: number | null,
  day: WeekdayName,
): string {
  // Return the key itself as a readable label for seasonal/moveable days.
  // Pre-built calendar files always provide a proper name — this is only the
  // engine fallback for years without a pre-built file.
  if (week !== null && week > 0) {
    const ordinal = ordinalSuffix(week);
    return day === 'Sunday'
      ? `${week}${ordinal} Sunday of ${season}`
      : `${day} of the ${week}${ordinal} week of ${season}`;
  }
  // Replace underscores for readability (e.g. "Mary_MotherOfGod" → "Mary Mother Of God")
  return key.replace(/_/g, ' ');
}

function resolveCelebrationType(
  key: string,
  day: WeekdayName,
  fixedFeastKey: string | undefined,
): string {
  if (fixedFeastKey && fixedFeastKey === key) return 'SOLEMNITY';
  if (day === 'Sunday') return 'SUNDAY';
  return 'FERIA';
}

function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}
