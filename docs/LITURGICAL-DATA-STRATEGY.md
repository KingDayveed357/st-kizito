# Liturgical Data Strategy — St. Kizito

_Phase 7 deliverable. Companion to skill `st-kizito-liturgical-data-pipeline`._

## Current state

- **Divine Office:** scraped from **DivineOffice.org** (US edition, ICEL) via
  `apps/mobile/scripts/scrape-divineoffice-org.mjs`, **keyed by liturgical key, not date** → one scrape
  covers all future years (the cycle repeats). Output: `data/divineOfficeComplete.json` (24 MB).
- **Readings/calendar:** `data/readings.json`, `data/calendar/2026.json` (only 2026 precomputed),
  `usccb-readings-dataset.json` (raw source), `bible.json` + `passageCache.json` for scripture.
- **Validation tooling exists and is good:** `office:audit` (alias-aware coverage, thin-entry detection),
  `office:verify` (calendar-parity between TS engine and scraper), `dataIntegrity.test.ts`.

## Correctness architecture (recommended)

1. **Single canonical key model** — every day resolves to a canonical liturgical key; readings and office
   are looked up by key. The engine (`liturgicalCalendar.ts`) and scraper must agree — enforced by
   `office:verify`. **Re-run parity on any calendar-algorithm change.** This is the backbone.
2. **Generate, never hand-edit.** All liturgical files come from scripts. Hand edits break parity/audit
   and are forbidden.
3. **Audit before ship.** `office:audit` must show no truly-missing keys and no thin entries for the
   liturgical window the app serves.
4. **Layered validation:** parity (keys align) → coverage (nothing missing/thin) → integrity tests (no
   gaps, no placeholders) → spot-check rendered output against an authoritative source.

## Licensing (respect it)

- DivineOffice.org / ICEL text is copyrighted and used under the project's existing arrangement. **Do not
  add new scrape sources, expand scope, or redistribute text without a cleared license.** No indiscriminate
  scraping.
- Keep raw source datasets (USCCB, scrape intermediates) **out of the shipped app bundle** — they are
  pipeline inputs, not product assets (`st-kizito-bundle-budget`).

## Nigerian accuracy (the real risk)

The office source is the **US edition**. English text is largely shared (ICEL), but the **calendar
differs**:

- The **National Calendar of Nigeria** (CBCN) has proper solemnities/feasts/memorials — e.g.
  **Bl. Cyprian Michael Iwene Tansi**, Nigerian martyrs, and local/diocesan patrons — and ranks some
  universal celebrations differently. Some **US-proper** memorials do **not** apply in Nigeria.
- **Strategy:** treat the US calendar as a baseline, then **override with Nigerian propers**. Flag any
  US-specific celebration during audit; verify against CBCN/diocesan calendars; source Nigerian proper
  texts deliberately with recorded provenance. Calendar keys must reflect the Nigerian calendar where it
  diverges. Never assume USCCB == Nigeria.

## Maintenance workflow

- **Office:** year-agnostic → scrape once, `office:verify`, `office:audit`, done. Re-scrape only to fill
  audited gaps/thin entries or fix a specific key.
- **Calendar (extend beyond 2026):** generate the year with the engine → `office:verify` + `office:audit`
  → reconcile Nigerian propers → `npm test` → commit. Never hand-key a year.
- **Every data change:** audit + verify + tests green; provenance recorded; bundle impact checked.

## Open items

- Only 2026 calendar is precomputed — extend forward using the workflow above.
- No systematic Nigerian-proper overlay yet — design a `nigeria-calendar-overrides` source that the
  engine merges over the base calendar, verified by parity/audit.
