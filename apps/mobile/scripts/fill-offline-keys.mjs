import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { ALL_CANONICAL_KEYS, CANONICAL_KEY_SET } from './lib/canonicalKeys.mjs';
import { CALENDAR_TO_STORAGE_MAP } from './lib/keyNormalizer.mjs';

const require = createRequire(import.meta.url);
const divineOfficeExtras = require('./lib/extras.js');
const { PSALTER_ANTIPHONS } = divineOfficeExtras;

const divineOfficeData = require('../data/divineOffice.json');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '../data/divineOfficeComplete.json');

// Get dataset
let dataset;
try {
  const raw = await fs.readFile(OUTPUT_FILE, 'utf8');
  dataset = JSON.parse(raw);
} catch (e) {
  console.error("❌ Cannot load divineOfficeComplete.json");
  process.exit(1);
}

const storedKeys = new Set(Object.keys(dataset).filter(k => k !== '__meta'));

// Find missing keys
const missingKeys = [];
for (const expectedKey of ALL_CANONICAL_KEYS) {
  const storageKey = CALENDAR_TO_STORAGE_MAP[expectedKey] || expectedKey;
  if (!storedKeys.has(expectedKey) && !storedKeys.has(storageKey)) {
    missingKeys.push(expectedKey);
  }
}

console.log(`🔍 Found ${missingKeys.length} truly missing keys to generate natively.`);

// Helper: infer Calendar context from Key
function inferCalendar(key) {
    let season = "Ordinary Time";
    let week = 1;
    let day = "Sunday";
    let isSolemnity = false;

    if (key.startsWith("OrdinaryTime")) {
         season = "Ordinary Time";
         const m = key.match(/Week(\d+)_([A-Za-z]+)/);
         if (m) { week = parseInt(m[1]); day = m[2]; }
    } else if (key.startsWith("Advent")) {
         season = "Advent";
         const m = key.match(/Week(\d+)_([A-Za-z]+)/);
         if (m) { week = parseInt(m[1]); day = m[2]; }
         else { week = 3; day = "Wednesday"; }
    } else if (key.startsWith("Lent")) {
         season = "Lent";
         const m = key.match(/Week(\d+)_([A-Za-z]+)/);
         if (m) { week = parseInt(m[1]); day = m[2]; }
         if (key.includes("AshWeek")) { week = 1; }
    } else if (key.startsWith("Easter")) {
         season = "Easter";
         const m = key.match(/Week(\d+)_([A-Za-z]+)/);
         if (m) { week = parseInt(m[1]); day = m[2]; }
    } else if (key.startsWith("Christmas")) {
         season = "Christmas";
         week = 1;
    } else {
         season = "Ordinary Time";
         isSolemnity = true;
    }

    const psalterWeek = (week % 4 === 0) ? 4 : (week % 4);
    return { season, week, psalterWeek, day, isSolemnity };
}

function getResponsory(seasonKey, officeKey) {
     if (seasonKey === 'Lent' && officeKey === 'morningPrayer') {
         return 'Have mercy on me, O God, in your kindness.\n— In your compassion blot out my offence.\nWash me more and more from my guilt.\n— Blot out my offence.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— In your compassion blot out my offence.';
     }
     return 'O Lord, hear my prayer.\n— And let my cry come before you.\nGlory be to the Father, and to the Son, and to the Holy Spirit.\n— As it was in the beginning, is now, and ever shall be.';
}

const SEASONAL_INTERCESSIONS = {
    Advent: "Lord, bring your salvation to the ends of the earth.",
    Christmas: "Lord, you are the light of the nations.",
    Lent: "Lord, be merciful to us sinners.",
    Easter: "Lord, by your resurrection you have conquered death.",
    OrdinaryTime: "Lord, guide our steps into the way of peace."
};

const officesToGen = ['morningPrayer', 'midmorningPrayer', 'middayPrayer', 'midafternoonPrayer', 'eveningPrayer', 'nightPrayer', 'officeOfReadings'];

for (const key of missingKeys) {
   const cal = inferCalendar(key);
   const seasonKey = cal.season.replace(" ", "");
   
   const newEntry = {
       key: key,
       date: "Generated Fallback",
       season: { name: cal.season, color: cal.season === 'Lent' || cal.season === 'Advent' ? 'purple' : 'green' },
       celebration: { name: `Generated fallback for ${key}`, rank: cal.isSolemnity ? "Solemnity" : "Weekday" },
       quality: { maxScore: 80, score: 80, rating: "THIN", fallback: true },
       offices: {}
   };

   for (const officeType of officesToGen) {
       const psalterWeekKey = `week${cal.psalterWeek}`;
       const dayOfWeek = cal.day.toLowerCase();
       const antiphonSource = PSALTER_ANTIPHONS[psalterWeekKey]?.[dayOfWeek]?.[officeType] ?? [];
       
       const isSunday = cal.day === 'Sunday';
       const scope = isSunday || cal.isSolemnity ? 'sunday' : 'weekday';
       
       let psalmRefs = divineOfficeData.psalter?.[psalterWeekKey]?.[officeType]?.[scope]?.psalms ?? ["Psalm 63", "Canticle of Daniel", "Psalm 149"];

       const introduction = officeType === 'nightPrayer'
            ? 'God, come to my assistance.\nLord, make haste to help me.\nGlory to the Father...\nAlleluia.'
            : 'O God, come to our aid.\nO Lord, make haste to help us.\nGlory be to the Father...';

       const psalmodyParts = psalmRefs.map((ref, idx) => ({
             heading: ref,
             antiphon: antiphonSource[idx] ?? "",
             text: `[ ${ref} — text to be dynamically fetched by Engine ]`
       }));

       const readingRef = divineOfficeData.seasons?.[seasonKey]?.readings?.[officeType] ?? null;

       const parts = {
           introduction,
           hymn: { text: `[ Seasonal Hymn for ${cal.season} ]` },
           psalmody: psalmodyParts,
           ...(readingRef ? { reading: { reference: readingRef, text: "[ Text dynamically fetched ]" } } : {}),
           responsory: { text: getResponsory(cal.season, officeType) },
           concludingPrayer: { text: "[ Concluding Prayer dynamically fetched ]" }
       };

       if (['morningPrayer', 'eveningPrayer'].includes(officeType)) {
           parts.gospelCanticle = {
               heading: officeType === 'morningPrayer' ? 'Benedictus' : 'Magnificat',
               antiphon: "[ Antiphon ]",
               text: officeType === 'morningPrayer' ? 'Blessed be the Lord...' : 'My soul glorifies the Lord...'
           };
       }

       if (officeType !== 'nightPrayer') {
           parts.intercessions = { text: SEASONAL_INTERCESSIONS[seasonKey] ?? SEASONAL_INTERCESSIONS.OrdinaryTime };
           parts.lordsPrayer = { text: "Our Father, who art in heaven..." };
       }

       newEntry.offices[officeType] = { parts };
   }

   dataset[key] = newEntry;
   console.log(`✅ Generated native fallback for ${key}`);
}

const finalKeys = Object.keys(dataset).filter(k => k !== '__meta');
dataset.__meta.totalKeys = finalKeys.length;
dataset.__meta.lastScrapedAt = new Date().toISOString();

await fs.writeFile(OUTPUT_FILE, JSON.stringify(dataset, null, 2), 'utf8');

console.log(`\n🎉 Success! Wrote ${missingKeys.length} missing keys natively to the dataset.`);
console.log(`Run 'npm run office:audit:missing' to confirm 100% coverage.`);
