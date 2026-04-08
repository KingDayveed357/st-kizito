const fs = require('fs');
const readline = require('readline');

// Book mapping from 3-letter codes to standard names used in passageCache
const bookMap = {
    'GEN': 'Genesis', 'EXO': 'Exodus', 'LEV': 'Leviticus', 'NUM': 'Numbers', 'DEU': 'Deuteronomy',
    'JOS': 'Joshua', 'JDG': 'Judges', 'RUT': 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
    '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles',
    'EZR': 'Ezra', 'NEH': 'Nehemiah', 'TOB': 'Tobit', 'JDT': 'Judith', 'EST': 'Esther',
    '1MA': '1 Maccabees', '2MA': '2 Maccabees', 'JOB': 'Job', 'PSA': 'Ps', 'PRO': 'Proverbs',
    'ECC': 'Ecclesiastes', 'SNG': 'Song of Solomon', 'WIS': 'Wisdom', 'SIR': 'Sirach',
    'ISA': 'Isa', 'JER': 'Jer', 'LAM': 'Lamentations', 'BAR': 'Baruch', 'EZK': 'Ezekiel',
    'DAN': 'Daniel', 'HOS': 'Hosea', 'JOL': 'Joel', 'AMO': 'Amos', 'OBA': 'Obadiah',
    'JON': 'Jonah', 'MIC': 'Micah', 'NAM': 'Nahum', 'HAB': 'Habakkuk', 'ZEP': 'Zephaniah',
    'HAG': 'Haggai', 'ZEC': 'Zechariah', 'MAL': 'Malachi',
    'MAT': 'Matt', 'MRK': 'Mark', 'LUK': 'Luke', 'JHN': 'John', 'ACT': 'Acts',
    'ROM': 'Rom', '1CO': '1 Corinthians', '2CO': '2 Corinthians', 'GAL': 'Gal',
    'EPH': 'Ephesians', 'PHP': 'Philippians', 'COL': 'Colossians', '1TH': '1 Thessalonians',
    '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy', 'TIT': 'Titus',
    'PHM': 'Philemon', 'HEB': 'Hebrews', 'JAS': 'James', '1PE': '1 Peter', '2PE': '2 Peter',
    '1JN': '1 John', '2JN': '2 John', '3JN': '3 John', 'JUD': 'Jude', 'REV': 'Rev',
    // Extra common abbreviations mapping if needed:
    'Psalms': 'Ps', 'Isaiah': 'Isa', 'Matthew': 'Matt', 'Romans': 'Rom', 'Galatians': 'Gal', 'Revelation': 'Rev', 'Jeremiah': 'Jer'
};

async function processBible() {
    const fileStream = fs.createReadStream('tmp/eng-web-c_vpl/eng-web-c_vpl.txt');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const bible = {}; // { "Genesis": { "1": { "1": "Text" } } }

    for await (const line of rl) {
        if (!line.trim()) continue;
        const match = line.match(/^([A-Z0-9]{3})\s+(\d+):(\d+)\s+(.+)$/);
        if (match) {
            const [_, bookCode, chapter, verse, text] = match;
            const bookName = bookMap[bookCode] || bookCode;
            if (!bible[bookName]) bible[bookName] = {};
            if (!bible[bookName][chapter]) bible[bookName][chapter] = {};
            bible[bookName][chapter][verse] = text;
        }
    }

    fs.writeFileSync('data/bible.json', JSON.stringify(bible));
    console.log('Bible JSON built successfully as data/bible.json');
}

processBible().catch(console.error);
