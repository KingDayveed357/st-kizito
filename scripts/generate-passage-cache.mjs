import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const bibleRoot = path.join(repoRoot, 'tmp', 'Bible-kjv-1611-main', 'Bible-kjv-1611-main');
const readingsPath = path.join(repoRoot, 'data', 'readings.json');
const officePath = path.join(repoRoot, 'data', 'divineOffice.json');
const outputPath = path.join(repoRoot, 'data', 'passageCache.json');

const BOOK_ALIASES = {
  Amos: 'Amos',
  Acts: 'Acts',
  Bar: 'Baruch',
  Baruch: 'Baruch',
  Bel: 'Bel and the Dragon',
  Col: 'Colossians',
  Colossians: 'Colossians',
  Dan: 'Daniel',
  Daniel: 'Daniel',
  Deut: 'Deuteronomy',
  Deuteronomy: 'Deuteronomy',
  Eccl: 'Ecclesiastes',
  Ecclesiastes: 'Ecclesiastes',
  Ecclesiasticus: 'Ecclesiasticus',
  Eph: 'Ephesians',
  Ephesians: 'Ephesians',
  Est: 'Esther',
  Esther: 'Esther',
  Exod: 'Exodus',
  Exodus: 'Exodus',
  Ezek: 'Ezekiel',
  Ezekiel: 'Ezekiel',
  Ezra: 'Ezra',
  Gal: 'Galatians',
  Galatians: 'Galatians',
  Gen: 'Genesis',
  Genesis: 'Genesis',
  Hab: 'Habakkuk',
  Habakkuk: 'Habakkuk',
  Haggai: 'Haggai',
  Heb: 'Hebrews',
  Hebrews: 'Hebrews',
  Hos: 'Hosea',
  Hosea: 'Hosea',
  Isa: 'Isaiah',
  Isaiah: 'Isaiah',
  Jas: 'James',
  James: 'James',
  Jer: 'Jeremiah',
  Jeremiah: 'Jeremiah',
  Job: 'Job',
  Joel: 'Joel',
  John: 'John',
  Jon: 'Jonah',
  Jonah: 'Jonah',
  Josh: 'Joshua',
  Joshua: 'Joshua',
  Jude: 'Jude',
  Judges: 'Judges',
  Judith: 'Judith',
  Kgs: 'Kings',
  Kings: 'Kings',
  Lam: 'Lamentations',
  Lamentations: 'Lamentations',
  Lev: 'Leviticus',
  Leviticus: 'Leviticus',
  Luke: 'Luke',
  Mal: 'Malachi',
  Malachi: 'Malachi',
  Mark: 'Mark',
  Matt: 'Matthew',
  Matthew: 'Matthew',
  Mic: 'Micah',
  Micah: 'Micah',
  Macc: 'Maccabees',
  Nah: 'Nahum',
  Nahum: 'Nahum',
  Neh: 'Nehemiah',
  Nehemiah: 'Nehemiah',
  Num: 'Numbers',
  Numbers: 'Numbers',
  Peter: 'Peter',
  Pet: 'Peter',
  Cor: 'Corinthians',
  Phil: 'Philippians',
  Phiippians: 'Philippians',
  Philippians: 'Philippians',
  Phlm: 'Philemon',
  Philemon: 'Philemon',
  Prov: 'Proverbs',
  Proverbs: 'Proverbs',
  Ps: 'Psalms',
  Psalm: 'Psalms',
  Psalms: 'Psalms',
  Rev: 'Revelation',
  Revelation: 'Revelation',
  Rom: 'Romans',
  Romans: 'Romans',
  Ruth: 'Ruth',
  Sam: 'Samuel',
  Samuel: 'Samuel',
  Sir: 'Ecclesiasticus',
  Sirach: 'Ecclesiasticus',
  SongofSongs: 'Song of Solomon',
  SongofSolomon: 'Song of Solomon',
  SongofSongs: 'Song of Solomon',
  Song: 'Song of Solomon',
  Thess: 'Thessalonians',
  Thessalonians: 'Thessalonians',
  Tim: 'Timothy',
  Timothy: 'Timothy',
  Titus: 'Titus',
  Tobit: 'Tobit',
  Wisdom: 'Wisdom of Solomon',
  WisdomofSolomon: 'Wisdom of Solomon',
  Wis: 'Wisdom of Solomon',
  Zech: 'Zechariah',
  Zechariah: 'Zechariah',
  Zeph: 'Zephaniah',
  Zephaniah: 'Zephaniah',
};

