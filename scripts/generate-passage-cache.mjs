import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const biblePath = path.join(repoRoot, 'tmp', 'eng-web-c_vpl', 'eng-web-c_vpl.txt');
const readingsPath = path.join(repoRoot, 'data', 'readings.json');
const officePath = path.join(repoRoot, 'data', 'divineOffice.json');
const outputPath = path.join(repoRoot, 'data', 'passageCache.json');

const BOOK_CODES = {
  Amos: 'AMO',
  '1 Chronicles': '1CH',
  '2 Chronicles': '2CH',
  Acts: 'ACT',
  Bar: 'BAR',
  Baruch: 'BAR',
  Bel: 'BEL',
  Col: 'COL',
  Colossians: 'COL',
  '1 Corinthians': '1CO',
  '2 Corinthians': '2CO',
  Dan: 'DAN',
  Daniel: 'DAN',
  Deut: 'DEU',
  Deuteronomy: 'DEU',
  Eccl: 'ECC',
  Ecclesiastes: 'ECC',
  Ecclesiasticus: 'SIR',
  Eph: 'EPH',
  Ephesians: 'EPH',
  Est: 'EST',
  Esther: 'EST',
  Exod: 'EXO',
  Exodus: 'EXO',
  Ezek: 'EZK',
  Ezekiel: 'EZK',
  Ezra: 'EZR',
  Gal: 'GAL',
  Galatians: 'GAL',
  Gen: 'GEN',
  Genesis: 'GEN',
  Hab: 'HAB',
  Habakkuk: 'HAB',
  Haggai: 'HAG',
  Heb: 'HEB',
  Hebrews: 'HEB',
  '1 John': '1JN',
  '2 John': '2JN',
  '3 John': '3JN',
  Hos: 'HOS',
  Hosea: 'HOS',
  Isa: 'ISA',
  Isaiah: 'ISA',
  Jas: 'JAS',
  James: 'JAS',
  Jer: 'JER',
  Jeremiah: 'JER',
  Job: 'JOB',
  Joel: 'JOL',
  John: 'JOH',
  Jon: 'JON',
  Jonah: 'JON',
  Josh: 'JOS',
  Joshua: 'JOS',
  Jude: 'JUD',
  Judges: 'JDG',
  Judith: 'JDT',
  Kgs: 'KGS',
  Kings: 'KGS',
  '1 Kings': '1KI',
  '2 Kings': '2KI',
  Lam: 'LAM',
  Lamentations: 'LAM',
  Lev: 'LEV',
  Leviticus: 'LEV',
  Luke: 'LUK',
  Mal: 'MAL',
  Malachi: 'MAL',
  Mark: 'MRK',
  Matt: 'MAT',
  Matthew: 'MAT',
  Mic: 'MIC',
  Micah: 'MIC',
  Macc: 'MAC',
  '1 Maccabees': '1MA',
  '2 Maccabees': '2MA',
  Nah: 'NAM',
  Nahum: 'NAM',
  Neh: 'NEH',
  Nehemiah: 'NEH',
  Num: 'NUM',
  Numbers: 'NUM',
  Peter: 'PE',
  Pet: 'PE',
  '1 Peter': '1PE',
  '2 Peter': '2PE',
  Phil: 'PHP',
  Phiippians: 'PHP',
  Philippians: 'PHP',
  Phlm: 'PHM',
  Philemon: 'PHM',
  Prov: 'PRO',
  Proverbs: 'PRO',
  Ps: 'PSA',
  Psalm: 'PSA',
  Psalms: 'PSA',
  Rev: 'REV',
  Revelation: 'REV',
  Rom: 'ROM',
  Romans: 'ROM',
  Ruth: 'RUT',
  Sam: 'SAM',
  Samuel: 'SAM',
  '1 Samuel': '1SA',
  '2 Samuel': '2SA',
  Sir: 'SIR',
  Sirach: 'SIR',
  SongofSongs: 'SNG',
  SongofSolomon: 'SNG',
  Song: 'SNG',
  '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH',
  Thess: 'THS',
  Thessalonians: 'THS',
  '1 Timothy': '1TI',
  '2 Timothy': '2TI',
  Tim: 'TIM',
  Timothy: 'TIM',
  Titus: 'TIT',
  Tobit: 'TOB',
  Wisdom: 'WIS',
  WisdomofSolomon: 'WIS',
  Wis: 'WIS',
  Zech: 'ZEC',
  Zechariah: 'ZEC',
  Zeph: 'ZEP',
  Zephaniah: 'ZEP',
};

