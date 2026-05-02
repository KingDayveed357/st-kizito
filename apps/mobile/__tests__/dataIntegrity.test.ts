import { getReadings } from '../src/services/liturgicalData';

describe('Liturgical Data Integrity Audit', () => {
  // Test a sample range to ensure data is present
  const testDates = ['2024-12-25', '2025-04-20', '2026-06-15'];

  test.each(testDates)('date %s should have valid readings', (date) => {
    const readings = getReadings(date);
    expect(readings).not.toBeNull();
    expect(readings?.readings.length).toBeGreaterThan(0);
    
    // Check for "Unavailable" placeholder text
    const firstReading = readings?.readings[0].text;
    expect(firstReading).not.toContain('unavailable');
  });

  test('detects gaps in a 1-year span', () => {
    const gaps: string[] = [];
    const start = new Date('2024-01-01');
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().slice(0, 10);
      const data = getReadings(iso);
      if (!data || data.readings.length === 0) {
        gaps.push(iso);
      }
    }
    
    if (gaps.length > 0) {
      console.warn(`Found ${gaps.length} days with missing readings:`, gaps.slice(0, 5));
    }
    expect(gaps.length).toBe(0);
  });
});
