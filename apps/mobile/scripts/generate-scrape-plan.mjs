#!/usr/bin/env node
/**
 * generate-scrape-plan.mjs
 *
 * Reads the current audit output (via audit-coverage.mjs --json) and produces
 * a prioritised, date-resolved scraping plan — exact --start/--end arguments
 * for each scrape batch needed to fill the missing canonical keys.
 *
 * The plan works by:
 *   1. Computing every date from 2025-01-01 through 2026-12-31 that maps to
 *      a missing key, using the authoritative liturgicalCalendar algorithm.
 *   2. Grouping contiguous date runs into batches (≤14 days each for safety).
 *   3. Prioritising by season: Lent → Advent → Easter → OT → Christmas.
 *
 * Usage:
 *   node scripts/generate-scrape-plan.mjs               # print plan
 *   node scripts/generate-scrape-plan.mjs --shell       # print ready-to-run shell commands
 *   node scripts/generate-scrape-plan.mjs --run         # execute scraper for each batch (sequential)
 *
 * IMPORTANT: divineoffice.org only serves a ~12-month rolling window.
 * Keys that cannot be resolved within that window are flagged as OFFLINE.
 */

import { fileURLToPath }    from 'url';
import path                 from 'path';
import { createRequire }    from 'module';
import { spawnSync }        from 'child_process';
import { SEASON_GROUPS }    from './lib/canonicalKeys.mjs';
import { normalizeToStorage } from './lib/keyNormalizer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

// ─── Inline calendar key computation (same algorithm as liturgicalCalendar.ts) ──

