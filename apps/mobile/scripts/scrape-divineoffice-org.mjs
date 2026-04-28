/**
 * scrape-divineoffice-org.mjs
 *
 * Production scraper for DivineOffice.org — the canonical source for the
 * Liturgy of the Hours (US edition, ICEL translation).
 *
 * Scrapes all 8 prayer hours per day, keyed by liturgical key (not date).
 * The liturgical cycle repeats identically every year, so one complete scrape
 * covers ALL future years permanently.
 *
 * Usage:
 *   node scripts/scrape-divineoffice-org.mjs --start 2025-11-30 --end 2026-11-28
 *   node scripts/scrape-divineoffice-org.mjs --start 2026-04-14 --end 2026-04-14  (single day test)
 *
 * Output: data/divineOfficeComplete.json
 * Resume-safe: already-scraped liturgical keys are skipped.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(repoRoot, 'data', 'divineOfficeComplete.json');

// ─── CLI ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const startArg = getArg('--start');
const endArg = getArg('--end');
const testMode = args.includes('--test');
const forceMode = args.includes('--force');
const cleanMode = args.includes('--clean');

if (!cleanMode && (!startArg || !endArg)) {
    console.error('Usage: node scripts/scrape-divineoffice-org.mjs --start YYYY-MM-DD --end YYYY-MM-DD [--test] [--force]');
    console.error('       node scripts/scrape-divineoffice-org.mjs --clean');
    process.exit(1);
}

// ─── Office type mapping ───────────────────────────────────────────────────
const OFFICE_LINK_MAP = {
    'invitatory':          'invitatory',
    'office of readings':  'officeOfReadings',
    'morning prayer':      'morningPrayer',
    'midmorning prayer':   'midMorningPrayer',
    'midday prayer':       'middayPrayer',
    'midafternoon prayer': 'afternoonPrayer',
    'evening prayer':      'eveningPrayer',
    'night prayer':        'nightPrayer',
};

// ─── Section markers in divineoffice.org content ───────────────────────────
const SECTION_MARKERS = [
    { key: 'hymn',             pattern: /^HYMN$/i },
    { key: 'psalmody',         pattern: /^PSALMODY$/i },
    { key: 'reading',          pattern: /^(READINGS|FIR\s*ST READING|SECOND READING|SCRIPTURE READING|READING\b)/i },
    { key: 'sacredSilence',    pattern: /^Sacred Silence/i },
    { key: 'responsory',       pattern: /^(SHORT )?RESPONSORY/i },
    { key: 'gospelCanticle',   pattern: /^CANTICLE OF (ZECHARIAH|MARY|SIMEON)/i },
    { key: 'intercessions',    pattern: /^INTERCESSIONS$/i },
    { key: 'lordsPrayer',      pattern: /^Our Father\b/i },
    { key: 'teDeum',           pattern: /^TE DEUM/i },
    { key: 'concludingPrayer', pattern: /^Concluding Prayer$/i },
    { key: 'dismissal',        pattern: /^(DISMISSAL|BLESSING|ACCLAMATION)/i },
];

// ─── HTTP helpers ──────────────────────────────────────────────────────────

const HTTP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchWithRetry(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const resp = await axios.get(url, {
                headers: HTTP_HEADERS,
                timeout: 20000,
                maxRedirects: 5,
            });
            return resp.data;
        } catch (err) {
            if (attempt === retries) {
                console.warn(`    ✗ Failed after ${retries} attempts: ${url} — ${err.message}`);
                return null;
            }
            const delay = attempt * 2000;
            console.warn(`    ⚠ Attempt ${attempt} failed for ${url}, retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }
    return null;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Contamination stripping ──────────────────────────────────────────────
// DivineOffice.org appends blog posts, newsletter CTAs, and app promotion
// text after the dismissal in some pages. Strip all of it.

const CONTAMINATION_PATTERNS = [
    /Divine Office Blog.*/s,
    /News and Updates from our ministry.*/s,
    /Get our Award-winning.*/s,
    /Liturgy of the Hours Podcast.*/s,
    /Available (for Purchase|on iTunes).*/s,
    /Ratings and Reviews.*/s,
    /Continue reading.*/s,
    /DivineOffice app.*/s,
    /The Faith Journey of our Community.*/s,
    /Personal Reflections.*/s,
    /\bon (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(st|nd|rd|th)?,\s*\d{4}.*/s,
];

function stripContamination(text) {
    if (!text) return '';
    let cleaned = text;
    for (const pat of CONTAMINATION_PATTERNS) {
        cleaned = cleaned.replace(pat, '');
    }
    return cleaned.trim();
}

// ─── Text cleaning ────────────────────────────────────────────────────────

