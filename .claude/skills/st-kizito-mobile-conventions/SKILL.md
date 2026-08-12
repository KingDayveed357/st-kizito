---
name: st-kizito-mobile-conventions
description: Project (St. Kizito). React Native + Expo conventions specific to this app — Expo Router structure, NativeWind styling with the theme tokens, safe-area, keyboard UX, forms, DatePicker fallback, notifications, deep linking, and the navigation/tab-bar rules. Read before adding a screen, a route, a form, a native module, notifications, or any RN UI. Complements the installed expo-router / expo-native-ui skills with project rules (don't duplicate those).
version: 1.0.0
---

# St. Kizito Mobile Conventions

Project-specific RN/Expo rules layered on top of the official Expo skills. For framework mechanics use
`expo-router`, `expo-native-ui`, `expo-data-fetching`; this skill covers *how we do it here*.

## Routing (Expo Router)

- Routes live in `app/` and are **thin** — compose hooks + components, no business logic, no fetching.
- Tab group: `app/(tabs)/` = index (home), readings, divine-office, parish, more. Stacks: booking,
  donation, calendar, favourites, history, inspiration, requests, sacraments, settings, readings/[date],
  divine-office/[prayer].
- Dynamic routes use `[param]`. Type navigation via `src/types/navigation.types.ts`.
- **Tab bar must respect safe-area.** Never hardcode `tabBarStyle.height` without adding
  `useSafeAreaInsets().bottom` — a fixed height defeats gesture-nav inset accommodation and crushes
  icons on tall devices (audit §3.1). Use `useTabBarClearance` for content that must clear the bar.

## Styling: NativeWind + theme tokens

- Styling is **NativeWind v4** (Tailwind classes) configured in `tailwind.config.js` / `global.css`.
- **Design tokens are the source of truth:** `src/theme/` (`colors`, `spacing`, `typography`,
  `liturgicalColors`). Read them via `useTheme()`; don't hardcode hex/spacing. Liturgical color always
  comes from `liturgicalColors.ts`. See `st-kizito-design-system`.
- Fonts: NotoSerif (liturgical/reading body) + Inter (UI), loaded async via `expo-font`. Text metrics
  shift when fonts land — never build layout logic that reacts to `onLayout` in a way that loops (audit
  §3.2). Reading long-form text must scale with `useTheme().textScale`.

## Forms & keyboard UX

- Wrap forms in `src/components/ui/KeyboardAwareForm.tsx`; inputs must stay visible above the keyboard.
- Dates use `src/components/ui/DatePickerField.tsx` — it has a **fallback** for when the native
  `@react-native-community/datetimepicker` isn't available (a real prior bug). Keep the fallback path;
  don't assume the native picker exists.
- Validate inline, show clear error state, disable submit only when truly invalid (not merely "not yet
  refreshed"). Reuse `Button`, `Chip`, `SegmentedControl`, `StatusModal`, `Toast` from `components/ui/`.

## Notifications

- `expo-notifications` configured in `app.json` (icon, color, sound). Services:
  `src/services/notifications/notificationService.ts` and `liturgyReminderService.ts`.
- Liturgy reminders are scheduled locally; admin pushes go through Expo push. Request permission
  contextually, not on cold start. Reminder settings: `app/settings/reminder.tsx` + `useNotifications`.

## Deep linking

- `expo-linking` is available; scheme defined in `app.json`. Route params must round-trip through
  `navigation.types.ts`. When adding a linkable screen (e.g. a shared reading `readings/[date]`), verify
  the link opens the correct canonical liturgical `key`/date (see `st-kizito-liturgical-domain`).
- Sharing uses `src/utils/shareApp.ts` and `expo-clipboard`.

## Native modules & config

- Managed workflow (CNG). `android/`/`ios/` are **generated** by prebuild — never hand-edit them; apply
  native config via `app.json` plugins or an Expo config plugin. Adding a native module means a new
  binary (see `st-kizito-release`) and a bundle-size review (see `st-kizito-bundle-budget`).
- Current plugins: expo-router, expo-sqlite, expo-image, expo-splash-screen, expo-notifications, expo-font.

## Engineering rules

1. Screens are thin; logic lives in hooks/services.
2. No hardcoded colors/spacing/fonts — use theme tokens; liturgical color via `liturgicalColors.ts`.
3. Respect safe-area on the tab bar and headers; test on gesture-nav + 3-button devices.
4. Keep the DatePicker fallback and KeyboardAwareForm wrapping.
5. New native module → justify bundle cost + plan a binary release.
6. Never edit generated `android/`/`ios/`.

## References

- `app/(tabs)/_layout.tsx`, `src/hooks/useTabBarClearance.ts`, `useTheme.ts`
- `src/components/ui/*` (KeyboardAwareForm, DatePickerField, Button, StatusModal, Toast, OfflineBanner)
- `src/services/notifications/*`; `src/utils/shareApp.ts`; `app.json`
- Installed skills: `expo-router`, `expo-native-ui`, `expo-data-fetching`