const utcDate  = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const addDays  = (dt, n)   => { const d = new Date(dt.getTime()); d.setUTCDate(d.getUTCDate() + n); return d; };
const diffDays = (a, b)    => Math.round((a.getTime() - b.getTime()) / 86_400_000);
const WDAYS    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function easter(year) {
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4;
  const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
  const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
  const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  const mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;
  return utcDate(year,mo,da);
}
function firstAdvent(y) {
  for(let d=27;d<=30;d++){const dt=utcDate(y,11,d);if(dt.getUTCDay()===0)return dt;}
  for(let d=1;d<=3;d++){const dt=utcDate(y,12,d);if(dt.getUTCDay()===0)return dt;}
}
function epiphany(y) {
  for(let d=2;d<=8;d++){const dt=utcDate(y,1,d);if(dt.getUTCDay()===0)return dt;}
}
function baptism(y) { const ep=epiphany(y); return ep.getUTCDate()>=7?addDays(ep,1):addDays(ep,7); }
function litYear(date) { const y=date.getUTCFullYear(); return date>=firstAdvent(y)?y+1:y; }
function anchors(year) {
  const e=easter(year);
  return { year,easter:e,ashWed:addDays(e,-46),palmSun:addDays(e,-7),holyThu:addDays(e,-3),
           pentecost:addDays(e,49),adventStart:firstAdvent(year-1),christmas:utcDate(year-1,12,25),
           baptism:baptism(year),nextAdvent:firstAdvent(year) };
}
function computeKey(isoDate) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  const y=date.getUTCFullYear(), m=date.getUTCMonth()+1, d=date.getUTCDate();
  const dn=WDAYS[date.getUTCDay()];
  const mmdd=`${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const ly=litYear(date);
  const a=anchors(ly);

  // Season
  let season,period;
  if(date<a.christmas){season='Advent';period='Advent';}
  else if(date<addDays(a.baptism,1)){season='Christmas';period='Christmas';}
  else if(date<a.ashWed){season='Ordinary Time';period='Ordinary Time';}
  else if(date<a.palmSun){season='Lent';period='Lent';}
  else if(date<a.holyThu){season='Lent';period='Holy Week';}
  else if(date<a.easter){season='Lent';period='Paschal Triduum';}
  else if(date<addDays(a.pentecost,1)){season='Easter';period=diffDays(date,a.easter)<=7?'Easter Octave':'Easter';}
  else if(date<a.nextAdvent){season='Ordinary Time';period='Ordinary Time';}
  else {season='Ordinary Time';period='Ordinary Time';}

  // Week number
  let week=null;
  if(season==='Ordinary Time'){
    const start=addDays(a.baptism,1);
    if(date<a.ashWed) week=Math.floor(diffDays(date,start)/7)+1;
    else { const lb=addDays(a.ashWed,-1); const wb=Math.floor(diffDays(lb,start)/7)+1; const res=addDays(a.pentecost,1); week=wb+2+Math.floor(diffDays(date,res)/7); }
  } else if(season==='Advent') week=Math.floor(diffDays(date,a.adventStart)/7)+1;
  else if(season==='Lent'&&period==='Lent'){const fs=addDays(a.ashWed,4);week=date<fs?0:Math.floor(diffDays(date,fs)/7)+1;}
  else if(season==='Easter') week=diffDays(date,a.easter)<=7?1:2+Math.floor(diffDays(date,addDays(a.easter,8))/7);

  // Key
  const FIXED={
    '01-01':'Mary_MotherOfGod','02-02':'PresentationOfTheLord','03-19':'SaintJoseph',
    '03-25':'AnnunciationOfTheLord','06-24':'NativityOfSaintJohnTheBaptist',
    '06-29':'SaintsPeterAndPaulApostles','08-06':'TransfigurationOfTheLord',
    '08-15':'AssumptionOfTheBlessedVirginMary','09-14':'ExaltationOfTheHolyCross',
    '11-01':'AllSaints','11-02':'AllSouls','12-08':'ImmaculateConception',
    '12-25':'NativityOfTheLord_Christmas','12-26':'SaintStephen',
    '12-27':'SaintJohnApostle','12-28':'HolyInnocents',
  };
  const PROTECTED=new Set(['EasterSunday','HolyThursday','GoodFriday','HolySaturday']);
  let key;
  if(season==='Ordinary Time'&&week!==null)key=`OrdinaryTime_Week${week}_${dn}`;
  else if(season==='Advent'){if(m===12&&d>=17&&d<=24&&dn!=='Sunday')key=`Advent_Dec${d}`;else if(week)key=`Advent_Week${week}_${dn}`;else key=`Advent_${dn}`;}
  else if(season==='Lent'){if(period==='Paschal Triduum'){if(dn==='Thursday')key='HolyThursday';else if(dn==='Friday')key='GoodFriday';else key='HolySaturday';}else if(period==='Holy Week')key=`HolyWeek_${dn}`;else if(week===0)key=`Lent_AshWeek_${dn}`;else if(week)key=`Lent_Week${week}_${dn}`;else key=`Lent_${dn}`;}
  else if(season==='Easter'){const da=diffDays(date,a.easter);if(da===0)key='EasterSunday';else if(period==='Easter Octave'&&dn!=='Sunday')key=`EasterOctave_${dn}`;else if(week)key=`Easter_Week${week}_${dn}`;else key=`Easter_${dn}`;}
  else if(season==='Christmas'){if(m===12&&d===25)key='NativityOfTheLord_Christmas';else if(m===12&&d===26)key='SaintStephen';else if(m===12&&d===27)key='SaintJohnApostle';else if(m===12&&d===28)key='HolyInnocents';else if(m===1&&d===1)key='Mary_MotherOfGod';else if(dn==='Sunday'){const dsc=diffDays(date,a.christmas);if(dsc>0&&dsc<=7)key='HolyFamily';else key=`Christmas_Sunday_W${Math.ceil(dsc/7)}`;}else{const ds=diffDays(date,a.christmas);if(ds>0&&ds<=7)key=`ChristmasOctave_${dn}`;else key=`Christmas_${dn}`;}}
  else key=`${season}_${dn}`;
  
  if(FIXED[mmdd]&&!PROTECTED.has(key))key=FIXED[mmdd];
  return key;
}

// ─── Load current missing list ─────────────────────────────────────────────────

let dataset;
try { dataset = require('../data/divineOfficeComplete.json'); } 
catch { console.error('❌ Cannot load divineOfficeComplete.json'); process.exit(1); }

const storedKeys = new Set(Object.keys(dataset).filter(k => k !== '__meta'));

// Build set of all currently missing canonical keys
const missingKeys = new Set();
for (const expectedKeys of Object.values(SEASON_GROUPS)) {
  for (const key of expectedKeys) {
    const storageKey = normalizeToStorage(key);
    if (!storedKeys.has(storageKey) && !storedKeys.has(key)) {
      missingKeys.add(storageKey !== key ? storageKey : key);
    }
  }
}

if (missingKeys.size === 0) {
  console.log('\n✅  All canonical keys are present. Nothing to scrape.\n');
  process.exit(0);
}

// ─── Build date → key mapping for the scraping window ─────────────────────────
// divineoffice.org serves ~12 months from today. We scan 18 months to be safe,
// then extend into future years until we find dates that cover all missing keys.

const today = new Date();
const scanStart = new Date(Date.UTC(today.getUTCFullYear() - 1, today.getUTCMonth(), 1));
const scanEnd   = new Date(Date.UTC(today.getUTCFullYear() + 2, today.getUTCMonth(), 1));

const missingKeyDates = new Map(); // key → [dates that map to this key]

const cur = new Date(scanStart.getTime());
while (cur <= scanEnd) {
  const iso = cur.toISOString().slice(0, 10);
  const key = computeKey(iso);
  if (missingKeys.has(key)) {
    if (!missingKeyDates.has(key)) missingKeyDates.set(key, []);
    missingKeyDates.get(key).push(iso);
  }
  cur.setUTCDate(cur.getUTCDate() + 1);
}

// Which missing keys have NO date in the scan window?
const offlineKeys = [...missingKeys].filter(k => !missingKeyDates.has(k));
const scrapableKeys = [...missingKeys].filter(k => missingKeyDates.has(k));

// ─── Group dates into contiguous batches ──────────────────────────────────────

// Collect all dates needed (first date found per key, prefer dates in the live window)
const liveWindowStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
const liveWindowEnd   = new Date(Date.UTC(today.getUTCFullYear() + 1, today.getUTCMonth() + 2, 1));

const targetDates = new Set();
for (const [, dates] of missingKeyDates) {
  // Prefer a date in the live window if available
  const liveDate = dates.find(d => {
    const dt = new Date(`${d}T12:00:00Z`);
    return dt >= liveWindowStart && dt <= liveWindowEnd;
  });
  targetDates.add(liveDate ?? dates[0]);
}

// Sort and group into contiguous runs (split on gaps > 3 days to avoid padding)
const sortedDates = [...targetDates].sort();
const batches = [];
let batchStart = null, batchEnd = null, batchKeys = [];

for (const iso of sortedDates) {
  const dt = new Date(`${iso}T12:00:00Z`);
  const key = computeKey(iso);

  if (!batchStart) {
    batchStart = iso; batchEnd = iso; batchKeys = [key];
  } else {
    const prev = new Date(`${batchEnd}T12:00:00Z`);
    const gap  = diffDays(dt, prev);
    if (gap <= 3 && batchKeys.length < 14) {
      batchEnd = iso; batchKeys.push(key);
    } else {
      batches.push({ start: batchStart, end: batchEnd, keys: [...batchKeys] });
      batchStart = iso; batchEnd = iso; batchKeys = [key];
    }
  }
}
if (batchStart) batches.push({ start: batchStart, end: batchEnd, keys: [...batchKeys] });

// ─── Priority ordering ────────────────────────────────────────────────────────

const PRIORITY = ['Lent', 'Advent', 'EasterOctave', 'Easter', 'HolyWeek', 'Christmas', 'Fixed', 'OrdinaryTime'];
function batchPriority(b) {
  for (let i = 0; i < PRIORITY.length; i++) {
    if (b.keys.some(k => k.startsWith(PRIORITY[i]) || (PRIORITY[i]==='Fixed'&&!k.includes('_Week')))) return i;
  }
  return PRIORITY.length;
}
batches.sort((a, b) => batchPriority(a) - batchPriority(b));

// ─── Output ───────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const shellMode = args.includes('--shell');
const runMode   = args.includes('--run');

if (shellMode) {
  console.log('# === Divine Office Scrape Plan — Generated', new Date().toISOString(), '===');
  console.log('# Run from: apps/mobile\n');
  for (const b of batches) {
    const keyPreview = b.keys.slice(0, 3).join(', ') + (b.keys.length > 3 ? ` ... (+${b.keys.length - 3} more)` : '');
    console.log(`# ${keyPreview}`);
    console.log(`node scripts/scrape-divineoffice-org.mjs --start ${b.start} --end ${b.end}`);
    console.log('');
  }
  if (offlineKeys.length > 0) {
    console.log('# ── OFFLINE KEYS (no date in scan window — need future scraping window) ──');
    offlineKeys.forEach(k => console.log(`# ${k}`));
  }
  process.exit(0);
}

