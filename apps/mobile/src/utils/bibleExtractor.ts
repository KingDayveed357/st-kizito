import bibleDataRaw from '../../data/bible.json';

const bibleData = bibleDataRaw as Record<string, Record<string, Record<string, string>>>;

/**
 * SmartBibleExtractor
 * Parses complex Bible references and extracts text from the local bible.json.
 * Supports ranges (1:1-5), comma-separated verses (1:1, 3, 5), and multiple chapters (1:1; 2:1).
 */
export function extractBibleText(reference: string): { reference: string; text: string; verses: string[] } {
    if (!reference) return { reference: '', text: '', verses: [] };

    // 1. Normalize reference (remove liturgical suffixes like 'a', 'b', 'c', or 'abc')
    const normalizedRef = reference.replace(/[a-g]+(?=\s|,|;|-|$)/g, '');

    // 2. Split by semicolon for multiple chapters/books (e.g., "Isaiah 1:1; 2:1")
    const parts = normalizedRef.split(';').map(p => p.trim());

    let allVerses: string[] = [];
    let currentBook = '';

    parts.forEach((part, partIdx) => {
        // Match Book, Chapter, and Verse parts
        // regex: (Book Name) (Chapter):(Verses)
        // Cases: "Genesis 1:1-5", "1 John 2:3", "Exodus 20"
        const match = part.match(/^((?:\d\s)?[a-zA-Z\s]+?)\s*(\d+)(?::([\d\s,-]+))?$/);

        if (!match) {
            // If it's just verses without a book (e.g. following a semicolon), use previous book
            const subMatch = part.match(/^(\d+):([\d\s,-]+)$/);
            if (subMatch && currentBook) {
                const chapter = subMatch[1];
                const verseRange = subMatch[2];
                allVerses = allVerses.concat(getVersesFromChapter(currentBook, chapter, verseRange));
            }
            return;
        }

        currentBook = match[1].trim();
        const chapter = match[2];
        const verseRange = match[3] || 'all';

        allVerses = allVerses.concat(getVersesFromChapter(currentBook, chapter, verseRange));
    });

    return {
        reference,
        text: allVerses.join(' '),
        verses: allVerses
    };
}

function getVersesFromChapter(book: string, chapter: string, rangeStr: string): string[] {
    const bookData = bibleData[book];
    if (!bookData) {
        console.warn(`Book not found: ${book}`);
        return [];
    }

    const chapterData = bookData[chapter];
    if (!chapterData) {
        console.warn(`Chapter not found: ${book} ${chapter}`);
        return [];
    }

    if (rangeStr === 'all') {
        const verses: string[] = [];
        Object.keys(chapterData).sort((a, b) => parseInt(a) - parseInt(b)).forEach(v => {
            verses.push(chapterData[v]);
        });
        return verses;
    }

    // Parse "1-5, 10, 12-14"
    const result: string[] = [];
    const chunks = rangeStr.split(',');

    chunks.forEach(chunk => {
        const rangeMatch = chunk.trim().split('-');
        if (rangeMatch.length === 2) {
            const start = parseInt(rangeMatch[0]);
            const end = parseInt(rangeMatch[1]);
            for (let i = start; i <= end; i++) {
                const v = chapterData[i.toString()];
                if (v) result.push(v);
            }
        } else {
            const v = chapterData[chunk.trim()];
            if (v) result.push(v);
        }
    });

    return result;
}
