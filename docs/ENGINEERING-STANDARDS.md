# Engineering Standards — St. Kizito

The rules every change follows. The `st-kizito-*` skills carry the operational depth; this is the
human-readable charter. When a standard and a skill disagree, fix one — they must stay consistent.

## Principles

1. **Correctness of liturgy beats everything.** Never invent liturgical rules/text. → `st-kizito-liturgical-domain`.
2. **Offline-first is a promise.** No screen dead-ends without network. → `st-kizito-data-and-state`.
3. **Premium by default.** Every screen ships loading + error + empty states, a11y, light/dark. → `st-kizito-premium-ui`.
4. **Budget-aware.** APK < 60 MB; no unjustified dependency. → `st-kizito-bundle-budget`.
5. **Feature-by-feature on a branch.** Never commit to `main`; commit/push only when asked.
6. **Measure before optimizing.** 60 FPS target. → `st-kizito-mobile-performance`.

## Architecture rules

- Data flow: `screen → hook → service → data/Supabase`. **No fetch/Supabase in a screen.**
- Pure logic in `utils/`/`domain/` (no React/I/O) so it's testable.
- Styling from `theme/` tokens only; liturgical color via `getLiturgicalHex`. No hardcoded hex/px.
- Render liturgy through `components/liturgical/*`; UI through `components/ui/*`. No inline duplicates.
- No new `packages/` shared workspace / no cross-app imports without discussion. → `st-kizito-architecture`.

## Conventions

- Components `PascalCase.tsx`; hooks `useX.ts`; services `x.api.ts`/`camelCase.ts`; types `x.types.ts`;
  stores `useXStore.ts`. Liturgy looked up by canonical `key`, never re-derived strings.
- TypeScript everywhere; no `any` in domain logic. Types live in the right `*.types.ts`.
- Match surrounding style, naming, and comment density. Remove dead code (don't reintroduce stubs).

## Tooling gaps to close (tracked)

- **No CI/CD** (`.github/` absent) — add: PR runs typecheck + `jest`; merge to `main` → `eas update
  --channel preview`; release tag → build/submit/OTA (see `st-kizito-release`).
- **No ESLint/Prettier** — add shared config to both apps; enforce in CI.
- **Two caching systems** (`useCachedData` + TanStack Query) — converge on TanStack + AsyncStorage persister.
- **No error monitoring** — adopt Sentry with PII scrubbing (`st-kizito-observability`).
- **Web has no tests** — add auth/route + form tests.

## Quality gates (per PR)

Architecture · liturgical correctness (+test) · performance · bundle size · security · a11y · offline ·
maintainability · testing · release-awareness. Full rubric: `st-kizito-code-review`.
