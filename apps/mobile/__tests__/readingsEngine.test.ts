import { getReadings } from '../src/services/liturgicalData';

describe('Readings Engine', () => {
  test('returns liturgical readings payload for known dates', () => {
    const dates = ['2026-01-01', '2026-03-19', '2026-04-05', '2026-12-25'];

    for (const date of dates) {
      const payload = getReadings(date);
      expect(payload).not.toBeNull();
      expect(payload?.date).toBe(date);
      expect(payload?.celebration).toBeTruthy();
      expect(Array.isArray(payload?.readings)).toBe(true);
      expect(payload?.readings.length).toBeGreaterThan(0);
    }
  });

  test('remains resolvable across 2000-2040 yearly checkpoints', () => {
    for (let year = 2000; year <= 2040; year++) {
      const date = `${year}-01-15`;
      const payload = getReadings(date);
      expect(payload).not.toBeNull();
      expect(payload?.date).toBe(date);
      expect(Array.isArray(payload?.readings)).toBe(true);
    }
  });
});
