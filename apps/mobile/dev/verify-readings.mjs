import fs from 'fs';

const readings = JSON.parse(fs.readFileSync('./data/readings.json', 'utf8'));
const cache = JSON.parse(fs.readFileSync('./data/passageCache.json', 'utf8'));

let missingReferences = 0;
let totalReferences = 0;
let foundGenesis = false;
let foundMark = false;
let foundJohn = false;

function checkPassage(refString) {
    if (!refString) return;
    totalReferences++;
    const text = cache[refString];
    
    if (!text || text === 'Text not available offline' || text.trim() === '') {
        console.error(`MISSING: ${refString}`);
        missingReferences++;
    } else {
        if (refString.match(/Gen/i)) foundGenesis = true;
        if (refString.match(/Mk|Mark/i)) foundMark = true;
        if (refString.match(/Jn|John/i)) foundJohn = true;
    }
}

for (const day of Object.values(readings)) {
    if (day === "__meta") continue;
    const processSet = (set) => {
        if (!set) return;
        checkPassage(set.first);
        checkPassage(set.second);
        checkPassage(set.gospel);
        checkPassage(set.psalm);
    };

    if (day.type === 'sunday') {
        if (day.A) processSet(day.A);
        if (day.B) processSet(day.B);
        if (day.C) processSet(day.C);
    } else {
        processSet(day);
    }
}

console.log(`\n--- Verification Results ---`);
console.log(`Total References Checked: ${totalReferences}`);
if (missingReferences > 0) {
    console.error(`Failed! ${missingReferences} references missing.`);
    process.exit(1);
} else {
    console.log(`Success! All ${totalReferences} references successfully mapped.`);
}

console.log(`Genesis present? ${foundGenesis ? 'Yes' : 'No'}`);
console.log(`Mark present? ${foundMark ? 'Yes' : 'No'}`);
console.log(`John present? ${foundJohn ? 'Yes' : 'No'}`);

if (!foundGenesis || !foundMark || !foundJohn) {
    console.error('Regression check failed: missing core books.');
    process.exit(1);
}
