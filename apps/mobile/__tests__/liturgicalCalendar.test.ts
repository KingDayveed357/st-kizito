import { computeLiturgicalDay } from '../src/services/liturgicalCalendar';

describe('Liturgical Calendar Engine', () => {
  test('correctly computes Christmas 2026', () => {
    const day = computeLiturgicalDay('2026-12-25');
    expect(day.key).toBe('NativityOfTheLord_Christmas');
    expect(day.color).toBe('white');
    expect(day.season).toBe('Christmas');
  });

  test('correctly computes Ordinary Time 2026', () => {
    const day = computeLiturgicalDay('2026-06-15');
    expect(day.season).toBe('Ordinary Time');
    expect(day.color).toBe('green');
  });

  test('correctly computes Easter 2026', () => {
    const day = computeLiturgicalDay('2026-04-05');
    expect(day.key).toContain('Easter');
    expect(day.season).toBe('Easter');
    expect(day.color).toBe('white');
  });

  test('handles 2040 edge case', () => {
    const day = computeLiturgicalDay('2040-12-31');
    expect(day.date).toBe('2040-12-31');
    expect(day.season).toBe('Christmas');
  });

  test('throws error for invalid date', () => {
    expect(() => computeLiturgicalDay('invalid-date')).toThrow();
  });
});

test('computes stable liturgical days across 2000-2040 monthly checkpoints', () => {
  for (let year = 2000; year <= 2040; year++) {
    for (let month = 1; month <= 12; month++) {
      const iso = `${year}-${String(month).padStart(2, '0')}-01`;
      const day = computeLiturgicalDay(iso);
      expect(day.date).toBe(iso);
      expect(typeof day.key).toBe('string');
      expect(day.key.length).toBeGreaterThan(0);
      expect(typeof day.season).toBe('string');
      expect(day.season.length).toBeGreaterThan(0);
      expect(typeof day.color).toBe('string');
      expect(day.color.length).toBeGreaterThan(0);
    }
  }
});
