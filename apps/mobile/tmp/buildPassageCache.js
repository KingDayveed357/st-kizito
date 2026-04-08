const fs = require('fs');

const bible = require('../data/bible.json');
const readings = require('../data/readings.json');

const cache = {};

function resolvePassage(refString) {
    if (!refString) return 'Reference unavailable';

    // Special handling for some Psalms format and multi references
    let texts = [];
    const parts = refString.split(';').map(p => p.trim());

    for (const part of parts) {
        // e.g., "Acts 10:34-38" or "1 Kgs 17:17-24" or "Ps 30:2+4, 5-6, 11-12a+13b"
        const match = part.match(/^([\d\sA-Za-z]+)\s+(\d+):(.*)$/);
        if (!match) continue;

        let [_, bookName, chapter, versesStr] = match;
        bookName = bookName.trim();

        // fix book names if differences exist
        const bookMapExt = {
            '1 Kgs': '1 Kings', '2 Kgs': '2 Kings',
            '1 Sam': '1 Samuel', '2 Sam': '2 Samuel',
            '1 Chr': '1 Chronicles', '2 Chr': '2 Chronicles',
            'Sg': 'Song of Solomon', 'Song': 'Song of Solomon',
            'Wisdom': 'Wisdom', 'Sirach': 'Sirach', 'Sir': 'Sirach',
            'Is': 'Isa', 'Jer': 'Jer', 'Ez': 'Ezekiel',
            'Ezek': 'Ezekiel', 'Prv': 'Proverbs', 'Prov': 'Proverbs',
            'Eccl': 'Ecclesiastes', 'Zech': 'Zechariah',
            'Mal': 'Malachi', 'Zep': 'Zephaniah', 'Zc': 'Zechariah',
            'Ex': 'Exodus', 'Exod': 'Exodus', 'Gen': 'Genesis',
            'Lev': 'Leviticus', 'Nm': 'Numbers', 'Num': 'Numbers',
            'Dt': 'Deuteronomy', 'Deut': 'Deuteronomy',
            'Jos': 'Joshua', 'Josh': 'Joshua', 'Jgs': 'Judges',
            'Ru': 'Ruth', 'Ezr': 'Ezra', 'Neh': 'Nehemiah',
            'Tb': 'Tobit', 'Jdt': 'Judith', 'Est': 'Esther',
            '1 Mc': '1 Maccabees', '2 Mc': '2 Maccabees',
            'Mt': 'Matt', 'Mk': 'Mark', 'Lk': 'Luke', 'Jn': 'John',
            'Rom': 'Rom', '1 Cor': '1 Corinthians', '2 Cor': '2 Corinthians',
            'Gal': 'Gal', 'Eph': 'Ephesians', 'Phil': 'Philippians',
            'Col': 'Colossians', '1 Thes': '1 Thessalonians',
            '2 Thes': '2 Thessalonians', '1 Tm': '1 Timothy',
            '2 Tm': '2 Timothy', 'Ti': 'Titus', 'Phlm': 'Philemon',
            'Heb': 'Hebrews', 'Jas': 'James', '1 Pt': '1 Peter',
            '2 Pt': '2 Peter', '1 Jn': '1 John', '2 Jn': '2 John',
            '3 Jn': '3 John', 'Jude': 'Jude', 'Rv': 'Rev',
            'Rev': 'Rev', 'Tb': 'Tobit', 'Bar': 'Baruch',
            'Hos': 'Hosea', 'Jl': 'Joel', 'Am': 'Amos', 'Ob': 'Obadiah',
            'Jon': 'Jonah', 'Mi': 'Micah', 'Na': 'Nahum', 'Hb': 'Habakkuk'
        };

        const resolvedBook = bookMapExt[bookName] || bookName;
        const bookData = bible[resolvedBook];
        if (!bookData || !bookData[chapter]) continue;

        // Verses is complex: "2+4, 5-6, 11-12a+13b"
        const segments = versesStr.replace(/[a-z]/g, '').split(/[\s,\+]+/);
        for (const seg of segments) {
            if (!seg) continue;
            if (seg.includes('-')) {
                const [start, end] = seg.split('-').map(Number);
                if (start && end) {
                    for (let i = start; i <= end; i++) {
                        if (bookData[chapter][i.toString()]) {
                            texts.push(bookData[chapter][i.toString()]);
                        }
                    }
                }
            } else {
                if (bookData[chapter][seg]) {
                    texts.push(bookData[chapter][seg]);
                }
            }
        }
    }
    return texts.join(' ');
}

for (const day of Object.values(readings)) {
    if (day === "__meta") continue;
    const processSet = (set) => {
        if (!set) return;
        if (set.first) cache[set.first] = resolvePassage(set.first) || 'Text not available offline';
        if (set.second) cache[set.second] = resolvePassage(set.second) || 'Text not available offline';
        if (set.gospel) cache[set.gospel] = resolvePassage(set.gospel) || 'Text not available offline';
        if (set.psalm) cache[set.psalm] = resolvePassage(set.psalm) || 'Text not available offline';
    };

    if (day.type === 'sunday') {
        if (day.A) processSet(day.A);
        if (day.B) processSet(day.B);
        if (day.C) processSet(day.C);
    } else {
        processSet(day);
    }
}

fs.writeFileSync('./data/passageCache.json', JSON.stringify(cache, null, 2));
console.log('passageCache.json updated fully with ALL reading references!');
