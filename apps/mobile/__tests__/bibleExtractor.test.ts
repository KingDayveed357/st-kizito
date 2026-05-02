import { extractBibleText } from '../src/utils/bibleExtractor';

describe('Bible Extractor', () => {
  test('extracts single verse', () => {
    // Note: This depends on bible.json content. 
    // Assuming 'John 3:16' exists in the mock or real data.
    const result = extractBibleText('John 3:16');
    expect(result.reference).toBe('John 3:16');
    expect(result.verses.length).toBeGreaterThan(0);
  });

  test('extracts range of verses', () => {
    const result = extractBibleText('Genesis 1:1-3');
    expect(result.verses.length).toBe(3);
  });

  test('handles multiple chapters', () => {
    const result = extractBibleText('Psalm 23:1; 24:1');
    expect(result.verses.length).toBe(2);
  });

  test('normalizes references with liturgical suffixes', () => {
    const result = extractBibleText('Matthew 5:1a');
    expect(result.reference).toBe('Matthew 5:1a');
    // The internal normalization should strip 'a'
  });

  test('returns empty for invalid reference', () => {
    const result = extractBibleText('');
    expect(result.text).toBe('');
  });

  test('resolves Tobit abbreviation mapping safely', () => {
    const result = extractBibleText('Tb 1:1');
    expect(result.reference).toBe('Tb 1:1');
    expect(Array.isArray(result.verses)).toBe(true);
  });
});
