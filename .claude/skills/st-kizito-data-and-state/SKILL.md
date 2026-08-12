---
name: st-kizito-data-and-state
description: Project (St. Kizito). How data and state work in the mobile app — Supabase access, the offline-first cache layer, TanStack Query vs the bespoke useCachedData vs Zustand, sqlite seeding/sync, query keys, RLS access model, and client_request_id idempotency for bookings/donations/requests. Read before adding a network call, a store, a cache, an offline flow, or anything that reads/writes Supabase from mobile.
version: 1.0.0
---

# St. Kizito Data & State

The app is **offline-first**: liturgy is fully local; parish data is cache-first with background refresh.
Never introduce a screen that dead-ends with no network.

## The layers (call inward only)

`screen → hook → service/api → Supabase | bundled data`

- **`src/services/api/supabase.ts`** — the anon-key Supabase client (parishioners are anonymous).
- **`src/services/api/*.api.ts`** — one module per domain (announcements, events, gallery, jobs,
  massTimes, booking, parishService). Services do the querying; hooks wrap them for React.
- **`src/hooks/useX.ts`** — the only layer screens touch. Return `{ data, isLoading, ... }`.

## Three state/caching systems (know which to use)

| System | Use for | Where |
|---|---|---|
| **`useCachedData<T>`** (bespoke, AsyncStorage) | Cache-first parish content that must survive offline | `src/hooks/useCachedData.ts` |
| **TanStack Query v5** | Server state where you want observable `isError`/`isStale`/retry | `QueryClientProvider` in `app/_layout.tsx`; keys in `src/utils/queryKeys.ts` |
| **Zustand** | Client/UI global state (selected date, theme, booking draft, favourites) | `src/store/use*Store.ts` |

**Known debt:** `useCachedData` and TanStack Query coexist (audit §6). Direction: standardize on
TanStack Query with an AsyncStorage persister so there's one observable cache with built-in
`isError`/`isStale`. Until then: **do not add a third pattern.** Prefer TanStack Query for new server
state; only extend `useCachedData` where it already owns the flow.

### `useCachedData` contract & the offline gap
- Genuinely cache-first: loads cache → background `refresh()` → **does not clear cache on fetch failure**
  (errors are swallowed, cached data survives). Good.
- **Gap:** it exposes no `isError`/`hasCache`/`isStale`/`source` flag, so screens can't tell "loading"
  from "offline, no cache." That is the donation offline dead-end (audit §4.1). When you touch it,
  return `{ isError, hasCache, isStale, source: 'cache' | 'network', lastSyncedAt }` and gate destructive
  actions on real availability, with a manual retry.

## Offline / sqlite

- `src/services/offline/`: `database.ts` (expo-sqlite), `seed.ts` (seed bundled liturgy),
  `readings.offline.ts`, `divineOffice.offline.ts`, `syncService.ts`; plus `src/services/sync/syncManager.ts`.
- Readings & office are seeded/bundled → available with zero network. `useReadings` hardcodes
  `isOffline: true` (cosmetic — see liturgical-domain).
- Connectivity: `src/services/network/connectivity.ts` + `useOfflineStatus` + `OfflineBanner`.

## The Supabase access model (RLS)

Parishioners are the **`anon`** role; admins are **`authenticated`**. RLS (in `infra/supabase/schema.sql`):
- Public content (`events`, `mass_times`, `payment_details`, active `parish_contacts`, published
  `announcements`) → `SELECT` for anon.
- Submittables (`bookings`, `donations`, `sacrament_requests`) → `INSERT` for anon (`WITH CHECK (true)`),
  full manage for authenticated admins.
- **Status polling without login:** `public_fetch_request_statuses(text[])` is a `SECURITY DEFINER` RPC
  granted to anon — the app polls booking/donation status by opaque `client_request_id`. Don't expose raw
  row reads to anon for these; use the RPC.

## Idempotency: `client_request_id`

Every submittable record carries a **client-generated unique `client_request_id`**
(`src/utils/requestId.ts`). It:
1. Deduplicates retries (unique index → safe re-submit offline/online).
2. Is the handle for status polling (the RPC above).
Always generate it client-side before the first submit; persist the pending request in its store so a
retry reuses the same id.

## Query keys

Centralize TanStack keys in `src/utils/queryKeys.ts`. Never inline string arrays at call sites — a typo'd
key silently breaks cache invalidation.

## Engineering rules

1. Screens never call Supabase or `axios` directly — always via a hook → service.
2. New server state → TanStack Query with a key from `queryKeys.ts`; don't hand-roll caching.
3. Never clear cached data on a failed refresh. Never disable a user action solely because a *refresh*
   failed if cached data is present.
4. All submittables carry `client_request_id`; reuse it across retries.
5. Respect RLS: anon may insert submittables and read public content + status RPC only. Don't try to read
   admin data with the anon key.
6. Keep `services/*` free of React; keep `store/*` free of I/O side effects beyond persistence.

## References

- `src/hooks/useCachedData.ts`, `useReadings.ts`, `useBooking.ts`, `usePaymentDetails.ts`
- `src/services/api/*`, `src/services/offline/*`, `src/services/sync/syncManager.ts`
- `src/store/*`, `src/utils/queryKeys.ts`, `src/utils/requestId.ts`
- `infra/supabase/schema.sql` (RLS + `public_fetch_request_statuses`)
