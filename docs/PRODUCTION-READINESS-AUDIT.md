# St. Kizito — Production Readiness Audit & Enterprise Architecture Review

_Date: 2026-08-05 · Scope: `apps/mobile` (Expo SDK 55 / RN 0.83), `apps/web` (Next.js 16), Supabase.
Author: production-readiness audit pass. Companion to `ENGINEERING-AUDIT.md` (mobile bug audit) and
`ENGINEERING-AUDIT-ADDENDUM.md` (repo-wide)._

> **Method & honesty note.** Findings marked **✅ Verified** were confirmed by reading the code
> (file cited). Findings marked **🔍 Needs device/live verification** could not be fully reproduced this
> session because **(a)** the local Android dev build is blocked (Gradle 9 / `IBM_SEMERU`), so nothing
> can be exercised on-device, and **(b)** there is no access to the live Supabase project or store
> consoles. Those are called out, not hand-waved. This document is Phases 1–4 (audit + roadmap). **No
> production code is changed by this document**; implementation (Phase 5) awaits roadmap approval.

---

## 0. Go / No-Go verdict

**Not yet release-ready.** The app is architecturally sound and feature-complete, but there are
**3 hard blockers** and a set of high-priority reliability/compliance gaps that a Play/App Store review
(and real users on low-end Android) would expose.

| Blocker | Why it blocks release |
|---|---|
| **B1. No green build pipeline on a device** | Local Android build fails (Gradle 9). No dev/preview build has ever been verified on hardware → **zero on-device QA**. You cannot ship what you cannot run. |
| **B2. No crash reporting / error monitoring** | Neither app has Sentry/Crashlytics. A store release with no crash visibility is flying blind; the first production crash is invisible. |
| **B3. Store-compliance artifacts missing** | No privacy policy URL, no Data Safety (Play) / Privacy Nutrition (Apple) declarations for the photos + notifications data you collect; store metadata/assets not assembled. Apple/Google will reject without these. |

Everything else below is prioritized to reach a confident release.

---

## 1. Architecture assessment (Phase 1)

### Strengths (keep)
- **Clean layered mobile architecture**: `screen → hook → service → data`; pure logic isolated in
  `utils/`/`domain/` and unit-tested. Liturgical correctness — the highest-risk area — is the
  best-tested part (61 passing tests).
- **Serious liturgical data pipeline** (scrape → alias-aware coverage audit → calendar-parity verify).
- **Offline-first** readings/office (bundled + sqlite), cache-first parish data that survives failed
  refresh.
- **Config-driven request system** (bookings/donations/sacraments share one anon-insert +
  `client_request_id` idempotency + status-RPC pattern).
- **Coherent design tokens** + reusable `components/ui` + the no-re-render Reading Mode pattern.
- **Web**: standard Next 16 App Router, middleware-gated admin, shadcn/Radix, now an installable PWA
  with a command palette and CSV export.

### Weaknesses / technical debt (grounded)
1. **Two caching systems on mobile** (`useCachedData` + TanStack Query) — fragmentation; `useCachedData`
   exposes no `isError/isStale/source`, which is the source of offline-dead-end risk. → converge on
   TanStack Query + AsyncStorage persister.
2. **Heuristic readings parser** patches dataset defects at render time (regex mojibake cleanup like
   `Ã‚Â¶`, header/reference stripping in `liturgicalData.ts`). Patching bad data at render is fragile.
   → normalize the corpus **in the pipeline**, render from clean structured data (see §6).
3. **No CI/CD** (`.github/` absent), **no ESLint/Prettier** in either app → style drift, no automated
   gates, `next.config.mjs` sets `typescript.ignoreBuildErrors: true` (type errors don't fail the web
   build — dangerous).
4. **Single precomputed calendar year (2026)** → dates outside 2026 fall back to the compute engine and
   can miss `readings.json` keys. Longevity gap.
5. **35 MB bundled JSON** dominates APK size; `divineOfficeComplete.json` (24 MB) is imported into the JS
   graph. → move big corpora to sqlite/on-demand.
6. **Duplicated small helpers** across apps (e.g. `contact-role-meta`) — acceptable at this size; do not
   prematurely extract a shared package.

---

## 2. Verified issues (Phase 2)

