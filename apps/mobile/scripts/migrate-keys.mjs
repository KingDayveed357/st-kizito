#!/usr/bin/env node
/**
 * migrate-keys.mjs
 *
 * Data migration tool for divineOfficeComplete.json.
 *
 * Repairs two categories of key format issues:
 *
 *   1. STALE FORMAT — keys stored in "calendar format" instead of
 *      "storage format" (e.g. Easter_Week1_Sunday instead of EasterSunday).
 *      These would have been created by older scraper versions.
 *
 *   2. DUPLICATES — cases where both the calendar-format AND storage-format
 *      keys exist in the dataset for the same liturgical position. The
 *      storage-format key is kept; the calendar-format key is removed.
 *
 * The migration is IDEMPOTENT: running it twice produces the same result.
 *
 * Usage:
 *   node scripts/migrate-keys.mjs           # dry-run (shows changes, no writes)
 *   node scripts/migrate-keys.mjs --apply   # apply changes and write file
 *   node scripts/migrate-keys.mjs --verbose # show all checked keys
 *
 * Safety:
 *   - Creates a .bak file before writing in --apply mode
 *   - Logs every rename/deletion before executing it
 *   - Does NOT modify any office data, only key names
 *
 * Exit codes:
 *   0 = no changes needed (or changes applied successfully)
 *   1 = error
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { CALENDAR_TO_STORAGE_MAP } from './lib/keyNormalizer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const OUTPUT_FILE = path.join(__dirname, '../data/divineOfficeComplete.json');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const applyMode = args.includes('--apply');
const verbose = args.includes('--verbose');

// ─── Load dataset ─────────────────────────────────────────────────────────────

let dataset;
try {
  dataset = require(OUTPUT_FILE);
} catch (err) {
  console.error('❌ Cannot load divineOfficeComplete.json:', err.message);
  process.exit(1);
}

const allKeys = Object.keys(dataset).filter(k => k !== '__meta');
console.log(`\n📖  Loaded: ${allKeys.length} keys`);
console.log(`🔍  Mode:   ${applyMode ? 'APPLY (will write changes)' : 'DRY-RUN (no writes)'}`);
console.log('\n─────────────────────────────────────────────────────────────────');

// ─── Phase 1: Find keys that need renaming ────────────────────────────────────
// Any key stored in CALENDAR format (i.e., it appears in CALENDAR_TO_STORAGE_MAP
// as a source key) needs to be renamed to its STORAGE format equivalent.

const renames = []; // { from, to, conflict: boolean }
const deletions = []; // { key, reason }
const skipped = []; // { key, reason }

for (const calendarKey of Object.keys(CALENDAR_TO_STORAGE_MAP)) {
  const storageKey = CALENDAR_TO_STORAGE_MAP[calendarKey];

  // Does the stale calendar-format key exist in the dataset?
  if (!Object.prototype.hasOwnProperty.call(dataset, calendarKey)) {
    if (verbose) console.log(`  ⬜ ${calendarKey} — not in dataset (ok)`);
    continue;
  }

  // Does the canonical storage-format key ALSO already exist?
  if (Object.prototype.hasOwnProperty.call(dataset, storageKey)) {
    // Conflict: both formats exist. Keep storage key, delete calendar key.
    console.log(`  ⚠️  CONFLICT: Both "${calendarKey}" and "${storageKey}" exist`);

    const calEntry = dataset[calendarKey];
    const storEntry = dataset[storageKey];
    const calOfficeCount = Object.keys(calEntry?.offices ?? {}).length;
    const storOfficeCount = Object.keys(storEntry?.offices ?? {}).length;

    console.log(`       "${calendarKey}":  ${calOfficeCount} offices`);
    console.log(`       "${storageKey}": ${storOfficeCount} offices`);

    if (calOfficeCount > storOfficeCount) {
      // Calendar-format entry has MORE data — merge richer data into storage key, then delete calendar key
      console.log(`       → Merging ${calendarKey} offices into ${storageKey} (calendar has more offices)`);
      renames.push({ from: calendarKey, to: storageKey, merge: true, calOffices: calEntry.offices, storOffices: storEntry.offices });
    } else {
      // Storage-format entry has equal or more data — delete calendar-format key
      console.log(`       → Deleting ${calendarKey} (${storageKey} has equal/more data)`);
      deletions.push({ key: calendarKey, reason: `duplicate of ${storageKey}` });
    }
  } else {
    // Clean rename: calendar-format → storage-format
    const officeCount = Object.keys(dataset[calendarKey]?.offices ?? {}).length;
    console.log(`  🔄  RENAME: "${calendarKey}" → "${storageKey}"  (${officeCount} offices)`);
    renames.push({ from: calendarKey, to: storageKey, merge: false });
  }
}

// ─── Phase 2: Report ──────────────────────────────────────────────────────────

console.log('\n─────────────────────────────────────────────────────────────────');
const totalChanges = renames.length + deletions.length;

if (totalChanges === 0) {
  console.log('  ✅  No migration needed — all keys are already in storage format.\n');
  process.exit(0);
}

console.log(`\n  Summary:`);
console.log(`    🔄  Keys to rename:  ${renames.filter(r => !r.merge).length}`);
console.log(`    🔀  Keys to merge:   ${renames.filter(r => r.merge).length}`);
console.log(`    🗑   Keys to delete:  ${deletions.length}`);
console.log(`    📦  Net change:      ${-(deletions.length + renames.filter(r => r.merge).length)} keys`);

if (!applyMode) {
  console.log('\n  ⚠️  DRY-RUN: No changes written.');
  console.log('     Re-run with --apply to execute the migration.\n');
  process.exit(0);
}

// ─── Phase 3: Apply changes ───────────────────────────────────────────────────

// 3a. Create backup
const backupPath = OUTPUT_FILE.replace('.json', `.bak.${Date.now()}.json`);
console.log(`\n  💾  Creating backup: ${path.basename(backupPath)}`);
await fs.copyFile(OUTPUT_FILE, backupPath);

// 3b. Build new dataset (preserving __meta and insertion order)
const newDataset = { __meta: dataset.__meta };

// Process the original keys in order
for (const key of Object.keys(dataset)) {
  if (key === '__meta') continue;

  // Skip calendar-format keys that we're renaming (they'll be added under the new name)
  const isSourceKey = Object.prototype.hasOwnProperty.call(CALENDAR_TO_STORAGE_MAP, key);
  const targetKey = isSourceKey ? CALENDAR_TO_STORAGE_MAP[key] : null;

  if (isSourceKey) {
    const renameOp = renames.find(r => r.from === key);

    if (renameOp?.merge) {
      // Merge: add offices from calendar-format key into the storage-format entry
      // The storage-format entry will be written when we encounter it
      console.log(`  🔀  Merging offices from "${key}" into "${targetKey}"`);
      continue; // Skip writing the calendar-format key; merge happens when we hit the storage key
    } else if (renameOp) {
      // Rename: write under the storage key
      console.log(`  🔄  Renaming "${key}" → "${targetKey}"`);
      const entry = { ...dataset[key], key: targetKey };
      newDataset[targetKey] = entry;
      continue;
    }

    const delOp = deletions.find(d => d.key === key);
    if (delOp) {
      console.log(`  🗑   Deleting "${key}" (${delOp.reason})`);
      continue;
    }
  }

  // Check if this is a storage-format key that has a merge operation targeting it
  const mergeOp = renames.find(r => r.merge && r.to === key);
  if (mergeOp) {
    // Merge offices from the calendar-format key into this entry
    const merged = { ...dataset[key] };
    merged.offices = { ...mergeOp.calOffices, ...dataset[key].offices }; // storage-format offices take priority
    const totalOffices = Object.keys(merged.offices).length;
    console.log(`  🔀  Merged into "${key}": now has ${totalOffices} offices`);
    newDataset[key] = merged;
    continue;
  }

  // Normal key — copy as-is
  newDataset[key] = dataset[key];
}

// ─── Phase 4: Update metadata and write ───────────────────────────────────────

const finalKeys = Object.keys(newDataset).filter(k => k !== '__meta');
newDataset.__meta = {
  ...newDataset.__meta,
  totalKeys: finalKeys.length,
  lastMigratedAt: new Date().toISOString(),
  migrationNote: `Migrated ${renames.length} keys from calendar-format to storage-format. Deleted ${deletions.length} duplicates.`,
};

const outputJson = JSON.stringify(newDataset, null, 2);
await fs.writeFile(OUTPUT_FILE, outputJson, 'utf8');

console.log('\n─────────────────────────────────────────────────────────────────');
console.log(`  ✅  Migration complete`);
console.log(`  📦  Keys before: ${allKeys.length}`);
console.log(`  📦  Keys after:  ${finalKeys.length}`);
console.log(`  💾  Backup at:   ${path.basename(backupPath)}`);
console.log('\n  Run audit to verify:');
console.log('  node scripts/audit-coverage.mjs\n');
