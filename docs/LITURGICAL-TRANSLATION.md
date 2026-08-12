# Liturgical Translation — Findings and Options

**Status: investigation only. Nothing in the readings pipeline was changed.**

The parish uses the **Jerusalem Bible** at Mass and the **Grail Psalms** for the responsorial psalm.
The app does not show either. This document records what the app actually shows today, why the
correct translations cannot simply be dropped in, and what the realistic paths are — so the work can
be picked up after launch without re-deriving any of it.

---

## 1. What the app shows today

Readings resolve in this order (`apps/mobile/src/services/liturgicalData.ts`, `buildMissalDay`):

| Order | Source | File | Translation |
|---|---|---|---|
| 1 | Full-text daily readings, keyed by ISO date | `data/usccb-readings-dataset.json` (4.5 MB, 998 dates) | **NABRE** — scraped from `bible.usccb.org` |
| 2 | Citation only, keyed by canonical liturgical key | `data/readings.json` (179 KB, 461 keys) | — resolves text via 3 |
| 3 | Pre-extracted passages, then whole-Bible fallback | `data/passageCache.json`, `data/bible.json` (4.85 MB) | **World English Bible**, Catholic edition |

**Neither is the Jerusalem Bible.** There is no Grail psalter anywhere in the repository — the
responsorial psalm simply inherits whatever translation supplied the reading it came with.

### The part that matters most

The two sources are **silently mixed**. A date covered by the USCCB dataset renders NABRE; a date
that falls through renders World English Bible — with no marker in the data, no indication in the
UI, and no way for a parishioner to tell which they are reading. `passageCache.json` does not even
carry the `translation` field its generator writes (`scripts/generate-passage-cache.mjs` sets
`__meta.translation = 'World English Bible'`; `grep -c "__meta"` on the shipped file returns 0).

So the honest description of current behaviour is: *the app shows a Bible translation that is
usually NABRE, sometimes WEB, and never the one used at this parish, without telling anyone which.*

---

## 2. Why the correct text cannot simply be added

Both translations the parish uses are under active copyright, and both are actively licensed:

| Text | Rights holder | Notes |
|---|---|---|
| **Jerusalem Bible** (1966) | Darton, Longman & Todd (UK/Commonwealth) | The edition used in Nigerian and most Anglophone-African lectionaries. Licensing is per-use and generally per-territory. |
| **Grail Psalms** | GIA Publications / Conception Abbey | The 1963 Grail and the Revised Grail Psalter are separately licensed. Liturgical use in print is not the same permission as reproduction in an app. |

Consequences:

- **They cannot be scraped.** Sites that host lectionary text hold a licence that does not transfer
  to us. Copying from them is infringement regardless of how the text is obtained.
- **They cannot be bundled** without a written licence naming this app and its distribution.
- **They cannot be fetched from a third-party API** unless that API's licence explicitly covers
  redistribution to end users through another application. Most do not.

This is a legal and commercial question, not a technical one. It needs a person, not a pull request.

---

## 3. Options, honestly assessed

### A. Obtain a licence, then add an admin-managed override layer — *recommended*

The parish (or diocese) obtains permission from DLT for the Jerusalem Bible and GIA/Conception Abbey
for the Grail. The app gains a `reading_overrides` table plus an admin editor, and resolution
becomes *override → bundled NABRE → citation fallback*, cached offline like other parish data.

- Correct text, with the parish holding the licence it is bound by.
- Also fixes the general problem: any reading can be corrected without an app release.
- Cost: the licence, plus the ongoing work of entering text. Realistically a parish secretary
  entering the day's readings, or a diocesan feed if one exists.

### B. Diocesan or episcopal-conference feed

Some conferences publish licensed daily readings. If the Catholic Bishops' Conference of Nigeria
provides such a feed, using it with permission is the least ongoing effort of any option, because
nobody has to type anything. **This is worth checking before committing to A** — it may make the
override layer unnecessary.

### C. Do nothing but label it clearly — *the minimum honest position*

Keep NABRE, remove the silent WEB fallback (or mark it visibly), and state the translation in the
readings screen. This does not give the parish the text it uses at Mass, but it stops the app
implying that it has.

### D. Ship the Jerusalem Bible without a licence

Not an option. It is infringement, it exposes the parish, and app-store takedowns for scraped
scripture are routine.

---

## 4. If option A or B is taken, the technical work

Recorded so the estimate is not guesswork:

1. `reading_overrides(date, block_type, reference, text, response, stanzas, translation, updated_at)`
   with public read / `is_admin()` write, following the pattern in
   `apps/web/db/2026_08_gallery.sql`.
2. An admin editor page, closest in shape to the sacrament-config page.
3. In `buildMissalDay`, consult the override before the bundled sources; cache via `useCachedData`
   so an override survives offline like the rest of the parish data.
4. Add `translation` to `LiturgicalBlock` and render an attribution line — required by essentially
   every scripture licence anyway.
5. Extend `__tests__/dataIntegrity.test.ts` to assert every rendered block carries a translation.

The calendar side needs no work: `scripts/verify-calendar-parity.mjs` already checks that feast,
season, colour and date mapping agree with the calendar engine. **The problem is the text, not the
day it is attached to.**

---

## 5. What to do next

1. Ask the parish priest whether the diocese already holds a licence, or has a feed (option B).
2. If not, request quotations from Darton, Longman & Todd (Jerusalem Bible) and GIA Publications
   (Grail Psalms), specifying: a free parish app, Android and iOS, Nigeria, and the expected number
   of users.
3. Only once a licence exists, build the override layer.

Until then the app shows NABRE, and **§3C is the smallest change that stops it being misleading.**
