# ST Kizito — Production Readiness: Issue Inventory, Blockers & Release Plan

_Date: 2026-08-05 · Companion to `PRODUCTION-READINESS-AUDIT.md` (full architecture audit),
`ENGINEERING-AUDIT.md` (mobile bugs), `ENGINEERING-AUDIT-ADDENDUM.md` (repo-wide)._

> **Evidence rule:** ✅ = reproduced/verified against code or a running server this session.
> 🔍 = needs a device/live-service to confirm (stated, never guessed).

---

## A. Architecture summary

**Ground truth:** npm-workspaces monorepo, `apps/mobile` (Expo SDK 55 / RN 0.83 / Expo Router /
Zustand / TanStack Query / expo-sqlite) + `apps/web` (Next.js 16 App Router / shadcn-Radix) over
**Supabase** (Postgres + RLS + `SECURITY DEFINER` RPC). **No Laravel. No `packages/` workspace.**

**Well designed:** layered mobile data flow (`screen → hook → service → data`); pure liturgical logic
isolated and unit-tested (61 tests); offline-first liturgy (bundled + sqlite); config-driven request
system (bookings/donations/sacraments share anon-insert + `client_request_id` idempotency + status RPC);
coherent design tokens; the no-re-render Reading Mode pattern.

**Poorly designed / debt:** two competing mobile caches (`useCachedData` + TanStack Query); a
**render-time repair parser** for readings (regex mojibake/label stripping) compensating for a dirty
corpus; 35 MB of JSON in the JS graph; a single precomputed calendar year (2026); **no shared
`app/admin/layout.tsx`** (every admin page mounts its own shell client-side → the sidebar "pops in");
stray `apps/web/package-lock.json` breaking workspace-root inference.

---

## B. Issue inventory

