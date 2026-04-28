const fs = require('fs');
const ts = fs.readFileSync('src/data/divineOfficeExtras.ts', 'utf8');

let js = ts.replace(/export const (\w+): Record<string, any>/g, 'const $1');
js = js.replace(/export const/g, 'const');
js += '\n\nmodule.exports = { PSALTER_ANTIPHONS, COMMON_RESPONSORIES };\n';

fs.writeFileSync('scripts/lib/extras.js', js);
