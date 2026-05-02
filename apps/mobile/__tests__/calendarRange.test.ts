import {
  CALENDAR_MAX_ISO,
  CALENDAR_MIN_ISO,
  buildInitialRange,
  clampWindowSize,
  clampWindowSizeFromEnd,
  ensureDateInRange,
  expandRangeFuture,
  expandRangePast,
} from '../src/domain/calendar/timeline';

describe('Calendar lazy-loading range strategy', () => {
  test('initial range is bounded to 2-year window and clamped to 2000-2040', () => {
    const nearMin = buildInitialRange('2000-01-02');
    expect(nearMin.start).toBe(CALENDAR_MIN_ISO);
    expect(nearMin.end >= nearMin.start).toBe(true);

    const nearMax = buildInitialRange('2040-12-30');
    expect(nearMax.end).toBe(CALENDAR_MAX_ISO);
    expect(nearMax.start <= nearMax.end).toBe(true);
  });

  test('expands future/past without exceeding hard limits', () => {
    const atMax = { start: '2040-01-01', end: CALENDAR_MAX_ISO };
    expect(expandRangeFuture(atMax)).toEqual(atMax);

    const atMin = { start: CALENDAR_MIN_ISO, end: '2000-12-31' };
    expect(expandRangePast(atMin)).toEqual(atMin);
  });

  test('ensureDateInRange includes picker-jumped dates across full supported range', () => {
    const range = buildInitialRange('2026-01-01');
    const jumpedPast = ensureDateInRange(range, '2003-02-26');
    expect(jumpedPast.start <= '2003-02-26').toBe(true);
    expect(jumpedPast.end >= '2003-02-26').toBe(true);
    expect(jumpedPast.start >= CALENDAR_MIN_ISO).toBe(true);

    const jumpedFuture = ensureDateInRange(range, '2039-11-15');
    expect(jumpedFuture.start <= '2039-11-15').toBe(true);
    expect(jumpedFuture.end >= '2039-11-15').toBe(true);
    expect(jumpedFuture.end <= CALENDAR_MAX_ISO).toBe(true);
  });

  test('window clamping keeps active list bounded after repeated pagination', () => {
    let range = buildInitialRange('2026-01-01');
    for (let i = 0; i < 20; i++) {
      range = clampWindowSize(expandRangeFuture(range));
    }

    const startYear = Number(range.start.slice(0, 4));
    const endYear = Number(range.end.slice(0, 4));
    expect(endYear - startYear).toBeLessThanOrEqual(4);

    for (let i = 0; i < 20; i++) {
      range = clampWindowSizeFromEnd(expandRangePast(range));
    }

    const startYear2 = Number(range.start.slice(0, 4));
    const endYear2 = Number(range.end.slice(0, 4));
    expect(endYear2 - startYear2).toBeLessThanOrEqual(4);
  });
});