function normalizeBookAlias(value) {
  const cleaned = value.replace(/\./g, '').replace(/\s+/g, ' ').trim();
  const compact = cleaned.replace(/\s+/g, '');

  if (BOOK_ALIASES[cleaned]) {
    return BOOK_ALIASES[cleaned];
  }

  if (BOOK_ALIASES[compact]) {
    return BOOK_ALIASES[compact];
  }

  const prefixedMatch = cleaned.match(/^([1-3])\s+(.+)$/);
  if (prefixedMatch) {
    const [, prefix, base] = prefixedMatch;
    const normalizedBase =
      BOOK_ALIASES[base] ||
      BOOK_ALIASES[base.replace(/\s+/g, '')] ||
      BOOK_ALIASES[base.replace(/\./g, '')] ||
      BOOK_ALIASES[base.replace(/\./g, '').replace(/\s+/g, '')] ||
      base;
    return `${prefix} ${normalizedBase}`;
  }

  return cleaned;
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
  const chapter = chapters.get(chapterNumber);
  if (!chapter) {
    return [];
  }

  if (!verseSpec) {
    return chapter.map((entry) => entry.text);
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
      verses.push(...buildVerseList(chapters, currentChapter, `${startVerse}-${chapter.length}`));
      for (let next = currentChapter + 1; next < endChapter; next += 1) {
        verses.push(...buildVerseList(chapters, next));
      }
      verses.push(...buildVerseList(chapters, endChapter, `1-${endVerse}`));
      continue;
    }

    const rangeMatch = token.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      for (const verseNumber of expandRange(Number(rangeMatch[1]), Number(rangeMatch[2]))) {
        const verse = chapter.find((entry) => entry.verse === verseNumber);
        if (verse) {
          verses.push(verse.text);
        }
      }
      continue;
    }

    const verseNumber = Number(token);
    if (Number.isFinite(verseNumber)) {
      const verse = chapter.find((entry) => entry.verse === verseNumber);
      if (verse) {
        verses.push(verse.text);
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

async function readBook(bookName) {
  const filePath = path.join(bibleRoot, `${bookName}.json`);
  const raw = JSON.parse(await fs.readFile(filePath, 'utf8'));
  const chapters = new Map(
    raw.chapters.map((chapter) => [
      Number(chapter.chapter),
      chapter.verses.map((verse) => ({
        verse: Number(verse.verse),
        text: String(verse.text).replace(/\s+/g, ' ').trim(),
      })),
    ]),
  );
  return chapters;
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

  const references = [...new Set([
    ...collectReferencesFromReadings(readings),
    ...collectReferencesFromOffice(office),
  ])];

  const booksNeeded = new Set();
  for (const reference of references) {
    const cleaned = cleanReference(reference);
    const match = cleaned.match(/^([1-3]?\s?[A-Za-z][A-Za-z\s]+?)\s+(.+)$/);
    if (!match) continue;
    booksNeeded.add(normalizeBookAlias(match[1]));
  }

  const books = {};
  for (const bookName of booksNeeded) {
    try {
      books[bookName] = await readBook(bookName);
    } catch (error) {
      console.warn(`Skipping ${bookName}: ${error.message}`);
    }
  }

  const output = {
    __meta: {
      translation: 'King James Bible 1611 public-domain JSON',
      generatedAt: new Date().toISOString(),
      references: references.length,
    },
  };

  for (const reference of references.sort()) {
    const cleaned = cleanReference(reference);
    const match = cleaned.match(/^([1-3]?\s?[A-Za-z][A-Za-z\s]+?)\s+(.+)$/);
    if (!match) continue;
    const bookName = normalizeBookAlias(match[1]);
    const chapters = books[bookName];
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
