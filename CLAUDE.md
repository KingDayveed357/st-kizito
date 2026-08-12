# St. Kizito Parish — Engineering Context (read first)

This is a **monorepo** for a Catholic parish platform: an offline-first **Expo/React Native**
mobile app for parishioners and a **Next.js** admin portal, backed by **Supabase**.

> The README calls the backend "Laravel/Edge Functions" and the repo "Turborepo-ready" — that is
> aspirational. **Ground truth: the backend is Supabase (Postgres + RLS + `SECURITY DEFINER` RPC).
> There is no Laravel, no Turborepo, and no `packages/` shared workspace.** Trust the code, not the prose.

## Repository shape

```
apps/mobile   Expo SDK 55 · RN 0.83 · React 19 · Expo Router · NativeWind v4 · Zustand · TanStack Query v5 · expo-sqlite
apps/web      Next.js 16 · React 19 · Tailwind v4 · Radix/shadcn · Supabase SSR (admin dashboard + landing)
infra/supabase  schema.sql (the source of truth for the DB)
apps/web/db     incremental SQL migrations (sacrament requests, feedback)
data (mobile)   bundled liturgical corpus (~35 MB JSON) + generation/audit scripts
design          per-screen HTML/PNG UX references + PRD
docs            engineering docs (audit, standards, budgets — this library)
```

npm **workspaces** = `apps/mobile`, `apps/web` only.

## Non-negotiable rules (enforced by skills)

1. **`npm install` runs from the repo ROOT only.** Installing from `apps/mobile` crashes npm 11
   (arborist null-location bug). See memory `npm-install-from-root-only`.
2. **APK budget: < 60 MB.** The 35 MB of bundled JSON is the dominant lever, not icons. Never add a
   dependency without justifying it against the budget. → skill `st-kizito-bundle-budget`.
3. **Liturgical correctness beats everything.** Wrong or missing prayer text is worse than a crash.
   Never guess liturgical rules — read skill `st-kizito-liturgical-domain`.
4. **Offline-first is a product promise.** Readings, office, and cached parish data must work with no
   network. Never introduce a screen that dead-ends offline. → skill `st-kizito-data-and-state`.
5. **Every screen ships loading + error + empty states.** → skill `st-kizito-premium-ui`.
6. **Work feature-by-feature on a branch.** Never commit to `main`. Commit/push only when asked.
7. **eas/expo commands run from `apps/mobile`, never the repo root** (a stray root `app.json` would
   build the wrong project).

## Where to look for how-to

Custom project skills live in `.claude/skills/st-kizito-*`. Start with **`st-kizito-architecture`**.
The Expo framework skills (`expo-router`, `expo-native-ui`, `eas-*`, …) are already installed — use
them for framework mechanics; the `st-kizito-*` skills add project-specific rules on top. Don't
duplicate the Expo skills.

Human-facing standards are in `docs/` (ENGINEERING-STANDARDS, PERFORMANCE-BUDGET, BUNDLE-BUDGET,
ACCESSIBILITY-STANDARDS, TESTING-STANDARDS, RELEASE-CHECKLIST, MCP-RECOMMENDATIONS,
LITURGICAL-DATA-STRATEGY, CONTRIBUTING, ONBOARDING). The prior mobile audit is `docs/ENGINEERING-AUDIT.md`.

## Environment notes

- Windows 11 · PowerShell primary shell · Bash tool available for POSIX scripts.
- Local Android build currently fails (Gradle 9 / `IBM_SEMERU` toolchain mismatch) — use **EAS Build**
  for dev clients. See `docs/ENGINEERING-AUDIT.md §1`.
- No CI/CD yet, no ESLint/Prettier configured. Adding these is on the roadmap (see standards docs).
