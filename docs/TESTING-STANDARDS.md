# Testing Standards — St. Kizito

Operational companion to skill `st-kizito-testing`. Highest-risk area = **liturgical correctness**.

## Setup facts

- Mobile: `apps/mobile/jest.config.js` uses **`ts-jest` + node env** — runs **pure TS logic** today.
  Run from `apps/mobile`: `npm test` (or `npx jest <file>`).
- `jest-expo` + `@testing-library/react-native` are installed but **not wired** — component/render tests
  don't run until a `jest-expo` project/preset is added. Don't assume RTL works out of the box.
- Web (`apps/web`): **no tests yet** — add auth/route + critical-form tests when touched.

## What to test (priority)

1. **Liturgical assembly (must):** `selectPsalmBodyVerses` across psalm shapes; `getLiturgicalClosing`
   per block type; reading-block order; Gospel Acclamation; Glory Be placement.
2. **Calendar engine:** Easter (Butcher), Advent start, season boundaries, A/B/C + I/II selection, feast
   rank/conflict, key derivation, day-rollover ("shows yesterday") guard.
3. **Data integrity:** no dataset gaps over a span; no `"unavailable"` placeholder; calendar/readings key alignment.
4. **Idempotency:** `client_request_id` generation + reuse (no duplicate submits).
5. **Pure utils:** dates, formatters, bibleExtractor, strings.

## Conventions

- Test **pure functions** (`utils/`, `domain/`, `services/*Engine`). Extract inline logic into a testable
  helper (why the psalm/endings fixes live in `utils/`).
- Table-driven (`test.each`); assert the **invariant**, not a snapshot blob.
- No network in unit tests; mock Supabase for service tests.
- Ship a **regression test with every bug fix**, citing the audit number in a comment.

## Merge gates

- Any change to liturgical/calendar/psalm/office logic ships a test.
- `npm test` green; no TypeScript errors.
- Grow coverage of the correctness core (`utils/`, `domain/`, `services/*Engine`) over chasing global %.
- Before relying on component tests: wire `jest-expo`. Before scaling web: add auth + form tests.

## Existing suites (the model to follow)

`__tests__/`: psalm · liturgicalClosings · liturgicalCalendar · readingBlocks · readingsEngine ·
readingChrome · calendarRange · bibleExtractor · dateFormat · dataIntegrity.
