# St. Kizito Parish App

## Pre-requisites
- Expo SDK 55
- NativeWind v4
- Expo Router v3
- Zustand
- TanStack Query v5

## Architecture & Extensibility Guide

### Adding a New Screen
1. Create a new `.tsx` file in the appropriate `/app/` directory (e.g. `/app/settings/index.tsx`).
2. If it belongs in the More tab, add the link to `menuItems` inside `app/(tabs)/more.tsx`.
3. Use primitive components from `/src/components/ui/` only - do not duplicate base styling logic.
4. Import colors via `const { colors } = useTheme();` and stick exclusively to semantic color references. Never hardcode hex values outside of `colors.ts`.

### Adding a New API service
1. Create `filename.api.ts` inside `/src/services/api/`.
2. Define typescript interfaces inside `/src/types/`.
3. Create a custom hook `useFile.ts` in `/src/hooks/` utilizing TanStack logic to fetch and cache responses.
4. No network fetching should occur outside of `/services/api/`.

### Adding a New Offline Data Type
1. Add the SQLite CREATE TABLE statement inside `src/services/offline/database.ts` via `execAsync`.
2. Create an offline service file (e.g., `events.offline.ts`) handling CRUD ops for that table.
3. Update `src/services/offline/seed.ts` if JSON seeding is required on first launch.
4. Incorporate this flow within the domain's custom hook: First verify SQLite records. If no record, try network API and fetch it locally into the SQL Table. If offline, return `isOffline: true`.

### Primitive UI Component Use
- `<Button variant="...">`: Variants available: `primary`, `secondary`, `outline`, `ghost`.
- `<Card elevated accentColor="...">`: Semantic wrapper creating uniform padding and radiuses.
- `<Header showBack leftElement="...">`: Fixed height Top navigation bar. Handle routing internally via router.
- Skeleton loaders: `<SkeletonLoader width="100%" height={24} lines={3} />` Animates opacity.
- Dynamic colors are supplied via NativeWind variables mapping to our `colors` file alongside inline dynamic styling leveraging `useTheme()`.