### DASH-1 — Admin dashboard can hang on skeletons forever · **High** · ✅ Verified
**Repro (from the provided screenshot):** `/admin` renders all metric cards as skeletons indefinitely.
**Root cause:** `fetchDashboardMetrics` / `fetchDashboardActivity` (`lib/admin-dashboard.ts`) run
`Promise.all` of Supabase queries with **no timeout and no AbortController**. `useDashboardMetrics`
only flips `isLoading=false` in `finally`, i.e. only when the promise *settles*. If Supabase is slow,
**paused (free-tier auto-pause)**, unreachable, or the `NEXT_PUBLIC_SUPABASE_*` env is wrong, the fetch
hangs → `isLoading` stays true → permanent skeletons with **no error and no retry**.
**Affected:** `apps/web/lib/admin-dashboard.ts`, `apps/web/hooks/use-admin-dashboard.ts`,
`apps/web/app/admin/page.tsx` (metric cards have no error branch).
**Short-term fix:** wrap each dashboard load in a timeout (`Promise.race` or AbortController, ~10s);
on timeout/error set an error state; give the metric cards an error+retry branch like `RecentActivity`.
**Long-term fix:** move dashboard reads to a single Supabase **RPC** (`get_admin_dashboard()` returning
counts+recent activity in one round trip) with server-side timeout; adopt TanStack Query on web for
built-in retry/stale/timeout instead of hand-rolled `isLoading`. **Effort:** S (short-term) / M (RPC).
**Regression risk:** low.

### DASH-2 — Activity feed silently drops announcements (bad column) · **Medium** · ✅ Verified
**Root cause:** `fetchDashboardActivity` runs `announcements.select('id,title,created_at,author')`, but
the `announcements` table has **no `author` column** (schema: id, title, content, type, published,
created_at). PostgREST returns an error; Supabase **resolves** the query with `{data:null,error}`;
`announcements.data ?? []` masks it → announcements never appear in the activity feed. The per-row
`item.author ?? 'Parish Office'` is dead defensiveness.
**Fix:** remove `author` from the select (use the `'Parish Office'` constant), and **check `.error` on
every dashboard query** so failures surface instead of silently emptying. **Effort:** XS. **Risk:** none.

### CAL-1 — Selecting a date scrolls the list to the top + VirtualizedList "slow to update" · **High** · ✅ Verified & FIXED this session
**Root cause:** the scroll-on-select effect fired on every `selectedDate` change (including taps),
yanking the tapped row to the viewport top and remounting a large cell batch; `renderItem` also depended
on `selectedDate`, re-invoking across the whole window per tap.
**Fix applied:** taps no longer scroll (a `skipAutoScrollRef` gate; only picker/year-nav/today scroll);
selection is now a **per-cell store subscription** so only the two affected rows re-render.
`apps/mobile/app/calendar.tsx`. Remaining (🔍 needs device profile): consider `windowSize` 11→7–8 if the
warning persists during fast scroll.

### STATE-1 — Bookmarked reading changed the tabs' date (shared state) · **High** · ✅ Verified & FIXED this session
Global `selectedDate` was written by the dated readings route, bleeding into Readings/Office tabs. Fixed
via a `dateOverride` prop (`app/(tabs)/readings.tsx`, `app/readings/[date].tsx`).

### READ-1 — Responsorial Psalm dropped verses / endings missing / text-scale · ✅ Verified & FIXED (prior)
`selectPsalmBodyVerses` (no blind `slice(1)`), render-layer endings (`getLiturgicalClosing`), and
`textScale` on all liturgical surfaces. Covered by `docs/ENGINEERING-AUDIT.md §2` + tests.

### BOOK-1 — Mass booking business rules / receipt upload · ✅ Implemented this session (deploy-gated)
Date-range booking, ₦500/Mass/day min, one-month cap, preferred Mass time, receipt upload. **Requires**
`apps/web/db/upgrade_mass_bookings.sql` + a native build for `expo-image-picker` (see
memory `mass-booking-v2-deploy`).

### HOME-1 — Mojibake separator on Home · ✅ Verified & FIXED this session
`{date} � PARISH OFFICE` → `·`.

---

## 3. New issues discovered (not previously reported)

