---
name: st-kizito-premium-ui
description: Project (St. Kizito). The premium-UX bar every screen must clear — loading, error, and empty states, skeletons, accessibility, responsive layout, subtle animation, professional typography and spacing, and text-scale support. Read before building or reviewing any screen. Enforces that no screen ships with only a happy path. Pairs with st-kizito-design-system (tokens) and st-kizito-accessibility.
version: 1.0.0
---

# St. Kizito Premium UI

This is a premium spiritual product. Every screen must feel calm, reverent, and finished. A screen with
only a happy path is **not done**.

## The four states — every data-backed screen ships all of them

1. **Loading** — a skeleton (`src/components/ui/SkeletonLoader.tsx`), never a bare spinner on a blank
   screen for content that has a known shape. Match the skeleton to the real layout.
2. **Error** — a human message + a **retry**. Never a dead-end. For offline specifically, say so and keep
   any cached content usable (see `st-kizito-data-and-state` — don't disable actions just because a
   background refresh failed).
3. **Empty** — use `src/components/ui/EmptyState.tsx` with a meaningful icon, one-line explanation, and
   (where relevant) a next action. "No bookings yet" ≠ a blank list.
4. **Success/content** — the real UI, with correct typography, spacing, and text-scale support.

## Premium checklist (per screen)

- [ ] Loading skeleton matching final layout
- [ ] Error state with retry (and offline-aware copy where data is remote)
- [ ] Empty state with icon + guidance
- [ ] Safe-area respected (top notch + bottom gesture bar; tab bar uses insets)
- [ ] Long-form text scales with `useTheme().textScale` (readings, office, reflections)
- [ ] Accessibility: labels, ≥ 44×44 touch targets, contrast, screen-reader order (→ `st-kizito-accessibility`)
- [ ] Responsive to small (Pixel 6) and tall gesture-nav devices; no clipped/overlapping UI
- [ ] Animations subtle (fades, gentle springs) — never bouncy or attention-grabbing during prayer
- [ ] Light + dark themes both correct (`useTheme()`), no hardcoded colors
- [ ] Uses design-system primitives from `components/ui/` (Button, Card, Chip, Badge, Divider, Header,
      SegmentedControl, StatusModal, Toast, OfflineBanner, ScrollToTopButton), not one-off styling

## Typography & spacing

- Fonts: **NotoSerif** for liturgical/reading body (reverent, readable), **Inter** for UI chrome. Tokens
  in `src/theme/typography.ts` + `spacing.ts` — never hardcode sizes. See `st-kizito-design-system`.
- Generous line-height and margins for prayer text; reading surfaces support the `TextSizeControl` and
  Reading Mode (`st-kizito-mobile-performance`).

## Animation

- Reanimated UI-thread animations only; subtle and purposeful. Reading Mode auto-hide chrome is the
  reference for scroll-driven motion. Haptics sparingly on meaningful taps.

## Design references

Per-screen HTML/PNG UX references live in `design/ui-ux/*` (home, daily_readings, divine_office_hub,
liturgical_calendar, book_a_mass, booking_confirmed, daily_inspiration, favourites, parish_hub,
payment_details, morning_prayer, settings, st_kizito_history, sacred_parchment). Use them as the visual
target; the PRD is `design/ui-ux/st._kizito_parish_app_prd.html`. Match the design, then apply the four
states + a11y on top.

## Engineering rules

1. No screen merges without loading + error + empty states.
2. No hardcoded colors/sizes — theme tokens only; light+dark both verified.
3. Long-form liturgical text must honor `textScale`.
4. Reuse `components/ui/*` primitives; don't reinvent buttons/cards/modals.
5. Verify on a short device and a tall gesture-nav device before calling it done.

## References

- `src/components/ui/*` (SkeletonLoader, EmptyState, StatusModal, Toast, OfflineBanner, …)
- `src/theme/*`, `src/hooks/useTheme.ts`, `src/components/ui/TextSizeControl.tsx`
- `design/ui-ux/*`; `docs/ENGINEERING-AUDIT.md §3` (state/nav bugs)
- Related skills: `st-kizito-design-system`, `st-kizito-accessibility`, `st-kizito-mobile-performance`
