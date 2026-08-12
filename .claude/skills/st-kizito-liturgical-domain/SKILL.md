---
name: st-kizito-liturgical-domain
description: Project (St. Kizito). The authoritative Catholic liturgical knowledge for this app — Daily Readings, Divine Office (Liturgy of the Hours), the liturgical calendar/seasons/colors, psalm formatting, Gospel Acclamations, reading endings, canonical keys, plus known bugs and data inconsistencies. Read BEFORE touching anything that renders, computes, or edits liturgy: readings, office, calendar, psalms, antiphons, liturgical colors, seasons, feast ranking, or the bundled liturgical JSON. Getting this wrong is worse than a crash.
version: 1.0.0
---

# St. Kizito Liturgical Domain

Wrong or missing liturgical text destroys user trust in a prayer app. **Never invent liturgical
rules or text.** Encode only what is verified here or in an authoritative source (see
`st-kizito-liturgical-data-pipeline`). When unsure, surface the uncertainty — do not guess.

## The two content pillars

### 1. Daily Readings (the Mass lectionary)
- Rendered by `app/(tabs)/readings.tsx` using components in `src/components/liturgical/`.
- Data: `data/readings.json` (462 entries, keyed by a **canonical key**, plus a `__meta` entry).
- A day's readings are looked up by the calendar engine's `key` (NOT by date) — see keys below.
- Block order for Mass: Entrance Antiphon → First Reading → Responsorial Psalm → (Second Reading, Sundays/
  solemnities) → Gospel Acclamation → Gospel. Optional reflection follows.
- **Reading endings are appended at the RENDER layer, never stored in data.** Use
  `getLiturgicalClosing(blockType)` in `src/utils/liturgicalClosings.ts`:
  - First/Second/other proclaimed readings → "The word of the Lord." / "Thanks be to God."
  - Gospel → "The Gospel of the Lord." / "Praise to you, Lord Jesus Christ."
  - Psalms, antiphons, acclamations → `null` (no ending).
