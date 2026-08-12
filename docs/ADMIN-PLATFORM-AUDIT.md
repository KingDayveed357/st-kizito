# St. Kizito — Admin Platform & Parish Community Experience Audit

**Date:** 7 August 2026
**Scope:** `apps/web` (Next.js 16 admin + landing), Supabase schema/RLS/storage, `apps/mobile` Parish screen
**Method:** Live interactive session against `http://localhost:3000` with a real authenticated admin session and real parish data, correlated against a full read of the codebase and `infra/supabase/schema.sql`.
**Status:** Audit and plan only. No code, schema, or data was modified.

---

## 1. Executive Summary

The admin dashboard is in better structural shape than the brief assumes, and in far worse **content-correctness** shape than the brief assumes.

Three things are true simultaneously:

**(a) Much of the "redesign" you were about to commission is already built and uncommitted in your working tree.** The `(dashboard)` route group exists. `AdminShell` renders from a server layout and reads sidebar state from a cookie to kill the hydration flash. A command palette is wired. Indexes are written. Receipt storage is private with signed URLs. Someone — you or a previous session — already did Phase 2. **Do not re-plan it.**

**(b) The real defect is not layout, it is the data layer.** All 13 admin pages are `"use client"` and query Supabase from the browser after hydration. `loading.tsx` returns `null`. So every navigation shows an empty content region until JS boots, authenticates, and completes a ~1.6–2.2 s round trip. That is the "pop-in then skeletons" you described, and moving things into layouts will not fix it.

**(c) The thing that should actually alarm you is that the parish app is currently lying to parishioners, every day.**

Live, published, visible in the mobile app right now:

| Announcement | Published | Says |
|---|---|---|
| Evening Benediction & Vespers | 6 Apr 2026 | *"Starts in 45 minutes"* |
| Harvest and Bazaar | 6 Apr 2026 | *"comes next Sunday"* |
| Pentecost | 1 May 2026 | *"is coming soon!"* |

All four announcements in the system are `published = true`, four months stale, with **no expiry, no scheduling, no archive, and no unpublish prompt**. There is no mechanism in the schema or the UI that can ever retire them. A parishioner opening the app tonight is told Benediction starts in 45 minutes.

Alongside that: the dashboard's headline **Total Donations ₦317,000 is wrong** — it sums pending and *rejected* donations. The Donations page itself says ₦75,000 approved. Two screens, one system, a 4× disagreement on a financial figure.

**My recommendation in one line:** spend the first phase on correctness and authorization — content lifecycle, the finance figure, and the RLS hole — *before* a single pixel of redesign or a single line of gallery code. The dashboard being prettier while it publishes stale liturgical notices and misreports offerings is the wrong trade.

---

## 2. Live Application Audit — What I Actually Observed

Session: authenticated admin, real parish data (13 donations, 5+ bookings, 4 announcements, 3 events, 13 mass times).

### Load lifecycle (`/admin`, authenticated)

Measured from the live page:

```
TTFB                    194 ms
DOMContentLoaded        283 ms
load                    559 ms
JS transferred          276 KB across 36 requests   (dev build — not a production number)
```

Then, and only then, the data layer starts. Captured from the Resource Timing API:

```
9 unique Supabase REST queries — each fired TWICE (18 total)
duration per query: 1,566 ms – 2,243 ms
all begin ~1,169,000 ms  (i.e. after hydration, not before)
```

The queries are correctly parallel (`Promise.all`), so there is no waterfall *within* the fetch. The waterfall is architectural: **HTML → JS download → hydrate → read auth cookie → 9 queries at ~1.6–2.2 s → paint.** The shell appears fast and the content arrives ~2.5–3 s later.

The double-firing is React StrictMode in dev, which is expected — but it exposes the real issue: **there is no request cache, no dedup, and no shared query client.** Every mount refetches everything. Navigating away and back re-runs all nine queries.

> Note on honesty: the 276 KB / 36 requests figure is a **development** build with HMR and Fast Refresh. Do not quote it as a production bundle size. A production measurement is a Phase 1 task.

### Console

Clean of application errors. Two recurring warnings: preloaded `woff2` fonts not used within a few seconds of load (`Inter`, `Noto_Serif`) — a minor font-loading inefficiency worth fixing, not a defect.

### Route-by-route observations

