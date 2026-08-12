# Performance Budget — St. Kizito Mobile

Operational companion to skill `st-kizito-mobile-performance`.

## Targets

| Metric | Budget |
|---|---|
| Sustained frame rate (scroll, animation, nav) | **60 FPS** (no dropped frames on mid-range Android) |
| Cold start to first meaningful paint | ≤ ~2 s (liturgy is local — never block startup on network) |
| Screen transition to interactive | ≤ 1 frame budget of jank; defer heavy work past the transition |
| Readings scroll | No pill flicker; stable active-section; fonts-loaded + cold start |
| Calendar open | No perceptible lag; month build lazy/memoized, not eager |
| List rendering | Virtualized for any growable list; memoized rows |
| Re-renders | Zero measure→setState→re-measure loops; selector-based Zustand |

## Rules (enforced in review)

1. **Measure before/after** (Hermes profiler, React DevTools Profiler, `performance.now`). Keep the win, revert noise.
2. `onLayout`/scroll offsets → `useRef`; `setState` only on real change, with hysteresis at boundaries.
3. Growable lists → `FlatList`/virtualization, never `ScrollView` + `.map()`. Stable `keyExtractor`; `getItemLayout` when possible.
4. Animations on the **UI thread** via Reanimated worklets/shared values; reuse the Reading Mode chrome pattern (no re-renders).
5. Calendar: memoize per-day liturgical lookups; lazy/virtualize months; defer with `InteractionManager` during transitions.
6. Subscribe to Zustand with selectors; avoid whole-store reads and broad Context churn.
7. Splash held until fonts + critical local data ready; defer non-critical fetches past first paint; `expo-image` for images.

## Known perf items (from audit §3)

- Readings pill flicker (feedback loop) — fixed pattern: refs + hysteresis.
- Calendar mount lag — memoize/lazy/defer.
- Text-scale must not trigger layout loops when fonts land.
