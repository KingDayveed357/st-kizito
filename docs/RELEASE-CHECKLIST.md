# Release Checklist — St. Kizito

Companion to skill `st-kizito-release`. Run eas/expo from **`apps/mobile`**, never the repo root.

## Before every release

- [ ] On a feature branch (never `main`); the change is scoped to one feature/fix
- [ ] `npm test` green (from `apps/mobile`); no TypeScript errors
- [ ] `/code-review` gates pass (see `st-kizito-code-review`); `/security-review` on auth/RLS/secret changes
- [ ] Liturgical data unchanged, or `office:audit` + `office:verify` re-run and green
- [ ] Bundle measured if deps/data changed; per-device size (from AAB) **< 60 MB**
- [ ] Light + dark + text-scale regression across touched screens; no offline dead-ends
- [ ] Loading/error/empty states present on new/changed screens

## OTA vs binary (decide explicitly)

- [ ] Change is **JS/asset only** → OTA-eligible → `eas update --channel <ch>`
- [ ] Change touches **native code/config/permissions/SDK/native module** → **new AAB/APK required**
- [ ] `runtimeVersion` reviewed — if it changes, a new binary is mandatory
- [ ] Large liturgical-data change: confirm OTA download cost is acceptable (24 MB office file!)

## Build & ship

- [ ] `eas build --profile production` (AAB, autoIncrement versionCode)
- [ ] `version` (semver) bumped in `app.json` if user-facing
- [ ] `eas submit` (store) and/or `eas update --channel production`
- [ ] **Staged rollout** first (small %), watch `eas-update-insights` / Play vitals, then widen
- [ ] Release tagged; git SHA / runtimeVersion mapped to monitoring

## Backend (if schema changed)

- [ ] Migration SQL is **idempotent** (`IF NOT EXISTS`, guarded policies) and lives in `apps/web/db/`
- [ ] Change is **additive/backward-compatible** (old binaries keep working); breaking change gated behind
      a `runtimeVersion` bump + deprecation window
- [ ] `infra/supabase/schema.sql` updated to reflect the new source of truth
- [ ] Web + mobile both verified against the new schema

## Rollback plan

- [ ] OTA: know the previous good update id (republish / `eas channel:edit` to revert)
- [ ] Binary: halt Play staged rollout, resume previous release

## First-time milestones (currently outstanding)

- [ ] A green **EAS development build** exists (none yet — Gradle 9 blocks local builds; audit §1)
- [ ] CI/CD wired (`.github/` — none yet); ESLint/Prettier added
