---
name: st-kizito-design-system
description: Project (St. Kizito). The design tokens and component library — color system (including liturgical colors and sepia reading theme), typography scale, spacing, radii, the components/ui primitives, and icon usage. Read before styling anything, adding a color/size, creating a UI primitive, or picking an icon. Enforces token-driven styling in both light and dark themes. Pairs with st-kizito-premium-ui.
version: 1.0.0
---

# St. Kizito Design System

All styling flows from tokens in `src/theme/`. **No raw hex, no magic numbers in components.**

## Color tokens (`src/theme/colors.ts`)

- **Surfaces:** `background` (#F9F6F0 / #0F1117), `surface` (#FFFFFF / #1C1F2A), `surfaceElevated`.
  Every color has a `{ light, dark }` pair — read via `useTheme()`, never pick a branch by hand.
- **Text:** `textPrimary`, `textSecondary`, `textMuted` (each light/dark).
- **Brand:** `accent` #4A7C59 (parish green), `accentSoft` #78A485.
- **Liturgical** (`colors.liturgical`, mapped in `liturgicalColors.ts`): ordinaryTime #4A7C59 (green),
  adventLent #6B4E8A (purple), christmasEaster #C9A84C (gold/white), pentecost #B5303C (red),
  marian #3A6EA5 (blue). Plus rose #D88A9F, white #F1F1F1 via `getLiturgicalHex()`.
  **Always resolve liturgical color through `getLiturgicalHex()`** — see `st-kizito-liturgical-domain`.
- **Semantic:** success #2D7A4F, error #B5303C, warning #D4891A.
- **Sepia reading theme:** `colors.sepia` (background #F5ECD7, text #3B2A1A, surface #EDE0C8) for the
  parchment/immersive reading surface.

## Typography (`src/theme/typography.ts`)

- Scale: xs 11 · sm 13 · base 16 · md 18 · lg 20 · xl 24 · 2xl 28 · 3xl 32.
- `readingLineHeight` 1.8 (generous for prayer), `uiLineHeight` 1.4, `readingScale` 1.0 baseline.
- The token file names `serif: 'Georgia'` / `sans: 'System'` as fallbacks, but the app loads
  **NotoSerif** (reading/liturgical body) and **Inter** (UI) via `expo-font`. Use NotoSerif for scripture
  and prayers, Inter for chrome. Keep the token file and loaded fonts reconciled if you change either.
- Long-form text multiplies the base size by `useTheme().textScale` — never hardcode reading font sizes
  (the inline `text-[18px]` psalm was a scaling bug, audit §2.4).

## Spacing & shape (`src/theme/spacing.ts`)

`screenMargin` 24 · `cardRadius` 16 · `buttonRadius` 12 · `buttonHeight` 48 · `headerHeight` 60 ·
`tabBarHeight` 65. Use these; the tab bar height must still add safe-area insets (see
`st-kizito-mobile-conventions`).

## Component library (`src/components/ui/`)

Primitives — reuse, don't reinvent: `Button`, `Card`, `Chip`, `Badge`, `Divider`, `Header`,
`SegmentedControl`, `SkeletonLoader`, `EmptyState`, `StatusModal`, `Toast`, `OfflineBanner`,
`ScrollToTopButton`, `TextSizeControl`, `DatePickerField`, `KeyboardAwareForm`, `CalendarIconButton`.
Feature components live under `components/<feature>/`. Liturgical rendering blocks
(`ReadingSection`, `PsalmBlock`, `AntiphonText`, `HymnBlock`, `PrayerSection`, `PrayerBlockRenderer`,
`ScriptureQuote`) are the single source of truth for prayer typography — render liturgy through them,
never inline (inline copies caused the verse/scaling bugs).

## Icons

`@expo/vector-icons` (Ionicons) on mobile; `lucide-react` on web. Import per-icon (bundle budget). The
sacrament config stores an Ionicons name per type (e.g. `water-outline`) — respect that contract.

## Engineering rules

1. Read colors/sizes from tokens via `useTheme()`; never hardcode hex or px in components.
2. Liturgical color → `getLiturgicalHex()`; reading text → `textScale`.
3. Render liturgy through the `liturgical/` components; render UI through `ui/` primitives.
4. Support light + dark for every new surface; verify both.
5. Per-icon imports only.

## References

- `src/theme/colors.ts`, `typography.ts`, `spacing.ts`, `liturgicalColors.ts`, `index.ts`
- `src/components/ui/*`, `src/components/liturgical/*`, `src/hooks/useTheme.ts`
- `design/ui-ux/*` (visual targets); related: `st-kizito-premium-ui`, `st-kizito-liturgical-domain`
