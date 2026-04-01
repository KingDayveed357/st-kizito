import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(
  repoRoot,
  'tmp',
  'catholic-readings-api-main',
  'catholic-readings-api-main',
);
const outputRoot = path.join(repoRoot, 'data');
const require = createRequire(import.meta.url);
const SOURCE_DATE_OVERRIDES = {
  '2025-12-28': {
    celebrationName: 'Holy Family',
    key: 'HolyFamily',
  },
};

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const ORDINAL_WORDS = {
  First: 1,
  Second: 2,
  Third: 3,
  Fourth: 4,
  Fifth: 5,
  Sixth: 6,
  Seventh: 7,
  Eighth: 8,
  Ninth: 9,
  Tenth: 10,
  Eleventh: 11,
  Twelfth: 12,
  Thirteenth: 13,
  Fourteenth: 14,
  Fifteenth: 15,
  Sixteenth: 16,
  Seventeenth: 17,
  Eighteenth: 18,
  Nineteenth: 19,
  Twentieth: 20,
  TwentyFirst: 21,
  TwentySecond: 22,
  TwentyThird: 23,
  TwentyFourth: 24,
  TwentyFifth: 25,
  TwentySixth: 26,
  TwentySeventh: 27,
  TwentyEighth: 28,
  TwentyNinth: 29,
  Thirtieth: 30,
  ThirtyFirst: 31,
  ThirtySecond: 32,
  ThirtyThird: 33,
  ThirtyFourth: 34,
};

const MAJOR_FEAST_KEYS = new Map([
  ['Mary, Mother of God', 'Mary_MotherOfGod'],
  ['Mary Mother of God', 'Mary_MotherOfGod'],
  ['The Epiphany of the Lord', 'EpiphanyOfTheLord'],
  ['Epiphany of the Lord', 'EpiphanyOfTheLord'],
  ['Epiphany', 'EpiphanyOfTheLord'],
  ['The Baptism of the Lord', 'BaptismOfTheLord'],
  ['Baptism of the Lord', 'BaptismOfTheLord'],
  ['Feast of the Baptism of the Lord', 'BaptismOfTheLord'],
  ['Presentation of the Lord', 'PresentationOfTheLord'],
  ['Ash Wednesday', 'AshWednesday'],
  ['Palm Sunday of the Passion of the Lord', 'PalmSunday'],
  ["Palm Sunday of the Lord's Passion", 'PalmSunday'],
  ['Palm Sunday of the Lord’s Passion', 'PalmSunday'],
  ['Monday of Holy Week', 'HolyWeek_Monday'],
  ['Tuesday of Holy Week', 'HolyWeek_Tuesday'],
  ['Wednesday of Holy Week', 'HolyWeek_Wednesday'],
  ['Holy Thursday', 'HolyThursday'],
  ['Friday of the Passion of the Lord', 'GoodFriday'],
  ['Good Friday', 'GoodFriday'],
  ['Holy Saturday', 'HolySaturday'],
  ['Easter Sunday', 'EasterSunday'],
  ['Second Sunday of Easter', 'Easter_Week2_Sunday'],
  ['Third Sunday of Easter', 'Easter_Week3_Sunday'],
  ['Fourth Sunday of Easter', 'Easter_Week4_Sunday'],
  ['Fifth Sunday of Easter', 'Easter_Week5_Sunday'],
  ['Sixth Sunday of Easter', 'Easter_Week6_Sunday'],
  ['Seventh Sunday of Easter', 'Easter_Week7_Sunday'],
  ['Pentecost Sunday', 'PentecostSunday'],
  ['Holy Trinity Sunday', 'MostHolyTrinity'],
  ['The Most Holy Trinity', 'MostHolyTrinity'],
  ['Corpus Christi', 'MostHolyBodyAndBloodOfChrist'],
  ['The Most Holy Body and Blood of Christ', 'MostHolyBodyAndBloodOfChrist'],
  ['The Most Sacred Heart of Jesus', 'MostSacredHeartOfJesus'],
  ['Sacred Heart of Jesus', 'MostSacredHeartOfJesus'],
  ['Holy Family', 'HolyFamily'],
  ['The Holy Family', 'HolyFamily'],
  ['The Holy Family of Jesus, Mary, and Joseph', 'HolyFamily'],
  ['The Assumption of the Blessed Virgin Mary', 'AssumptionOfTheBlessedVirginMary'],
  ['All Saints', 'AllSaints'],
  ['The Commemoration of All the Faithful Departed (All Souls)', 'AllSouls'],
  ['The Immaculate Conception of the Blessed Virgin Mary', 'ImmaculateConception'],
  ['Our Lord Jesus Christ, King of the Universe', 'ChristTheKing'],
  ['Christ the King', 'ChristTheKing'],
  ['The Annunciation of the Lord', 'AnnunciationOfTheLord'],
  ['Saint Joseph, Spouse of the Blessed Virgin Mary', 'SaintJosephSpouseOfTheBlessedVirginMary'],
  ['The Nativity of Saint John the Baptist', 'NativityOfSaintJohnTheBaptist'],
  ['Saints Peter and Paul, Apostles', 'SaintsPeterAndPaulApostles'],
  ['The Transfiguration of the Lord', 'TransfigurationOfTheLord'],
  ['The Exaltation of the Holy Cross', 'ExaltationOfTheHolyCross'],
  ['The Nativity of the Lord (Christmas)', 'NativityOfTheLord_Christmas'],
  ['Christmas', 'NativityOfTheLord_Christmas'],
]);

