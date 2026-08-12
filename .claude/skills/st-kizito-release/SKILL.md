---
name: st-kizito-release
description: Project (St. Kizito). The mobile release & deployment process — EAS build/submit profiles, OTA (EAS Update) vs new-binary decisions, runtimeVersion, staged rollout, versioning, Supabase migration discipline, and web (Vercel) deploys. Read before shipping, cutting a release, publishing an OTA update, bumping versions, or migrating the database. Complements the installed eas-* skills with project rules.
version: 1.0.0
---

# St. Kizito Release

Ship feature-by-feature, on a branch, promoting the **same commit** across channels. For EAS mechanics
use the installed `eas-app-stores` / `eas-workflows` / `eas-update-insights` skills; this adds the
project rules.

## Build profiles (`apps/mobile/eas.json`)

`development` (dev client, internal) · `preview` (internal distribution QA) · `production`
(`autoIncrement` versionCode, store submit). `appVersionSource: remote`. Run **eas/expo from
`apps/mobile`, never the repo root** (a stray root `app.json` builds the wrong project — audit §1.3).

> Local Android builds currently fail (Gradle 9 / `IBM_SEMERU`, audit §1.1). **Use EAS Build for dev
> clients** until the toolchain pin is fixed via config plugin. There has never been a green dev build —
> first milestone is producing one.

## OTA vs new binary — the decision rule

**If `runtimeVersion` changes, you need a new binary.** Otherwise OTA is eligible.

- **OTA-eligible (EAS Update, instant):** anything in the JS bundle or bundled assets — screens, styling,
  liturgical *rendering* fixes, copy, business logic, bundled images. Ship: `eas update --channel <ch>`.
- **Requires new AAB/APK:** native code/config changes — add/remove native module, permissions, `app.json`
  native fields, icon/splash native config, SDK upgrades, `expo-notifications`/`expo-sqlite` version bumps,
  anything altering the native runtime.
- **Data caveat:** the liturgical JSON ships *in the bundle*, so corrected liturgical **data** can go OTA —
  but mind the bundle budget (`st-kizito-bundle-budget`); a 24 MB office file re-download per update is
  costly. Prefer targeted data fixes.

## Distribution & size

- **Store = AAB** (per-ABI split → ~25–40 MB/device). Never ship a universal APK to represent size.
  Direct-install APK = ABI-split / `arm64-v8a`. Enable R8/Proguard shrinking for release. See bundle skill.

## Versioning

- User-facing `version` (semver) in `app.json`; let EAS auto-increment Android `versionCode` (production).
- `runtimeVersion` policy `appVersion` (set) — OTA only targets compatible binaries.
- Tag releases; map git SHA / runtimeVersion to monitoring (Sentry) so error spikes trace to a release.

## Rollout & rollback

- **Staged rollout always** — OTA to a small % first (`eas-update-insights` to watch crash/adoption),
  then widen. Store: Play staged rollout.
- **Rollback:** OTA → republish previous known-good update to the channel (updates are immutable) or
  `eas channel:edit`. Binary → halt Play rollout, resume prior release.

## Supabase migrations (backend release discipline)

- Schema source of truth: `infra/supabase/schema.sql`; incremental changes as **idempotent** SQL in
  `apps/web/db/*.sql` (the sacrament migration is the template: `IF NOT EXISTS`, `ADD COLUMN IF NOT
  EXISTS`, guarded policies).
- **Additive & backward-compatible by default** (nullable/defaulted columns, backfill) so old app binaries
  keep working. Gate any breaking API change behind a `runtimeVersion` bump + deprecation window — never
  ship a breaking DB change without a matching new binary.
- Apply migrations in the Supabase SQL editor; keep the checked-in SQL the record of truth.

## Web (apps/web)

- Next.js 16 → Vercel (`@vercel/analytics` present). `npm run build` from `apps/web`. Env/secrets in
  Vercel (service-role key server-only). Web and mobile share the DB — coordinate schema changes so both
  keep working.

## Pre-release checklist

Use `docs/RELEASE-CHECKLIST.md`. Minimum: `npm test` green, no TS errors, bundle measured if deps/data
changed, OTA-vs-binary decided, staged rollout planned, migrations idempotent + additive, monitoring in place.

## References

- `apps/mobile/eas.json`, `app.json`; `infra/supabase/schema.sql`, `apps/web/db/*.sql`
- `docs/ENGINEERING-AUDIT.md §8` (deploy strategy), `docs/RELEASE-CHECKLIST.md`
- Installed skills: `eas-app-stores`, `eas-workflows`, `eas-update-insights`, `eas-hosting`