| Pri | Issue | Root cause | Area | Proposed fix | Risk |
|---|---|---|---|---|---|
| **P0** | ✅ Admin: every nested `/admin/*` 404s in dev (Overview works) | `turbopack.root` pointed at the **monorepo root**, breaking nested App-Router resolution in `next dev`. Root-root cause: stray `apps/web/package-lock.json` made Next's workspace inference ambiguous, prompting the override. Production `next start` unaffected. **A/B verified: with key → 404; without → 200.** | web | Remove `turbopack.root` (**done**); delete the stray lockfile so inference is correct; re-add `turbopack.root: __dirname` only if still warned | Low |
| **P0** | ✅ Booking insert fails: *"Could not find the `amount`/`payment_receipt_url` column in schema cache"* | `apps/web/db/upgrade_mass_bookings.sql` was **never applied** to the live Supabase. Frontend is correct; DB is behind. | db | Run the migration in Supabase SQL editor; then verify schema cache + inserts | Med (must run) |
| **P0** | ✅ Donation receipts impossible | `donations` table has **no** `payment_receipt_url` column; only `bookings` gets one. Mobile donation flow has no upload. | db+mobile | New migration adding `donations.payment_receipt_url`; reuse `uploadMassReceipt`; wire donation payment screen; admin viewer | Med |
| **P0** | ✅ No crash/error reporting (mobile + web) | Never installed | both | Sentry (`sentry-expo`, `@sentry/nextjs`) + PII scrubbing; hook into existing `ErrorBoundary.componentDidCatch` | Low |
| **P0** | ✅ Store compliance artifacts absent | Never produced | release | Privacy policy page + URL, Play Data Safety, Apple Privacy labels, permission strings, metadata/screenshots | Med |
| **P0** | 🔍 No verified device build | Local Android build fails (Gradle 9 / `IBM_SEMERU`) | build | EAS dev/preview build; config plugin to pin Gradle if local builds wanted | Med |
| **P0** | ⚠️ `RECORD_AUDIO` permission now declared in `app.json` with no audio feature in code | Added externally | release | **Remove unless a feature needs it** — unjustified permissions draw Play rejection + Data-Safety inconsistency | Low |
| **P0** | ⚠️ `runtimeVersion` changed from `{policy:"appVersion"}` to fixed `"1.0.0"` | Changed externally | release | Intentional for bare/OTA stability? If staying managed, `appVersion` policy is safer — a fixed value silently widens OTA targeting across app versions | Med |
| **P1** | ✅ Psalm shows 8–9 broken stanzas instead of 4; response cut / stray bold | **Not the renderer.** `parseUSCCBPsalmText` splits on **every newline** and flushes a stanza per blank-line group, so source line-wrapping (not stanza structure) determines grouping. Response detection is a regex on `R.`/`R/` prefixes; unmatched lines inherit bold. | mobile | Structured psalm model (`{response, stanzas:[{lines[]}], repeatAfterEach}`) produced in the **pipeline**, not at render | Med-High |
| **P1** | ✅ Admin "31 days ago / 120 days ago" | `recent-activity.tsx` has only m/h/**d** buckets — no week/month/absolute rollover, no tz handling | web | Shared `formatRelativeTime()` util with thresholds → absolute date past ~7 days; apply everywhere | Low |
| **P1** | ✅ Admin loads: no sidebar → sidebar → skeletons | **No `app/admin/layout.tsx`.** Each page is `"use client"` and renders its own `<AdminLayout>`, so the shell can't stream; nothing renders until page JS hydrates | web | Add a shared server `app/admin/layout.tsx` rendering sidebar/navbar; pages render only content; skeletons scoped to data | Med |
| **P1** | 🔍 `Can't perform a React state update on a component that hasn't mounted` | Not yet reproduced (needs device). Prime suspects: `useCachedData` (async `setState` after unmount — has `mountedRef` but `persistCache` path can still race), `useMassTimes`, notification/sync listeners in `_layout` | mobile | Reproduce with a dev build; enforce mounted-guards/AbortController in the shared data hooks | Med |
| **P1** | ✅ KeyboardAwareForm: lower fields unreachable | Needs audit of `KeyboardAwareForm` vs `softwareKeyboardLayoutMode: "resize"` + Expo Router nesting | mobile | Single audited keyboard strategy; verify on both OSes | Med |
| **P1** | ✅ Mass times hardcoded UX shape | Options are derived by flattening day-grouped `useMassTimes`; per-slot IDs are lost | mobile+db | Expose slot-level `mass_time_id`; bind booking to a real schedule row | Med |
| **P2** | ✅ Three inconsistent text-control implementations | Copy-paste across Readings/Office/Favourites | mobile | One reusable readability control | Low |
| **P2** | ✅ Divine Office hymn layout; Inspirations truncation w/o "Read more"; liturgical title hierarchy | Presentational | mobile | Typography/layout pass on structured data | Low |
| **P2** | ✅ Admin sidebar polish, onboarding (admin + parishioner) | Not built | both | Dismissible, persisted first-run tours | Low |
| **P2** | ✅ 30 ESLint issues (mostly React 19 `set-state-in-effect`) | Legacy code | web | Pay down, then promote lint to a blocking gate | Low |
| **P3** | Bundle diet (24 MB office JSON out of JS graph), multi-year calendar, Nigerian-proper overlay, realtime admin | — | both | Post-release | — |

### Already fixed & verified earlier this session
Bookmark→date leak and Parish state mutation (single global `selectedDate` written by the dated route →
`dateOverride` prop); calendar scroll-jump + VirtualizedList slow-update (tap no longer scrolls;
per-cell store subscription so only 2 rows re-render); psalm verse-dropping / missing liturgical
endings / text-scale; dashboard infinite skeletons (10s AbortController + error/retry) and the silent
`announcements.author` bug; mobile error boundary; offline Divine Office image; `userInterfaceStyle`.

---

## C. Production blockers (must clear before submission)

1. **Apply `upgrade_mass_bookings.sql`** — bookings currently fail on `amount`/`payment_receipt_url`.
2. **Donation receipt column + flow** — feature is impossible today.
3. **Verified EAS build on a real device** — nothing has been exercised on hardware.
4. **Crash reporting** (Sentry) with PII scrubbing.
5. **Privacy policy + Play Data Safety + Apple Privacy labels**, accurate to what is collected
   (names, phone, intentions, donations, receipt images, notification tokens).
6. **Remove `RECORD_AUDIO`** unless a real feature requires it.
7. **Confirm `runtimeVersion` strategy** matches the actual workflow (managed vs bare).
8. **Native build including `expo-image-picker`** (receipt upload is a native module).

---

## D. Recommended execution order

| Batch | Contents | Why here |
|---|---|---|
| **1. Database truth** | Apply booking migration; add donation receipt column + indexes; verify schema cache, inserts, storage RLS | Everything payment-related is broken until this lands |
| **2. Web routing/shell** | Delete stray lockfile; shared `app/admin/layout.tsx`; relative-time util | Highest-visibility admin defects; low risk; verifiable locally |
| **3. Receipts end-to-end** | Donation upload; admin viewing for both; lifecycle test | Completes the money path |
| **4. Readings correctness** | Structured psalm model in the pipeline + renderer consuming it; test across weekday/Sunday/solemnity/feast/memorial | Liturgical accuracy = core trust |
| **5. Mobile stability** | Reproduce + fix unmounted-setState; keyboard strategy; Mass-schedule binding | Needs the device build from Batch 6 to verify |
| **6. Build + monitoring** | EAS dev/preview build; Sentry both apps | Prerequisite for all device QA |
| **7. Compliance** | Privacy policy, permissions cleanup, Data Safety/Nutrition, metadata | Submission gate |
| **8. Polish** | Text controls, hymn layout, Inspirations, onboarding, sidebar | After correctness |
| **9. Performance** | Bundle diet, query/waterfall audit, lint debt | Measurable, non-blocking |
| **10. Release QA** | Full matrix (§34), upgrade path, offline | Final |

---

## E. Agent division

**Claude (me) — reasoning-heavy, cross-cutting, risky:** schema/migration design and the frontend↔DB
truth reconciliation; the psalm data-model redesign; state-ownership and navigation bugs; the admin
layout/server-boundary refactor; security/RLS review; release configuration; anything touching
liturgical correctness or money.

**Delegate (Antigravity or similar) — well-specified, verifiable, low-blast-radius:** applying the
relative-time util across every timeline component once I define it; ESLint debt cleanup file-by-file;
sidebar/scrollbar styling; onboarding UI once flows are specified; screenshot/metadata asset prep;
mechanical test scaffolding. **Do not delegate:** liturgical parsing, RLS/storage policies, payments,
migrations, or release config.

---

## F. Release checklist (🔴 blocked · 🟡 in progress · 🟢 passed)

### Database & payments
- 🟡 **`upgrade_payments_and_receipts.sql` — WRITTEN, awaiting you to run it in Supabase.**
  Supersedes `upgrade_mass_bookings.sql` (deleted; never applied). Adds `bookings.amount`,
  `bookings.payment_receipt_url`, `bookings.preferred_mass_time`, `donations.payment_receipt_url`,
  the date-range check, and the private `payment-receipts` bucket + policies. Idempotent.
- 🟢 Donation receipt column + upload flow + admin viewing (code complete)
- 🟢 Receipt storage architecture: one private bucket, `bookings/` + `donations/` folders,
  5 MB limit, MIME allow-list, anon-insert / authenticated-read, signed URLs (600s)
- 🔴 Booking + donation insert verified end-to-end against live DB (blocked on the migration)
- 🔴 Admin index migration applied (`add_admin_indexes.sql`)

### Mobile
- 🔴 Green EAS dev build installed on device
- 🔴 Production AAB builds + clean install + upgrade path
- 🟡 Unmounted-setState warning (needs device repro)
- 🟢 VirtualizedList slow-update on calendar select
- 🟢 Bookmark/Parish date-state leakage
- 🟢 Error boundary; offline Divine Office image
- 🟢 Psalm stanza/response structure correct across day types — structured model
  (`parsePsalmText` → `{response, responseCitation, alternateResponse, stanzas[]}`) built in the data
  layer; renderer consumes stanzas. Validated across **all 1,063 psalms in the corpus**: 0 refrain
  leaks, 0 unparsed refrains, 0 empty psalms. Two root causes fixed: (1) refrain repetitions were
  emitted into the verse stream as siblings of stanzas; (2) `stripHeadersAndReferences` removed the
  leading `R.` marker, demoting the opening refrain into stanza 1 and losing its verse citation.
- 🔴 Keyboard: lower booking fields reachable (Android + iOS)
- 🔴 Onboarding

### Web/Admin
- 🟢 Nested `/admin/*` routes resolve — root cause (stray lockfile → bad workspace inference →
  `turbopack.root` override) removed; verified `/admin/login` 200 + all routes 307, zero warnings
- 🟢 Dashboard cannot hang (timeout + retry); announcements appear in activity
- 🟢 Shared dashboard layout — implemented as an `app/admin/(dashboard)/` route group (Option A):
  sidebar now lives in the layout and streams with the first HTML instead of mounting per page;
  `/admin/login` sits outside the group and stays chrome-free. All 15 URLs unchanged, 0 × 404.
  Side fix: login no longer uses `useSearchParams()` (CSR bailout) — params arrive as server props,
  so the form is server-rendered.
- 🟢 Relative-time formatter applied everywhere, tz-aware (`lib/format-time.ts`, `Africa/Lagos`);
  all 7 raw `toLocaleDateString` sites eliminated
- 🔴 Admin onboarding; sidebar polish
- 🟢 Type-safe build (`ignoreBuildErrors` removed); CI gates green

### Security & compliance
- 🟢 Service-role key never client-side; anon key only
- 🟡 RLS permissive-by-design — documented, needs sign-off
- 🔴 Rate limiting on anon inserts
- 🔴 Privacy policy + Data Safety + Apple Privacy labels
- 🔴 `RECORD_AUDIO` removed/justified
- 🔴 `runtimeVersion` strategy confirmed
- 🔴 Git history secret scan
- 🔴 Sentry live in both apps

### Quality
- 🟢 Mobile 61/61 tests, 0 TS errors; web 0 TS errors, build green
- 🔴 Component + web tests; first E2E happy paths
- 🔴 Accessibility pass (TalkBack/VoiceOver, contrast, targets)
- 🔴 QA matrix (§34) executed
