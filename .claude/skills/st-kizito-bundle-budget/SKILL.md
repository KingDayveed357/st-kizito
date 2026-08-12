---
name: st-kizito-bundle-budget
description: Project (St. Kizito). Enforces the mobile app size budget — APK < 60 MB, JS bundle and bundled liturgical JSON under control. Read before adding ANY dependency or native module, importing large JSON, adding fonts/images/SVGs, or preparing a release. Covers AAB vs universal APK, the 35 MB bundled-JSON problem, tree-shaking, dynamic imports, and how to run a bundle analysis before merge.
version: 1.0.0
---

# St. Kizito Bundle Budget

**Hard budget: the Android APK must stay < 60 MB.** This is a permanent constraint, not a suggestion.

## Where the size actually is (measured)

| Source | Size | Note |
|---|---|---|
| Bundled liturgical JSON in `apps/mobile/data/` | **~35 MB raw** | `divineOfficeComplete.json` 24 MB, `bible.json` 4.8 MB, `usccb-readings-dataset.json` 4.5 MB, `divineOfficeCycle.json` 1.25 MB, `passageCache.json` 0.45 MB. **This is the dominant lever.** |
| Hermes JS bundle | ~26 MB (export) | Includes the JSON that is `import`/`require`d into the graph. |
| Image assets | ~4 MB | Three 1.1–1.3 MB PNGs (`icon`, `splash-icon`, `android-icon`) are oversized — icons should be tens of KB. |
| Native (per universal APK) | large | A **universal APK bundles every ABI** → 100 MB+. That number is a measurement artifact, not the shipped size. |

**The #4 "app is 120 MB" report was a universal-APK artifact** (audit §3.5). Ship an **AAB**; Play
delivers ~25–40 MB per device via ABI splitting. For direct-install APKs, split ABIs / `arm64-v8a` only.

## Rules (in priority order)

1. **AAB to the store, never a universal APK.** Enable R8/Proguard code + resource shrinking for release.
2. **Guard the bundled JSON.** Do not grow `data/*.json` casually. `divineOfficeComplete.json` (24 MB) is
   the biggest cost — before adding office/reading years or the full bible into the graph, consider:
   - Load big corpora into **sqlite** (already used) / on-demand files instead of `import`ing them into
     the JS graph, so they don't inflate the Hermes bundle.
   - Ship only what the app actually reads; keep raw source datasets (USCCB, scrape outputs) **out of the
     app bundle** — they belong to the data pipeline, not the shipped app.
   - Minify/strip whitespace from shipped JSON; drop unused fields.
3. **Never add a dependency without justification.** Prefer an existing dep. Before `npm install <new>`:
   - Is it in `package.json` already or achievable with what's installed (reanimated, gesture-handler,
     expo-*, TanStack, Zustand)?
   - What does it add to the bundle? Does it pull a native module (→ new binary + size)?
   - Record the justification in the PR.
4. **Tree-shaking & imports:** import named symbols, not whole namespaces; avoid barrel files that defeat
   shaking; no `import * as`. Use `lucide`/`@expo/vector-icons` per-icon, never the whole set.
5. **Dynamic imports / lazy load** heavy, rarely-first screens and large data behind `React.lazy` /
   `import()` where the router allows, so they're not in the first bundle.
6. **Images:** compress the three oversized PNGs; use `expo-image`; prefer WebP; size to actual display.
7. **SVG/fonts:** subset fonts to used weights; optimize SVGs (SVGO); don't ship unused NotoSerif/Inter
   weights.

## Bundle analysis before merge

Run an export and inspect sizes; investigate any large delta:

```bash
cd apps/mobile
npx expo export --platform android --output-dir /tmp/exp-analyze
# then inspect bundle + assetmap sizes; the Hermes bundle is the .hbc/.js in _expo/
```

Compare against the previous export. Any dependency or data change that moves the bundle materially must
be called out in review (see `st-kizito-code-review`). A release build must be measured **per-ABI from
the AAB**, not from a universal APK.

## Budget gates

- APK/AAB per-device: **< 60 MB** (hard).
- New dependency: must state size impact + why an existing dep won't do.
- `data/*.json` shipped in the JS graph: do not increase without moving big corpora to sqlite/on-demand.
- Icons: tens of KB, not > 1 MB.

## References

- `apps/mobile/data/*`, `apps/mobile/assets/*`, `apps/mobile/metro.config.js`
- `apps/mobile/scripts/*` (data generation — outputs must not all ship in the app)
- Audit: `docs/ENGINEERING-AUDIT.md §3.5`. Budget doc: `docs/BUNDLE-BUDGET.md`.