| ID | Sev | Finding | Verified |
|---|---|---|---|
| NEW-1 | High | **No request timeout anywhere on web dashboard** (DASH-1 is the symptom). Any hung Supabase call = frozen UI. Pattern should be a shared fetch-with-timeout. | ✅ |
| NEW-2 | High | **`typescript.ignoreBuildErrors: true`** in `next.config.mjs` — the web build ships even with type errors (it already masked the `supabase-server.ts` cookie bug). Remove once types are clean. | ✅ |
| NEW-3 | Med | **Divine Office "Daily Manna" loads a remote Unsplash image** (`app/(tabs)/divine-office.tsx`) in an offline-first app → blank/broken card offline, and an external network dependency + privacy consideration. Bundle a local asset or make it graceful. | ✅ |
| NEW-4 | Med | **No account-deletion / data-request path**; parishioner PII (names, phones, intentions, donations) is collected anonymously. Apple/Play require a privacy policy and, where accounts exist (web admin), deletion. Clarify data-subject flows. | ✅ |
| NEW-5 | Med | **`userInterfaceStyle: "light"`** in `app.json` while the app ships a full dark theme — the native chrome is pinned to light. Set to `automatic` and verify. | ✅ |
| NEW-6 | Med | **No error boundary** around route trees / liturgy rendering (mobile) — a render throw white-screens mid-prayer. | ✅ |
| NEW-7 | Low | **Supabase anon key is the only client key**; all admin writes rely entirely on RLS `authenticated` policies (no server authorization layer). Acceptable, but document and keep RLS audited. | ✅ |
| NEW-8 | Low | **`react-native-worklets` + Reanimated 4 / RN 0.83 / React 19** is a bleeding-edge matrix; verify no New-Architecture regressions on a real device before release. | 🔍 |

---

## 4. Security audit (Phase 2)

- **RLS is the perimeter** and is enabled on every table (`infra/supabase/schema.sql`). Anon may read
  public content + insert submittables + read status via the `public_fetch_request_statuses`
  `SECURITY DEFINER` RPC; `authenticated` = admin full manage. **Permissive by design** (`WITH CHECK
  (true)` inserts, `USING (true)` status reads) — acceptable for an account-less parishioner flow, but
  **must be documented as a deliberate decision** and the opaque `client_request_id` is the only thing
  protecting status reads. ✅
- **Service-role key**: never referenced client-side (good). Client uses only the anon key
  (`EXPO_PUBLIC_*`, `NEXT_PUBLIC_*`). ✅
- **Secrets**: `.env` files exist in both apps and are gitignored (`.env*`). Verify none are committed in
  history and that CI/EAS/Vercel hold secrets, not the repo. 🔍
- **Admin auth**: web `middleware.ts` gates `/admin/*` via `supabase.auth.getUser()` and redirects — sound.
  The new receipts bucket is private with anon-insert / authenticated-read RLS. ✅
- **Gaps**: no rate limiting on anon inserts (a bot could spam bookings/donations/requests) → consider a
  lightweight per-IP throttle or a Supabase Edge Function gate; add basic input validation server-side
  (currently client-only). Deep links (`scheme: st-kizito`) should be audited for parameter injection into
  liturgical lookups.

---

## 5. Database & Supabase audit

- Schema is small and reasonable. **Indexing**: `bookings`/`donations` have unique indexes on
  `client_request_id`; `sacrament_requests` indexes status/created/client_req. **Add** indexes for the
  dashboard/admin query patterns: `bookings(status)`, `donations(status)`, `events(start_date)`,
  `announcements(created_at)`, and `*_created_at` order-bys used by the activity feed and list pages.
- **N+1 / round-trips**: the dashboard fires 5 + 4 separate queries per load. Collapse into one
  `SECURITY DEFINER` RPC returning counts + recent activity (also fixes DASH-1 timeout surface).
- **Migrations** are idempotent and split between `infra/supabase/schema.sql` and `apps/web/db/*.sql` —
  keep `schema.sql` the source of truth; the two can drift.
- No realtime subscriptions today; admin lists refetch on focus/manual — fine for scale, but new
  bookings/requests would feel more "live" via a single realtime channel.

---

## 6. Readings & Divine Office system (Phase 2, deep)

**Current pipeline:** `getReadings(date)` → `getCalendar(date).key` → `readings.json` (or USCCB
by-date) → `buildMissalDay` assembles blocks → render. Psalm assembly and endings are correct and
tested. **But** `sanitizeText`/`stripHeadersAndReferences` in `liturgicalData.ts` exist to *repair*
encoding mojibake and stray labels/references at render time — a signal the **source dataset is not
clean**.

