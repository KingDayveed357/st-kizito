---
name: st-kizito-architecture
description: Project (St. Kizito). The master map of this parish monorepo — repository philosophy, feature-first organization, module boundaries, dependency rules, naming conventions, and where every kind of code lives. Read this FIRST before adding a feature, moving a file, deciding where new code belongs, or reasoning about how mobile, web, and Supabase communicate. Points to the specialized st-kizito-* skills for each subsystem.
version: 1.0.0
---

# St. Kizito Architecture

The entry point for working in this repo. It tells you **where things live, what may depend on what,
and which specialized skill owns each concern.** When in doubt about placement or boundaries, this skill decides.

## Philosophy

- **Offline-first, reverence-first.** The mobile app is a prayer tool. It must open instantly, work with
  no network, and never show wrong liturgical text. Reliability and correctness outrank cleverness.
- **Feature-first, layered inside.** Code is grouped by domain feature, then by layer (component → hook →
  service → data). A screen never talks to Supabase directly; it goes through a hook → service.
- **The database schema is the contract.** `infra/supabase/schema.sql` + `apps/web/db/*.sql` are the
  source of truth shared by mobile and web. Both apps have their own typed mirror; keep them in sync.
- **Duplication is tolerated over a premature shared package.** There is no `packages/` workspace. Small
  shared concepts (e.g. `contact-role-meta`) are copied in each app on purpose. Do NOT create a shared
  package without a strong, discussed reason — it complicates the Expo/Next build.

## Where things live (mobile — `apps/mobile`)

| Path | Owns | Rule |
|---|---|---|
| `app/` | Expo Router routes only | Thin. Screens compose hooks + components; no business logic, no fetch calls. |
| `src/components/<feature>/` | Presentational + feature components | `ui/` = design-system primitives; `liturgical/`, `booking/`, `parish/`, `calendar/`, `reading/`, `more/` = feature components. |
| `src/hooks/` | React data/behavior hooks | The ONLY layer a screen calls for data. `useX` returns `{ data, isLoading, ... }`. |
| `src/services/` | Non-React logic | `api/` (Supabase + REST), `offline/` (sqlite, seed, sync), `network/`, `notifications/`, `requests/`, `sync/`, plus the liturgical engines. |
| `src/store/` | Zustand global state | `useAppStore` (selected date), `useThemeStore`, `useBookingStore`, `useFavouritesStore`. Persisted via AsyncStorage. |
| `src/domain/` | Pure domain logic (calendar timeline) | No React, no I/O. Fully unit-testable. |
| `src/data/` + `data/` (repo) | Bundled JSON corpus + TS data helpers | `data/` at app root holds the big JSON (readings, office, bible, calendar). |
| `src/theme/` | Design tokens | `colors`, `spacing`, `typography`, `liturgicalColors`. Single source of truth for styling. |
| `src/types/` | Shared TS types per domain | One file per domain (`readings.types.ts`, `divineOffice.types.ts`, …). |
| `src/utils/` | Pure helpers | Dates, formatters, psalm/reading assembly, query keys, strings. Test these. |

## Where things live (web — `apps/web`)

| Path | Owns |
|---|---|
| `app/admin/*` | Admin dashboard pages (announcements, events, bookings, donations, mass-times, payment-details, contact-details, users, feedback, sacrament-config, sacrament-requests, settings). Auth-gated by `middleware.ts`. |
| `app/api/*` | Route handlers (admin login, feedback). |
| `app/page.tsx` + `components/landing/` | Public landing page. |
| `components/ui/` | shadcn/Radix primitives. `components/admin`, `dashboard`, `layout` = composed UI. |
| `lib/` | `supabase.ts` (browser), `supabase-server.ts` (SSR), `admin-dashboard.ts`, `utils.ts`. |
| `hooks/` | `use-admin-dashboard`, `use-logout`, `use-toast`, `use-mobile`. |
| `db/` | Incremental SQL migrations applied in the Supabase SQL editor. |

## How the three tiers communicate

```
Mobile (anon Supabase key)  ─┐
                             ├─► Supabase Postgres  ◄─ RLS enforces access
Web admin (authenticated)   ─┘        │
                                      └─ SECURITY DEFINER RPC (public_fetch_request_statuses)
                                         lets anon poll booking/donation/request status by opaque
                                         client_request_id — see st-kizito-data-and-state.
```

- **Parishioners are anonymous.** Bookings, donations, and sacrament requests are `INSERT` by the `anon`
  role (RLS `WITH CHECK (true)`). No parishioner login exists.
- **Admins are `authenticated`.** The web portal signs in via Supabase Auth; RLS grants
  authenticated users full management.
- **Idempotency + status:** every submittable record carries a client-generated `client_request_id`
  (unique) so retries don't duplicate and the mobile app can poll status offline-safely.

## Dependency rules (do not violate)

1. `app/` → `hooks/` → `services/` → `data/`/Supabase. **Never skip inward** (no fetch in a screen).
2. `components/` may use `hooks/`, `theme/`, `types/`. Components never import `services/api` directly.
3. `domain/` and `utils/` import **nothing** from React, services, or stores — keep them pure & tested.
4. `theme/` is the only place raw colors/spacing/fonts are defined. No hardcoded hex in components
   (liturgical colors come from `theme/liturgicalColors.ts`).
5. Mobile and web never import from each other. Shared truth is the DB schema + duplicated small helpers.

## Naming conventions

- Components: `PascalCase.tsx`. Hooks: `useCamelCase.ts`. Services: `camelCase.ts` or `<domain>.api.ts`.
- Types files: `<domain>.types.ts`. Zustand stores: `use<Name>Store.ts`.
- Liturgical keys are canonical strings (e.g. reading keys in `readings.json`) — never construct them
  ad hoc; use the calendar engine's `key`. See `st-kizito-liturgical-domain`.

## Which skill owns what

| Concern | Skill |
|---|---|
| Liturgy: readings, office, calendar, colors, psalms, endings | `st-kizito-liturgical-domain` |
| Sourcing/validating liturgical data | `st-kizito-liturgical-data-pipeline` |
| Supabase, offline cache, TanStack vs Zustand, sync, RLS access | `st-kizito-data-and-state` |
| RN/Expo/Router/theme/keyboard/notifications/deep-linking | `st-kizito-mobile-conventions` |
| Rerenders, FlatList, memoization, 60fps | `st-kizito-mobile-performance` |
| APK < 60 MB, bundling, tree-shaking | `st-kizito-bundle-budget` |
| Screen states, skeletons, premium polish | `st-kizito-premium-ui` |
| Design tokens, typography, spacing, color system | `st-kizito-design-system` |
| Next.js admin patterns, tables, forms, charts, export | `st-kizito-web-admin` |
| Bookings/donations/sacraments config-driven request pattern | `st-kizito-sacraments-and-requests` |
| Jest, RN Testing Library, what to test | `st-kizito-testing` |
| RLS, secrets, PII, payment handling | `st-kizito-security` |
| a11y for RN + web | `st-kizito-accessibility` |
| Error boundaries, logging, monitoring, analytics | `st-kizito-observability` |
| PR review gates | `st-kizito-code-review` |
| EAS build/submit/OTA, versioning, release | `st-kizito-release` |

## References

- `README.md`, `apps/mobile/README.md`, `apps/web/ARCHITECTURE.md`
- `infra/supabase/schema.sql` — the DB contract
- `docs/ENGINEERING-AUDIT.md` — prior deep audit (bugs + roadmap)
- `docs/ENGINEERING-STANDARDS.md` — coding standards
