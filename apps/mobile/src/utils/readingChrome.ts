export type ChromeAction = 'show' | 'hide' | 'none';

export interface ChromeDecisionOpts {
    /** Always show when within this many px of the top. */
    topThreshold?: number;
    /** Minimum scroll delta before reacting (avoids jitter / accidental triggers). */
    deltaThreshold?: number;
}

/**
 * Pure decision for the immersive reading chrome: should it show, hide, or stay put given a
 * scroll movement from `prevY` to `y`? Kept pure so the interaction is unit-testable and the
 * hook stays a thin adapter.
 *
 * - Near the top → always show (you should never lose navigation at the top of a reading).
 * - Scrolling down past the delta threshold → hide (reclaim space).
 * - Scrolling up past the delta threshold → show (the always-available, no-learning fallback).
 * - Tiny movements → no change (prevents flicker / accidental toggles for shaky hands).
 */
export const decideChrome = (
    prevY: number,
    y: number,
    { topThreshold = 8, deltaThreshold = 6 }: ChromeDecisionOpts = {},
): ChromeAction => {
    if (y <= topThreshold) return 'show';
    const dy = y - prevY;
    if (dy > deltaThreshold) return 'hide';
    if (dy < -deltaThreshold) return 'show';
    return 'none';
};
