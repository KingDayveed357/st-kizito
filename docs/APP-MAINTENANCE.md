# App Maintenance & Release

How to ship a change to St. Kizito Parish, and how to undo one.

Two rules before anything else:

1. **Run every `eas` / `expo` command from `apps/mobile`, never the repo root.** A stray root
   `app.json` would build the wrong project.
2. **Run `npm install` from the repo ROOT only.** Installing from `apps/mobile` crashes npm 11
   (arborist null-location bug) in this workspaces layout.

---

## The decision: OTA update, or a new build?

This is the question to answer first, every time. Getting it wrong either wastes a week waiting on
store review, or ships an update that crashes on launch for everyone who takes it.

| You changed | How it ships |
|---|---|
| Screens, components, styling, copy | **OTA** — `eas update` |
| Business logic, validation, hooks, stores | **OTA** |
| Bundled JSON (readings, Divine Office, prayers, inspirations) | **OTA** — but see the size note below |
| Images and fonts already referenced by the bundle | **OTA** |
| Adding or removing **any** dependency with native code | **New build** |
| Expo SDK upgrade | **New build** |
| Anything in `app.json` outside `extra` | **New build** |
| Android permissions, app icon, splash screen, package name | **New build** |
| `expo-notifications` channel/sound configuration | **New build** |
| `version` in `app.json` | **New build** (it *is* the runtime version — see below) |

**The test:** if the change would alter the compiled native binary, it needs a build. When unsure,
run `npx expo-doctor` and `npx expo prebuild --clean` locally and see whether the native projects
change.

### Size note on OTA

The app bundles ~30 MB of liturgical JSON. An OTA update ships the changed assets, so regenerating
`divineOfficeComplete.json` (22.6 MB) means every user downloads it again — frequently on mobile
data. Batch content regeneration with a release rather than pushing it on its own.

---

## Runtime versions — read this before changing `version`

`app.json` sets:

```json
"runtimeVersion": { "policy": "appVersion" }
```

This means **the runtime version equals `expo.version`**. An OTA update is only delivered to
installed builds whose runtime version matches exactly.

It was previously the fixed string `"1.0.0"`, which is dangerous: every build ever made claimed
runtime `1.0.0`, so an update built against new native code would be delivered to an old binary that
did not have it — a crash on launch, for every user who took the update, fixable only by a store
release.

> **The change was safe to make at `version: "1.0.0"`.** Under the `appVersion` policy the computed
> runtime version for 1.0.0 is *also* `"1.0.0"` — identical to the old fixed string, so already
> installed 1.0.0 builds keep receiving updates. Making this change after bumping to 1.0.1 would
> have orphaned every installed build. If it ever needs revisiting, do it at a version boundary.

**Consequence to internalise:** bumping `version` from `1.0.0` to `1.1.0` creates a *new* runtime
version. Builds on 1.0.0 will no longer receive updates published to 1.1.0. That is correct and
intended — but it means **you must publish a build, not just an update, whenever you bump `version`.**

---

## Versioning

| Field | Where | Who sets it |
|---|---|---|
| `expo.version` | `app.json` | You, by hand. Also the runtime version. |
| Android `versionCode` | EAS remote | EAS (`appVersionSource: "remote"`, `autoIncrement: true`) |
| iOS build number | EAS remote | EAS |

Use semantic versioning against user-visible change:

- **Patch** (1.0.0 → 1.0.1) — bug fixes. Usually an OTA; only bump `version` if you are also
  building.
- **Minor** (1.0.0 → 1.1.0) — new features. Requires a build.
- **Major** — a redesign or a breaking change to stored data.

Because `version` is the runtime version, **do not bump it for an OTA-only fix.** Ship the OTA
against the current version; bump when you next cut a binary.

---

## Channels and profiles

`apps/mobile/eas.json`:

| Profile | Channel | Distribution | Artefact |
|---|---|---|---|
| `development` | `development` | internal | dev client |
| `preview` | `preview` | internal | APK |
| `production` | `production` | store | AAB |
| `production-apk` | `production` | internal | APK |

`production-apk` shares the `production` channel deliberately: the parish distributes an APK
directly, and it must receive the same updates as a Play Store install.

---

## Releasing

### An OTA update (JS/content only)