**Why Universalis "renders correctly":** it serves pre-cleaned, canonically-structured liturgical text;
it doesn't parse messy HTML at display time. The lesson is architectural: **clean at the source, render
from structure.**

**Recommendation — normalize in the pipeline, don't patch at render:**
1. Add a one-time normalization pass in `apps/mobile/scripts/` that fixes encoding (UTF-8), strips
   embedded labels/references, and emits a **strictly typed** readings schema (blocks with explicit
   `type`, `reference`, `text`, `verses[]`), validated by `office:audit`-style checks.
2. Reduce the render-time parser to a thin, dumb renderer over clean data (delete the regex repair once
   the corpus is clean).
3. Keep the render-layer helpers that are genuinely presentational (endings, Glory Be, textScale).
This is a **redesign of the data contract, not the renderer** — lower risk than rewriting the UI, and it
permanently removes the class of "psalm/format looks wrong" bugs. **Effort:** M–L. Do it behind the
existing tests + a golden-file snapshot per season.

**Divine Office:** structure/typography are good; the remote Unsplash "Daily Manna" image (NEW-3) is the
one offline-first violation. State persistence/offline behave via the same calendar-key model.

---

## 7. Accessibility audit (🔍 mostly needs device + screen-reader verification)

Verified in code: dynamic `textScale` on liturgical text; ≥44×44 touch targets on key controls;
accessibility labels/roles on many buttons. **Gaps to verify/close before release:** systematic
`accessibilityLabel`/`role`/`state` coverage across ALL icon-only buttons; screen-reader reading order
for prayers (antiphon → psalm → Glory Be); AA contrast in light **and** dark **and** sepia; reduced-motion
honoring for Reading Mode + Reanimated; VoiceOver/TalkBack passes on a real device. Web admin inherits
Radix a11y but needs a keyboard + contrast pass (charts need text alternatives). Full standard:
`docs/ACCESSIBILITY-STANDARDS.md`.

---

## 8. Store compliance & release engineering (Phase 2)

| Area | Status |
|---|---|
| iOS `bundleIdentifier` / Android `package` | ✅ `com.dave.js.stkizito`, tablet supported |
| Hermes, `runtimeVersion` (appVersion), EAS `updates.url`, projectId | ✅ set |
| EAS build profiles (dev/preview/production, autoIncrement) | ✅ present; **no green build produced** (B1) |
| Android signing / iOS credentials | 🔍 not verified (EAS-managed credentials assumed; confirm) |
| App icons / splash | present; icons oversized (1.1–1.3 MB) — compress |
| Permissions declared | photos (image-picker), notifications — **need store privacy declarations** |
| Privacy policy URL | ❌ missing (required by both stores) |
| Play Data Safety form | ❌ not prepared (collects names, phone, intentions, donations, photos) |
| Apple Privacy Nutrition labels | ❌ not prepared |
| Account deletion (Apple 5.1.1(v)) | 🔍 parishioners anonymous (likely N/A); confirm no login path |
| Crash reporting | ❌ none (B2) |
| Analytics | web-only (`@vercel/analytics`); mobile none |
| Store metadata/screenshots | ❌ not assembled |
| `userInterfaceStyle` | ⚠️ pinned `light` while app has dark theme (NEW-5) |

---

## 9. Testing strategy (Phase 2)

Current: 11 Jest suites / 61 tests, **pure logic only** (`ts-jest`/node); `jest-expo` +
RN-Testing-Library installed but **not wired**; web has **zero tests**. Plan:
- **Unit** (have): keep liturgical/calendar/psalm/booking-rules coverage; add readings-normalization
  golden snapshots.
- **Component** (new): wire `jest-expo`; test the four screen states + booking form validation.
- **Web** (new): middleware auth redirect, dashboard error/timeout state, CSV export, a critical form.
- **E2E** (new, pre-release): Maestro or Detox happy paths — open readings, book a Mass, submit a
  sacrament request, offline readings — run on the EAS preview build.
- **Manual QA matrix**: low-end Android (2GB RAM), slow/no network, Android 8→15, an iPhone, tablet;
  offline cold start; day-rollover; dark/light/sepia + text scale.

---

## 10. Prioritized roadmap (Phase 3) & implementation plan (Phase 4)

