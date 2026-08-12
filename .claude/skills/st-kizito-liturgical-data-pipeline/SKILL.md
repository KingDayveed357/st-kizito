---
name: st-kizito-liturgical-data-pipeline
description: Project (St. Kizito). How liturgical content is sourced, validated, and kept correct — the DivineOffice.org scraper, canonical-key model, coverage audit, calendar-parity verification, and the licensing/accuracy strategy (incl. Nigerian vs US-edition concerns). Read before scraping, editing, regenerating, or validating any liturgical dataset (office, readings, calendar, bible), or before changing the calendar algorithm. Do NOT scrape ad hoc.
version: 1.0.0
---

# St. Kizito Liturgical Data Pipeline

Liturgical data is **generated and verified by scripts**, not hand-edited. Never paste liturgical text
into a data file directly, and never scrape a new source ad hoc. Use the pipeline in
`apps/mobile/scripts/` (run from `apps/mobile`).

## Sources & the key model

- **Divine Office:** `scripts/scrape-divineoffice-org.mjs` scrapes **DivineOffice.org** (US edition, ICEL
  translation) — all 8 hours per day, **keyed by liturgical key, not date.** The cycle repeats identically
  every year, so **one complete scrape covers all future years.** Output: `data/divineOfficeComplete.json`.
  Resume-safe (already-scraped keys are skipped).
- **Readings/calendar:** `data/readings.json`, `data/calendar/2026.json`, `data/usccb-readings-dataset.json`
  (raw source — should NOT ship in the app bundle; it's pipeline input). `data/bible.json` +
  `passageCache.json` back scripture lookup.
- **Generators:** `generate-liturgical-datasets.mjs`, `generate-passage-cache.mjs`,
  `generate-passage-overrides.mjs`, `compile-extras.js`; key migration via `migrate-keys.mjs`; scrape
  planning via `generate-scrape-plan.mjs`. NPM scripts: `office:scrape`, `office:audit[:missing|:thin|:json]`,
  `office:migrate[:apply]`, `office:verify`, `office:plan[:shell]`.

## Validation (run these — they gate correctness)

1. **Coverage audit** — `npm run office:audit` (`audit-coverage.mjs`): alias-aware coverage %, data quality
   (% of offices with psalmody/hymn/reading/concluding prayer), **thin entries** (exist but missing
   critical sections), and which keys to scrape next. Exit 0 = 100% coverage. Use `--missing`/`--thin`.
2. **Calendar parity** — `npm run office:verify` (`verify-calendar-parity.mjs`): asserts the TypeScript
   `liturgicalCalendar.ts` algorithm and the scraper's `resolveDateToCalendarEntry()` produce **identical
   keys** for every date in the test set. **Re-run this whenever either calendar algorithm changes** — a
   drift means the app looks up the wrong office/readings. Exit 1 = mismatch.
3. **Data-integrity tests** — `__tests__/dataIntegrity.test.ts` (no gaps, no `"unavailable"` placeholders).

## Licensing & accuracy strategy

- **Respect source licensing.** DivineOffice.org content is copyrighted (ICEL translation). This is used
  under the project's own arrangement — do not add new scrape sources or redistribute text without a
  cleared license. Do not scrape sources indiscriminately or expand scope without approval.
- **US edition vs Nigeria:** the office source is the **US edition**. Nigeria uses the same ICEL English
  text for most of the Liturgy of the Hours and Mass, but the **National Calendar of Nigeria** differs
  (proper solemnities/feasts/memorials — e.g. Bl. Cyprian Michael Iwene Tansi, Nigerian martyrs, local
  patrons) and some US-specific memorials do not apply. **Flag and verify** any celebration that is
  US-proper against Nigerian sources before trusting it. Calendar keys must reflect the Nigerian calendar
  where it diverges. See `st-kizito-liturgical-domain`.
- **Authoritative references for verification** (verify, don't bulk-scrape): the Roman Missal / GIRM for
  rules, the Nigerian liturgical calendar (diocesan/CBCN) for propers, USCCB/DivineOffice for the English
  text baseline. When a Nigerian proper is needed, source it deliberately and record provenance.

## Maintainable sync strategy

- The office cycle is **year-agnostic** (keyed) → scrape once, verify parity, done. Only re-scrape to fill
  audited gaps/thin entries or fix a specific key.
- Extending the **calendar** to years beyond 2026: generate the year via the engine, run parity + audit,
  reconcile any Nigerian propers, then commit — never hand-key a year.
- Any pipeline change: run `office:audit` + `office:verify` + `npm test`; keep raw source datasets out of
  the shipped app bundle (`st-kizito-bundle-budget`); record what changed and why.

## Engineering rules

1. Generate/scrape via the scripts; never hand-edit liturgical data files.
2. Re-run `office:verify` after ANY change to a calendar algorithm (TS or scraper).
3. Run `office:audit` after any office data change; fix thin/missing before shipping.
4. No new scrape source or expanded scope without a licensing decision.
5. Verify US-proper celebrations against the Nigerian calendar before trusting them.
6. Keep raw source datasets out of the app bundle.

## References

- `apps/mobile/scripts/*` (scrape, audit, verify, generate, migrate, plan) + `scripts/lib/*`
- `apps/mobile/src/services/liturgicalCalendar.ts`, `liturgicalEngine.ts`, `calendarEngine.ts`
- `data/divineOfficeComplete.json`, `readings.json`, `calendar/2026.json`
- `__tests__/dataIntegrity.test.ts`; docs: `docs/LITURGICAL-DATA-STRATEGY.md`
- Related: `st-kizito-liturgical-domain`, `st-kizito-bundle-budget`