**`/admin` (Dashboard).** Six metric cards, activity feed, "Operational Pulse" panel.
- `Total Donations ₦317,000` — **incorrect**, includes pending + rejected (verified against the Donations page's own ₦75,000 approved total).
- `Activity Throughput: 10` — this is a **fake metric**. It renders `activity.items.length`, which is the page size. It will read 10 forever. It measures nothing.
- Card subtitles are decorative copy, not information: *"Content heartbeat of the parish"*, *"Prioritize follow-up…"*. They occupy the space where actionable data belongs.
- Activity feed shows visible duplicates: two identical `₦10,000 / Nnanna Chimobi / Pending` donations and two identical `For my family / Ikechukwu / Approved` bookings.
- Mixed time formats in one list: `9 hours ago`, `15 hours ago`, `27 Jul 2026`.
- `Upcoming Events: 0` is technically correct and completely unhelpful — it does not tell the admin that all three events are four months in the past.

**`/admin/events`.** Three events: Community Week, Cathechism, Women VS Men football match — **all dated April 2026**, four months ago. The page renders them as an undifferentiated card list with no past/upcoming split, no status, no archive. An administrator cannot tell at a glance that the entire list is expired. Meanwhile `Public read events USING (TRUE)` means the mobile app shows all three to parishioners as parish events.

**`/admin/donations`.** The strongest page in the app. Status tabs with counts (All 13 / Pending 4 / Approved 8 / Rejected 1), a real table, Export CSV, correct ₦75,000 approved total. Gaps: no search, no date-range filter, no sort control, and **every row shows `Receipt: None`** — the receipt column exists but not one donation has captured one. Two obvious duplicate ₦10,000 rows with no dedupe or merge affordance.

**`/admin/mass-times`.** Real data integrity failures visible on screen:
- **Thursday: 6:00 PM listed twice**, both "Low Mass", both Main Church.
- **Friday: 6:00 PM listed twice** — one "Vigil mass", one "Low Mass". Two different Masses claimed at the same time in the same place.
- Sunday 6:30 AM and 9:00 AM have no `type` at all; 6:00 PM does. Inconsistent.

There is no uniqueness constraint, no conflict detection, no `active` flag, and no concept of a one-off or overridden Mass. The mobile app renders this contradiction to parishioners.

**`/admin/announcements`.** Four announcements, all `Published`, all stale (detailed in §1). Type filter (All / Liturgical / Parish) works. No search, no scheduling, no expiry, no archive.

**`/admin/sacrament-requests`.** Empty. Empty state is the bare string **"No requests found"** — a dead end with no explanation and no next action.

**`/admin/settings`.** Two serious problems.
- **Parish Information is a fake save.** `handleSaveProfile` is a 700 ms `setTimeout` that then reports *"Parish profile preferences saved."* Nothing is persisted; there is no parish-profile table. The fields are pre-filled with **US placeholder data** (`123 Faith Street, Holy City, HC 12345`, `+1 (555) 123-4567`). An admin will correct the parish address, be told it saved, and lose it.
- **Danger Zone is theatre.** A "Delete Parish Data — permanently removes bookings, donations, events" control gated behind typing `DELETE`. It is inert (another `setTimeout`) and reports that deletion is locked. Safe today, but it is a loaded destructive control that does nothing — and if it is ever wired up as written, any authenticated user could trigger it (see §14).

Change Password is genuine and correctly re-authenticates before updating.

**`/admin/users`.** `ComingSoonPanel` placeholder. Disabled in the sidebar with a "Soon" badge.

**`/admin/does-not-exist`.** Drops to Next.js's raw default **"404: This page could not be found."** — no shell, no branding, no navigation, no way back. There is **no `not-found.tsx` and no `error.tsx` anywhere in the app** (verified: zero files).

### Responsive

- **375 px fresh load:** correct. Sidebar off-canvas at `x: -256`, no page-level horizontal scroll, table scrolls inside its own container.
- **Desktop → mobile resize:** **bug.** The sidebar stays pinned open at `x: 0, width: 256` — covering 68% of a 375 px viewport. `AdminShell` guards its mobile default behind a one-shot `useRef`, so once it has run it never re-applies. Resize-only; does not affect real mobile users on first load.
- **919 × 550 (laptop):** **navigation is silently truncated.** The nav needs `scrollHeight: 764px` but has `clientHeight: 413px`. **351 px of navigation is hidden** — 4 of 12 destinations — with no scroll indicator, no fade, no affordance. On a 768 px-tall laptop it is still cut.
- Tables are 804 px wide inside a 375 px viewport: horizontally scrollable but not reformatted. No card fallback.

---

## 3. Route Inventory

| Route | Purpose | Auth | Primary actions | Loading | Empty | Error | Responsive | Problems |
|---|---|---|---|---|---|---|---|---|
| `/` | Landing / APK download | Public | Download APK | SSR | n/a | none | ok | Marketing claim "+2k Active Community" unverified |
| `/admin/login` | Sign-in | Public | Sign in | Inline spinner | n/a | Inline, good | ok | Solid. Rate limited, no open redirect |
| `/admin` | Dashboard | Yes | Refresh | Skeletons | none | Card + Retry | ok | **Wrong ₦ total**, fake throughput metric, decorative copy |
| `/admin/announcements` | Announcements CRUD | Yes | Create/Edit/Delete/Publish | Skeleton | Basic | **none** | ok | No expiry/schedule/archive/search; `alert()`/`confirm()` |
| `/admin/events` | Events CRUD | Yes | Create/Edit/Delete | Skeleton | Basic | **none** | ok | No past/upcoming split, no status, no image, no time-of-day |
| `/admin/mass-times` | Mass schedule | Yes | Create/Edit/Delete | Skeleton | Basic | **none** | ok | **Duplicate/conflicting entries**, no overrides, no active flag |
| `/admin/mass-bookings` | Booking review | Yes | Approve/Reject/Details/Receipt/CSV | Skeleton | Basic | **none** | Table scrolls | No search/date filter; status change unaudited |
| `/admin/sacrament-requests` | Sacrament review | Yes | Status transitions | Skeleton | **Dead-end** | **none** | ok | Bare "No requests found" |
| `/admin/donations` | Donation review | Yes | Approve/Reject/CSV | Skeleton | Basic | **none** | Table scrolls | No search/date filter; no receipts captured; duplicates |
| `/admin/feedback` | Feedback inbox | Yes | Read/triage | Skeleton | Basic | **none** | ok | Largest page (461 lines), untested |
| `/admin/payment-details` | Bank details | Yes | Edit | Skeleton | Basic | **none** | ok | Edits publish straight to mobile, unaudited |
| `/admin/contact-details` | Parish contacts | Yes | CRUD | Skeleton | Basic | **none** | ok | `confirm()` for delete |
| `/admin/sacrament-config` | Request type config | Yes | Configure JSONB form schema | Skeleton | Basic | **none** | ok | Powerful, no validation preview |
| `/admin/settings` | Settings | Yes | Change password | — | n/a | Inline | ok | **Fake save**, inert Danger Zone, US placeholder data |
| `/admin/users` | Users/roles | Yes | — | — | — | — | ok | Placeholder |
| `/admin/logout` | Sign out | Yes | POST | — | — | — | — | Fine |
| `/api/admin/login` | Auth endpoint | Public | POST | — | — | JSON | — | Good: rate limit + redirect allowlist |
| `/api/feedback` | Feedback intake | Public | POST | — | — | JSON | — | Verify rate limiting |
| `/offline` | PWA offline | Public | — | — | — | — | ok | — |
| `*` | **Missing 404** | — | — | — | — | **Raw Next default** | — | No `not-found.tsx`, no `error.tsx` |

---

## 4. UX Audit

**Navigation truncation (P1).** 351 px of nav hidden at laptop heights. Fix: compress section spacing, make section headers sticky, and add a scroll-shadow affordance. The 12 destinations across 4 groups is a reasonable count — the problem is density, not structure.

**No error or not-found boundaries (P0).** Zero `error.tsx`, zero `not-found.tsx`, zero `global-error.tsx`. Any thrown render error or RLS denial produces a white screen. A typo'd URL produces an unbranded Next 404.

**Native `alert()` and `confirm()` (P1).** Seven occurrences across announcements, events, mass-times, contact-details. Browser-chrome dialogs in a system positioned as premium, and `confirm()` for deletes gives no context about what is being destroyed.

**No toast system (P1).** `sonner` is installed. Nothing is wired. Mutations succeed silently — after `handleSave`, the modal closes and the list refetches with no confirmation that anything happened.

**Empty states are dead ends (P1).** "No requests found", "No events scheduled". They explain nothing and offer no action. Your own §25 example is the correct standard.

**Dashboard answers the wrong question (P1).** It reports totals. An administrator arrives asking *"what needs me today?"* — pending bookings, unverified receipts, stale published content, today's Masses. The "Operational Pulse" panel restates three numbers already shown in the cards above it.

**No search anywhere (P2).** No page has a search input. The command palette exists but is navigation-only.

**Mixed date formats (P2).** `9 hours ago` next to `27 Jul 2026` in the same list.

**Accessibility (P1).** `app/layout.tsx` sets `maximumScale: 1, userScalable: false` — this **blocks pinch-zoom**, a WCAG 1.4.4 failure. The parish audience skews older, and `docs/ACCESSIBILITY-STANDARDS.md` makes readable scalable text a stated requirement. Also: several icon-only buttons lack accessible names; `.dark` tokens are defined in `globals.css` and `next-themes` is installed, but **no `ThemeProvider` is mounted**, so dark mode is unreachable dead code.

---

## 5. Workflow Audit

Your §11 template applied to what exists:

**Announcements (current):** Intent → Modal → truthiness check → *(no confirmation)* → insert → *(no feedback)* → refetch → **published forever, no audit**.

Missing: real validation, scheduled publish, expiry, preview, archive, success feedback, audit trail.

**Announcements (recommended):**
```
Intent → "New announcement" → form (zod-validated, live preview of the mobile card)
      → choose: Save draft | Publish now | Schedule for <datetime>
      → set expiry (default: 14 days, required for time-sensitive types)
      → server action → optimistic list update → toast "Published — visible in the app"
      → audit_log entry (who/what/when)
      → dashboard surfaces "3 announcements expire this week"
```

**Mass bookings (current):** Approve/Reject are single unconfirmed clicks that mutate status directly from the browser. No reason capture, no notification to the parishioner, no audit.

**Recommended:** Approve requires the receipt to have been viewed; Reject requires a reason; both write to `audit_log`; both trigger parishioner notification; status history is visible on the detail panel.

**Donations (current):** Same as bookings, on financial records, with no reconciliation step and no receipt captured.

**Recommended:** verification requires either a receipt or an explicit "verified out-of-band" reason; `verified_by` and `verified_at` are recorded; approved-total is the only figure surfaced as "donations".

**Mass times (current):** Free-form create with no conflict check — which is exactly how Thursday and Friday ended up with duplicate 6:00 PM entries.

**Recommended:** unique constraint on `(day_of_week, time, location)`; conflict warning at form level; `active` flag instead of delete; a separate override table for one-off and cancelled Masses.

---

## 6. Missing Capabilities

| Area | Cannot currently | Priority |
|---|---|---|
| Announcements | schedule, expire, archive, preview, search, soft-delete | **P0** (expire), P1 (rest) |
| Events | set a **time of day** (`start_date` is `DATE`), add cover image, gallery, status, archive, distinguish past/upcoming | **P1** |
| Mass times | prevent conflicts, deactivate without deleting, one-off/special Masses, cancel a single date, effective date ranges | **P1** |
| Bookings | search, filter by date, record rejection reason, notify parishioner, see status history | **P1** |
| Donations | search, filter by date, reconcile, capture receipt, dedupe, record who verified | **P1** |
| Parish profile | save *anything* — it is a fake save | **P0** |
| Users/roles | everything — placeholder | P2 |
| Audit | see who changed what, ever | **P1** |
| Global | search content, recover from a mistake (no soft delete anywhere) | P2 |

The single highest-value missing capability is **content expiry**. It is the difference between a parish app that is trusted and one that is ignored.

---

## 7. Architecture Audit

**Current**

```
Client Component page ("use client")
 ├── createClient()            ← browser Supabase client, anon key
 ├── useState/useEffect        ← ad-hoc fetch, no cache, no dedup
 ├── inline query + mutation   ← business logic in the component
 ├── inline validation         ← if (!a || !b) alert(...)
 └── JSX
```

All 13 pages follow this shape. Consequences:
- Nothing renders with data on the server; every page pays hydration + round-trip.
- No shared cache — navigation refetches everything.
- Query shapes, types, and formatting are duplicated per page. `Event`, `Booking`, `Donation` are re-declared inline in each file rather than derived from generated Supabase types.
- Untestable: there is no unit boundary between UI and data.
- `lib/mock-data.ts` (247 lines) is dead code, imported nowhere.

**Recommended**

```
Server Component page          ← awaits data, renders with content in the HTML
 └── lib/queries/<domain>.ts   ← typed reads (server client)
Client island (table/form)     ← interactivity only
 └── app/actions/<domain>.ts   ← "use server" mutations: authz → zod → mutate → audit → revalidatePath
       └── lib/data/<domain>.ts
             └── Supabase
```

Two rules make this concrete:
1. **Reads move to server components.** The admin's slow link stops mattering — the query runs from the server, near Supabase.
2. **Writes move to server actions.** Authorization and validation happen somewhere the browser cannot skip, and every mutation gets one obvious place to write an audit row.

This is the simplest architecture that fixes the performance problem, the validation problem, the authorization problem, and the testability problem at once. It does not require TanStack Query on web — `revalidatePath` plus server components covers the admin's needs. Add a query client only if you later build genuinely interactive real-time views.

**Types.** Generate `database.types.ts` from Supabase (`supabase gen types`) and delete the hand-written inline row types. They will drift otherwise — they already have (`fetchDashboardActivity` carries a comment about an `author` column that does not exist and silently broke the feed).

---

## 8. shadcn/ui Evaluation

**You already have it. All of it. You are not using any of it.**

Measured:

```
components/ui/*.tsx           : 53 files
Never imported anywhere       : 47
Used in admin pages           : 5  (dialog, dropdown-menu, pagination, select, spinner)
Parallel hand-rolled set      : badge-custom, button-custom, card-custom,
                                input-custom, modal-custom, table-custom
Custom-component imports      : 44 across admin pages
```

`package.json` confirms the full stack is paid for and installed: 27 Radix primitives, `cmdk`, `sonner`, `vaul`, `react-hook-form`, `zod`, `recharts`, `react-day-picker`, `next-themes`, `class-variance-authority`, `tailwind-merge`, Tailwind v4.

`zod` and `react-hook-form` are installed and appear **only** inside the untouched `components/ui/form.tsx`. That is why every form validates with `if (!title) alert(...)`.

**Verdict: do not "adopt shadcn/ui". Delete the `-custom` shadow layer and use what you own.**

- **Compatibility:** Next 16 / React 19 / Tailwind v4 — the installed Radix versions are current and correct. No migration risk.
- **Bundle:** shadcn components are source in your repo, tree-shaken per import. Replacing `-custom` with the shadcn equivalents removes duplication rather than adding weight. Net: neutral to smaller.
- **Ownership:** you own the files; customization is editing them. That is the point.
- **Accessibility:** this is the real win. Radix gives focus traps, `aria-*`, keyboard handling, and escape semantics that `modal-custom.tsx` (80 lines) does not.
- **Dark mode:** tokens already exist; mounting `ThemeProvider` makes them live.

**Components you should actually use** (against real requirements found in this audit): `table` + `data-table`, `form` + `field` (with zod), `dialog`, `alert-dialog` (destructive confirms), `sheet` (mobile nav + detail panels), `sonner` (toasts), `select`, `calendar` + `popover` (date pickers for scheduling/expiry), `badge`, `tabs`, `command` (already used), `skeleton`, `empty`, `dropdown-menu`, `switch`, `textarea`.

**Do not install:** `carousel`, `menubar`, `context-menu`, `input-otp`, `resizable`, `navigation-menu`, `hover-card`, `aspect-ratio`, `chart` (until there is a real chart requirement). Several are already sitting unused — delete them.

---

## 9. Design System

You have 150 CSS custom properties in `globals.css` and a Material-ish surface scale (`surface`, `surface-container-low/lowest`, `outline`, `tertiary`). The tokens are not the problem; **consistency of application** is. Pages mix token classes (`bg-surface-container-low`) with raw Tailwind (`bg-green-600/10`, `text-emerald-500`, `text-amber-500`) — status colours in particular are ad-hoc per page.

Recommended foundation:

**Typography.** `Noto_Serif` for page titles and parish-facing content (already loaded, already used on login — extend it consistently); `Inter` for UI, tables, labels. Fixed scale: Page title 24/32 semibold serif · Section 18/28 semibold · Body 14/22 · Table 14/20 tabular-nums · Label 12/16 medium uppercase 0.08em · Helper 12/16 muted.

**Colour.** Keep the existing surface/primary tokens. Add **semantic status tokens** and ban raw colours in pages:
`--status-pending` (amber) · `--status-approved` (emerald) · `--status-rejected` (red) · `--status-draft` (slate) · `--status-published` (emerald) · `--status-expired` (orange) · `--status-info` (blue).
One `<StatusBadge status={...} />` consumes them. Today five pages each invent their own badge colours.

**Numerals.** All currency and counts in `font-variant-numeric: tabular-nums`. Currency through one `formatNaira()` helper — `₦` formatting is currently duplicated in at least three files.

**Component contracts to build once:** `PageHeader` (title + description + actions + breadcrumb), `DataTable` (sort/filter/paginate/empty/loading/row-actions), `StatusBadge`, `ConfirmDialog` (typed intent, names the record), `EmptyState` (icon + explanation + primary action), `FormField` (zod-bound, error + helper), `DateTimeField`, `ImageUploader`, `AuditTrail`, `FilterBar` (search + status + date range).

Build these ten and the feature pages become composition rather than 300-line bespoke files.

---

## 10. Events + Gallery System

This is the one place where I think your instinct is exactly right, and I want to add one constraint.

**The instinct is right:** a parish that can revisit its Harvest & Bazaar photographs is a parish with a memory. That is genuinely different from a social feed, and it is the highest-emotional-value feature in the brief.

**The constraint:** `events.start_date` is a `DATE`. **An event cannot currently have a time of day.** "Harvest & Bazaar, Sunday 12 October" cannot say 10:00 AM. Before galleries, events need to become real objects.

**Recommended model**

```sql
events
  id, slug, title, description
  starts_at TIMESTAMPTZ NOT NULL      -- replaces start_date DATE
  ends_at   TIMESTAMPTZ
  location TEXT, location_note TEXT
  cover_photo_id UUID → event_photos(id)
  status TEXT CHECK (status IN ('draft','scheduled','published','archived'))
  published_at, created_by, updated_at

event_photos
  id, event_id → events(id) ON DELETE CASCADE
  storage_path TEXT NOT NULL          -- parish-media/events/<event_id>/<uuid>.webp
  thumb_path   TEXT NOT NULL
  width, height INT NOT NULL          -- known before load: no layout shift
  blurhash TEXT                       -- progressive placeholder
  caption TEXT, alt_text TEXT
  sort_order INT NOT NULL DEFAULT 0
  bytes INT, created_by, created_at
```

`cover_photo_id` as a nullable FK into `event_photos` (rather than a separate URL column) means the cover is always a real, already-optimized gallery photo. Add the FK **after** both tables exist to avoid a circular dependency.

`width`/`height` stored at upload is what lets both the admin grid and the mobile gallery reserve space and never shift. `blurhash` is ~30 bytes and gives a real progressive experience on a slow Nigerian connection — cheap and high-impact.

**Admin flow:** open event → Photos tab → multi-select upload → client-side resize *before* upload → drag to reorder → caption + alt text inline → set cover → Publish gallery. Publishing the gallery is a distinct action from publishing the event, so photos can be staged privately.

**Moderation:** for a single parish with 1–2 trusted admins, a moderation queue is over-engineering. Publish/unpublish at gallery level is sufficient. Revisit only if you ever accept parishioner submissions.

---

## 11. Mobile Parish Experience

**What already exists** (`apps/mobile/app/(tabs)/parish.tsx`): a four-tab screen — Announcements / Events / Mass Times / Gallery — with pull-to-refresh, offline banner, toast, and an upcoming-liturgy card with reminder toggle. This is more built than the brief implies.

**The problem:** `src/hooks/useGallery.ts` returns **four hardcoded Unsplash stock photographs** behind a fake 300 ms delay:

```ts
setData([
  { id: '1', uri: 'https://images.unsplash.com/photo-1548625361-...' },
  ...
])
```

Parishioners are currently being shown stock photos of unrelated churches presented as their parish gallery. Combined with the four-month-old "Starts in 45 minutes" announcement, the Parish tab is the least trustworthy surface in the app.

**Recommended information architecture** — I would restructure away from four peer tabs, because tabs hide the most important thing:

```
Parish identity header  (name, today's Mass times inline — the #1 lookup)
↓
Needs attention         (only when real: "Harvest & Bazaar this Sunday")
↓
Announcements           (unexpired only, newest first, 3 shown + "See all")
↓
Upcoming events         (horizontal cards with cover image, date, time, location)
↓
Parish memories         (past events WITH galleries — the emotional payload)
↓
Parish information      (contacts, address, giving)
```

A single scrolling surface beats tabs here: the content volume is low, and tabs force a parishioner to hunt for what changed. Keep "See all" routes for depth.

**Event detail:** cover image → title → date/time/location → description → gallery grid → share. **Skip calendar integration in v1** — it needs a native permission prompt for marginal benefit; add it only if parishioners ask.

**Gallery:** 3-column fixed-aspect grid, **not masonry**. Masonry on React Native requires measuring every image and produces jank on the cheap Android devices this app targets. Fixed aspect with `expo-image` (built-in disk cache + `blurhash` placeholder), `FlashList`, page size 30, full-screen viewer with swipe and an `n / total` counter. `alt_text` feeds the screen reader.

---

## 12. Database Architecture

**Findings against the current schema (199 lines, 7 tables):**

| Issue | Severity |
|---|---|
| `auth.role() = 'authenticated'` is the *entire* admin authorization model | **P0** |
| No `updated_at` on any table; no update triggers | P1 |
| No `created_by` / `updated_by` anywhere — attribution is impossible | P1 |
| `events.start_date` is `DATE` — events cannot have a time | P1 |
| No event status/publish lifecycle (`Public read events USING (TRUE)`) | P1 |
| `announcements.published` is a boolean — no schedule, no expiry, no archive | **P0** |
| `mass_times` has no uniqueness constraint → the observed duplicates | P1 |
| `mass_times` has no `active` flag and no override/cancellation table | P1 |
| `bookings.mass_time_id` FK exists but the app writes free-text `preferred_mass_time` — split truth | P2 |
| No `audit_log` table | P1 |
| No soft delete anywhere — deletes are irreversible | P1 |
| No parish profile table (hence the fake Settings save) | **P0** |
| Donation/booking status changes record no actor and no timestamp | P1 |
| `donations`/`bookings` allow `INSERT WITH CHECK (TRUE)` — unauthenticated spam insert | P2 |

**Recommended additions** (migration-safe ordering):

1. `admins (user_id UUID PK → auth.users, role TEXT, created_at)` + `is_admin()` / `has_role()` `SECURITY DEFINER` helpers. Replace **every** `auth.role() = 'authenticated'` policy.
2. `updated_at` + a shared `set_updated_at()` trigger on all mutable tables.
3. `announcements`: `status`, `publish_at`, `expires_at`, `created_by`, `archived_at`. Migrate `published = true` → `status = 'published'`.
4. `events`: `starts_at`/`ends_at` `TIMESTAMPTZ`, `status`, `slug`, `cover_photo_id`, `created_by`.
5. `event_photos` (§10).
6. `mass_times`: `active`, `UNIQUE (day_of_week, time, location)`, `effective_from`, `effective_to`; plus `mass_schedule_overrides (date, mass_time_id, action, note)`.
7. `parish_profile` — single-row table for name/address/phone/email.
8. `audit_log (id, actor_id, action, entity, entity_id, before JSONB, after JSONB, created_at)`.
9. `bookings`/`donations`: `reviewed_by`, `reviewed_at`, `review_note`.

**Migration risk.** Steps 1–2 and 7–9 are additive and low risk. Step 3 needs a backfill (`publish_at := created_at`) and a decision on what `expires_at` should be for existing rows — **I would set them to expired**, since all four are stale. Step 4 changes a column type: do it as add-new-column → backfill → dual-read → drop, not in place, because the mobile app reads `start_date` and an old APK will keep doing so. **This is the one migration that requires mobile coordination** — see §20.

---

## 13. Storage Architecture

Existing: one private `payment-receipts` bucket, 5 MB limit, MIME-restricted, anon INSERT / authenticated READ, short-lived signed URLs. **This is well designed** — keep the pattern.

**For parish media, add a second bucket:**

```
bucket: parish-media    PUBLIC (read)     10 MB limit
layout: events/<event_id>/<photo_uuid>.webp
        events/<event_id>/thumbs/<photo_uuid>.webp
types : image/jpeg, image/png, image/webp, image/heic
```

Public read is correct here — these are photographs the parish *wants* discoverable, and signed URLs would defeat CDN caching and add a round-trip per image on a slow connection. Writes stay `authenticated` + `is_admin()`.

**The critical rule: never store or serve the original.** Resize in the browser (`canvas`) *before* upload:

| Variant | Longest edge | Format | Approx size |
|---|---|---|---|
| Display | 1600 px | WebP q80 | 250–400 KB |
| Thumb | 400 px | WebP q75 | 30–50 KB |

A 4 MB phone original becomes ~400 KB total across both variants — a **~10× reduction** in storage and bandwidth, achieved before a single byte is uploaded, with no dependency on Supabase image transformations (which are plan-gated).

**Orphan handling.** Deleting an `event_photos` row must delete both objects. Do it in a server action (delete objects, then row) and add a scheduled reconciliation job that lists bucket paths without a matching row. Storage orphans are the most common silent cost leak in Supabase projects.

**Existing gap to close:** the `Anon upload payment receipts` policy allows any holder of the anon key — which ships inside the APK — to insert unlimited 5 MB objects into `payment-receipts`, with no path constraint. That is a storage-cost and abuse vector. Constrain the path prefix and add server-side rate limiting.

---

## 14. Security

### P0 — Any authenticated Supabase user is a full parish administrator

Every admin policy in the schema is:

```sql
CREATE POLICY "Admins manage donations" ON donations
  FOR ALL USING (auth.role() = 'authenticated');
```

`auth.role() = 'authenticated'` means **"has any valid JWT"** — not "is an admin". There is no `admins` table, no role claim, no allowlist.

The mitigating factor is that parishioners are anonymous — the mobile app uses the anon key without signing in. The exposure depends entirely on one Supabase setting:

> **Verify immediately: Supabase → Authentication → Providers → Email → "Enable signup".**
> If signup is enabled (it is **on by default**), anyone holding the anon key — which is embedded in your public APK — can `POST /auth/v1/signup`, receive an `authenticated` JWT, and instantly gain **full read/write on bookings, donations, announcements, events, mass times, parish contacts, and bank details**, plus read access to every payment receipt.

That would be remote privilege escalation to full parish admin, exploitable by anyone who downloads the beta APK. **This is the single most urgent finding in this audit.** I could not check the setting from here — it is a dashboard value, not in the repo.

Immediate mitigation, in order: (1) disable email signup, (2) create the `admins` table + `is_admin()`, (3) replace every policy, (4) rotate the anon key.

### Other findings

- **No security headers.** `next.config.mjs` sets cache headers only. Missing CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `X-Content-Type-Options`, HSTS.
- **No authorization layer in the app.** Middleware checks *authenticated*, never *authorized*. Any signed-in user reaching `/admin` gets the full console.
- **Login rate limiting is in-process** (`Map` in the route module). Correctly documented as best-effort; on Vercel's serverless it resets per instance and is close to ineffective. Move to Upstash/Redis before production.
- **Bank details are publicly readable** (`Public read payment details USING (TRUE)`) and editable by any authenticated user, with no audit. An attacker who obtains a JWT could redirect parish donations by editing the account number, and nothing would record it.
- **Public INSERT on `bookings`/`donations`** with `CHECK (TRUE)` — unauthenticated spam insertion is possible.
- **No audit log** for approvals, rejections, payment-detail edits, or content publication.

**Public vs private boundary** (should be explicit and enforced):
*Public:* published announcements (unexpired), published events, published galleries, mass times, parish contacts, bank details.
*Private:* all bookings, all donations, all receipts, all feedback, all sacrament requests, all PII, all audit records.

---

## 15. Performance — Root Causes

You asked me not to assume "move the sidebar into a layout". Correct — that was already done, and it was not the cause.

| Symptom | Actual cause | Fix |
|---|---|---|
| Shell appears, then blank, then skeletons | All 13 pages are `"use client"`; data fetch cannot begin until hydration completes | Move reads to server components |
| Nothing at all during navigation | **`app/admin/(dashboard)/loading.tsx` returns `null`** | Real skeleton matching each page's layout |
| ~2.5–3 s to content | 9 client queries × 1.6–2.2 s each, over the admin's connection | Query from the server, near Supabase |
| Refetch on every navigation | No cache, no dedup, `useEffect` per page | `revalidatePath` + server components; tag-based revalidation |
| Every query fires twice | StrictMode in dev — but exposes the absent cache | Same fix |
| Sidebar flash | **Already fixed** — cookie read in the server layout, passed as `defaultSidebarOpen` | None needed |
| Font preload warnings | `next/font` preloading weights not used above the fold | Subset / adjust preload |

**The single highest-leverage change in this entire audit** is converting page reads to server components. It removes the hydration dependency, moves the 1.6–2.2 s round trip to a fast server-to-Supabase hop, and eliminates the double-fetch — without touching a single visual design decision.

---

## 16. Cost Analysis

**I am not going to quote Supabase, Vercel, or EAS prices.** Plan limits and pricing change, and a financial decision for a parish should not rest on a number I recalled. **Verify current pricing at supabase.com/pricing and vercel.com/pricing before committing.** What I can give you reliably is the *shape* of the cost and which architectural choices move it.

**The cost drivers, ranked:**
1. **Storage bandwidth (egress)** — dominant, and it scales with parishioners × photos × visits.
2. **Storage at rest** — grows monotonically; parish photos are never deleted.
3. Database size — negligible at parish scale (your entire dataset is a few hundred rows).
4. Auth MAU — near zero; parishioners are anonymous.
5. Compute — negligible.

**Scenario modelling (volume, not currency):**

| Scenario | Events/yr | Photos/event | Storage/yr (optimized) | Storage/yr (unoptimized) |
|---|---|---|---|---|
| Current parish | 6 | 40 | ~100 MB | ~1 GB |
| Small | 12 | 60 | ~290 MB | ~2.9 GB |
| Medium | 24 | 80 | ~770 MB | ~7.7 GB |
| Large / high-engagement | 50 | 120 | ~2.4 GB | ~24 GB |

*(Optimized = 1600 px WebP display + 400 px thumb ≈ 400 KB/photo. Unoptimized = 4 MB phone original.)*

**Bandwidth is where it actually bites.** 500 parishioners each browsing one new gallery: 500 × 40 thumbs × 40 KB ≈ **800 MB per gallery per cycle**, plus full-size views. Serve originals instead and that same cycle becomes ~8 GB.

**Architectural decisions that reduce cost, in order of impact:**
1. **Resize before upload** (~10×). Non-negotiable.
2. **Thumbnails for grids** — never let a grid load display-size images (~8× on the most common view).
3. **Public bucket + long `Cache-Control`** — lets the CDN absorb repeat views; signed URLs would force revalidation.
4. **`expo-image` disk caching on mobile** — a parishioner re-opening a gallery should pay zero bytes.
5. **Paginate galleries** (30/page) — do not fetch 120 photos to show 9.
6. **Prune orphans** — reconciliation job.
7. **Stay on the free tier honestly:** the DB will not push you off it; media will. The optimized "Medium" scenario (~770 MB/yr) is the difference between staying free for years and not.

**One caution:** Supabase free-tier projects **auto-pause after inactivity**. `lib/admin-dashboard.ts` already defends against this with a 10 s `AbortController` timeout — good. But a paused project means a parishioner opening the app gets nothing. If this goes to production for a real parish, budget for the lowest paid tier for availability alone, not for capacity.

---

## 17. Code Quality

**Good:** `lib/admin-dashboard.ts` is genuinely well-engineered — abort-bounded queries, explicit error surfacing instead of silent zeros, and comments explaining *why* (the `author`-column regression, the free-tier pause). `lib/format-time.ts` correctly pins the parish timezone so a `DATE` never renders as the previous day. `next.config.mjs` documents two real debugging outcomes rather than just stating config. The login route is careful: rate limiting, redirect allowlist, no user enumeration. Someone has been thinking properly.

**Problems:**

| Issue | Evidence |
|---|---|
| No separation of concerns | All 13 pages mix UI + queries + mutations + validation + state |
| Duplicated types | `Event`, `Booking`, `Donation` re-declared inline per page instead of generated |
| Duplicated formatting | `₦` formatting in ≥3 files; date formatting partially centralized |
| Dead code | `lib/mock-data.ts` (247 lines, unused); 47 unused `components/ui/*`; `.dark` tokens with no `ThemeProvider` |
| Duplicated hooks | `hooks/use-toast.ts` **and** `components/ui/use-toast.ts` — 191 lines each, both unused |
| No validation layer | `zod` installed, used nowhere; forms validate with `alert()` |
| `any` casts | `setBookings(data as any as Booking[])` |
| No tests | Zero tests in `apps/web` (mobile has Jest; web has none) |
| No error handling | Zero error boundaries; failed mutations are silent (`await supabase...update()` with no error check in events/announcements/mass-times) |

That last one deserves emphasis: in `events/page.tsx`, `handleSave` awaits the insert/update and **never checks `error`**. If RLS rejects the write, the modal closes, the list refetches unchanged, and the admin believes they saved. This is the same class of bug as the fake Settings save, and it exists in the real mutation paths.

---

## 18. Priority Matrix

### P0 — Critical
1. **Verify Supabase email signup is disabled.** If enabled → remote privilege escalation to full admin via the public APK's anon key. *(§14)*
2. **Replace `auth.role() = 'authenticated'`** with a real `admins` table + `is_admin()`. *(§14)*
3. **Announcement expiry.** The app is telling parishioners a service starts in 45 minutes, four months later. *(§1)*
4. **Fix `Total Donations`** — exclude pending and rejected. Two screens disagree 4× on a financial figure. *(§2)*
5. **Remove or implement the fake Settings save.** It silently discards parish profile edits. *(§2)*
6. **Add `error.tsx` + `not-found.tsx`.** Zero boundaries exist. *(§4)*
7. **Check mutation errors.** Failed writes currently report success. *(§17)*

### P1 — Required for a professional release
8. Move page reads to server components; real `loading.tsx` skeletons *(§15)*
9. Server actions for all mutations, with zod validation and authorization *(§7)*
10. Audit log for approvals, rejections, publishes, and payment-detail edits *(§12)*
11. Retire the `-custom` layer; standardize on shadcn + `sonner` + `alert-dialog` *(§8)*
12. Events get real timestamps + status + past/upcoming separation *(§12)*
13. Mass-times uniqueness constraint + conflict detection + `active` flag *(§12)*
14. Search and date filters on bookings/donations *(§6)*
15. Fix nav truncation; fix `userScalable: false`; mount `ThemeProvider` *(§4)*
16. Security headers; move rate limiting off in-process memory *(§14)*
17. Real empty states with actions *(§4)*
18. Replace the mobile stock-photo gallery with real data or hide the tab *(§11)*

### P2 — High value
19. Events + gallery system end-to-end *(§10)*
20. Mobile Parish screen restructure *(§11)*
21. Dashboard rebuilt around "what needs me today" *(§4)*
22. Soft delete + restore *(§12)*
23. Roles beyond a single admin tier *(§19 below)*
24. Global content search in the command palette
25. Card fallbacks for tables on narrow viewports

### P3 — Nice to have
26. Scheduled publishing UI, revision history, notification preferences, analytics, yearly memory archive, parish groups/ministries.

---

## 19. Challenging Your Assumptions

You asked me to be direct.

**"Should we adopt shadcn/ui?"** — Wrong question. You adopted it months ago and then built a parallel component library next to it. 47 components installed and never imported, against a hand-rolled `-custom` set used 44 times. The work is *deletion*, not installation.

**"Should `/admin/login` move outside a `(dashboard)` route group?"** — Already done in your working tree, and done well. The layout reads the sidebar cookie server-side to eliminate the flash. Nothing to plan.

**"Is the loading problem caused by layout architecture?"** — No. It is `"use client"` on all 13 pages plus a `loading.tsx` that returns `null`. You would have redesigned the shell and shipped the same 3-second delay.

**Four admin roles (Super Admin / Parish Administrator / Content Manager / Finance Manager) is over-engineering.** This is one parish with, realistically, one to three administrators. Four roles means four policy sets, a role-management UI, and a permission matrix to maintain for a decade — for users who all sit in the same office. **Build the `admins` table with a `role` column now** (so the data model is ready), but ship exactly two roles: `admin` and `staff`. Add more when a real person is actually blocked by permissions.

**A command palette before content expiry is the wrong order.** It is already built, which is fine — but do not invest further in it while the app publishes four-month-old notices. Global search across 4 announcements and 3 events solves a problem you do not have.

**Revision history, preview environments, and scheduled publishing are P3, not P1.** For a parish office publishing a few items a week, `updated_at` + an audit log covers the real need ("who changed this?"). Full revision history is months of work for a question nobody has asked yet.

**Masonry galleries: no.** They require measuring every image and produce visible jank on the low-end Android devices this app explicitly targets. Fixed-aspect grid.

**Calendar integration on event detail: probably not.** A native permission prompt for marginal value. Ship sharing; add calendar if parishioners ask.

**The thing you did not ask about is the thing that matters most.** Your brief is 38 sections about architecture, design systems, and galleries. Not one line asks "is what we are publishing to parishioners correct?" It is not. Stale announcements, stock-photo galleries, duplicate Mass times, and a 4× wrong donation total are all live right now. **A beautiful dashboard that publishes wrong information is worse than an ugly one that publishes right information**, because it earns a trust it does not deserve.

---

## 20. Phased Implementation Plan

### Phase 0 — Verify & Contain *(hours, not days)*
**Objective:** close the security hole and stop the misinformation.
- Verify Supabase email signup setting; disable if on. Rotate anon key if it was on.
- Manually unpublish/correct the four stale announcements (data fix, no code).
- Correct or remove the three past events.
- Deduplicate the Thursday/Friday mass times.
- **DoD:** no stale content visible in the app; signup confirmed disabled.
- **Risk:** none. No code changes.

### Phase 1 — Correctness & Authorization
**Objective:** the system tells the truth, and only admins can change it.
- `admins` table + `is_admin()`; replace all RLS policies.
- Fix `Total Donations` to approved-only.
- Remove the fake Settings save; add `parish_profile` and wire it.
- Add `error.tsx`, `not-found.tsx`, `global-error.tsx`.
- Check `error` on every mutation; surface failures.
- `updated_at` triggers; `audit_log` table.
- Security headers.
- **DB:** additive + policy replacement. **Mobile:** none. **Risk:** policy replacement can lock out admins — apply in a transaction, verify with a test session before committing.
- **DoD:** a non-admin authenticated user can read nothing private; every dashboard figure reconciles with its detail page; no mutation can fail silently.

### Phase 2 — Data Layer & Performance
**Objective:** kill the 3-second delay.
- Generate `database.types.ts`; delete inline row types.
- Convert page reads to server components; `lib/queries/*`.
- Server actions for mutations; zod schemas; `revalidatePath`.
- Real `loading.tsx` skeletons per route.
- Delete `mock-data.ts`, duplicate `use-toast`, unused `components/ui/*`.
- **Risk:** the largest refactor. Do it one route at a time, donations first (best-structured, highest value). **Do not** convert all 13 at once.
- **DoD:** first contentful data ≤ 1 s; zero client-side Supabase reads in admin pages; production bundle measured.

### Phase 3 — Content Lifecycle & Design System
**Objective:** content that retires itself, on a consistent UI.
- `announcements`: status + `publish_at` + `expires_at`; backfill existing as expired.
- `events`: `starts_at`/`ends_at` timestamptz (add → backfill → dual-read), status, past/upcoming split.
- `mass_times`: unique constraint, `active`, overrides table, conflict detection.
- Retire `-custom`; build the ten shared components (§9); `sonner`; `alert-dialog`; `ThemeProvider`; fix `userScalable`.
- Search + date filters on bookings/donations. Real empty states.
- **Mobile:** must tolerate both `start_date` and `starts_at` during dual-read. **This phase requires a coordinated mobile release.**
- **DoD:** no announcement can be published without an expiry; no two Masses can occupy the same slot; every destructive action names its target.

### Phase 4 — Events & Community
- `event_photos`, `parish-media` bucket, client-side resize, upload/reorder/caption/cover UI, gallery publish.
- **DoD:** an admin can upload 40 photos and publish a gallery in under 5 minutes; no original ever leaves the browser unresized.

### Phase 5 — Mobile Parish Experience
- Replace the stock-photo `useGallery` with real data.
- Restructure the Parish screen (§11); event detail; gallery viewer with `FlashList` + `expo-image` + blurhash.
- **DoD:** gallery scrolls at 60 fps on a low-end Android device; works offline from cache; APK still < 60 MB.

### Phase 6 — Hardening
- Redis-backed rate limiting; storage path constraints; orphan reconciliation; Sentry; soft delete + restore; accessibility pass; web tests for queries/actions/validation.

### Phase 7 — Production Readiness
- Load test, backup/restore rehearsal, runbook, migration rollback plan, paid-tier decision, release checklist.

---

## 21. Risks

**Technical.** The Phase 2 refactor touches all 13 pages — route-by-route or it becomes unreviewable. The `events.start_date` → `starts_at` type change is the only migration that can break a shipped APK; dual-read is mandatory, and old clients must keep working until adoption is confirmed.

**Security.** Replacing every RLS policy at once risks locking out the only admin. Apply in a transaction and verify with a live session before committing. Rotating the anon key invalidates it for every installed APK — sequence it with a mobile release.

**Product.** The gallery is the most emotionally compelling feature and the least urgent. There is real risk of building Phase 4 first and leaving stale announcements live for another quarter.

**Migration.** No backup/restore rehearsal has been done. Do not run any destructive migration until one has.

**Cost.** Unoptimized uploads are a ~10× multiplier that compounds forever. Get resize-before-upload right the first time; retrofitting means reprocessing every stored photo.

**Performance.** Blurhash and thumbnails are cheap now and expensive to backfill.

---

## 22. What I Would Add If I Owned This Product

1. **Content freshness as a first-class dashboard citizen.** "3 announcements expire this week · 1 event has no photos · 2 bookings unreviewed for 5 days". The dashboard should nag. This is the direct antidote to the failure mode this audit found.
2. **A "publish preview" that renders the actual mobile card.** Admins write for a screen they never see. Show it to them inline.
3. **A weekly parish digest email to the admin** — what published, what expired, what is pending. Makes neglect visible without requiring anyone to log in.
4. **Idempotency visibility.** You built `client_request_id` and there are still duplicate donations on screen. Surface suspected duplicates in the admin with a merge action rather than trusting the constraint silently.
5. **"Cancel this Sunday's 9 AM Mass" as a one-click override.** Real parishes cancel individual Masses constantly. Today the only options are delete the recurring entry or leave it wrong.
6. **Receipt capture is broken and nobody noticed.** Every donation shows `Receipt: None` despite the column and bucket existing. Instrument it — a metric for "donations with receipts" would have caught this.
7. **A read-only "parish view" toggle** so an admin can see exactly what parishioners see right now. The stale-announcement problem is invisible from the admin side.
8. **Backup rehearsal on a calendar reminder.** A parish has no ops team. An untested backup is not a backup.
9. **Store liturgical season on events** so galleries can be browsed as "Harvest 2026", "Easter 2027" — a parish memory archive organized the way a parish actually thinks.
10. **Accessibility as a release gate, not a phase.** Your own standards doc requires it and the app currently blocks pinch-zoom. Add it to the PR checklist.
11. **A `parish_settings` kill switch** to hide a feature from mobile without shipping an APK. You are Android-beta with no OTA guarantee for native changes; server-side feature flags are cheap insurance.
12. **Track "days since last published content"** as the single health metric for the whole platform. If it exceeds 14, the digital parish is dying regardless of how good the dashboard looks.

---

## Final Recommendation

**Do Phase 0 today.** It is hours of work, needs no code, and it stops the app from misinforming parishioners while removing a potentially critical security exposure. Verifying that one Supabase signup setting is the highest-value five minutes available to you right now.

**Then do Phase 1 and Phase 2 before anything visual.** Correct data and real authorization first; then the server-component conversion that actually fixes the loading behaviour you asked about. Together these address every P0 and the genuine performance root cause — without redesigning a single screen.

**Only then redesign.** By Phase 3 you will have a system that tells the truth, and the design system work will land on solid foundations instead of papering over them. The events-and-gallery work you are most excited about is Phase 4 — and it will be better for arriving after events have real timestamps and a publish lifecycle.

**Resist the urge to start with the gallery.** It is the most rewarding thing in this brief and the least urgent. The parish will be better served by an app that never tells anyone a service starts in 45 minutes when it ended four months ago.

Build the system that tells the truth first. The beauty will mean something then.