Ranked by (release-blocking → user impact → effort). Each item lists affected surfaces; full
per-item file/rollback detail to be expanded at implementation time.

### P0 — Release blockers
| # | Item | Effort | Files/Surfaces |
|---|---|---|---|
| P0-1 | **Green EAS dev + preview build** (unblock on-device QA) — fix Gradle via config plugin or build on EAS | M | `eas.json`, config plugin, `app.json` |
| P0-2 | **Crash reporting** — Sentry (mobile `sentry-expo`, web `@sentry/nextjs`), PII scrubbing, release mapping | M | root layouts, `app/_layout.tsx`, EAS/Vercel env |
| P0-3 | **Store compliance pack** — privacy policy URL, Play Data Safety, Apple Privacy labels, metadata/screenshots, account-deletion clarity | M | store consoles, `app.json`, web `/privacy` page |
| P0-4 | **Dashboard reliability (DASH-1)** — timeout + error/retry so admin never hangs | S | `lib/admin-dashboard.ts`, `hooks/use-admin-dashboard.ts`, `app/admin/page.tsx` |

### P1 — High (pre-launch quality/correctness)
| # | Item | Effort | Files |
|---|---|---|---|
| P1-1 | **DASH-2** bad `author` column + check `.error` on all dashboard queries | XS | `lib/admin-dashboard.ts` |
| P1-2 | **Remove `ignoreBuildErrors`** + add ESLint/Prettier + CI (typecheck+jest on PR, EAS on merge/tag) | M | `next.config.mjs`, `.github/`, configs |
| P1-3 | **Mobile error boundary** around routes + liturgy rendering | S | `app/_layout.tsx`, new `ErrorBoundary` |
| P1-4 | **Offline-first fix**: Divine Office remote image → local/graceful (NEW-3) | S | `app/(tabs)/divine-office.tsx` |
| P1-5 | **`userInterfaceStyle: automatic`** + verify native chrome dark (NEW-5) | XS | `app.json` |
| P1-6 | **DB indexes** for admin/list/activity query patterns | S | `apps/web/db/*.sql` |
| P1-7 | **Deploy mass-booking v2** (run migration, native build) | S | `apps/web/db/upgrade_mass_bookings.sql` |

### P2 — Medium (maintainability/scale)
| # | Item | Effort |
|---|---|---|
| P2-1 | **Readings corpus normalization pipeline** (§6) — clean-at-source, thin renderer | M–L |
| P2-2 | **Converge caching on TanStack Query** (mobile + web dashboard) with persister | M |
| P2-3 | **Dashboard RPC** (single round trip) + optional realtime for new bookings/requests | M |
| P2-4 | **Bundle diet**: move `divineOfficeComplete.json`/`bible.json` out of JS graph → sqlite/on-demand; compress icons | M |
| P2-5 | **Wire `jest-expo`** + component tests + web tests + first E2E happy paths | M |
| P2-6 | **Rate-limit anon inserts** + server-side validation | M |

### P3 — Polish
| # | Item | Effort |
|---|---|---|
| P3-1 | Premium-UI pass across remaining screens (parish/inspiration/favourites/requests/sacraments): skeletons, empty/error states, a11y labels, haptics | M |
| P3-2 | Extend multi-year calendar generation + Nigerian-proper overlay | M |
| P3-3 | CSV export + command palette actions across remaining admin lists | S |

---

## 11. What this audit did NOT verify (honesty ledger)
- **On-device behavior** (crashes, memory, frame rate, VoiceOver/TalkBack, keyboard, tablet) — blocked by
  B1; requires a green build.
- **Live Supabase** (actual query latency, whether the dashboard hang is a paused project vs. a code
  path) — no project access; DASH-1 is verified as a *missing-timeout architecture* regardless of trigger.
- **Store review outcome** — the compliance gaps are identified; the artifacts themselves are not created.
- **Git history secret scan** — recommended before release.

---

## 12. Recommended next step
Approve a **P0-first** execution order. I recommend starting with **P0-4 + P1-1 (dashboard reliability
& the `author` bug)** because they are small, fully code-verifiable now, and directly fix the behavior in
your screenshot — then **P0-2 (Sentry)** and the **P0-1 build unblock**, which are prerequisites for all
on-device QA. Each change ships incrementally with tests and a rollback note, per Phase 5.