- **Responsorial Psalm assembly:** use `selectPsalmBodyVerses()` in `src/utils/psalm.ts`. It drops only a
  *leading refrain duplicate* (`verses[0].type === 'response'`) — never a real verse. A naive `slice(1)`
  was the "psalm cut off" bug (audit #6). Drive layout off `verse.type` (`'response' | 'verse'`), never
  positional assumptions.
- **Gospel Acclamation** ("Alleluia" / in Lent "Praise to you…"): its own block type; renders the
  acclamation + versicle. Do not append a reading ending to it.

### 2. Divine Office (Liturgy of the Hours)
- Hours: Invitatory, Office of Readings, Morning Prayer (Lauds), Daytime/Midday, Evening Prayer
  (Vespers), Night Prayer (Compline). App surfaces Morning/Midday/Evening/Night.
- Data: `data/divineOfficeComplete.json` (**~24 MB — the single biggest bundle cost**), plus
  `divineOfficeCycle.json`, `divineOffice.json`, and `src/data/divineOfficeExtras.ts`.
- Types: `src/types/divineOffice.types.ts`. Two representations coexist:
  - **`DivineOfficeParts`** — a semantic object (invitatory, hymn, psalmody[], reading, responsory,
    gospelCanticle, intercessions, lordsPrayer, concludingPrayer, dismissal).
  - **`PrayerBlock[]`** — a flat typed block stream (`BlockType`: heading, invitatory, hymn, antiphon,
    psalm_title/summary/body, glory_be, reading_1/2, responsory_1/2, gospel_canticle, intercessions,
    our_father, concluding_prayer, dismissal, rubric, + generic fallbacks).
- **Canonical Hour structure** a renderer must honor: Invitatory (Morning) → Hymn → Psalmody (each psalm:
  antiphon → psalm body → optional psalm-prayer, "Glory be" after each) → Reading (short chapter) →
  Responsory → Gospel Canticle (Benedictus at Morning, Magnificat at Evening, Nunc Dimittis at Night,
  each with its antiphon) → Intercessions → Our Father → Concluding Prayer → Dismissal.
- Every psalm/canticle ends with the **Glory Be** ("Glory to the Father…") unless a rubric says otherwise.
  Antiphons are typically repeated after the psalm.

## The liturgical calendar

- **Engine:** `src/services/liturgicalEngine.ts` computes season/year/cycle/feast for any date.
  Easter via **Butcher's algorithm** (`getEasterSunday`); Advent start = Dec 25 − 4 Sundays.
- **Precomputed data:** `data/calendar/2026.json` — **only 2026 exists** (366 entries). Shape:
  `{ date, liturgicalYear, season, period, week, day, celebration, celebrationType, key }`.
- **Seasons:** Advent · Christmas · Lent · Easter · Ordinary Time · Paschal Triduum.
- **Sunday cycle** A/B/C (3-year); **weekday cycle** I/II (2-year, odd/even). Ordinary Time weekdays use
  I/II; Sundays & solemnities use A/B/C; Lent/Advent/Christmas/Holy Week/Easter Octave & many solemnities
  use **proper** readings (not rotating) — per `readings.json.__meta.notes`.
- **Celebration ranks** (highest wins on conflict): Solemnity → Feast → Memorial → Optional Memorial →
  Weekday/Feria. The engine carries `rank` for conflict resolution and a `celebrationType`.

## Liturgical colors (`src/theme/liturgicalColors.ts`)

`LiturgicalColor = 'green' | 'purple' | 'white' | 'red' | 'rose' | 'gold' | 'blue'` → hex via
`getLiturgicalHex()`. Meaning (Roman Rite):
- **Green** — Ordinary Time. **Purple/Violet** — Advent & Lent (penitential). **White/Gold** — Christmas,
  Easter, feasts of the Lord/Mary/non-martyr saints, solemnities of joy. **Red** — Passion (Palm Sunday,
  Good Friday), Pentecost, Holy Spirit, martyrs, apostles. **Rose** — Gaudete (3rd Advent) & Laetare
  (4th Lent) Sundays only. **Blue** — Marian (a local/customary usage, not universal Roman law).
- Always drive UI color from the day's liturgical color, via the theme helper — **never hardcode hex**.

## Nigerian liturgical context

- The parish is Nigerian (Catholic Diocese context). The National Calendar of Nigeria adds proper
  celebrations (e.g. **St. Cyprian Michael Iwene Tansi (Bl.)**, Nigerian martyrs, local patrons) and
  may rank some universal memorials differently.
- **Do not assume the US (USCCB) calendar is authoritative here** even though a USCCB dataset is bundled
  (`data/usccb-readings-dataset.json`). Nigerian propers and English translations (the app uses the
  standard English lectionary text) must be verified against Nigerian sources — see
  `st-kizito-liturgical-data-pipeline`. Flag any US-specific memorial that shouldn't apply.

## Known bugs / data inconsistencies (verify before trusting)

- **Single calendar year:** only `data/calendar/2026.json` exists. Any date outside 2026 falls back to
  the computed engine, which may diverge from precomputed propers. Extending years is a known gap.
- **Two office data shapes** (`DivineOfficeParts` vs `PrayerBlock[]`) with generic fallbacks
  (`reading`/`psalm`/`responsory`/`prayer`) — unknown blocks degrade to these; verify the renderer
  handles both and doesn't drop content.
- **Historic render bugs (fixed — keep fixed):** psalm `slice(1)` dropped verses (#6); reading endings
  weren't appended (#5); psalm/reflection didn't scale with text size (#6/#11); app showed *yesterday's*
  liturgy after relaunch because `selectedDate` persisted without a day-rollover check (#9). See
  `docs/ENGINEERING-AUDIT.md §2` for the canonical write-ups.
- **`isOffline: true` is hardcoded** in `useReadings.ts` (readings are fully local/bundled) — cosmetic
  but can mislead; readings never hit the network.
- **Calendar `liturgicalYear` in data vs engine:** the JSON stores a `liturgicalYear` string; the engine
  recomputes A/B/C + I/II. If you edit one, reconcile the other.

## Engineering rules

1. Look up liturgy by the calendar engine's **canonical `key`**, never by re-deriving strings.
2. Append endings and Glory Be at the **render layer** via helpers; never mutate the data files to add them.
3. Drive psalm/office layout off explicit `type` fields, never array position.
4. All liturgical text must scale with `useTheme().textScale` (read `st-kizito-premium-ui`).
5. Color comes from the day's liturgical color through `liturgicalColors.ts`. No hardcoded hex.
6. Any change to liturgical assembly needs a pure-function unit test (see `st-kizito-testing`).
7. Never scrape or paste liturgical text ad hoc — go through `st-kizito-liturgical-data-pipeline`.

## References

- `src/services/liturgicalEngine.ts`, `calendarEngine.ts`, `divineOfficeEngine.ts`
- `src/utils/liturgicalClosings.ts`, `psalm.ts`, `readingBlocks.ts`, `divineOfficeParser.ts`
- `src/types/readings.types.ts`, `divineOffice.types.ts`; `src/constants/liturgical.ts`
- `src/theme/liturgicalColors.ts`; `data/readings.json`, `data/calendar/2026.json`
- Tests: `__tests__/psalm.test.ts`, `liturgicalClosings.test.ts`, `liturgicalCalendar.test.ts`,
  `readingBlocks.test.ts`, `dataIntegrity.test.ts`
