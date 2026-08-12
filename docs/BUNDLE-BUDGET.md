# Bundle Budget — St. Kizito Mobile

Operational companion to skill `st-kizito-bundle-budget`. Numbers are the contract; the skill has the how.

## Hard budget

| Metric | Budget | Status |
|---|---|---|
| **Android per-device size (from AAB, per-ABI)** | **< 60 MB** | Must hold every release |
| Universal APK | Not a shipping artifact | Ignore its size (100 MB+ is an ABI artifact) |
| Hermes JS bundle | Watch; ~26 MB today | Reduce by moving big JSON out of the graph |
| Bundled `data/*.json` in JS graph | Do not grow | 35 MB raw today — the dominant lever |
| App icons (each) | < 100 KB | Currently 1.1–1.3 MB — **compress** |

## The big offenders (measured)

- `data/divineOfficeComplete.json` — 24 MB
- `data/bible.json` — 4.8 MB · `data/usccb-readings-dataset.json` — 4.5 MB (raw source — should NOT ship)
- `data/divineOfficeCycle.json` — 1.25 MB · `data/passageCache.json` — 0.45 MB
- `assets/icon.png`, `splash-icon.png`, `android-icon.png` — 1.1–1.3 MB each

## Gates (enforced in review)

1. **AAB to store**, R8/Proguard shrinking on for release. Never ship/measure a universal APK.
2. **No new dependency** without a size justification + why an existing dep won't do. No casual native modules.
3. **`data/*.json` not grown into the JS graph** — big corpora load via sqlite/on-demand files.
4. Keep raw pipeline datasets (USCCB, scrape outputs) **out** of the shipped bundle.
5. Per-icon imports for icon libraries; subset fonts to used weights; optimize SVG/images (WebP, `expo-image`).
6. **Run a bundle analysis** when deps/data change; call out any material delta in the PR.

## Analyze

```bash
cd apps/mobile
npx expo export --platform android --output-dir /tmp/exp-analyze
# inspect _expo/ bundle + assetmap; diff against the previous export
```

Reduction backlog: compress icons; move `divineOfficeComplete.json`/`bible.json` to sqlite/on-demand so
they leave the Hermes graph; drop `usccb-readings-dataset.json` from the app; minify shipped JSON.