function normalizeBookAlias(value) {
  const cleaned = value.replace(/\./g, '').replace(/\s+/g, ' ').trim();
  const prefixedMatch = cleaned.match(/^([1-3])\s+(.+)$/);
  if (prefixedMatch) {
    const [, prefix, baseRaw] = prefixedMatch;
    const base = baseRaw
      .replace(/^Cor(inthians)?$/i, 'Corinthians')
      .replace(/^Thess(alonians)?$/i, 'Thessalonians')
      .replace(/^Tim(othy)?$/i, 'Timothy')
      .replace(/^Pet(er)?$/i, 'Peter')
      .replace(/^Sam(uel)?$/i, 'Samuel')
      .replace(/^Kgs$/i, 'Kings')
      .replace(/^Chr(onicles)?$/i, 'Chronicles')
      .replace(/^Macc(abees)?$/i, 'Maccabees')
      .replace(/^John$/i, 'John')
      .replace(/^John$/i, 'John');
    return `${prefix} ${base}`;
  }

  return cleaned
    .replace(/^Ps(alms?)?$/i, 'Psalms')
    .replace(/^Psalm$/i, 'Psalms')
    .replace(/^Gen$/i, 'Genesis')
    .replace(/^Exod$/i, 'Exodus')
    .replace(/^Lev$/i, 'Leviticus')
    .replace(/^Num$/i, 'Numbers')
    .replace(/^Deut$/i, 'Deuteronomy')
    .replace(/^Josh$/i, 'Joshua')
    .replace(/^Judg(es)?$/i, 'Judges')
    .replace(/^Sam$/i, 'Samuel')
    .replace(/^Kgs$/i, 'Kings')
    .replace(/^Chr(onicles)?$/i, 'Chronicles')
    .replace(/^Ezra$/i, 'Ezra')
    .replace(/^Neh$/i, 'Nehemiah')
    .replace(/^Est$/i, 'Esther')
    .replace(/^Job$/i, 'Job')
    .replace(/^Prov$/i, 'Proverbs')
    .replace(/^Eccl$/i, 'Ecclesiastes')
    .replace(/^Song$/i, 'Song of Solomon')
    .replace(/^Wis$/i, 'Wisdom')
    .replace(/^Sir$/i, 'Sirach')
    .replace(/^Isa$/i, 'Isaiah')
    .replace(/^Jer$/i, 'Jeremiah')
    .replace(/^Lam$/i, 'Lamentations')
    .replace(/^Ezek$/i, 'Ezekiel')
    .replace(/^Dan$/i, 'Daniel')
    .replace(/^Hos$/i, 'Hosea')
    .replace(/^Joel$/i, 'Joel')
    .replace(/^Amos$/i, 'Amos')
    .replace(/^Obad$/i, 'Obadiah')
    .replace(/^Jon$/i, 'Jonah')
    .replace(/^Mic$/i, 'Micah')
    .replace(/^Nah$/i, 'Nahum')
    .replace(/^Hab$/i, 'Habakkuk')
    .replace(/^Zeph$/i, 'Zephaniah')
    .replace(/^Hag$/i, 'Haggai')
    .replace(/^Zech$/i, 'Zechariah')
    .replace(/^Mal$/i, 'Malachi')
    .replace(/^Matt$/i, 'Matthew')
    .replace(/^Mark$/i, 'Mark')
    .replace(/^Luke$/i, 'Luke')
    .replace(/^Acts$/i, 'Acts')
    .replace(/^Rom$/i, 'Romans')
    .replace(/^Cor$/i, 'Corinthians')
    .replace(/^Gal$/i, 'Galatians')
    .replace(/^Eph$/i, 'Ephesians')
    .replace(/^Phil$/i, 'Philippians')
    .replace(/^Col$/i, 'Colossians')
    .replace(/^Thess$/i, 'Thessalonians')
    .replace(/^Tim$/i, 'Timothy')
    .replace(/^Titus$/i, 'Titus')
    .replace(/^Phlm$/i, 'Philemon')
    .replace(/^Heb$/i, 'Hebrews')
    .replace(/^Jas$/i, 'James')
    .replace(/^Pet$/i, 'Peter')
    .replace(/^John$/i, 'John')
    .replace(/^Jude$/i, 'Jude')
    .replace(/^Rev$/i, 'Revelation');
}