if (!runMode) {
  // Default: human-readable plan
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║            DIVINE OFFICE SCRAPE PLAN                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log(`  Missing keys:        ${missingKeys.size}`);
  console.log(`  Scrapable now:       ${scrapableKeys.length}  (have a date in ${scanStart.toISOString().slice(0,7)}–${scanEnd.toISOString().slice(0,7)})`);
  console.log(`  Offline (no window): ${offlineKeys.length}`);
  console.log(`  Batches to run:      ${batches.length}\n`);

  console.log('  ─────────────────────────────────────────────────────────────');
  console.log('  Batch Plan:\n');

  batches.forEach((b, i) => {
    const keyPreview = b.keys.slice(0, 4).join(', ') + (b.keys.length > 4 ? ` (+${b.keys.length-4} more)` : '');
    const inLiveWindow = new Date(`${b.start}T12:00:00Z`) >= liveWindowStart && new Date(`${b.end}T12:00:00Z`) <= liveWindowEnd;
    const windowFlag = inLiveWindow ? '✅ live' : '⚠️  outside live window';
    console.log(`  [${String(i+1).padStart(2)}]  ${b.start} → ${b.end}  (${b.keys.length} keys)  ${windowFlag}`);
    console.log(`        Keys: ${keyPreview}`);
  });

  if (offlineKeys.length > 0) {
    console.log('\n  ─────────────────────────────────────────────────────────────');
    console.log(`  ⚠️  ${offlineKeys.length} keys have no date in the scan window:`);
    offlineKeys.forEach(k => console.log(`    • ${k}`));
  }

  console.log('\n  ─────────────────────────────────────────────────────────────');
  console.log('  To run: node scripts/generate-scrape-plan.mjs --shell');
  console.log('       or: node scripts/generate-scrape-plan.mjs --run\n');
  process.exit(0);
}

// ─── --run mode: execute each batch sequentially ──────────────────────────────

console.log(`\n🚀  Running ${batches.length} scrape batches...\n`);

let succeeded = 0, failed = 0;
for (const [i, b] of batches.entries()) {
  const keyPreview = b.keys.slice(0, 3).join(', ') + (b.keys.length > 3 ? '...' : '');
  console.log(`\n[${i + 1}/${batches.length}]  ${b.start} → ${b.end}  —  ${keyPreview}`);

  const result = spawnSync(
    'node',
    ['scripts/scrape-divineoffice-org.mjs', '--start', b.start, '--end', b.end],
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  );

  if (result.status === 0) {
    succeeded++;
    console.log(`         ✅ Done`);
  } else {
    failed++;
    console.log(`         ❌ Failed (exit ${result.status})`);
  }

  // Small pause between batches
  await new Promise(r => setTimeout(r, 1000));
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`  ✅  Succeeded: ${succeeded}`);
console.log(`  ❌  Failed:    ${failed}`);
console.log(`\n  Run audit to verify: npm run office:audit\n`);