function utcDate(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day));
}

function cloneDate(date) {
  return new Date(date.getTime());
}

function addDays(date, days) {
  const next = cloneDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function diffDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function normalizeWhitespace(value) {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function stripAccents(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function slugKey(value) {
  return stripAccents(value)
    .replace(/&/g, 'And')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function romanSundayCycle(liturgicalYear) {
  return ['C', 'A', 'B'][liturgicalYear % 3];
}

function weekdayCycleForYear(year) {
  return year % 2 === 0 ? 'II' : 'I';
}

function computeEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month, day);
}

function firstSundayOfAdvent(year) {
  for (let day = 27; day <= 30; day += 1) {
    const novemberDate = utcDate(year, 11, day);
    if (novemberDate.getUTCDay() === 0) {
      return novemberDate;
    }
  }

  for (let day = 1; day <= 3; day += 1) {
    const decemberDate = utcDate(year, 12, day);
    if (decemberDate.getUTCDay() === 0) {
      return decemberDate;
    }
  }

  throw new Error(`Unable to compute Advent start for ${year}`);
}

function usEpiphany(year) {
  for (let day = 2; day <= 8; day += 1) {
    const date = utcDate(year, 1, day);
    if (date.getUTCDay() === 0) {
      return date;
    }
  }
  throw new Error(`Unable to compute Epiphany for ${year}`);
}

function baptismOfTheLord(year) {
  const epiphany = usEpiphany(year);
  if (epiphany.getUTCDate() === 7 || epiphany.getUTCDate() === 8) {
    return addDays(epiphany, 1);
  }
  return addDays(epiphany, 7);
}

function liturgicalYearForDate(date) {
  const civilYear = date.getUTCFullYear();
  const adventStart = firstSundayOfAdvent(civilYear);
  return date >= adventStart ? civilYear + 1 : civilYear;
}

function computeTemporalAnchors(year) {
  const easter = computeEaster(year);
  const ashWednesday = addDays(easter, -46);
  const palmSunday = addDays(easter, -7);
  const holyThursday = addDays(easter, -3);
  const pentecost = addDays(easter, 49);
  return {
    year,
    easter,
    ashWednesday,
    palmSunday,
    holyThursday,
    pentecost,
    adventStart: firstSundayOfAdvent(year),
    christmas: utcDate(year, 12, 25),
    baptism: baptismOfTheLord(year),
  };
}

function buildYearContext(year) {
  return {
    current: computeTemporalAnchors(year),
    previous: computeTemporalAnchors(year - 1),
  };
}

function classifySeason(date, context) {
  const { current } = context;

  if (date <= current.baptism) {
    return { season: 'Christmas', period: 'Christmas' };
  }

  if (date < current.ashWednesday) {
    return { season: 'Ordinary Time', period: 'Ordinary Time' };
  }

  if (date < current.palmSunday) {
    return { season: 'Lent', period: 'Lent' };
  }

  if (date < current.holyThursday) {
    return { season: 'Lent', period: 'Holy Week' };
  }

  if (date < current.easter) {
    return { season: 'Lent', period: 'Paschal Triduum' };
  }

  if (date <= current.pentecost) {
    return {
      season: 'Easter',
      period: diffDays(date, current.easter) <= 7 ? 'Easter Octave' : 'Easter',
    };
  }

  if (date < current.adventStart) {
    return { season: 'Ordinary Time', period: 'Ordinary Time' };
  }

  if (date < current.christmas) {
    return { season: 'Advent', period: 'Advent' };
  }

  return { season: 'Christmas', period: 'Christmas' };
}

function decodeHtml(value) {
  return value
    .replace(/&#8212;/g, '—')
    .replace(/&#8211;/g, '–')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&uuml;/g, 'u')
    .replace(/&eacute;/g, 'e')
    .replace(/&aacute;/g, 'a')
    .replace(/&oacute;/g, 'o')
    .replace(/&iacute;/g, 'i')
    .replace(/&ccedil;/g, 'c')
    .replace(/<sup>(.*?)<\/sup>/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u2019/g, "'")
    .replace(/\u2013/g, '–');
}

function cleanReadingReference(value) {
  if (!value) {
    return null;
  }
  const text = normalizeWhitespace(decodeHtml(value))
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/\bopt\.?:\s*/gi, '')
    .replace(/\boptional\.?:\s*/gi, '')
    .replace(/\bor\b.*$/i, '')
    .replace(/\(\s*diff\s*\)/gi, '')
    .replace(/\(\s*new\s*\)/gi, '')
    .replace(/\*\s*$/g, '')
    .trim();
  return text || null;
}

function extractRows(html) {
  const rows = [];
  const rowPattern = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch = rowPattern.exec(html);
  while (rowMatch) {
    const cells = [];
    const cellPattern = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch = cellPattern.exec(rowMatch[1]);
    while (cellMatch) {
      cells.push(cellMatch[1]);
      cellMatch = cellPattern.exec(rowMatch[1]);
    }
    if (cells.length) {
      rows.push(cells);
    }
    rowMatch = rowPattern.exec(html);
  }
  return rows;
}

function parseTableRowToReading(cells) {
  if (cells.length < 8) {
    return null;
  }

  const title = normalizeWhitespace(decodeHtml(cells[2]));
  if (!title || title === 'Sunday or Feast' || title === 'Date') {
    return null;
  }

  const payload = {
    title,
    first: cleanReadingReference(cells[3]),
    psalm: cleanReadingReference(cells[4]),
    second: cleanReadingReference(cells[5]),
    gospel: cleanReadingReference(cells[7]),
  };

  if (!payload.first || !payload.psalm || !payload.gospel) {
    return null;
  }

  return payload;
}

function ordinalToNumber(value) {
  const normalized = slugKey(value);
  if (ORDINAL_WORDS[normalized]) {
    return ORDINAL_WORDS[normalized];
  }

  const numeric = normalized.match(/(\d+)/);
  if (numeric) {
    return Number(numeric[1]);
  }

  throw new Error(`Unsupported ordinal value: ${value}`);
}

function keyFromSundayTitle(title) {
  const simplified = title
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\bAt the Vigil Mass.*$/i, '')
    .replace(/\bMass during the Day.*$/i, '')
    .replace(/\bbegin \d+(?:st|nd|rd|th) Week in Ordinary Time\b/i, '')
    .replace(/^[^:]+:\s*/g, '')
    .replace(/^Feast of /i, '')
    .replace(/\s+\(.*?\)/g, '')
    .replace(/\s+-\s+[ABC]$/g, '')
    .replace(/\s+ABC$/g, '')
    .replace(/\s+[ABC]$/g, '')
    .replace(/\s+Sunday of Divine Mercy/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const mapped = MAJOR_FEAST_KEYS.get(simplified);
  if (mapped) {
    return mapped;
  }

  let match = simplified.match(/^(.*?) Sunday of Advent$/i);
  if (match) {
    return `Advent_Week${ordinalToNumber(match[1])}_Sunday`;
  }

  match = simplified.match(/^(.*?) Sunday of Lent$/i);
  if (match) {
    return `Lent_Week${ordinalToNumber(match[1])}_Sunday`;
  }

  match = simplified.match(/^(.*?) Sunday of Easter$/i);
  if (match) {
    return `Easter_Week${ordinalToNumber(match[1])}_Sunday`;
  }

  match = simplified.match(/^(.*?) Sunday (?:in|of) Ordinary Time$/i);
  if (match) {
    return `OrdinaryTime_Week${ordinalToNumber(match[1])}_Sunday`;
  }

  if (/Christ the King/i.test(simplified)) {
    return 'ChristTheKing';
  }

  return slugKey(simplified);
}

function pickReadingFields(parsed) {
  const result = {
    first: parsed.first,
    psalm: parsed.psalm,
    gospel: parsed.gospel,
  };
  if (parsed.second) {
    result.second = parsed.second;
  }
  return result;
}

function parseSupplementalSundayTables(files) {
  const readings = {};
  for (const file of files) {
    const html = require('node:fs').readFileSync(file, 'utf8');
    for (const cells of extractRows(html)) {
      const parsed = parseTableRowToReading(cells);
      if (!parsed) {
        continue;
      }
      const cycleMatch = parsed.title.match(/-\s*([BC])\b/);
      if (!cycleMatch) {
        continue;
      }

      const key = keyFromSundayTitle(parsed.title);
      if (!readings[key]) {
        readings[key] = {};
      }

      readings[key][cycleMatch[1]] = pickReadingFields(parsed);
    }
  }
  return readings;
}

function normalizeCelebrationName(rawName) {
  return normalizeWhitespace(rawName)
    .replace(/\s+\(.*?\)/g, '')
    .replace(/^USA:\s*/i, '')
    .replace(/^The /, '')
    .trim();
}

function extractWeekFromName(name) {
  const normalized = name
    .replace(/Sunday of Divine Mercy/gi, '')
    .replace(/\s+after Ash Wednesday/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  let match = normalized.match(/\b(the )?(.*?) Week in Ordinary Time\b/i);
  if (match) return ordinalToNumber(match[2]);

  match = normalized.match(/\b(the )?(.*?) Sunday (?:in|of) Ordinary Time\b/i);
  if (match) return ordinalToNumber(match[2]);

  match = normalized.match(/\b(the )?(.*?) Week of Advent\b/i);
  if (match) return ordinalToNumber(match[2]);

  match = normalized.match(/\b(the )?(.*?) Sunday of Advent\b/i);
  if (match) return ordinalToNumber(match[2]);

  match = normalized.match(/\b(the )?(.*?) Week of Lent\b/i);
  if (match) return ordinalToNumber(match[2]);

  match = normalized.match(/\b(the )?(.*?) Sunday of Lent\b/i);
  if (match) return ordinalToNumber(match[2]);

  match = normalized.match(/\b(the )?(.*?) Week of Easter\b/i);
  if (match) return ordinalToNumber(match[2]);

  match = normalized.match(/\b(the )?(.*?) Sunday of Easter\b/i);
  if (match) return ordinalToNumber(match[2]);

  return null;
}

function ordinaryTimeWeek(date, context) {
  const ordinaryStart = addDays(context.current.baptism, 1);
  if (date < context.current.ashWednesday) {
    return Math.floor(diffDays(date, ordinaryStart) / 7) + 1;
  }

  const lastBeforeLent = addDays(context.current.ashWednesday, -1);
  const weeksBeforeLent = Math.floor(diffDays(lastBeforeLent, ordinaryStart) / 7) + 1;
  const ordinaryResume = addDays(context.current.pentecost, 1);
  return weeksBeforeLent + 2 + Math.floor(diffDays(date, ordinaryResume) / 7);
}

function adventWeek(date, context) {
  return Math.floor(diffDays(date, context.current.adventStart) / 7) + 1;
}

function lentWeek(date, context) {
  const firstSunday = addDays(context.current.ashWednesday, 4);
  if (date < firstSunday) {
    return 0;
  }
  return Math.floor(diffDays(date, firstSunday) / 7) + 1;
}

function easterWeek(date, context) {
  if (diffDays(date, context.current.easter) <= 7) {
    return 1;
  }
  return 2 + Math.floor(diffDays(date, addDays(context.current.easter, 8)) / 7);
}

function computedWeekForDate(date, seasonInfo, context) {
  if (seasonInfo.season === 'Ordinary Time') {
    return ordinaryTimeWeek(date, context);
  }
  if (seasonInfo.season === 'Advent') {
    return adventWeek(date, context);
  }
  if (seasonInfo.season === 'Lent') {
    if (seasonInfo.period === 'Holy Week' || seasonInfo.period === 'Paschal Triduum') {
      return null;
    }
    return lentWeek(date, context);
  }
  if (seasonInfo.season === 'Easter') {
    return easterWeek(date, context);
  }
  return null;
}

function shouldUseTemporalKey(celebrationType, day, seasonInfo) {
  if (day === 'Sunday') {
    return true;
  }

  if (['SOLEMNITY', 'FEAST'].includes(celebrationType)) {
    return false;
  }

  return ['Ordinary Time', 'Advent', 'Lent', 'Easter'].includes(seasonInfo.season);
}

function keyForDate(date, celebrationName, seasonInfo, week, celebrationType) {
  const dayName = WEEKDAY_NAMES[date.getUTCDay()];
  const cleanName = normalizeCelebrationName(celebrationName);

  if (shouldUseTemporalKey(celebrationType, dayName, seasonInfo)) {
    if (
      seasonInfo.season === 'Advent' &&
      date.getUTCMonth() === 11 &&
      date.getUTCDate() >= 17 &&
      date.getUTCDate() <= 24
    ) {
      return `Advent_Dec${date.getUTCDate()}`;
    }

    if (seasonInfo.season === 'Ordinary Time' && week !== null) {
      return `OrdinaryTime_Week${week}_${dayName}`;
    }

    if (seasonInfo.season === 'Advent' && week !== null) {
      return `Advent_Week${week}_${dayName}`;
    }

    if (seasonInfo.season === 'Lent') {
      if (seasonInfo.period === 'Holy Week') {
        return `HolyWeek_${dayName}`;
      }
      if (week === 0) {
        return `Lent_AshWeek_${dayName}`;
      }
      if (week !== null) {
        return `Lent_Week${week}_${dayName}`;
      }
    }

    if (seasonInfo.season === 'Easter') {
      if (seasonInfo.period === 'Easter Octave' && dayName !== 'Sunday') {
        return `EasterOctave_${dayName}`;
      }
      if (week !== null) {
        return `Easter_Week${week}_${dayName}`;
      }
    }
  }

  if (MAJOR_FEAST_KEYS.has(cleanName)) {
    return MAJOR_FEAST_KEYS.get(cleanName);
  }

  if (
    seasonInfo.season === 'Advent' &&
    date.getUTCMonth() === 11 &&
    date.getUTCDate() >= 17 &&
    date.getUTCDate() <= 24 &&
    date.getUTCDay() !== 0
  ) {
    return `Advent_Dec${date.getUTCDate()}`;
  }

  if (/after Ash Wednesday/i.test(cleanName)) {
    return `Lent_AshWeek_${dayName}`;
  }

  if (/Holy Week/i.test(cleanName)) {
    return `HolyWeek_${dayName}`;
  }

  if (/within the Octave of Easter/i.test(cleanName)) {
    return `EasterOctave_${dayName}`;
  }

  const derivedWeek = week ?? extractWeekFromName(cleanName);

  if (/Ordinary Time/i.test(cleanName) && derivedWeek !== null) {
    return `OrdinaryTime_Week${derivedWeek}_${dayName}`;
  }

  if (/Advent/i.test(cleanName) && derivedWeek !== null) {
    return `Advent_Week${derivedWeek}_${dayName}`;
  }

  if (/Lent/i.test(cleanName) && derivedWeek !== null) {
    return `Lent_Week${derivedWeek}_${dayName}`;
  }

  if (/Easter/i.test(cleanName) && derivedWeek !== null) {
    return `Easter_Week${derivedWeek}_${dayName}`;
  }

  return MAJOR_FEAST_KEYS.get(cleanName) || slugKey(cleanName);
}

function buildCalendarEntry(date, celebration, context) {
  const seasonInfo = classifySeason(date, context);
  const liturgicalYear = liturgicalYearForDate(date);
  const override = SOURCE_DATE_OVERRIDES[isoDate(date)];
  const celebrationName = override?.celebrationName || celebration?.celebration?.name || 'Weekday';
  const day = WEEKDAY_NAMES[date.getUTCDay()];
  const celebrationType = String(celebration?.celebration?.type || 'WEEKDAY').toUpperCase();
  const week = extractWeekFromName(celebrationName) ?? computedWeekForDate(date, seasonInfo, context);
  const key = override?.key || keyForDate(date, celebrationName, seasonInfo, week, celebrationType);

  return {
    date: isoDate(date),
    liturgicalYear: romanSundayCycle(liturgicalYear),
    season: seasonInfo.season,
    period: seasonInfo.period,
    week,
    day,
    celebration: celebrationName,
    celebrationType,
    key,
  };
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function loadSourceYear(baseDir, year) {
  const dir = path.join(baseDir, String(year));
  const names = (await fs.readdir(dir)).filter((name) => name.endsWith('.json')).sort();
  const records = new Map();
  for (const name of names) {
    const fullPath = path.join(dir, name);
    records.set(name.replace(/\.json$/, ''), await readJson(fullPath));
  }
  return records;
}

function sortObjectKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (value && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort((a, b) => {
      if (a === '__meta') return -1;
      if (b === '__meta') return 1;
      return a.localeCompare(b);
    })) {
      sorted[key] = sortObjectKeys(value[key]);
    }
    return sorted;
  }

  return value;
}

async function generateCalendarDataset(sourceCalendar2026) {
  const context = buildYearContext(2026);
  const output = {
    __meta: {
      schemaVersion: 1,
      locale: 'en-US',
      calendarSystem: 'Roman Rite (USCCB temporal structure with sanctoral names from public JSON references)',
      generatedAt: new Date().toISOString(),
      computedTransitions: {
        adventStart: isoDate(context.current.adventStart),
        ashWednesday: isoDate(context.current.ashWednesday),
        easterSunday: isoDate(context.current.easter),
        pentecostSunday: isoDate(context.current.pentecost),
      },
      note: 'Sunday cycle is A/B/C. Weekday cycle is I/II and appears in readings.json rather than this per-date calendar.',
    },
  };

  for (const [monthDay, celebration] of [...sourceCalendar2026.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const [month, day] = monthDay.split('-').map(Number);
    const date = utcDate(2026, month, day);
    output[isoDate(date)] = buildCalendarEntry(date, celebration, context);
  }

  return output;
}

function buildReadingPayload(sourceReading) {
  const payload = {
    first: cleanReadingReference(sourceReading.readings.firstReading),
    psalm: cleanReadingReference(sourceReading.readings.psalm),
    gospel: cleanReadingReference(sourceReading.readings.gospel),
  };

  if (sourceReading.readings.secondReading) {
    payload.second = cleanReadingReference(sourceReading.readings.secondReading);
  }

  return payload;
}

function upsertReadingEntry(target, key, partial) {
  if (!target[key]) {
    target[key] = {
      type: partial.type,
      title: partial.title,
      season: partial.season,
    };
  }

  if (partial.type === 'proper' && partial.proper) {
    target[key].proper = partial.proper;
  }

  if (partial.type === 'weekday' && partial.weekdayCycle) {
    target[key].weekdayCycle = {
      ...(target[key].weekdayCycle || {}),
      ...partial.weekdayCycle,
    };
  }

  if (partial.type === 'sunday' && partial.cycles) {
    Object.assign(target[key], partial.cycles);
  }
}

function classifyReadingEntry(calendarEntry) {
  if (calendarEntry.day === 'Sunday') {
    return 'sunday';
  }

  if (calendarEntry.season === 'Ordinary Time' && /^OrdinaryTime_Week\d+_/.test(calendarEntry.key)) {
    return 'weekday';
  }

  return 'proper';
}

async function generateReadingsDataset(sourceCalendarByYear, sourceReadingsByYear) {
  const entries = {
    __meta: {
      schemaVersion: 1,
      locale: 'en-US',
      generatedAt: new Date().toISOString(),
      notes: [
        'Sunday and solemnity readings use Sunday cycle A/B/C.',
        'Ordinary Time weekdays use weekday cycle I/II, which is the Roman Rite norm.',
        'Lent, Advent, Christmas, Holy Week, Easter Octave, and many solemnities use proper readings rather than rotating Sunday or weekday cycles.',
      ],
    },
  };

  for (const year of [2025, 2026]) {
    const context = buildYearContext(year);
    const calendarMap = sourceCalendarByYear[year];
    const readingsMap = sourceReadingsByYear[year];

    for (const [monthDay, sourceReading] of [...readingsMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const calendar = calendarMap.get(monthDay);
      if (!calendar) continue;

      const [month, day] = monthDay.split('-').map(Number);
      const date = utcDate(year, month, day);
      const calendarEntry = buildCalendarEntry(date, calendar, context);
      const payload = buildReadingPayload(sourceReading);
      const entryType = classifyReadingEntry(calendarEntry);

      if (entryType === 'proper') {
        upsertReadingEntry(entries, calendarEntry.key, {
          type: 'proper',
          title: calendarEntry.celebration,
          season: calendarEntry.season,
          proper: payload,
        });
      } else if (entryType === 'weekday') {
        upsertReadingEntry(entries, calendarEntry.key, {
          type: 'weekday',
          title: calendarEntry.celebration,
          season: calendarEntry.season,
          weekdayCycle: {
            [weekdayCycleForYear(year)]: payload,
          },
        });
      } else {
        upsertReadingEntry(entries, calendarEntry.key, {
          type: 'sunday',
          title: calendarEntry.celebration,
          season: calendarEntry.season,
          cycles: {
            [calendarEntry.liturgicalYear]: payload,
          },
        });
      }
    }
  }

  const supplemental = parseSupplementalSundayTables([
    path.join(repoRoot, 'tmp', 'advent.html'),
    path.join(repoRoot, 'tmp', 'christmas.html'),
    path.join(repoRoot, 'tmp', 'lent.html'),
    path.join(repoRoot, 'tmp', 'easter.html'),
    path.join(repoRoot, 'tmp', 'ordinary-b.html'),
    path.join(repoRoot, 'tmp', 'ordinary-c.html'),
    path.join(repoRoot, 'tmp', 'solemnities.html'),
  ]);

  for (const [key, patch] of Object.entries(supplemental)) {
    if (!entries[key]) {
      entries[key] = {
        type: 'sunday',
        title: key,
        season: null,
      };
    }
    if (patch.B) entries[key].B = patch.B;
    if (patch.C) entries[key].C = patch.C;
  }

  return sortObjectKeys(entries);
}

function buildDivineOfficeDataset() {
  return sortObjectKeys({
    __meta: {
      schemaVersion: 1,
      locale: 'en-US',
      generatedAt: new Date().toISOString(),
      design: 'Reference-first structure with psalter rotation and seasonal override hooks',
    },
    commons: {
      gospelCanticles: {
        benedictus: { reference: 'Luke 1:68-79', scriptureKey: 'Luke.1', verseRange: '68-79' },
        magnificat: { reference: 'Luke 1:46-55', scriptureKey: 'Luke.1', verseRange: '46-55' },
        nuncDimittis: { reference: 'Luke 2:29-32', scriptureKey: 'Luke.2', verseRange: '29-32' },
      },
      placeholders: {
        invitatoryPsalm: 'Psalm 95',
        officeOfReadingsResponsory: 'Use proper or common responsory by season/feast.',
        benedictusAntiphon: 'Resolve from season, celebration, or commons.',
        magnificatAntiphon: 'Resolve from season, celebration, or commons.',
      },
    },
    psalter: {
      week1: {
        officeOfReadings: { sunday: { psalms: ['Psalm 1', 'Psalm 2', 'Psalm 3'] }, weekday: { psalms: ['Psalm 24', 'Psalm 26', 'Psalm 28'] } },
        morningPrayer: { sunday: { psalms: ['Psalm 63', 'Daniel 3:57-88, 56', 'Psalm 149'] }, weekday: { psalms: ['Psalm 51', 'Tobit 13:1-8', 'Psalm 147'] } },
        eveningPrayer: { sunday: { psalms: ['Psalm 110', 'Psalm 114', 'Revelation 19:1-7'] }, weekday: { psalms: ['Psalm 141', 'Psalm 142', 'Philippians 2:6-11'] } },
        nightPrayer: { sunday: { psalms: ['Psalm 4', 'Psalm 134'] }, weekday: { psalms: ['Psalm 91'] } },
      },
      week2: {
        officeOfReadings: { sunday: { psalms: ['Psalm 18', 'Psalm 33', 'Psalm 36'] }, weekday: { psalms: ['Psalm 39', 'Psalm 40', 'Psalm 42'] } },
        morningPrayer: { sunday: { psalms: ['Psalm 118:1-24', 'Daniel 3:52-57', 'Psalm 150'] }, weekday: { psalms: ['Psalm 42', 'Sirach 36:1-7, 13-16', 'Psalm 19'] } },
        eveningPrayer: { sunday: { psalms: ['Psalm 110', 'Psalm 113A', 'Revelation 4:11; 5:9-10, 12'] }, weekday: { psalms: ['Psalm 45', 'Psalm 46', 'Ephesians 1:3-10'] } },
        nightPrayer: { sunday: { psalms: ['Psalm 91'] }, weekday: { psalms: ['Psalm 16'] } },
      },
      week3: {
        officeOfReadings: { sunday: { psalms: ['Psalm 76', 'Psalm 84', 'Psalm 85'] }, weekday: { psalms: ['Psalm 68', 'Psalm 71', 'Psalm 72'] } },
        morningPrayer: { sunday: { psalms: ['Psalm 63', 'Isaiah 61:10-62:5', 'Psalm 149'] }, weekday: { psalms: ['Psalm 57', 'Jeremiah 31:10-14', 'Psalm 48'] } },
        eveningPrayer: { sunday: { psalms: ['Psalm 110', 'Psalm 111', 'Colossians 1:12-20'] }, weekday: { psalms: ['Psalm 126', 'Psalm 127', 'Revelation 15:3-4'] } },
        nightPrayer: { sunday: { psalms: ['Psalm 86'] }, weekday: { psalms: ['Psalm 31:1-6'] } },
      },
      week4: {
        officeOfReadings: { sunday: { psalms: ['Psalm 24', 'Psalm 47', 'Psalm 96'] }, weekday: { psalms: ['Psalm 77', 'Psalm 78', 'Psalm 80'] } },
        morningPrayer: { sunday: { psalms: ['Psalm 118:1-24', 'Daniel 3:52-57', 'Psalm 150'] }, weekday: { psalms: ['Psalm 90', 'Isaiah 26:1-4, 7-9, 12', 'Psalm 67'] } },
        eveningPrayer: { sunday: { psalms: ['Psalm 110', 'Psalm 112', 'Revelation 19:1-7'] }, weekday: { psalms: ['Psalm 135', 'Psalm 136', '1 Timothy 3:16'] } },
        nightPrayer: { sunday: { psalms: ['Psalm 4', 'Psalm 134'] }, weekday: { psalms: ['Psalm 130'] } },
      },
    },
    seasons: {
      Advent: { antiphons: { morningPrayer: 'Use Advent weekday or Sunday antiphons by week.', eveningPrayer: 'Use Advent weekday or Sunday antiphons by week.' }, readings: { officeOfReadings: 'Isaiah cycle with patristic Advent readings', morningPrayer: 'Romans 13:11-12; Isaiah 2:3', eveningPrayer: 'Philippians 4:4-5; James 5:7-8' } },
      Christmas: { antiphons: { morningPrayer: 'Nativity / Octave / Epiphany proper antiphons', eveningPrayer: 'Nativity / Octave / Epiphany proper antiphons' }, readings: { officeOfReadings: 'Hebrews 1; Johannine Prologue patterns', morningPrayer: 'Isaiah 9:6; Titus 3:4-7', eveningPrayer: 'Hebrews 1:1-2; 1 John 1:1-3' } },
      Lent: { antiphons: { morningPrayer: 'Penitential antiphons; omit Alleluia', eveningPrayer: 'Penitential antiphons; omit Alleluia' }, readings: { officeOfReadings: 'Exodus, Hebrews, and Lenten Fathers', morningPrayer: 'Joel 2:12-13; Ezekiel 36:25-27', eveningPrayer: '2 Corinthians 6:1-4a; James 5:16, 19-20' } },
      Easter: { antiphons: { morningPrayer: 'Alleluia antiphons through Pentecost', eveningPrayer: 'Alleluia antiphons through Pentecost' }, readings: { officeOfReadings: 'Acts, Revelation, and mystagogical Fathers', morningPrayer: 'Acts 10:40-43; Romans 6:8-11', eveningPrayer: 'Hebrews 10:12-14; 1 Peter 2:9-10' } },
      OrdinaryTime: { antiphons: { morningPrayer: 'Use psalter and weekday antiphons', eveningPrayer: 'Use psalter and weekday antiphons' }, readings: { officeOfReadings: 'Continuous biblical and patristic cycle', morningPrayer: 'Ephesians 4:29-32; Romans 8:35, 37', eveningPrayer: 'Colossians 1:23; 1 Thessalonians 2:13' } },
    },
    complineByDay: {
      Sunday: { psalms: ['Psalm 91'] },
      Monday: { psalms: ['Psalm 86'] },
      Tuesday: { psalms: ['Psalm 143'] },
      Wednesday: { psalms: ['Psalm 31:1-6'] },
      Thursday: { psalms: ['Psalm 16'] },
      Friday: { psalms: ['Psalm 88'] },
      Saturday: { psalms: ['Psalm 4', 'Psalm 134'] },
    },
  });
}

function buildScriptureDataset() {
  return sortObjectKeys({
    __meta: {
      schemaVersion: 1,
      translation: 'Douay-Rheims (public domain excerpts)',
      generatedAt: new Date().toISOString(),
      scope: 'Core Divine Office gospel canticles only',
      note: 'This intentionally omits a full Bible bundle to keep the app lightweight and avoid embedding copyrighted text.',
    },
    Luke: {
      1: {
        46: 'And Mary said: My soul doth magnify the Lord.',
        47: 'And my spirit hath rejoiced in God my Saviour.',
        48: 'Because he hath regarded the humility of his handmaid; for behold from henceforth all generations shall call me blessed.',
        49: 'Because he that is mighty hath done great things to me; and holy is his name.',
        50: 'And his mercy is from generation unto generations, to them that fear him.',
        51: 'He hath shewed might in his arm: he hath scattered the proud in the conceit of their heart.',
        52: 'He hath put down the mighty from their seat, and hath exalted the humble.',
        53: 'He hath filled the hungry with good things; and the rich he hath sent empty away.',
        54: 'He hath received Israel his servant, being mindful of his mercy.',
        55: 'As he spoke to our fathers, to Abraham and to his seed for ever.',
        68: 'Blessed be the Lord God of Israel; because he hath visited and wrought the redemption of his people:',
        69: 'And hath raised up an horn of salvation to us, in the house of David his servant:',
        70: 'As he spoke by the mouth of his holy prophets, who are from the beginning:',
        71: 'Salvation from our enemies, and from the hand of all that hate us:',
        72: 'To perform mercy to our fathers, and to remember his holy testament,',
        73: 'The oath, which he swore to Abraham our father, that he would grant to us,',
        74: 'That being delivered from the hand of our enemies, we may serve him without fear,',
        75: 'In holiness and justice before him, all our days.',
        76: 'And thou, child, shalt be called the prophet of the Highest: for thou shalt go before the face of the Lord to prepare his ways:',
        77: 'To give knowledge of salvation to his people, unto the remission of their sins:',
        78: 'Through the bowels of the mercy of our God, in which the Orient from on high hath visited us:',
        79: 'To enlighten them that sit in darkness, and in the shadow of death: to direct our feet into the way of peace.',
      },
      2: {
        29: 'Now thou dost dismiss thy servant, O Lord, according to thy word in peace;',
        30: 'Because my eyes have seen thy salvation,',
        31: 'Which thou hast prepared before the face of all peoples:',
        32: 'A light to the revelation of the Gentiles, and the glory of thy people Israel.',
      },
    },
  });
}

async function writeJson(relativePath, data) {
  const fullPath = path.join(outputRoot, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function main() {
  const sourceCalendarByYear = {
    2025: await loadSourceYear(path.join(sourceRoot, 'liturgical-calendar'), 2025),
    2026: await loadSourceYear(path.join(sourceRoot, 'liturgical-calendar'), 2026),
  };
  const sourceReadingsByYear = {
    2025: await loadSourceYear(path.join(sourceRoot, 'readings'), 2025),
    2026: await loadSourceYear(path.join(sourceRoot, 'readings'), 2026),
  };

  await writeJson(path.join('calendar', '2026.json'), await generateCalendarDataset(sourceCalendarByYear[2026]));
  await writeJson('readings.json', await generateReadingsDataset(sourceCalendarByYear, sourceReadingsByYear));
  await writeJson('divineOffice.json', buildDivineOfficeDataset());
  await writeJson('scripture.json', buildScriptureDataset());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
