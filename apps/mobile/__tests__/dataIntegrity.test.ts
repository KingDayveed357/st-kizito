import { getReadings } from '../src/services/liturgicalData';

/**
 * Liturgical data-integrity guard.
 *
 * The app bundles a precomputed liturgical calendar per year (`data/calendar/<year>.json`) and a
 * readings corpus keyed by canonical liturgical key. The product guarantee is: **every day of a
 * bundled calendar year resolves to non-empty, non-placeholder readings.**
 *
 * `BUNDLED_CALENDAR_YEARS` must list exactly the years for which a `data/calendar/<year>.json`
 * exists. Today that is 2026 (the current liturgical year). Extending coverage to 2027+ is a
 * data-pipeline task (generate the year, run `office:verify` + `office:audit`, add it here) — see
 * docs/LITURGICAL-DATA-STRATEGY.md. Do NOT assert years the corpus does not ship; that tests a
 * promise the product never made and forbids inventing liturgical text to satisfy it.
 */
const BUNDLED_CALENDAR_YEARS = [2026];

describe('Liturgical Data Integrity Audit', () => {
  // Spot-check a few high-traffic days across the shipped year.
  const sampleDates = ['2026-01-01', '2026-04-05', '2026-06-15', '2026-12-25'];

  test.each(sampleDates)('date %s should have valid readings', (date) => {
    const readings = getReadings(date);
    expect(readings).not.toBeNull();
    expect(readings?.readings.length).toBeGreaterThan(0);

    // No "unavailable" placeholder text should ever reach a reading body.
    const firstReading = readings?.readings[0].text ?? '';
    expect(firstReading.toLowerCase()).not.toContain('unavailable');
  });

  test.each(BUNDLED_CALENDAR_YEARS)('every day of bundled year %i has readings', (year) => {
    const gaps: string[] = [];
    const start = new Date(Date.UTC(year, 0, 1));

    // Walk the whole calendar year, day by day (UTC to avoid DST/timezone drift on the ISO slice).
    for (let d = new Date(start); d.getUTCFullYear() === year; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const data = getReadings(iso);
      if (!data || data.readings.length === 0) {
        gaps.push(iso);
      }
    }

    if (gaps.length > 0) {
      console.warn(`Year ${year}: ${gaps.length} day(s) with missing readings:`, gaps.slice(0, 10));
    }
    expect(gaps).toEqual([]);
  });
});
