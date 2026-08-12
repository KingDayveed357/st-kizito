---
name: st-kizito-mobile-performance
description: Project (St. Kizito). Runtime performance rules for the mobile app — avoiding unnecessary re-renders, list virtualization (FlatList over ScrollView), memoization, Reanimated worklets on the UI thread, the reading-mode shared-value pattern, and calendar mount performance. Read before building lists, scroll-driven UI, animations, the calendar, or when anything feels janky. Measure before optimizing; target a steady 60 FPS.
version: 1.0.0
---

# St. Kizito Mobile Performance

The app must open instantly and stay at **60 FPS**. Measure first (Hermes profiler / React DevTools
Profiler / `performance.now`) — never optimize on a hunch.

## Re-render discipline

- **Measuring must not trigger re-renders.** Store `onLayout` offsets in `useRef`, not state. Writing
  fresh objects to state from `onLayout` created the readings-pill flicker feedback loop (audit §3.2):
  layout → setState → re-render → re-measure → oscillation. Compute derived UI from a throttled scroll
  handler and only `setState` when the value actually changes (add hysteresis at boundaries; settle with
  `onMomentumScrollEnd`).
- Memoize expensive children with `React.memo`; memoize callbacks/derived data with `useCallback`/
  `useMemo` when they feed memoized children or effect deps.
- **Zustand:** subscribe with selectors (`useStore(s => s.value)`), never destructure the whole store —
  that re-renders on every unrelated change. Avoid broad Context whose value changes each render.

## Lists & virtualization

- Long/unbounded lists → **`FlatList`/`FlashList`-style virtualization**, never `ScrollView` with a
  `.map()`. Provide stable `keyExtractor`, `getItemLayout` when row height is known, and `React.memo`
  row components. Short, fixed lists (a few rows) may stay in a `ScrollView`.
- The **calendar** must not build a whole month/year eagerly on mount (audit §3.3). Memoize per-day
  liturgical lookups, lazy/virtualize months, and defer non-critical work with `InteractionManager`
  until after the navigation transition so the screen appears immediately.

## Animation (Reanimated 4 + worklets)

- Animations run on the **UI thread** via Reanimated worklets — keep them off the JS thread. Use
  `useSharedValue`/`useAnimatedStyle`; don't drive animation from React state.
- **Reading Mode pattern (reuse it):** immersive auto-hide chrome is a shared value that both the scroll
  handler and the chrome read, so hiding/showing the header+tab bar causes **no re-renders**. See
  `src/components/reading/ReadingModeProvider.tsx`, `ImmersiveTabBar.tsx`, `useReadingChrome`,
  `src/utils/readingChrome.ts`, and memory `reading-mode-architecture`. Apply the same shared-value
  approach to any scroll-driven chrome rather than toggling state.
- Haptics via `expo-haptics` on meaningful interactions — subtle, not constant.

## Startup & assets

- Splash held until fonts + critical data ready (`expo-splash-screen`). Don't block startup on network —
  liturgy is local. Defer non-critical fetches past first paint.
- Use `expo-image` (already a dep) for caching/decoding, not RN `Image`. Right-size images (see
  `st-kizito-bundle-budget`).

## Engineering rules

1. Measure before and after; keep the win, revert the noise.
2. `onLayout`/scroll offsets → `useRef`; `setState` only on real change, with hysteresis.
3. Virtualize any list that can grow; memoize rows.
4. Animations on the UI thread via shared values/worklets; reuse the reading-mode chrome pattern.
5. Subscribe to Zustand with selectors; avoid whole-store and broad-Context churn.
6. Defer heavy work behind `InteractionManager` during transitions (esp. calendar).

## References

- `app/(tabs)/readings.tsx`, `app/calendar.tsx`, `src/components/calendar/*`,
  `src/components/liturgical/CalendarGrid.tsx`
- `src/components/reading/*`, `src/hooks/useReadingChrome.ts`, `src/utils/readingChrome.ts`
- Memory: `reading-mode-architecture`. Audit: `docs/ENGINEERING-AUDIT.md §3.2–3.3`.
