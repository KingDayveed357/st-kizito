#!/usr/bin/env node
/**
 * audit-coverage.mjs
 *
 * Production-grade coverage audit for divineOfficeComplete.json.
 *
 * Reports:
 *   1. TRUE coverage (alias-aware) — counts aliased keys as PRESENT, not missing
 *   2. Data quality — % of offices with psalmody, hymn, reading, concluding prayer
 *   3. Thin entries — offices that exist but are missing critical sections
 *   4. Actionable recommendations — which keys to scrape next
 *
 * Usage:
 *   node scripts/audit-coverage.mjs                  # full report
 *   node scripts/audit-coverage.mjs --season Easter  # filter by season
 *   node scripts/audit-coverage.mjs --missing        # show only missing keys
 *   node scripts/audit-coverage.mjs --thin           # show only thin entries
 *   node scripts/audit-coverage.mjs --json           # output machine-readable JSON
 *
 * Exit code:
 *   0 = 100% coverage (nothing truly missing)
 *   1 = gaps remain
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { SEASON_GROUPS, TOTAL_CANONICAL_KEYS } from './lib/canonicalKeys.mjs';
import { normalizeToStorage } from './lib/keyNormalizer.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Load dataset ─────────────────────────────────────────────────────────────

let dataset;
try {
  dataset = require('../data/divineOfficeComplete.json');
} catch {
  console.error('❌  Cannot load data/divineOfficeComplete.json');
  console.error('    Run: node scripts/scrape-divineoffice-org.mjs');
  process.exit(1);
}

const storedKeys = new Set(Object.keys(dataset).filter(k => k !== '__meta'));

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
// Safe extraction: only set filterSeason if --season flag is explicitly present and followed by a value.
const seasonFlagIdx = args.indexOf('--season');
const filterSeason = seasonFlagIdx !== -1 && seasonFlagIdx + 1 < args.length ? args[seasonFlagIdx + 1] : null;
const showMissingOnly = args.includes('--missing');
const showThinOnly = args.includes('--thin');
const jsonOutput = args.includes('--json');

// ─── Core audit ───────────────────────────────────────────────────────────────

const MAJOR_HOURS = ['morningPrayer', 'eveningPrayer'];
const ALL_HOURS = ['officeOfReadings', 'morningPrayer', 'midMorningPrayer', 'middayPrayer', 'afternoonPrayer', 'eveningPrayer', 'nightPrayer'];

const QUALITY_FIELDS = {
  psalmody:         { label: 'Psalmody',          weight: 3, checker: parts => Array.isArray(parts?.psalmody) && parts.psalmody.length > 0 },
  hymn:             { label: 'Hymn',               weight: 2, checker: parts => !!parts?.hymn?.text },
  reading:          { label: 'Short Reading',      weight: 2, checker: parts => !!parts?.reading?.text },
  responsory:       { label: 'Responsory',         weight: 1, checker: parts => !!parts?.responsory?.text },
  gospelCanticle:   { label: 'Gospel Canticle',    weight: 2, checker: parts => !!parts?.gospelCanticle?.text },
  intercessions:    { label: 'Intercessions',      weight: 2, checker: parts => !!parts?.intercessions?.text },
  concludingPrayer: { label: 'Concluding Prayer',  weight: 2, checker: parts => !!parts?.concludingPrayer?.text },
};

function scoreEntry(entry) {
  if (!entry?.offices) return { score: 0, maxScore: 0, hours: {}, isComplete: false };

  let totalScore = 0, totalMax = 0;
  const hours = {};

  for (const hour of ALL_HOURS) {
    const parts = entry.offices[hour]?.parts;
    if (!parts) {
      hours[hour] = { present: false, score: 0, maxScore: 0, missing: [] };
      continue;
    }

    let score = 0, maxScore = 0;
    const missing = [];
    for (const [field, { weight, checker }] of Object.entries(QUALITY_FIELDS)) {
      // Only check major fields for minor hours; all fields for lauds/vespers
      const isMajorHour = MAJOR_HOURS.includes(hour);
      if (!isMajorHour && !['psalmody', 'hymn', 'reading', 'concludingPrayer'].includes(field)) continue;

      maxScore += weight;
      totalMax += weight;
      if (checker(parts)) {
        score += weight;
        totalScore += weight;
      } else {
        missing.push(field);
      }
    }
    hours[hour] = { present: true, score, maxScore, missing };
  }

  const isComplete = totalMax > 0 && totalScore === totalMax;
  return { score: totalScore, maxScore: totalMax, hours, isComplete };
}

// ─── Per-season analysis ──────────────────────────────────────────────────────

const SEASON_RESULTS = {};
const ALL_MISSING = [];
const ALL_ALIASED = [];
const ALL_THIN = [];

for (const [season, expectedKeys] of Object.entries(SEASON_GROUPS)) {
  if (filterSeason && filterSeason.toLowerCase() !== season.toLowerCase().replace(' ', '')) continue;

  const results = {
    season,
    total: expectedKeys.length,
    direct: 0,
    aliased: 0,
    missing: [],
    thin: [],
    qualitySum: 0,
    qualityMax: 0,
  };

  for (const expectedKey of expectedKeys) {
    // First check: direct hit (key in storage format)
    if (storedKeys.has(expectedKey)) {
      results.direct++;
      const quality = scoreEntry(dataset[expectedKey]);
      results.qualitySum += quality.score;
      results.qualityMax += quality.maxScore;

      // Check for thin entries
      if (quality.maxScore > 0 && quality.score / quality.maxScore < 0.5) {
        const thinEntry = { key: expectedKey, season, score: quality.score, maxScore: quality.maxScore, hours: quality.hours };
        results.thin.push(thinEntry);
        ALL_THIN.push(thinEntry);
      }
      continue;
    }

    // Second check: aliased hit (calendar-format key resolves to a stored key)
    const storageKey = normalizeToStorage(expectedKey);
    if (storageKey !== expectedKey && storedKeys.has(storageKey)) {
      results.aliased++;
      const aliasEntry = { expectedKey, storageKey, season };
      ALL_ALIASED.push(aliasEntry);

      const quality = scoreEntry(dataset[storageKey]);
      results.qualitySum += quality.score;
      results.qualityMax += quality.maxScore;
      continue;
    }

    // Third check: truly missing
    results.missing.push({ key: expectedKey, season });
    ALL_MISSING.push({ key: expectedKey, season });
  }

  SEASON_RESULTS[season] = results;
}

// ─── Render ───────────────────────────────────────────────────────────────────

if (jsonOutput) {
  const summary = {
    generatedAt: new Date().toISOString(),
    storedTotal: storedKeys.size,
    canonicalTotal: TOTAL_CANONICAL_KEYS,
    missingTotal: ALL_MISSING.length,
    aliasedTotal: ALL_ALIASED.length,
    thinTotal: ALL_THIN.length,
    trueCoveragePercent: (((TOTAL_CANONICAL_KEYS - ALL_MISSING.length) / TOTAL_CANONICAL_KEYS) * 100).toFixed(1),
    seasons: SEASON_RESULTS,
    missing: ALL_MISSING,
    aliased: ALL_ALIASED,
    thin: ALL_THIN,
  };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(ALL_MISSING.length > 0 ? 1 : 0);
}

// ─── Human-readable report ────────────────────────────────────────────────────

const BAR_WIDTH = 30;
function bar(filled, total) {
  const pct = total > 0 ? filled / total : 0;
  const filled_n = Math.round(pct * BAR_WIDTH);
  return '[' + '█'.repeat(filled_n) + '░'.repeat(BAR_WIDTH - filled_n) + ']';
}
function pct(n, d) { return d > 0 ? `${((n / d) * 100).toFixed(1)}%` : 'N/A'; }

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║         DIVINE OFFICE COVERAGE AUDIT (Alias-Aware)           ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Sum actual direct + aliased counts from per-season results (always correct regardless of missing count).
const totalDirect  = Object.values(SEASON_RESULTS).reduce((s, r) => s + r.direct,  0);
const totalPresent = Object.values(SEASON_RESULTS).reduce((s, r) => s + r.direct + r.aliased, 0);
const totalAliased  = ALL_ALIASED.length;
const totalMissing  = ALL_MISSING.length;
const metaStoredStr = dataset.__meta?.totalKeys ?? storedKeys.size;

console.log(`  📦  Keys in file:       ${metaStoredStr}`);
console.log(`  📋  Canonical expected: ${TOTAL_CANONICAL_KEYS}`);
console.log(`  ✅  Present (direct):   ${totalDirect}`);
console.log(`  🔀  Present (aliased):  ${totalAliased}  ← found under alternate key`);
console.log(`  ❌  Truly missing:      ${totalMissing}`);
console.log(`  📊  True coverage:      ${pct(totalPresent, TOTAL_CANONICAL_KEYS)}\n`);

console.log('─────────────────────────────────────────────────────────────────');
console.log('  By Season\n');

for (const [season, r] of Object.entries(SEASON_RESULTS)) {
  const present = r.direct + r.aliased;
  const qualityPct = r.qualityMax > 0 ? ((r.qualitySum / r.qualityMax) * 100).toFixed(0) : 'N/A';
  console.log(`  ${season.padEnd(16)} ${bar(present, r.total)}  ${String(present).padStart(3)}/${r.total}  ${pct(present, r.total).padStart(6)}  quality: ${qualityPct}%`);
  if (r.aliased > 0) {
    console.log(`    └─ 🔀 ${r.aliased} found via alias`);
  }
}

if (!showMissingOnly && !showThinOnly) {
  // Show the alias report
  if (ALL_ALIASED.length > 0) {
    console.log('\n─────────────────────────────────────────────────────────────────');
    console.log('  🔀  Aliased Keys (present under alternate storage key)\n');
    for (const a of ALL_ALIASED) {
      console.log(`  [${a.season.padEnd(14)}]  ${a.expectedKey.padEnd(32)} → ${a.storageKey}`);
    }
  }
}

// ─── Missing keys ─────────────────────────────────────────────────────────────

if (!showThinOnly && ALL_MISSING.length > 0) {
  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log(`  ❌  Missing Keys (${ALL_MISSING.length} truly absent — need scraping)\n`);

  const bySeason = {};
  for (const m of ALL_MISSING) {
    (bySeason[m.season] = bySeason[m.season] || []).push(m.key);
  }

  for (const [season, keys] of Object.entries(bySeason)) {
    console.log(`  ── ${season} (${keys.length}) ──`);
    // Group consecutive week numbers for readability
    const grouped = [];
    let lastGroup = null;
    for (const key of keys.sort()) {
      const m = key.match(/Week(\d+)_(\w+)/);
      if (m) {
        const week = parseInt(m[1], 10);
        const day = m[2];
        if (lastGroup && lastGroup.prefix === key.replace(/_Week\d+_\w+$/, '') && lastGroup.day === day && lastGroup.lastWeek === week - 1) {
          lastGroup.lastWeek = week;
          lastGroup.count++;
        } else {
          if (lastGroup) grouped.push(lastGroup);
          lastGroup = { prefix: key.replace(/_Week\d+_\w+$/, ''), day, firstWeek: week, lastWeek: week, count: 1, keys: [key] };
        }
        lastGroup.keys.push(key);
      } else {
        if (lastGroup) { grouped.push(lastGroup); lastGroup = null; }
        grouped.push({ single: key });
      }
    }
    if (lastGroup) grouped.push(lastGroup);

    for (const g of grouped) {
      if (g.single) {
        console.log(`    ${g.single}`);
      } else if (g.firstWeek === g.lastWeek) {
        console.log(`    ${g.prefix}_Week${g.firstWeek}_${g.day}`);
      } else {
        console.log(`    ${g.prefix}_Week${g.firstWeek}–${g.lastWeek}_${g.day}  (${g.count} keys)`);
      }
    }
    console.log('');
  }
}

// ─── Thin entries ─────────────────────────────────────────────────────────────

if (!showMissingOnly && ALL_THIN.length > 0) {
  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log(`  ⚠️  Thin Entries (${ALL_THIN.length} entries with quality < 50%)\n`);
  for (const t of ALL_THIN) {
    const pctQ = pct(t.score, t.maxScore);
    console.log(`  [${t.season.padEnd(14)}]  ${t.key.padEnd(38)}  quality: ${pctQ}`);
    for (const [hour, h] of Object.entries(t.hours)) {
      if (h.present && h.missing.length > 0) {
        console.log(`    └─ ${hour.padEnd(20)} missing: ${h.missing.join(', ')}`);
      }
    }
  }
}

// ─── Recommendations ──────────────────────────────────────────────────────────

if (!showMissingOnly && !showThinOnly) {
  console.log('\n─────────────────────────────────────────────────────────────────');
  console.log('  📌  Recommended Next Actions\n');

  if (ALL_MISSING.length === 0) {
    console.log('  🎉  Full canonical coverage achieved! Nothing to scrape.');
  } else {
    // Priority: Easter → Lent → Advent → Ordinary Time
    const priority = ['Easter', 'Lent', 'Advent', 'Christmas', 'Fixed Feasts', 'Ordinary Time'];
    for (const season of priority) {
      const r = SEASON_RESULTS[season];
      if (!r || r.missing.length === 0) continue;
      const present = r.direct + r.aliased;
      console.log(`  ${season} (${r.missing.length} missing, ${pct(present, r.total)} covered):`);

      // Generate a date-range hint for batch scraping
      const d1 = getScrapeHintDate(season, r.missing[0]?.key);
      if (d1) console.log(`    → Scrape Advent/Easter/Lent dates that map to missing keys`);
      console.log(`    → node scripts/scrape-divineoffice-org.mjs --start YYYY-MM-DD --end YYYY-MM-DD`);
      console.log('');
    }
  }

  const otMissing = SEASON_RESULTS['Ordinary Time']?.missing?.length ?? 0;
  if (otMissing > 0) {
    console.log(`  ℹ️  ${otMissing} Ordinary Time keys missing.`);
    console.log(`     OT spans Weeks 1–34. Focus scraping on weeks adjacent to Lent/Pentecost`);
    console.log(`     where coverage may be thin (weeks 5–8 and 28–34).\n`);
  }

  if (ALL_THIN.length > 0) {
    console.log(`  ⚠️  ${ALL_THIN.length} thin entries have poor quality scores.`);
    console.log(`     Run with --force to re-scrape specific keys:`);
    console.log(`     node scripts/scrape-divineoffice-org.mjs --force --start YYYY-MM-DD --end YYYY-MM-DD\n`);
  }
}

console.log('─────────────────────────────────────────────────────────────────\n');

process.exit(ALL_MISSING.length > 0 ? 1 : 0);

// ─── Helper ───────────────────────────────────────────────────────────────────

function getScrapeHintDate(season, key) {
  if (!key) return null;
  const year = new Date().getFullYear();
  // Rough date hints for batch scraping guidance
  const SEASON_MONTH = { 'Advent': `${year}-12-01`, 'Lent': `${year + 1}-02-15`, 'Easter': `${year + 1}-04-05` };
  return SEASON_MONTH[season] ?? null;
}