function normalizeText(text) {
  return String(text)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveBookCode(referenceBook) {
  const normalized = normalizeBookAlias(referenceBook);
  return BOOK_CODES[normalized] ?? null;
}

function cleanReference(ref) {
  return String(ref)
    .replace(/^cf\.\s*/i, '')
    .replace(/^opt\.?:\s*/i, '')
    .replace(/^optional\.?:\s*/i, '')
    .replace(/^or\s+/i, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseVerseToken(token) {
  const normalized = token
    .replace(/[–—]/g, '-')
    .replace(/\+/g, ',')
    .replace(/(\d)[a-z]+(?=\d)/gi, '$1-')
    .replace(/[a-z]/gi, '');

  return normalized
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function expandRange(start, end) {
  const out = [];
  for (let current = start; current <= end; current += 1) {
    out.push(current);
  }
  return out;
}

function buildVerseList(chapters, chapterNumber, verseSpec) {
  const chapter = chapters[chapterNumber];
  if (!chapter) {
    return [];
  }

  if (!verseSpec) {
    return Object.keys(chapter)
      .map(Number)
      .sort((a, b) => a - b)
      .map((verseNumber) => chapter[verseNumber]);
  }

  const tokens = parseVerseToken(
    verseSpec
      .replace(/\band\b/gi, ',')
      .replace(/\s/g, ''),
  );

  const verses = [];
  for (const token of tokens) {
    const crossChapter = token.match(/^(\d+)-(\d+):(\d+)$/);
    if (crossChapter) {
      const startVerse = Number(crossChapter[1]);
      const endChapter = Number(crossChapter[2]);
      const endVerse = Number(crossChapter[3]);
      const currentChapter = chapterNumber;
      verses.push(...buildVerseList(chapters, currentChapter, `${startVerse}-${Object.keys(chapter).length}`));
      for (let next = currentChapter + 1; next < endChapter; next += 1) {
        verses.push(...buildVerseList(chapters, next));
      }
      verses.push(...buildVerseList(chapters, endChapter, `1-${endVerse}`));
      continue;
    }

    const rangeMatch = token.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      for (const verseNumber of expandRange(Number(rangeMatch[1]), Number(rangeMatch[2]))) {
        const verse = chapter[verseNumber];
        if (verse) {
          verses.push(verse);
        }
      }
      continue;
    }

    const verseNumber = Number(token);
    if (Number.isFinite(verseNumber)) {
      const verse = chapter[verseNumber];
      if (verse) {
        verses.push(verse);
      }
    }
  }

  return verses;
}

function parsePassage(reference, chapters) {
  const cleaned = cleanReference(reference);
  if (!cleaned || /(no bibl\. ref)|(alleluia)/i.test(cleaned)) {
    return null;
  }

  const match = cleaned.match(/^([1-3]?\s?[A-Za-z][A-Za-z\s]+?)\s+(.+)$/);
  if (!match) {
    return null;
  }

  const bookName = normalizeBookAlias(match[1]);
  const rawSpec = match[2].replace(/[–—]/g, '-');
  const segments = rawSpec.split(';').map((segment) => segment.trim()).filter(Boolean);
  const collected = [];
  let currentChapter = null;

  for (const segment of segments) {
    const explicit = segment.match(/^(\d+):(.*)$/);
    if (explicit) {
      currentChapter = Number(explicit[1]);
      collected.push(...buildVerseList(chapters, currentChapter, explicit[2]));
      continue;
    }

    if (currentChapter === null) {
      const wholeChapter = Number(segment);
      if (Number.isFinite(wholeChapter)) {
        currentChapter = wholeChapter;
        collected.push(...buildVerseList(chapters, wholeChapter));
      }
      continue;
    }

    collected.push(...buildVerseList(chapters, currentChapter, segment));
  }

  if (!collected.length) {
    return null;
  }

  return {
    book: bookName,
    text: collected.join(' '),
    verses: collected,
  };
}

async function loadBooks() {
  const raw = await fs.readFile(biblePath, 'utf8');
  const books = {};
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^([1-3]?[A-Z]{3})\s+(\d+):(\d+)\s+(.+)$/);
    if (!match) {
      continue;
    }

    const [, code, chapterRaw, verseRaw, textRaw] = match;
    const chapter = Number(chapterRaw);
    const verse = Number(verseRaw);
    const text = normalizeText(textRaw);

    books[code] ??= {};
    books[code][chapter] ??= {};
    books[code][chapter][verse] = text;
  }

  return books;
}

function collectReferencesFromReadings(readings) {
  const refs = new Set();

  for (const [key, entry] of Object.entries(readings)) {
    if (key === '__meta') continue;

    for (const variant of ['proper', 'A', 'B', 'C']) {
      const value = entry[variant];
      if (!value) continue;
      for (const ref of [value.first, value.psalm, value.second, value.gospel]) {
        if (ref) refs.add(ref);
      }
    }

    if (entry.weekdayCycle) {
      for (const cycle of Object.values(entry.weekdayCycle)) {
        for (const ref of [cycle.first, cycle.psalm, cycle.second, cycle.gospel]) {
          if (ref) refs.add(ref);
        }
      }
    }
  }

  return refs;
}

function collectReferencesFromOffice(office) {
  const refs = new Set();
  const visit = (value) => {
    if (!value) return;
    if (typeof value === 'string') {
      if (/\d/.test(value)) refs.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === 'object') {
      Object.values(value).forEach(visit);
    }
  };
  visit(office);
  return refs;
}

async function main() {
  const readings = JSON.parse(await fs.readFile(readingsPath, 'utf8'));
  const office = JSON.parse(await fs.readFile(officePath, 'utf8'));
  const books = await loadBooks();

  const references = [...new Set([
    ...collectReferencesFromReadings(readings),
    ...collectReferencesFromOffice(office),
  ])];

  const output = {
    __meta: {
      translation: 'World English Bible',
      generatedAt: new Date().toISOString(),
      references: references.length,
    },
  };

  for (const reference of references.sort()) {
    const cleaned = cleanReference(reference);
    const match = cleaned.match(/^([1-3]?\s?[A-Za-z][A-Za-z\s]+?)\s+(.+)$/);
    if (!match) continue;
    const bookCode = resolveBookCode(match[1]);
    const chapters = bookCode ? books[bookCode] : null;
    if (!chapters) continue;
    const passage = parsePassage(reference, chapters);
    if (passage) {
      output[reference] = passage;
    }
  }

  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
