import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const inputPath = path.join(repoRoot, 'tmp', 'eng-web-c_vpl', 'eng-web-c_vpl.txt');
const outputPath = path.join(repoRoot, 'data', 'passageOverrides.json');

const TARGET_REFERENCES = [
  'Isaiah 42:1-7',
  'Psalm 27:1, 2, 3, 13-14',
  'John 12:1-11',
  'Psalm 35:1-2',
  'Psalm 102:2',
  'Isaiah 49:1-6',
  'Psalm 71:1-2, 3-4a, 5ab-6ab, 15 and 17',
  'John 13:21-33, 36-38',
  'Psalm 27:12',
  'Romans 8:32',
  'Isaiah 50:4-9a',
  'Psalm 69:8-10, 21-22, 31 and 33-34',
  'Matthew 26:14-25',
  'Philippians 2:8-11',
  'Matthew 20:28',
];

const BOOK_CODES = {
  Isaiah: 'ISA',
  John: 'JOH',
  Matthew: 'MAT',
  Psalm: 'PSA',
  Psalms: 'PSA',
  Romans: 'ROM',
  Philippians: 'PHI',
};

function normalizeText(text) {
  return text
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€”/g, '-')
    .replace(/â€“/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeReference(reference) {
  return reference
    .replace(/[a-z]/g, '')
    .replace(/\band\b/gi, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseVerseParts(spec) {
  return normalizeReference(spec)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function addRange(result, verses, start, end) {
  for (let value = start; value <= end; value += 1) {
    if (verses[value]) {
      result.push(verses[value]);
    }
  }
}

function resolveVerseList(chapters, chapterNumber, rawSpec) {
  const verses = chapters[chapterNumber];
  if (!verses) {
    return [];
  }

  if (!rawSpec) {
    return Object.keys(verses)
      .map(Number)
      .sort((a, b) => a - b)
      .map((verseNumber) => verses[verseNumber]);
  }

  const result = [];
  for (const part of parseVerseParts(rawSpec)) {
    const crossChapter = part.match(/^(\d+)-(\d+):(\d+)$/);
    if (crossChapter) {
      const startVerse = Number(crossChapter[1]);
      const endChapter = Number(crossChapter[2]);
      const endVerse = Number(crossChapter[3]);
      addRange(result, chapters[chapterNumber] ?? {}, startVerse, 999);
      for (let nextChapter = chapterNumber + 1; nextChapter < endChapter; nextChapter += 1) {
        result.push(...resolveVerseList(chapters, nextChapter));
      }
      result.push(...resolveVerseList(chapters, endChapter, `1-${endVerse}`));
      continue;
    }

    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      addRange(result, verses, Number(range[1]), Number(range[2]));
      continue;
    }

    const verseNumber = Number(part);
    if (Number.isFinite(verseNumber) && verses[verseNumber]) {
      result.push(verses[verseNumber]);
    }
  }

  return result;
}

function resolveReference(reference, books) {
  const [bookPart, ...specParts] = reference.split(' ');
  const maybeBook = [bookPart, specParts[0]].filter(Boolean).join(' ');
  const bookName = BOOK_CODES[maybeBook] ? maybeBook : bookPart;
  const code = BOOK_CODES[bookName];
  const spec = BOOK_CODES[maybeBook] ? specParts.slice(1).join(' ') : specParts.join(' ');

  if (!code || !spec) {
    return null;
  }

  const chapters = books[code];
  if (!chapters) {
    return null;
  }

  const segments = spec.split(';').map((segment) => segment.trim()).filter(Boolean);
  const collected = [];
  let currentChapter = null;

  for (const segment of segments) {
    const explicit = segment.match(/^(\d+):(.*)$/);
    if (explicit) {
      currentChapter = Number(explicit[1]);
      collected.push(...resolveVerseList(chapters, currentChapter, explicit[2]));
      continue;
    }

    if (currentChapter !== null) {
      collected.push(...resolveVerseList(chapters, currentChapter, segment));
    }
  }

  if (!collected.length) {
    return null;
  }

  return {
    reference,
    text: collected.join(' '),
    verses: collected,
  };
}

async function loadBooks() {
  const raw = normalizeText(await fs.readFile(inputPath, 'utf8'));
  const books = {};
  const lines = raw.split(/\r?\n/).filter(Boolean);

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

async function main() {
  const books = await loadBooks();
  const output = {};

  for (const reference of TARGET_REFERENCES) {
    const resolved = resolveReference(reference, books);
    if (resolved) {
      output[reference] = resolved;
    }
  }

  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
