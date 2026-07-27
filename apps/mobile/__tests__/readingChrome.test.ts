import { decideChrome } from '../src/utils/readingChrome';

describe('decideChrome', () => {
    it('always shows near the top regardless of direction', () => {
        expect(decideChrome(0, 0)).toBe('show');
        expect(decideChrome(50, 5)).toBe('show'); // scrolled back to top
        expect(decideChrome(0, 8)).toBe('show'); // at threshold
    });

    it('hides when scrolling down past the delta threshold', () => {
        expect(decideChrome(100, 130)).toBe('hide');
    });

    it('shows when scrolling up past the delta threshold', () => {
        expect(decideChrome(300, 270)).toBe('show');
    });

    it('does nothing for negligible movement (anti-jitter)', () => {
        expect(decideChrome(200, 203)).toBe('none');
        expect(decideChrome(200, 197)).toBe('none');
    });

    it('respects custom thresholds', () => {
        expect(decideChrome(200, 220, { deltaThreshold: 30 })).toBe('none');
        expect(decideChrome(200, 240, { deltaThreshold: 30 })).toBe('hide');
        expect(decideChrome(5, 12, { topThreshold: 20 })).toBe('show');
    });
});
