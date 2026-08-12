# Engineering Audit — Repo-Wide Addendum

_Date: 2026-08-01 · Scope: whole monorepo (the existing `ENGINEERING-AUDIT.md` is mobile-centric; this
adds web, backend, tooling, and cross-cutting findings). No code was modified during this audit._

## Premise corrections (trust code over prose)

- **Backend is Supabase**, not Laravel. No PHP; no Edge Functions beyond the one Postgres RPC.
- **Not a Turborepo.** Plain npm workspaces (`apps/mobile`, `apps/web`). **No `packages/` shared workspace.**
- README/mobile-README describe aspirational architecture; the code is the source of truth.

## Repository & module boundaries

- Feature-first mobile `src/` (components/hooks/services/store/domain/theme/types/utils) with a clean
  inward dependency direction (screen → hook → service → data). Well-organized. Boundaries are mostly
  respected; the known leak is **inline liturgical rendering in `readings.tsx`** duplicating the
  `liturgical/` components (source of the psalm/scaling bugs).
- Web is standard Next.js App Router; admin pages map 1:1 to domain tables.
- **Shared code is duplicated on purpose** (e.g. `contact-role-meta` in both apps). Acceptable at this
  size; a `packages/` extraction is **not** recommended yet (build complexity > benefit).

## Dependency graph / bundle

- Mobile deps are lean and Expo-aligned (SDK 55). The dominant weight is **data, not code**: ~35 MB of
  bundled JSON (`divineOfficeComplete` 24 MB). This is the #1 scalability/size lever. → `BUNDLE-BUDGET.md`.
- Web pulls the full Radix/shadcn set + recharts + embla + vaul — normal for a dashboard; tree-shaken by
  Next. No obvious bloat.

## Backend / data flow

- 7 core tables + sacrament config/requests + feedback. RLS on all; anon insert for submittables;
  authenticated = admin; anon status reads via `public_fetch_request_statuses` (`SECURITY DEFINER`).
- Idempotency via `client_request_id` (unique) across bookings/donations/requests. Solid pattern.
- Migrations are **idempotent** and live in `apps/web/db/` + `infra/supabase/schema.sql`. Good discipline,
  but the two locations can drift — keep `schema.sql` authoritative.

## Cross-cutting gaps (prioritized)

| # | Gap | Impact | Fix |
|---|---|---|---|
| 1 | **No green dev build** (Gradle 9/IBM_SEMERU) | Can't test on-device | EAS dev client (audit §1) |
| 2 | **No CI/CD** (`.github/` absent) | No automated gates | GH Actions: typecheck+jest on PR; OTA on merge; build on tag |
| 3 | **No ESLint/Prettier** | Style drift, avoidable bugs | Add shared config both apps; enforce in CI |
| 4 | **Two caching systems** (`useCachedData` + TanStack) | Fragmentation; offline dead-ends | Converge on TanStack + AsyncStorage persister |
| 5 | **No error monitoring**; analytics web-only | Blind to prod crashes | Sentry + PII scrubbing (`st-kizito-observability`) |
| 6 | **Web has no tests** | Admin regressions unguarded | Auth/route + form tests |
| 7 | **Only 2026 calendar precomputed** | Wrong data outside 2026 | Extend via engine + parity/audit |
| 8 | **No Nigerian-proper overlay** | US-calendar celebrations may be wrong | Overrides source merged over base (`LITURGICAL-DATA-STRATEGY.md`) |
| 9 | Oversized icons (1.1–1.3 MB) | Wasted bundle | Compress to tens of KB |

## Strengths (keep)

- Serious liturgical **data pipeline** (scrape → alias-aware audit → calendar-parity verify) and
  liturgical-logic **unit tests** — the highest-risk area is the best-tested. Rare and good.
- Clean offline-first cache-first behavior (cache survives failed refresh).
- Config-driven request system (add sacraments via a row, not code).
- Coherent design-token system + reusable UI primitives + the no-re-render Reading Mode pattern.

## Verdict

Fundamentally sound, domain-rich app with excellent data-correctness instincts. The work now is
**production hardening** (dev build, CI, monitoring, lint), **size discipline** (move big JSON out of the
JS graph), and **calendar/Nigerian-data completeness** — all captured in the `st-kizito-*` skills and the
budget/standards docs in this folder.