function cleanText(raw) {
    if (!raw) return '';
    return raw
        .replace(/\u00A0/g, ' ')     // non-breaking space
        .replace(/\u2019/g, "'")     // right single quote
        .replace(/\u2018/g, "'")     // left single quote
        .replace(/\u201C/g, '"')     // left double quote
        .replace(/\u201D/g, '"')     // right double quote
        .replace(/\u2014/g, '—')     // em dash
        .replace(/\u2013/g, '–')     // en dash
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// ─── Landing page: extract prayer links ────────────────────────────────────

function extractPrayerLinks(html, dateStr) {
    const $ = cheerio.load(html);
    const links = {};
    const dateSuffix = `?date=${dateStr.replace(/-/g, '')}`;

    $('a').each((_, el) => {
        const text = $(el).text().trim().toLowerCase();
        const href = $(el).attr('href') || '';
        
        const officeKey = OFFICE_LINK_MAP[text];
        if (officeKey && href.includes('divineoffice.org/') && !links[officeKey]) {
            // Ensure the date parameter is correct
            let url = href.split('?')[0];
            if (!url.endsWith('/')) url += '/';
            url += dateSuffix;
            links[officeKey] = url;
        }
    });

    return links;
}

// ─── Prayer page parser ───────────────────────────────────────────────────

function extractPrayerContent(html) {
    const $ = cheerio.load(html);

    // Remove non-content elements
    $('script, style, noscript, iframe, form, nav, header, footer').remove();
    $('audio, source, .modal, .popup, .sidebar, .widget').remove();
    $('[class*="comment"], [class*="discussion"], [class*="prayer-request"]').remove();
    $('[class*="contribute"], [class*="donate"], [class*="blog"]').remove();
    $('[class*="app-container"], [class*="recommended"], [class*="radio"]').remove();

    // divineoffice.org uses a WordPress theme — content is in the main post area
    // Walk block-level elements that contain prayer text
    const blockTags = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th', 'blockquote', 'pre']);
    const textParts = [];
    const seen = new Set(); // Dedup by text content

    $('body').find('*').each((_, el) => {
        const tag = el.name?.toLowerCase();
        if (!tag || !blockTags.has(tag)) return;
        
        const $el = $(el);
        const text = $el.text().trim();
        if (!text || text.length < 2) return;
        
        // Skip if this text is a subset of something we've already added  
        // or if we've seen the exact text before
        if (seen.has(text)) return;

        // Skip navigation/chrome elements
        if (/^(Join Free|Log in|Today|Community|Blog|About|Go to Prayers|Support us|Donate|Share|More|Login|Register|Sign In)$/i.test(text)) return;
        if (/prayer light/i.test(text) && text.length < 50) return;
        if (/^(Accept and Continue|Not Now|Don't ask|Share My Location)/i.test(text)) return;
        if (/^(View on Amazon|Continue reading)/i.test(text)) return;
        if (/Knowledge Base|Chat with DivineOffice/i.test(text)) return;
        if (/copyright notice|terms and conditions|privacy policy/i.test(text)) return;
        if (/are you sure|where are you from|join us in prayer/i.test(text)) return;
        if (/^Login to (like|reply|read)/i.test(text)) return;
        if (/on (January|February|March|April|May|June|July|August|September|October|November|December) \d/i.test(text) && text.length > 100) return;
        
        
        // --- TERMINATION TRIGGER ---
        // Once we hit non-liturgical community blocks, the valid prayer content is over.
        if (/Personal Reflections/i.test(text) || /The Faith Journey of our Community/i.test(text)) {
            return false; // Break out of jQuery .each() - IMMEDIATE TERMINATION
        }

        // Skip metadata
        if (/Available (for Purchase|on iTunes)/i.test(text) || /Albums that contain this Hymn/i.test(text)) return;
        if (text.startsWith('𝄞')) return;

        // Don't include very long texts that are clearly reviews/descriptions
        if (text.length > 800 && !/psalm|canticle|prayer|glory|father/i.test(text)) return;

        seen.add(text);
        textParts.push(text);
    });

    return textParts.join('\n');
}

function parsePrayerPage(html, officeKey) {
    if (!html) return null;

    const rawText = extractPrayerContent(html);
    const allLines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    // Find the prayer content boundaries
    // Start: line containing "Prayer for" or "Office of Readings for" or similar
    // End: line containing "to top" or the end of meaningful content
    let startIdx = 0;
    let endIdx = allLines.length;

    for (let i = 0; i < allLines.length; i++) {
        const line = allLines[i];
        if (/^(Morning|Evening|Night|Midmorning|Midday|Midafternoon) Prayer for /i.test(line) ||
            /^Office of Readings for /i.test(line) ||
            /^Invitatory$/i.test(line)) {
            startIdx = i;
            break;
        }
    }

    for (let i = allLines.length - 1; i > startIdx; i--) {
        if (allLines[i].includes('to top') || allLines[i].includes('↑')) {
            endIdx = i;
            break;
        }
    }

    const lines = allLines.slice(startIdx, endIdx);
    if (lines.length < 5) return null;

    // Parse into sections
    const sections = [];
    let currentSection = { key: 'title', lines: [] };

    for (const line of lines) {
        // Check if this line is a section marker
        let matched = false;
        for (const marker of SECTION_MARKERS) {
            if (marker.pattern.test(line)) {
                // Save current section
                if (currentSection.lines.length > 0) {
                    sections.push(currentSection);
                }
                currentSection = { key: marker.key, lines: [] };

                // For READING, extract the reference from the marker line itself
                if (marker.key === 'reading') {
                    const match = line.match(/^(?:FIRST|SECOND|SCRIPTURE)?\s*READING[S]?\s+(.+)/i);
                    if (match && match[1]) {
                        currentSection.reference = match[1].trim();
                    }
                }

                // For gospel canticle, note which one
                if (marker.key === 'gospelCanticle') {
                    if (/ZECHARIAH/i.test(line)) currentSection.canticleName = 'Benedictus';
                    else if (/MARY/i.test(line)) currentSection.canticleName = 'Magnificat';
                    else if (/SIMEON/i.test(line)) currentSection.canticleName = 'Nunc Dimittis';
                }

                // Do not discard the matched line if it is actual prayer content!
                if (marker.key === 'lordsPrayer' || marker.key === 'teDeum') {
                    currentSection.lines.push(line);
                }

                matched = true;
                break;
            }
        }

        if (!matched) {
            currentSection.lines.push(line);
        }
    }

    // Push final section
    if (currentSection.lines.length > 0 || currentSection.reference || currentSection.canticleName) {
        sections.push(currentSection);
    }

    // Build structured parts from sections
    return buildParts(sections, officeKey);
}

function buildParts(sections, officeKey) {
    const parts = {
        introduction: '',
        hymn: { text: '' },
        psalmody: [],
        reading: { text: '', reference: '' },
        responsory: { text: '' },
        gospelCanticle: { heading: '', antiphon: '', text: '' },
        intercessions: { text: '' },
        lordsPrayer: { text: '' },
        concludingPrayer: { text: '' },
        dismissal: { text: '' },
        blocks: []
    };

    for (const section of sections) {
        const text = cleanText(section.lines.join('\n'));
        if (!text && section.key !== 'psalmody') continue;

        let block = { type: section.key, text };

        switch (section.key) {
            case 'title': {
                const introLines = section.lines.filter(l =>
                    /God, come to my assistance/i.test(l) ||
                    /Lord, make haste to help me/i.test(l) ||
                    /Lord, open my lips/i.test(l) ||
                    /And my mouth will declare your praise/i.test(l) ||
                    /Glory to the Father/i.test(l) ||
                    /as it was in the beginning/i.test(l)
                );
                if (introLines.length > 0) {
                    const introText = cleanText(introLines.join('\n'));
                    parts.introduction = introText;
                    block.text = introText;
                    block.type = 'introduction';
                }
                break;
            }

            case 'hymn':
                parts.hymn.text = text;
                break;

            case 'psalmody':
                const psalms = parsePsalmody(section.lines);
                parts.psalmody = [...parts.psalmody, ...psalms];
                block.items = psalms;
                break;

            case 'reading':
                // Append reading text as there can be multiple (e.g. readings in Office of Readings)
                parts.reading.text += (parts.reading.text ? '\n\n' : '') + text;
                if (section.reference && !parts.reading.reference) {
                    parts.reading.reference = section.reference;
                    block.reference = section.reference;
                }
                break;

            case 'sacredSilence':
                continue;

            case 'responsory':
                parts.responsory.text += (parts.responsory.text ? '\n\n' : '') + text;
                break;
                
            case 'teDeum':
                break;

            case 'gospelCanticle':
                parts.gospelCanticle = parseGospelCanticle(section);
                block.items = [parts.gospelCanticle];
                break;

            case 'intercessions':
                parts.intercessions = { text };
                break;

            case 'lordsPrayer':
                parts.lordsPrayer = { text };
                break;

            case 'concludingPrayer':
                parts.concludingPrayer = { text };
                break;

            case 'dismissal':
                parts.dismissal = { text: stripContamination(text) };
                break;
        }

        if (block.text || block.items?.length > 0) {
            parts.blocks.push(block);
        }
    }

    const finalParts = { blocks: parts.blocks };
    if (parts.introduction) finalParts.introduction = parts.introduction;
    if (parts.hymn.text) finalParts.hymn = parts.hymn;
    if (parts.psalmody.length > 0) finalParts.psalmody = parts.psalmody;
    else finalParts.psalmody = [];
    if (parts.reading.text) finalParts.reading = parts.reading;
    if (parts.responsory.text) finalParts.responsory = parts.responsory;
    if (parts.gospelCanticle.text) finalParts.gospelCanticle = parts.gospelCanticle;
    if (parts.intercessions.text) finalParts.intercessions = parts.intercessions;
    if (parts.lordsPrayer.text) finalParts.lordsPrayer = parts.lordsPrayer;
    if (parts.concludingPrayer.text) finalParts.concludingPrayer = parts.concludingPrayer;
    if (parts.dismissal.text) finalParts.dismissal = parts.dismissal;

    return finalParts;
}

// ─── Psalmody parser ──────────────────────────────────────────────────────

function parsePsalmody(lines) {
    const psalms = [];
    let current = null;

    const finalize = () => {
        if (current && current.bodyLines.length > 0) {
            const entry = {
                heading: current.heading,
                text: cleanText(current.bodyLines.join('\n')),
            };
            if (current.antiphon) entry.antiphon = cleanText(current.antiphon);
            if (current.psalmPrayer) entry.psalmPrayer = cleanText(current.psalmPrayer);
            psalms.push(entry);
        }
        current = null;
    };

    let inPsalmPrayer = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Detect antiphon lines: "Ant. 1 ...", "Ant. ...", or lines starting with "Ant."
        const antMatch = trimmed.match(/^Ant\.?\s*(\d+)?\s*(.*)/i);
        if (antMatch) {
            const antText = antMatch[2].trim();
            const antNum = antMatch[1] ? parseInt(antMatch[1]) : null;

            if (antNum && antNum >= 1) {
                // Starting antiphon for a new psalm
                finalize();
                current = {
                    heading: '',
                    antiphon: antText,
                    bodyLines: [],
                    psalmPrayer: '',
                };
                inPsalmPrayer = false;
            } else if (current && current.bodyLines.length > 0) {
                // Closing antiphon (repeat) — skip, it's the same as the opening
            } else if (!current) {
                // Antiphon without number — start of first psalm
                finalize();
                current = {
                    heading: '',
                    antiphon: antText,
                    bodyLines: [],
                    psalmPrayer: '',
                };
                inPsalmPrayer = false;
            }
            continue;
        }

        // Detect psalm/canticle heading: "Psalm 43 ...", "Canticle – Isaiah 38:..."
        const psalmMatch = trimmed.match(/^(Psalm\s+\d+|Canticle\s*[–—-]\s*)/i);
        if (psalmMatch) {
            if (!current) {
                // Psalm heading without preceding antiphon
                current = { heading: trimmed, antiphon: '', bodyLines: [], psalmPrayer: '' };
            } else {
                current.heading = trimmed;
            }
            inPsalmPrayer = false;
            continue;
        }

        // Detect "Psalm-prayer" marker
        if (/^Psalm[- ]?prayer$/i.test(trimmed)) {
            inPsalmPrayer = true;
            continue;
        }

        // Detect Glory to the Father (doxology) — part of the psalm body, not a new section
        if (/^Glory to the Father/i.test(trimmed)) {
            if (current) {
                current.bodyLines.push(trimmed);
            }
            inPsalmPrayer = false;
            continue;
        }

        // Roman numeral section markers within a psalm (I, II, III)
        if (/^(I{1,3}|IV|V|VI)$/.test(trimmed)) {
            // These mark sub-sections of a psalm — keep as part of the body
            if (current) {
                current.bodyLines.push(trimmed);
            }
            continue;
        }

        // Musical score links — skip
        if (/Musical Score/i.test(trimmed) || /^\[.*\]$/.test(trimmed)) {
            continue;
        }

        // Ribbon Placement — skip
        if (/^Ribbon Placement/i.test(trimmed) || /^Christian Prayer/i.test(trimmed)) {
            continue;
        }

        // Accumulate content
        if (current) {
            if (inPsalmPrayer) {
                current.psalmPrayer += (current.psalmPrayer ? '\n' : '') + trimmed;
            } else {
                current.bodyLines.push(trimmed);
            }
        }
    }

    finalize();
    return psalms;
}

// ─── Gospel canticle parser ───────────────────────────────────────────────

function parseGospelCanticle(section) {
    const result = {
        heading: section.canticleName || 'Gospel Canticle',
        antiphon: '',
        text: '',
    };

    const bodyLines = [];
    let foundAnt = false;

    for (const line of section.lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // First Ant. line = canticle antiphon
        const antMatch = trimmed.match(/^Ant\.?\s*(.*)/i);
        if (antMatch && !foundAnt) {
            result.antiphon = cleanText(antMatch[1]);
            foundAnt = true;
            continue;
        }

        // Repeated Ant. at the end — skip
        if (antMatch && foundAnt) continue;

        // Scripture reference heading (e.g., "Luke 1:68-79 The Messiah and his forerunner")
        if (/^(Luke|Matthew|Mark|John)\s+\d+:\d+/i.test(trimmed)) {
            // Keep as heading context but don't include in prayer text
            if (!result.heading || result.heading === 'Gospel Canticle') {
                result.heading = section.canticleName || 'Gospel Canticle';
            }
            result.reference = trimmed;
            continue;
        }

        bodyLines.push(trimmed);
    }

    result.text = cleanText(bodyLines.join('\n'));
    return result;
}

// ─── Liturgical key computation (self-contained) ──────────────────────────
// Ported from the existing scraper — computes the liturgical key for any date.

const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function utcDate(y,m,d) { return new Date(Date.UTC(y,m-1,d)); }
function addDays(date,n) { const d=new Date(date.getTime()); d.setUTCDate(d.getUTCDate()+n); return d; }
function diffDays(a,b) { return Math.round((a.getTime()-b.getTime())/86400000); }

function computeEaster(year) {
    const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4;
    const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
    const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
    const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
    const month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
    return utcDate(year,month,day);
}

function firstSundayOfAdvent(year) {
    for(let d=27;d<=30;d++){const dt=utcDate(year,11,d);if(dt.getUTCDay()===0)return dt;}
    for(let d=1;d<=3;d++){const dt=utcDate(year,12,d);if(dt.getUTCDay()===0)return dt;}
    throw new Error(`Cannot compute Advent start for ${year}`);
}

function usEpiphany(year) {
    for(let d=2;d<=8;d++){const dt=utcDate(year,1,d);if(dt.getUTCDay()===0)return dt;}
    throw new Error(`Cannot compute Epiphany for ${year}`);
}

function baptismOfTheLord(year) {
    const ep=usEpiphany(year);
    return (ep.getUTCDate()===7||ep.getUTCDate()===8) ? addDays(ep,1) : addDays(ep,7);
}

function liturgicalYearForDate(date) {
    const y=date.getUTCFullYear();
    return date>=firstSundayOfAdvent(y) ? y+1 : y;
}

function romanSundayCycle(litYear) { return ['C','A','B'][litYear%3]; }

function computeAnchors(year) {
    const easter=computeEaster(year);
    return {
        year,easter,
        ashWednesday: addDays(easter,-46),
        palmSunday:   addDays(easter,-7),
        holyThursday: addDays(easter,-3),
        pentecost:    addDays(easter,49),
        adventStart:  firstSundayOfAdvent(year - 1),  // Start of THIS liturgical year (prior calendar year)
        christmas:    utcDate(year - 1, 12, 25),       // Christmas of the prior calendar year
        baptism:      baptismOfTheLord(year),
        nextAdventStart: firstSundayOfAdvent(year),    // Start of the NEXT liturgical year (current calendar year)
    };
}

function classifySeason(date, anch) {
    // The liturgical year flows: Advent → Christmas → OT1 → Lent → Triduum → Easter → OT2 → [next Advent]
    // Advent precedes Christmas, so check in chronological order within the liturgical year.
    // NOTE: Anchor dates are at midnight UTC (Date.UTC), but input dates may be at noon UTC.
    //       Use < addDays(x,1) instead of <= x for inclusive same-day comparison.
    if(date<anch.christmas)          return {season:'Advent',period:'Advent'};
    if(date<addDays(anch.baptism,1)) return {season:'Christmas',period:'Christmas'};
    if(date<anch.ashWednesday)       return {season:'Ordinary Time',period:'Ordinary Time'};
    if(date<anch.palmSunday)         return {season:'Lent',period:'Lent'};
    if(date<anch.holyThursday)       return {season:'Lent',period:'Holy Week'};
    if(date<anch.easter)             return {season:'Lent',period:'Paschal Triduum'};
    if(date<addDays(anch.pentecost,1)) {
        const isOctave=diffDays(date,anch.easter)<=7;
        return {season:'Easter',period:isOctave?'Easter Octave':'Easter'};
    }
    // After Pentecost, before the NEXT liturgical year's Advent = Ordinary Time
    if(date<anch.nextAdventStart) return {season:'Ordinary Time',period:'Ordinary Time'};
    // Safety fallback — should not be reached since liturgicalYearForDate handles boundaries
    return {season:'Ordinary Time',period:'Ordinary Time'};
}

function ordinaryTimeWeek(date, anch) {
    const start=addDays(anch.baptism,1);
    if(date<anch.ashWednesday) return Math.floor(diffDays(date,start)/7)+1;
    const lastBefore=addDays(anch.ashWednesday,-1);
    const weeksBefore=Math.floor(diffDays(lastBefore,start)/7)+1;
    const resume=addDays(anch.pentecost,1);
    return weeksBefore+2+Math.floor(diffDays(date,resume)/7);
}

function adventWeek(date, anch) { return Math.floor(diffDays(date,anch.adventStart)/7)+1; }

function lentWeek(date, anch) {
    const firstSun=addDays(anch.ashWednesday,4);
    if(date<firstSun) return 0;
    return Math.floor(diffDays(date,firstSun)/7)+1;
}

function easterWeek(date, anch) {
    if(diffDays(date,anch.easter)<=7) return 1;
    return 2+Math.floor(diffDays(date,addDays(anch.easter,8))/7);
}

function slugify(value) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        .replace(/&/g,'And').replace(/[^A-Za-z0-9]+/g,' ').trim()
        .split(/\s+/).map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join('');
}

const FIXED_DATE_KEY_OVERRIDES = {
    '01-01': 'Mary_MotherOfGod',
    '02-02': 'PresentationOfTheLord',
    '03-19': 'SaintJoseph',
    '03-25': 'AnnunciationOfTheLord',
    '06-24': 'NativityOfSaintJohnTheBaptist',
    '06-29': 'SaintsPeterAndPaulApostles',
    '08-06': 'TransfigurationOfTheLord',
    '08-15': 'AssumptionOfTheBlessedVirginMary',
    '09-14': 'ExaltationOfTheHolyCross',
    '11-01': 'AllSaints',
    '11-02': 'AllSouls',
    '12-08': 'ImmaculateConception',
    '12-25': 'NativityOfTheLord_Christmas',
    '12-26': 'SaintStephen',
    '12-27': 'SaintJohnApostle',
    '12-28': 'HolyInnocents',
};

function resolveDateToCalendarEntry(isoDate) {
    const date = new Date(`${isoDate}T12:00:00Z`);
    const year = date.getUTCFullYear();
    const litYear = liturgicalYearForDate(date);
    const litAnch = computeAnchors(litYear);
    const seasonInfo = classifySeason(date, litAnch);
    const dayName = WEEKDAY_NAMES[date.getUTCDay()];
    const m = date.getUTCMonth()+1;
    const d = date.getUTCDate();
    const mmdd = `${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const fixedKey = FIXED_DATE_KEY_OVERRIDES[mmdd];

    let week = null;
    if (seasonInfo.season==='Ordinary Time') week = ordinaryTimeWeek(date, litAnch);
    else if (seasonInfo.season==='Advent') week = adventWeek(date, litAnch);
    else if (seasonInfo.season==='Lent' && seasonInfo.period !== 'Holy Week' && seasonInfo.period !== 'Paschal Triduum') week = lentWeek(date, litAnch);
    else if (seasonInfo.season==='Easter') week = easterWeek(date, litAnch);

    let key;
    if(seasonInfo.season==='Ordinary Time' && week!==null) {
        key = `OrdinaryTime_Week${week}_${dayName}`;
    } else if(seasonInfo.season==='Advent') {
        if(m===12 && d>=17 && d<=24 && dayName!=='Sunday') key = `Advent_Dec${d}`;
        else if(week!==null) key = `Advent_Week${week}_${dayName}`;
        else key = `Advent_${dayName}`;
    } else if(seasonInfo.season==='Lent') {
        if(seasonInfo.period==='Paschal Triduum') {
            if(dayName==='Thursday') key='HolyThursday';
            else if(dayName==='Friday') key='GoodFriday';
            else if(dayName==='Saturday') key='HolySaturday';
            else key=`Triduum_${dayName}`;
        } else if(seasonInfo.period==='Holy Week') {
            key = `HolyWeek_${dayName}`;
        } else if(week===0) {
            key = `Lent_AshWeek_${dayName}`;
        } else if(week!==null) {
            key = `Lent_Week${week}_${dayName}`;
        } else {
            key = `Lent_${dayName}`;
        }
    } else if(seasonInfo.season==='Easter') {
        if(diffDays(date,litAnch.easter)===0) key = 'EasterSunday';
        else if(seasonInfo.period==='Easter Octave' && dayName!=='Sunday') key = `EasterOctave_${dayName}`;
        else if(week!==null) key = `Easter_Week${week}_${dayName}`;
        else key = `Easter_${dayName}`;
    } else if(seasonInfo.season==='Christmas') {
        if(m===12 && d===25) key='NativityOfTheLord_Christmas';
        else if(m===12 && d===26) key='SaintStephen';
        else if(m===12 && d===27) key='SaintJohnApostle';
        else if(m===12 && d===28) key='HolyInnocents';
        else if(m===1  && d===1 ) key='Mary_MotherOfGod';
        else if(dayName==='Sunday') {
            const daysSinceChristmas = diffDays(date, litAnch.christmas);
            if(daysSinceChristmas>0 && daysSinceChristmas<=7) key='HolyFamily';
            else key=`Christmas_Sunday_W${Math.ceil(diffDays(date,litAnch.christmas)/7)}`;
        } else {
            const daysSince = diffDays(date, litAnch.christmas);
            if(daysSince>0 && daysSince<=7) key=`ChristmasOctave_${dayName}`;
            else key=`Christmas_${dayName}`;
        }
    } else {
        key = slugify(`${seasonInfo.season}_${dayName}`);
    }

    if(fixedKey && !['EasterSunday','HolyThursday','GoodFriday','HolySaturday',
                       'PentecostSunday','MostHolyTrinity','MostHolyBodyAndBloodOfChrist'].includes(key)) {
        key = fixedKey;
    }

    return { date: isoDate, key, season: seasonInfo.season, period: seasonInfo.period, day: dayName, week, liturgicalYear: romanSundayCycle(litYear) };
}

// ─── Date range generator ──────────────────────────────────────────────────

function* dateRange(start, end) {
    const cur = new Date(`${start}T12:00:00Z`);
    const last = new Date(`${end}T12:00:00Z`);
    while (cur <= last) {
        yield cur.toISOString().slice(0, 10);
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
}

// ─── Validation ────────────────────────────────────────────────────────────

function validateOfficeParts(parts, officeKey) {
    const issues = [];
    if (!parts.psalmody || parts.psalmody.length === 0) issues.push('missing psalmody');
    if (!parts.hymn?.text && officeKey !== 'invitatory') issues.push('missing hymn');

    // For major hours, check for essential parts
    if (['morningPrayer', 'eveningPrayer'].includes(officeKey)) {
        if (!parts.reading?.text) issues.push('missing reading');
        if (!parts.responsory?.text) issues.push('missing responsory');
        if (!parts.gospelCanticle?.text) issues.push('missing gospel canticle');
        if (!parts.intercessions?.text) issues.push('missing intercessions');
        if (!parts.concludingPrayer?.text) issues.push('missing concluding prayer');
    }

    return issues;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
    // Load existing data  
    let existing = {};
    try {
        existing = JSON.parse(await fs.readFile(OUTPUT_FILE, 'utf8'));
        const count = Object.keys(existing).filter(k => k !== '__meta').length;
        console.log(`📖 Loaded existing data — ${count} liturgical keys stored.`);
    } catch {
        console.log('📄 Starting fresh — no existing data.');
    }

    // ── Clean mode: purge misclassified keys & strip contamination, then exit ──
    if (cleanMode) {
        await runCleanMode(existing);
        return;
    }

    const dates = [...dateRange(startArg, endArg)];
    console.log(`\n🕊  Scraping ${dates.length} dates: ${startArg} → ${endArg}`);
    if (forceMode) console.log('🔄 FORCE MODE — will re-scrape even if key already exists');
    if (testMode) console.log('🧪 TEST MODE — will scrape first date only\n');

    let scraped = 0, skipped = 0, failed = 0;
    const datesToProcess = testMode ? dates.slice(0, 1) : dates;

    for (const date of datesToProcess) {
        const calEntry = resolveDateToCalendarEntry(date);
        const liturgicalKey = calEntry.key;

        if (!liturgicalKey) {
            console.log(`  ⚪ ${date} — no liturgical key, skipping`);
            skipped++;
            continue;
        }

        if (!forceMode && existing[liturgicalKey]?.offices && Object.keys(existing[liturgicalKey].offices).length >= 3) {
            console.log(`  ⏭  ${date} [${liturgicalKey}] — already scraped (use --force to override)`);
            skipped++;
            continue;
        }
        if (forceMode && existing[liturgicalKey]?.offices) {
            console.log(`  🔄 ${date} [${liturgicalKey}] — force re-scraping`);
        }

        console.log(`\n  📅 ${date} → 🔑 ${liturgicalKey} [${calEntry.season}]`);

        // Fetch landing page to get prayer links
        const dateStr = date.replace(/-/g, '');
        const landingUrl = `https://divineoffice.org/?date=${dateStr}`;
        const landingHtml = await fetchWithRetry(landingUrl);

        if (!landingHtml) {
            console.log(`    ✗ Failed to fetch landing page`);
            failed++;
            continue;
        }

        const prayerLinks = extractPrayerLinks(landingHtml, date);
        const linkCount = Object.keys(prayerLinks).length;
        console.log(`    Found ${linkCount} prayer links: ${Object.keys(prayerLinks).join(', ')}`);

        if (linkCount === 0) {
            console.log(`    ✗ No prayer links found on landing page`);
            failed++;
            continue;
        }

        const offices = {};
        let officesFailed = 0;

        for (const [officeKey, url] of Object.entries(prayerLinks)) {
            process.stdout.write(`    ↳ ${officeKey}... `);

            const html = await fetchWithRetry(url);
            if (!html) {
                process.stdout.write('✗ fetch failed\n');
                officesFailed++;
                await sleep(1500);
                continue;
            }

            const parts = parsePrayerPage(html, officeKey);
            if (!parts) {
                process.stdout.write('✗ parse failed\n');
                officesFailed++;
                await sleep(1500);
                continue;
            }

            const issues = validateOfficeParts(parts, officeKey);
            if (issues.length > 0) {
                process.stdout.write(`⚠ (${issues.join(', ')})\n`);
            } else {
                process.stdout.write('✓\n');
            }

            offices[officeKey] = { parts };

            // Polite delay between requests
            await sleep(1200);
        }

        if (Object.keys(offices).length === 0) {
            console.log(`    ✗ No offices parsed successfully`);
            failed++;
            continue;
        }

        existing[liturgicalKey] = {
            key: liturgicalKey,
            celebration: liturgicalKey.replace(/_/g, ' '),
            season: calEntry.season,
            period: calEntry.period,
            day: calEntry.day,
            week: calEntry.week ?? null,
            liturgicalYear: calEntry.liturgicalYear ?? null,
            scrapedFromDate: date,
            source: 'divineoffice.org',
            offices,
        };

        scraped++;

        // Checkpoint after every date
        const output = {
            __meta: {
                schemaVersion: 3,
                source: 'divineoffice.org',
                description: 'Complete Liturgy of the Hours, keyed by liturgical position. Valid for all years.',
                generatedAt: new Date().toISOString(),
                totalKeys: Object.keys(existing).filter(k => k !== '__meta').length,
            },
            ...existing,
        };
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
        console.log(`    ✅ Saved [${liturgicalKey}] (${Object.keys(offices).length} offices, ${officesFailed} failed)`);

        // Delay between dates
        await sleep(800);
    }

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  ✅ Scraped:    ${scraped} new liturgical keys`);
    console.log(`  ⏭  Skipped:    ${skipped} (already present)`);
    console.log(`  ✗  Failed:     ${failed} dates`);
    console.log(`  📦 Total keys: ${Object.keys(existing).filter(k => k !== '__meta').length}`);
    console.log(`${'─'.repeat(60)}\n`);
}

// ─── Clean mode ───────────────────────────────────────────────────────────
// Purge misclassified keys, strip contamination, drop redundant blocks[].
// Run with: node scripts/scrape-divineoffice-org.mjs --clean

async function runCleanMode(existing) {
    console.log('\n🧹 CLEAN MODE — Auditing & sanitizing existing data...\n');

    const allKeys = Object.keys(existing).filter(k => k !== '__meta');
    let purged = 0, sanitized = 0, blocksRemoved = 0;

    // 1. Purge misclassified keys (key computed from scrapedFromDate no longer matches stored key)
    for (const storedKey of allKeys) {
        const entry = existing[storedKey];
        if (!entry?.scrapedFromDate) continue;

        const recomputed = resolveDateToCalendarEntry(entry.scrapedFromDate);
        if (recomputed.key !== storedKey) {
            console.log(`  🗑  PURGE: "${storedKey}" → should be "${recomputed.key}" (scraped from ${entry.scrapedFromDate})`);
            delete existing[storedKey];
            purged++;
        }
    }

    // 2. Strip contamination from all text fields & remove blocks[]
    const remainingKeys = Object.keys(existing).filter(k => k !== '__meta');
    for (const key of remainingKeys) {
        const entry = existing[key];

        // Update season/period/week using the FIXED algorithm
        if (entry.scrapedFromDate) {
            const recomputed = resolveDateToCalendarEntry(entry.scrapedFromDate);
            entry.season = recomputed.season;
            entry.period = recomputed.period;
            entry.day = recomputed.day;
            entry.week = recomputed.week;
        }

        if (!entry.offices) continue;

        for (const [officeKey, officeData] of Object.entries(entry.offices)) {
            if (!officeData?.parts) continue;
            const parts = officeData.parts;

            // Remove redundant blocks[] array
            if (parts.blocks) {
                delete parts.blocks;
                blocksRemoved++;
            }

            // Recursively strip contamination from all text fields
            let hadContamination = false;
            for (const [fieldKey, fieldVal] of Object.entries(parts)) {
                if (fieldKey === 'psalmody' && Array.isArray(fieldVal)) {
                    for (const psalm of fieldVal) {
                        if (psalm.text) {
                            const cleaned = stripContamination(psalm.text);
                            if (cleaned !== psalm.text) { psalm.text = cleaned; hadContamination = true; }
                        }
                    }
                } else if (typeof fieldVal === 'object' && fieldVal !== null && fieldVal.text) {
                    const cleaned = stripContamination(fieldVal.text);
                    if (cleaned !== fieldVal.text) { fieldVal.text = cleaned; hadContamination = true; }
                } else if (typeof fieldVal === 'string') {
                    const cleaned = stripContamination(fieldVal);
                    if (cleaned !== fieldVal) { parts[fieldKey] = cleaned; hadContamination = true; }
                }
            }

            if (hadContamination) sanitized++;
        }
    }

    // 3. Save cleaned data
    const finalCount = Object.keys(existing).filter(k => k !== '__meta').length;
    const output = {
        __meta: {
            schemaVersion: 3,
            source: 'divineoffice.org',
            description: 'Complete Liturgy of the Hours, keyed by liturgical position. Valid for all years.',
            generatedAt: new Date().toISOString(),
            totalKeys: finalCount,
            lastCleaned: new Date().toISOString(),
        },
        ...existing,
    };
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  🧹 Clean Mode Results`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`  🗑  Purged:       ${purged} misclassified keys`);
    console.log(`  🧼 Sanitized:    ${sanitized} offices (contamination stripped)`);
    console.log(`  📦 blocks[] removed from: ${blocksRemoved} offices`);
    console.log(`  📦 Remaining:    ${finalCount} valid liturgical keys`);
    console.log(`${'─'.repeat(60)}\n`);

    // Show what's still missing
    console.log('📊 Coverage check after clean:');
    const expectedSeasons = {
        'Ordinary Time': [],
        'Advent': [],
        'Lent': [],
        'Easter': [],
    };

    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    for (let w = 1; w <= 34; w++) {
        for (const d of days) { expectedSeasons['Ordinary Time'].push(`OrdinaryTime_Week${w}_${d}`); }
    }
    for (let w = 1; w <= 4; w++) {
        for (const d of days) { expectedSeasons['Advent'].push(`Advent_Week${w}_${d}`); }
    }
    for (let w = 0; w <= 5; w++) {
        for (const d of days) {
            if (w === 0) expectedSeasons['Lent'].push(`Lent_AshWeek_${d}`);
            else expectedSeasons['Lent'].push(`Lent_Week${w}_${d}`);
        }
    }
    for (let w = 1; w <= 7; w++) {
        for (const d of days) { expectedSeasons['Easter'].push(`Easter_Week${w}_${d}`); }
    }

    const cleanedKeys = new Set(Object.keys(existing).filter(k => k !== '__meta'));
    let totalMissing = 0;
    for (const [season, keys] of Object.entries(expectedSeasons)) {
        const missing = keys.filter(k => !cleanedKeys.has(k));
        totalMissing += missing.length;
        console.log(`  ${season}: ${keys.length - missing.length}/${keys.length} present (${missing.length} missing)`);
    }
    console.log(`\n  Total missing regular keys: ${totalMissing}`);
    console.log(`  (Fixed feasts and special keys not counted above)\n`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exitCode = 1;
});
