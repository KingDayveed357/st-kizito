---
name: st-kizito-testing
description: Project (St. Kizito). Testing strategy and conventions — what to test (liturgical logic first), the Jest setup, pure-function tests, data-integrity tests, and the gap between the current ts-jest/node config and the installed jest-expo/RN-Testing-Library for component tests. Read before writing tests, changing liturgical/calendar/psalm logic, or reviewing test coverage.
version: 1.0.0
---

# St. Kizito Testing

Highest-risk area = **liturgical correctness**. Test the pure logic that assembles readings, psalms,
endings, and the calendar before/with any change to it. A crash is recoverable; wrong scripture is not.

## Current setup (know the gap)

- `apps/mobile/jest.config.js` uses **`ts-jest` + `testEnvironment: 'node'`** — it runs **pure
  TypeScript logic**, not React Native components. `e2e/` is ignored.
- `jest-expo`, `@testing-library/react-native`, and `@testing-library/jest-native` are **installed but
  NOT wired into the jest config.** So component/render tests can't run today. If you need component
  tests, add a second Jest project (or switch preset) using `jest-expo` — don't assume RTL works out of
  the box here.
- Run tests from `apps/mobile`: `npm test` (or `npx jest <file>`).
- **Web (`apps/web`) has zero tests.** Add route/auth + critical-form tests when you touch admin code.

## What exists (10 mobile suites, all logic)

`__tests__/`: `psalm`, `liturgicalClosings`, `liturgicalCalendar`, `readingBlocks`, `readingsEngine`,
`readingChrome`, `calendarRange`, `bibleExtractor`, `dateFormat`, `dataIntegrity`. These are the model to
follow: pure functions, table-driven (`test.each`), assert real liturgical invariants (e.g. no
`"unavailable"` placeholder, no dropped verses, correct endings, no calendar gaps over a year span).

## What to test (priority order)

1. **Liturgical assembly (must):** `selectPsalmBodyVerses` across psalm shapes (leading response vs real
   verse), `getLiturgicalClosing` for every block type, reading-block ordering, Gospel Acclamation, Glory
   Be placement. Any office/reading render helper gets a test.
2. **Calendar engine:** Easter (Butcher), Advent start, season boundaries, A/B/C + I/II cycle selection,
   feast rank/conflict resolution, key derivation. Guard the "shows yesterday" class of bug with a
   date-rollover test on the store logic.
3. **Data integrity:** no gaps in the readings dataset over a span; no placeholder text; calendar/readings
   key alignment.
4. **Idempotency/requests:** `client_request_id` generation + reuse; submit-retry doesn't duplicate.
5. **Pure utils:** `dateUtils`, `formatters`, `bibleExtractor`, `strings`.

## Conventions

- Test **pure functions** in `utils/`, `domain/`, `services/*Engine`. Extract inline logic into a pure
  helper so it can be tested (this is why the psalm/endings fixes live in `utils/`).
- Table-driven with `test.each`; name cases by input. Assert the invariant, not the current output blob.
- No network in unit tests; liturgy is local anyway. Mock Supabase for service tests.
- Add a regression test **with** each bug fix, citing the audit number in a comment.

## Targets

- Every change to liturgical/calendar/psalm/office logic ships a test. Treat this as a merge gate.
- Grow toward meaningful coverage of `utils/`, `domain/`, `services/*Engine` (the correctness core) rather
  than chasing a global % over UI.
- Wire `jest-expo` before relying on component tests; add web tests for auth + forms.

## References

- `apps/mobile/jest.config.js`, `apps/mobile/__tests__/*`
- Logic under test: `src/utils/{psalm,liturgicalClosings,readingBlocks,dateUtils,bibleExtractor}.ts`,
  `src/services/liturgicalEngine.ts`, `src/domain/calendar/timeline.ts`
- Standards: `docs/TESTING-STANDARDS.md`. Related: `st-kizito-liturgical-domain`, `st-kizito-code-review`.