```bash
cd apps/mobile && npx tsc --noEmit && npx jest
```

Publish to preview first and check it on a real device:

```bash
cd apps/mobile && eas update --branch preview --message "Fix booking amount validation"
```

Then production:

```bash
cd apps/mobile && eas update --branch production --message "Fix booking amount validation"
```

### A new build

1. Bump `expo.version` in `app.json` (remember: this changes the runtime version).
2. Build:

```bash
cd apps/mobile && eas build --profile production --platform android
```

3. For the parish's direct APK:

```bash
cd apps/mobile && eas build --profile production-apk --platform android
```

4. Submit to the Play Store:

```bash
cd apps/mobile && eas submit --profile production --platform android
```

---

## Rolling back a bad OTA update

Updates are immutable; you roll back by making an older one current again.

```bash
cd apps/mobile && eas update:list --branch production
```

Then republish the last good commit to the same branch:

```bash
cd apps/mobile && eas update --branch production --message "Roll back to <good-sha>"
```

`eas update:republish --group <id>` does the same without a rebuild of the bundle, and is faster.

Users receive the rollback on their **next launch after** the one that downloads it — with
`checkAutomatically: ON_LOAD`, the update is fetched on launch and applied on the following one. A
rollback is therefore not instant for a user who is mid-session.

**A rollback cannot fix a native crash.** If a build crashes before `expo-updates` initialises,
there is no OTA path in; only a new binary fixes it. This is the whole reason the runtime-version
policy matters.

---

## Database changes

Supabase migrations are **not** covered by EAS. Order matters, because an OTA update reaches devices
in minutes while an APK reaches them over weeks.

**The rule: the database must tolerate both the old and the new client at once.**

1. **Additive first.** Add columns as nullable, or with a default. Never rename or drop a column an
   installed client still writes — this is why `bookings.payment_receipt_url` was not renamed to
   `payment_receipt_path` despite storing a path; APKs in the field still write that name.
2. **Apply the migration before publishing the client** that depends on it.
3. **Deploy the web admin after** the migration (Vercel picks up `main`).
4. Only remove the old column once the analytics show no installed client still uses it.

Migrations live in `apps/web/db/` and are applied by hand in the Supabase SQL Editor, in filename
order. `infra/supabase/schema.sql` is the from-scratch definition and must be kept in step.

Current order for a fresh project:

```
infra/supabase/schema.sql
apps/web/db/create_sacrament_requests.sql
apps/web/db/create_feedback_submissions.sql
apps/web/db/upgrade_payments_and_receipts.sql
apps/web/db/2026_08_security_hardening.sql   ← also seeds admin_users; see the banner in the file
apps/web/db/2026_08_gallery.sql
apps/web/db/add_admin_indexes.sql
```

---

## Before any release

- [ ] `npx tsc --noEmit` clean in `apps/mobile` and `apps/web`
- [ ] `npx jest` green in `apps/mobile`
- [ ] Cold start in airplane mode: readings, Divine Office, prayers and cached parish data all
      resolve, and the offline banner is visible above the tab bar
- [ ] Book a Mass end to end, including a receipt upload, and confirm the admin can open the receipt
- [ ] Submit a sacramental request and confirm its status appears
- [ ] Android gesture navigation **and** 3-button navigation: no toast or banner is obscured
- [ ] Text size at 0.8 and 1.4: no clipped headers, no controls pushed off screen
- [ ] APK size under the 60 MB budget (`docs/BUNDLE-BUDGET.md`)
- [ ] Any new Supabase migration applied to production first

---

## What is still missing

Recorded honestly so nobody assumes otherwise:

- **No CI.** Type checks and tests are run by hand. There is nothing preventing a broken commit
  reaching `main`.
- **No crash reporting.** A crash in a parishioner's hands produces no signal at all — the first
  report will be somebody telephoning the parish office. Sentry is the obvious fix; see
  `docs/MCP-RECOMMENDATIONS.md` and the `st-kizito-observability` skill.
- **No staged rollout.** `eas update` reaches the whole channel at once. For a risky change, publish
  to `preview` and sit on it for a day before promoting.
- **Local Android builds fail** (Gradle 9 / `IBM_SEMERU` toolchain mismatch) — use EAS Build. See
  `docs/ENGINEERING-AUDIT.md §1`.
