/**
 * scrape-divine-office-cycle.mjs
 *
 * Scrapes the Liturgy of the Hours from Universalis for a date range and stores
 * content keyed by LITURGICAL KEY (e.g. "OrdinaryTime_Week3_Monday") rather
 * than raw date. This means the ~370 unique keys cover ALL future liturgical
 * years without re-scraping.
 *
 * SELF-CONTAINED: Does NOT require any pre-generated calendar JSON file.
 * The liturgical key is computed inline for any date in any year.
 *
 * Usage:
 *   node scripts/scrape-divine-office-cycle.mjs --start 2026-01-12 --end 2026-02-08
 *   node scripts/scrape-divine-office-cycle.mjs --start 2025-11-30 --end 2025-12-31  (Advent/Christmas)
 *   node scripts/scrape-divine-office-cycle.mjs --start 2026-02-18 --end 2026-04-04  (Lent)
 *   node scripts/scrape-divine-office-cycle.mjs --start 2026-04-05 --end 2026-05-24  (Easter)
 *
 * Output: data/divineOfficeCycle.json (keyed by liturgical key)
 * Resumes safely: already-scraped keys are skipped.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(repoRoot, 'data', 'divineOfficeCycle.json');

// ─── CLI args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const startArg = getArg('--start');
const endArg = getArg('--end');

if (!startArg || !endArg) {
    console.error('Usage: node scripts/scrape-divine-office-cycle.mjs --start YYYY-MM-DD --end YYYY-MM-DD');
    process.exit(1);
}

// ─── Hour map: internal key → Universalis URL segment ─────────────────────
const HOURS = {
    officeOfReadings: 'readings',
    morningPrayer:   'lauds',
    midMorningPrayer:'terce',
    middayPrayer:    'sext',
    afternoonPrayer: 'none',
    eveningPrayer:   'vespers',
    nightPrayer:     'compline',
};

// ─── HTML utilities ────────────────────────────────────────────────────────

function decodeHtmlEntities(text) {
    return text
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&rsquo;/g, '\u2019')
        .replace(/&lsquo;/g, '\u2018')
        .replace(/&ldquo;/g, '\u201C')
        .replace(/&rdquo;/g, '\u201D')
        .replace(/\u00A0/g, ' ');
}

function cleanText(raw) {
    if (!raw) return '';
    return decodeHtmlEntities(raw)
        .replace(/\s*\n\s*/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// ─── Main per-hour scraper ─────────────────────────────────────────────────

async function scrapeHour(isoDate, internalKey) {
    const urlDate = isoDate.replace(/-/g, '');
    const urlSegment = HOURS[internalKey];
    const url = `https://universalis.com/${urlDate}/${urlSegment}.htm`;

    let html;
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; parish-app-scraper/1.0)',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 15000,
        });
        html = response.data;
    } catch (err) {
        console.warn(`  ⚠ Failed to fetch ${url}: ${err.message}`);
        return null;
    }

    const $ = cheerio.load(html);

    // ── Strip all UI chrome and non-prayer elements ──────────────────────
    $(
        '#hourlinks, #calendar-heading, #feastlinks, #side, #header, #footer, ' +
        '.Pages, .Dates, .smallprint, .nav, .navigation, ' +
        'script, style, noscript, iframe, form, input, button, ' +
        'table.weekdays, [class*="breadcrumb"], [class*="widget"]'
    ).remove();

    // Store celebration name BEFORE removing #feastname from DOM
    const celebration = cleanText($('#feastname').text()) || 'Ordinary Time';
    $('#feastname').remove();

    const parts = {
        introduction: '',
        hymn: { text: '' },
        psalmody: [],
        reading: { text: '', reference: '' },
        responsory: { text: '' },
        gospelCanticle: { antiphon: '', text: '', heading: '' },
        intercessions: { text: '' },
        lordsPrayer: { text: '' },
        concludingPrayer: { text: '' },
    };

    let currentSection = null;
    let currentPsalm = null;

    const finalizePsalm = () => {
        if (currentPsalm && (currentPsalm.text.trim() || currentPsalm.antiphon)) {
            // Clean up psalm: remove any leading/trailing blank lines
            currentPsalm.text = currentPsalm.text.trim();
            parts.psalmody.push({ ...currentPsalm });
            currentPsalm = null;
        }
    };

    // Walk every relevant node in document order
    const nodes = $('h3, h4, h5, th, div.v, div.vi, div.vr, div.rubric, p.rubric, p');

    nodes.each((_, el) => {
        const $el = $(el);
        const tag = el.name?.toLowerCase() ?? '';
        const cls = ($el.attr('class') || '').toLowerCase();
        const rawText = $el.text();
        const text = cleanText(rawText);
        if (!text) return;

        const lower = text.toLowerCase();

        // ── 1. Section-heading detection ─────────────────────────────────
        if (tag === 'th' || tag === 'h3' || tag === 'h4' || tag === 'h5') {
            // Introduction / Opening verse
            if (lower.includes('introduction') || lower.includes('opening verse')) {
                currentSection = 'introduction';
                finalizePsalm();
                return;
            }
            // Hymn
            if (lower === 'hymn' || lower.match(/^hymn\b/)) {
                currentSection = 'hymn';
                finalizePsalm();
                return;
            }
            // Psalm / Canticle (not the gospel canticles)
            const isGospelCanticle = ['benedictus', 'magnificat', 'nunc dimittis'].some(m => lower.includes(m));
            if (!isGospelCanticle && (lower.includes('psalm') || lower.includes('canticle') || lower.match(/^psalm\s+\d/i))) {
                finalizePsalm();
                currentPsalm = { heading: text, text: '', antiphon: '' };
                currentSection = 'psalmody';
                return;
            }
            // Reading
            if (lower.match(/^(short )?reading\b/) || lower.includes('scripture reading')) {
                currentSection = 'reading';
                finalizePsalm();
                return;
            }
            // Responsory
            if (lower.includes('responsory') || lower.includes('short responsory')) {
                currentSection = 'responsory';
                finalizePsalm();
                return;
            }
            // Gospel Canticle
            if (isGospelCanticle) {
                finalizePsalm();
                currentSection = 'gospelCanticle';
                parts.gospelCanticle.heading = text;
                return;
            }
            // Intercessions / Prayers / Petitions
            if (lower.includes('intercession') || lower.includes('prayers') || lower.includes('petition')) {
                currentSection = 'intercessions';
                finalizePsalm();
                return;
            }
            // Lord's Prayer
            if (lower.includes("lord's prayer") || lower.includes('our father')) {
                currentSection = 'lordsPrayer';
                finalizePsalm();
                return;
            }
            // Concluding Prayer / Blessing / Dismissal
            if (lower.includes('concluding prayer') || lower.includes('collect') || lower.includes('blessing') || lower.includes('dismissal')) {
                currentSection = 'concludingPrayer';
                finalizePsalm();
                return;
            }
            // Unknown heading — close current psalm
            finalizePsalm();
            return;
        }

        // ── 2. Text classification by current section ─────────────────────
        const isRubric = cls.includes('rubric') || tag === 'p' && cls.includes('rubric');
        const isAntiphonLine = lower.startsWith('ant.') || lower.startsWith('antiphon');

        if (currentSection === 'introduction') {
            parts.introduction += (parts.introduction ? '\n' : '') + text;

        } else if (currentSection === 'hymn') {
            // For hymns with div.v (verse lines), maintain line breaks
            if (tag === 'div' && (cls.includes(' v') || cls === 'v' || cls.includes(' vi') || cls === 'vi')) {
                parts.hymn.text += (parts.hymn.text ? '\n' : '') + text;
            } else if (!isRubric) {
                parts.hymn.text += (parts.hymn.text ? '\n' : '') + text;
            }

        } else if (currentSection === 'psalmody' && currentPsalm !== null) {
            if (isAntiphonLine || isRubric) {
                // Antiphon: strip "Ant." prefix
                const antiphonText = text.replace(/^Ant\.?\s*/i, '').replace(/^Antiphon\s*\d*\s*:?\s*/i, '').trim();
                if (!currentPsalm.antiphon) {
                    currentPsalm.antiphon = antiphonText;
                } else if (!currentPsalm.antiphon2) {
                    currentPsalm.antiphon2 = antiphonText;
                }
            } else {
                currentPsalm.text += (currentPsalm.text ? '\n' : '') + text;
            }

        } else if (currentSection === 'reading') {
            if (isRubric && !parts.reading.reference) {
                // First rubric in a reading section is usually the Scripture reference
                parts.reading.reference = text;
            } else if (!isRubric) {
                parts.reading.text += (parts.reading.text ? '\n' : '') + text;
            }

        } else if (currentSection === 'responsory') {
            if (!isRubric) {
                parts.responsory.text += (parts.responsory.text ? '\n' : '') + text;
            }

        } else if (currentSection === 'gospelCanticle') {
            if (isAntiphonLine || isRubric) {
                const antiphonText = text.replace(/^Ant\.?\s*/i, '').replace(/^Antiphon\s*\d*\s*:?\s*/i, '').trim();
                if (!parts.gospelCanticle.antiphon) {
                    parts.gospelCanticle.antiphon = antiphonText;
                } else if (!parts.gospelCanticle.antiphon2) {
                    parts.gospelCanticle.antiphon2 = antiphonText;
                }
            } else {
                parts.gospelCanticle.text += (parts.gospelCanticle.text ? '\n' : '') + text;
            }

        } else if (currentSection === 'intercessions') {
            if (!isRubric) {
                parts.intercessions.text += (parts.intercessions.text ? '\n' : '') + text;
            }

        } else if (currentSection === 'lordsPrayer') {
            if (!isRubric) {
                parts.lordsPrayer.text += (parts.lordsPrayer.text ? '\n' : '') + text;
            }

        } else if (currentSection === 'concludingPrayer') {
            if (!isRubric) {
                parts.concludingPrayer.text += (parts.concludingPrayer.text ? '\n' : '') + text;
            }
        }
    });

    finalizePsalm();

    // ── 3. Post-process: strip empty sections ────────────────────────────
    const finalParts = {};

    if (parts.introduction.trim()) finalParts.introduction = cleanText(parts.introduction);
    if (parts.hymn.text.trim()) finalParts.hymn = { text: cleanText(parts.hymn.text) };

    if (parts.psalmody.length > 0) {
        finalParts.psalmody = parts.psalmody.map(p => {
            const entry = { heading: p.heading, text: cleanText(p.text) };
            if (p.antiphon) entry.antiphon = cleanText(p.antiphon);
            if (p.antiphon2) entry.antiphon2 = cleanText(p.antiphon2);
            return entry;
        }).filter(p => p.text);
    } else {
        finalParts.psalmody = [];
    }

    if (parts.reading.text.trim()) {
        finalParts.reading = {
            text: cleanText(parts.reading.text),
            reference: cleanText(parts.reading.reference) || '',
        };
    }
    if (parts.responsory.text.trim()) finalParts.responsory = { text: cleanText(parts.responsory.text) };

    if (parts.gospelCanticle.text.trim()) {
        finalParts.gospelCanticle = {
            heading: cleanText(parts.gospelCanticle.heading),
            text: cleanText(parts.gospelCanticle.text),
        };
        if (parts.gospelCanticle.antiphon) finalParts.gospelCanticle.antiphon = cleanText(parts.gospelCanticle.antiphon);
        if (parts.gospelCanticle.antiphon2) finalParts.gospelCanticle.antiphon2 = cleanText(parts.gospelCanticle.antiphon2);
    }

    if (parts.intercessions.text.trim()) finalParts.intercessions = { text: cleanText(parts.intercessions.text) };
    if (parts.lordsPrayer.text.trim()) finalParts.lordsPrayer = { text: cleanText(parts.lordsPrayer.text) };
    if (parts.concludingPrayer.text.trim()) finalParts.concludingPrayer = { text: cleanText(parts.concludingPrayer.text) };

    return { celebration, parts: finalParts };
}

// ─── Self-contained liturgical key computation engine ─────────────────────
// Ported from generate-liturgical-datasets.mjs so the scraper works for any
// date in any year without requiring a pre-generated calendar JSON file.

const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const ORDINAL_WORDS = {
    First:1,Second:2,Third:3,Fourth:4,Fifth:5,Sixth:6,Seventh:7,Eighth:8,Ninth:9,Tenth:10,
    Eleventh:11,Twelfth:12,Thirteenth:13,Fourteenth:14,Fifteenth:15,Sixteenth:16,
    Seventeenth:17,Eighteenth:18,Nineteenth:19,Twentieth:20,
    TwentyFirst:21,TwentySecond:22,TwentyThird:23,TwentyFourth:24,TwentyFifth:25,
    TwentySixth:26,TwentySeventh:27,TwentyEighth:28,TwentyNinth:29,
    Thirtieth:30,ThirtyFirst:31,ThirtySecond:32,ThirtyThird:33,ThirtyFourth:34,
};

const MAJOR_FEAST_KEYS = new Map([
    ['Mary, Mother of God','Mary_MotherOfGod'],
    ['The Epiphany of the Lord','EpiphanyOfTheLord'],
    ['The Baptism of the Lord','BaptismOfTheLord'],
    ['Baptism of the Lord','BaptismOfTheLord'],
    ['Presentation of the Lord','PresentationOfTheLord'],
    ['Ash Wednesday','AshWednesday'],
    ['Palm Sunday of the Passion of the Lord','PalmSunday'],
    ["Palm Sunday of the Lord's Passion",'PalmSunday'],
    ['Monday of Holy Week','HolyWeek_Monday'],
    ['Tuesday of Holy Week','HolyWeek_Tuesday'],
    ['Wednesday of Holy Week','HolyWeek_Wednesday'],
    ['Holy Thursday','HolyThursday'],
    ['Friday of the Passion of the Lord','GoodFriday'],
    ['Good Friday','GoodFriday'],
    ['Holy Saturday','HolySaturday'],
    ['Easter Sunday','EasterSunday'],
    ['Second Sunday of Easter','Easter_Week2_Sunday'],
    ['Third Sunday of Easter','Easter_Week3_Sunday'],
    ['Fourth Sunday of Easter','Easter_Week4_Sunday'],
    ['Fifth Sunday of Easter','Easter_Week5_Sunday'],
    ['Sixth Sunday of Easter','Easter_Week6_Sunday'],
    ['Seventh Sunday of Easter','Easter_Week7_Sunday'],
    ['Pentecost Sunday','PentecostSunday'],
    ['The Most Holy Trinity','MostHolyTrinity'],
    ['The Most Holy Body and Blood of Christ','MostHolyBodyAndBloodOfChrist'],
    ['Corpus Christi','MostHolyBodyAndBloodOfChrist'],
    ['Holy Family','HolyFamily'],
    ['The Holy Family of Jesus, Mary, and Joseph','HolyFamily'],
    ['The Assumption of the Blessed Virgin Mary','AssumptionOfTheBlessedVirginMary'],
    ['All Saints','AllSaints'],
    ['The Commemoration of All the Faithful Departed (All Souls)','AllSouls'],
    ['The Immaculate Conception of the Blessed Virgin Mary','ImmaculateConception'],
    ['Our Lord Jesus Christ, King of the Universe','ChristTheKing'],
    ['Christ the King','ChristTheKing'],
    ['The Annunciation of the Lord','AnnunciationOfTheLord'],
    ['The Nativity of Saint John the Baptist','NativityOfSaintJohnTheBaptist'],
    ['Saints Peter and Paul, Apostles','SaintsPeterAndPaulApostles'],
    ['The Transfiguration of the Lord','TransfigurationOfTheLord'],
    ['The Exaltation of the Holy Cross','ExaltationOfTheHolyCross'],
    ['The Nativity of the Lord (Christmas)','NativityOfTheLord_Christmas'],
    ['Christmas','NativityOfTheLord_Christmas'],
]);

function utcDate(y,m,d) { return new Date(Date.UTC(y,m-1,d)); }
function addDays(date,n) { const d=new Date(date.getTime()); d.setUTCDate(d.getUTCDate()+n); return d; }
function diffDays(a,b) { return Math.round((a.getTime()-b.getTime())/86400000); }
function isoStr(d) { return d.toISOString().slice(0,10); }

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
        adventStart:  firstSundayOfAdvent(year),
        christmas:    utcDate(year,12,25),
        baptism:      baptismOfTheLord(year),
    };
}

function classifySeason(date, anch) {
    if(date<=anch.baptism)      return {season:'Christmas',period:'Christmas'};
    if(date<anch.ashWednesday)  return {season:'Ordinary Time',period:'Ordinary Time'};
    if(date<anch.palmSunday)    return {season:'Lent',period:'Lent'};
    if(date<anch.holyThursday)  return {season:'Lent',period:'Holy Week'};
    if(date<anch.easter)        return {season:'Lent',period:'Paschal Triduum'};
    if(date<=anch.pentecost) {
        const isOctave=diffDays(date,anch.easter)<=7;
        return {season:'Easter',period:isOctave?'Easter Octave':'Easter'};
    }
    if(date<anch.adventStart)   return {season:'Ordinary Time',period:'Ordinary Time'};
    if(date<anch.christmas)     return {season:'Advent',period:'Advent'};
    return {season:'Christmas',period:'Christmas'};
}

function ordinalToNumber(value) {
    const slug=value.trim().replace(/[^A-Za-z0-9]+/g,' ').trim().split(/\s+/)
        .map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join('');
    if(ORDINAL_WORDS[slug]) return ORDINAL_WORDS[slug];
    const m=slug.match(/(\d+)/); if(m) return Number(m[1]);
    return null;
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

function computeWeek(date, seasonInfo, anch) {
    if(seasonInfo.season==='Ordinary Time') return ordinaryTimeWeek(date,anch);
    if(seasonInfo.season==='Advent') return adventWeek(date,anch);
    if(seasonInfo.season==='Lent') {
        if(seasonInfo.period==='Holy Week'||seasonInfo.period==='Paschal Triduum') return null;
        return lentWeek(date,anch);
    }
    if(seasonInfo.season==='Easter') return easterWeek(date,anch);
    return null;
}

function slugify(value) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        .replace(/&/g,'And').replace(/[^A-Za-z0-9]+/g,' ').trim()
        .split(/\s+/).map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join('');
}

function keyForDate(date, anch) {
    const dayName = WEEKDAY_NAMES[date.getUTCDay()];
    const seasonInfo = classifySeason(date, anch);
    const week = computeWeek(date, seasonInfo, anch);
    const m = date.getUTCMonth()+1;
    const d = date.getUTCDate();

    // Advent special dates Dec 17-24 get their own keys
    if(seasonInfo.season==='Advent' && m===12 && d>=17 && d<=24) {
        return `Advent_Dec${d}`;
    }

    // Check major feasts first (for fixed-date feasts)
    // We'll try to identify by context below; for named feasts the scraped
    // celebration text from Universalis will be used

    if(seasonInfo.season==='Ordinary Time' && week!==null) return `OrdinaryTime_Week${week}_${dayName}`;
    if(seasonInfo.season==='Advent' && week!==null) return `Advent_Week${week}_${dayName}`;
    if(seasonInfo.season==='Lent') {
        if(seasonInfo.period==='Holy Week') return `HolyWeek_${dayName}`;
        if(week===0) return `Lent_AshWeek_${dayName}`;
        if(week!==null) return `Lent_Week${week}_${dayName}`;
    }
    if(seasonInfo.season==='Easter') {
        if(seasonInfo.period==='Easter Octave' && dayName!=='Sunday') return `EasterOctave_${dayName}`;
        if(week!==null) return `Easter_Week${week}_${dayName}`;
    }
    if(seasonInfo.season==='Christmas') return `Christmas_${dayName}_${m}${String(d).padStart(2,'0')}`;

    return `${slugify(seasonInfo.season)}_${dayName}`;
}

/** Overrides for specific civil dates that map to named proper feasts */
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

/**
 * Resolves a date string (YYYY-MM-DD) to its full liturgical calendar entry.
 * Works for any date in any year — no pre-generated calendar file needed.
 */
function resolveDateToCalendarEntry(isoDate) {
    const date = new Date(`${isoDate}T12:00:00Z`);
    const year = date.getUTCFullYear();

    // We need both the current and possibly previous year's anchors
    // (Christmas/Baptism of the Lord crosses year boundary)
    const anch = computeAnchors(year);
    // If date is in Advent of the current civil year, the liturgical year is year+1
    // If date is in Christmas of the previous civil year's Advent, use year-1 anchors
    // The rule: if date is before the baptism of current year, it's in prev lit year
    const litYear = liturgicalYearForDate(date);
    // Use anchors for the liturgical year (which may differ from civil year)
    const litAnch = computeAnchors(litYear);
    const seasonInfo = classifySeason(date, litAnch);
    const week = computeWeek(date, seasonInfo, litAnch);
    const dayName = WEEKDAY_NAMES[date.getUTCDay()];
    const m = date.getUTCMonth()+1;
    const d = date.getUTCDate();
    const mmdd = `${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    // Fixed-date solemnity overrides (always trump temporal key)
    const fixedKey = FIXED_DATE_KEY_OVERRIDES[mmdd];
    // Only apply fixed key if the season matches (e.g. Dec 25 IS Christmas)
    // and if it's not overridden by a moveable feast

    // Compute temporal key
    let key;
    if(seasonInfo.season==='Ordinary Time' && week!==null) {
        key = `OrdinaryTime_Week${week}_${dayName}`;
    } else if(seasonInfo.season==='Advent') {
        if(m===12 && d>=17 && d<=24 && dayName!=='Sunday') {
            key = `Advent_Dec${d}`;
        } else if(week!==null) {
            key = `Advent_Week${week}_${dayName}`;
        } else {
            key = `Advent_${dayName}`;
        }
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
        if(diffDays(date,litAnch.easter)===0) {
            key = 'EasterSunday';
        } else if(seasonInfo.period==='Easter Octave' && dayName!=='Sunday') {
            key = `EasterOctave_${dayName}`;
        } else if(week!==null) {
            key = `Easter_Week${week}_${dayName}`;
        } else {
            key = `Easter_${dayName}`;
        }
    } else if(seasonInfo.season==='Christmas') {
        if(m===12 && d===25) key='NativityOfTheLord_Christmas';
        else if(m===12 && d===26) key='SaintStephen';
        else if(m===12 && d===27) key='SaintJohnApostle';
        else if(m===12 && d===28) key='HolyInnocents';
        else if(m===1  && d===1 ) key='Mary_MotherOfGod';
        else if(dayName==='Sunday') {
            // Check if it's Holy Family (first Sunday after Christmas)
            const daysSinceChristmas = diffDays(date, litAnch.christmas);
            if(daysSinceChristmas>0 && daysSinceChristmas<=7) key='HolyFamily';
            else key=`Christmas_${dayName}_W${Math.ceil(diffDays(date,litAnch.christmas)/7)}`;
        } else {
            const daysSince = diffDays(date, litAnch.christmas);
            if(daysSince>0 && daysSince<=7) key=`ChristmasOctave_${dayName}`;
            else key=`Christmas_${dayName}`;
        }
    } else {
        key = slugify(`${seasonInfo.season}_${dayName}`);
    }

    // Apply fixed-date override for proper solemnities when on exactly that date
    // Only override if we didn't already assign a moveable feast key
    if(fixedKey && !['EasterSunday','HolyThursday','GoodFriday','HolySaturday',
                       'PentecostSunday','MostHolyTrinity','MostHolyBodyAndBloodOfChrist'].includes(key)) {
        key = fixedKey;
    }

    return {
        date: isoDate,
        key,
        celebration: key.replace(/_/g,' '),  // Will be overridden with actual Universalis text
        season: seasonInfo.season,
        period: seasonInfo.period,
        day: dayName,
        week,
        liturgicalYear: romanSundayCycle(litYear),
    };
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

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
    // Load existing cycle data (to resume safely)
    let existing = {};
    try {
        existing = JSON.parse(await fs.readFile(OUTPUT_FILE, 'utf8'));
        console.log(`📖 Loaded existing divineOfficeCycle.json — ${Object.keys(existing).filter(k => k !== '__meta').length} keys already stored.`);
    } catch {
        console.log('📄 No existing divineOfficeCycle.json — starting fresh.');
    }

    // Also load pre-generated calendar files to get accurate celebration names
    // (the built-in resolver gives a fallback key; calendar files give proper names)
    const calendarDir = path.join(repoRoot, 'data', 'calendar');
    const mergedCalendar = {};
    try {
        const calFiles = await fs.readdir(calendarDir);
        for (const file of calFiles.filter(f => f.endsWith('.json'))) {
            const data = JSON.parse(await fs.readFile(path.join(calendarDir, file), 'utf8'));
            Object.assign(mergedCalendar, data);
        }
        const calCount = Object.keys(mergedCalendar).filter(k => k !== '__meta').length;
        console.log(`📅 Loaded ${calCount} calendar entries from ${calFiles.filter(f=>f.endsWith('.json')).length} calendar file(s).`);
    } catch {
        console.log('📅 No pre-generated calendar files found — using built-in liturgical key resolver.');
    }

    const dates = [...dateRange(startArg, endArg)];
    console.log(`\n🕊  Scraping ${dates.length} dates: ${startArg} → ${endArg}\n`);

    let scraped = 0;
    let skipped = 0;
    let failed = 0;

    for (const date of dates) {
        // Use pre-generated calendar entry if available, else compute inline
        const preGenEntry = mergedCalendar[date];
        const calEntry = preGenEntry ?? resolveDateToCalendarEntry(date);

        const liturgicalKey = calEntry.key;
        if (!liturgicalKey) {
            console.log(`  ⚪ ${date} — no liturgical key, skipping`);
            skipped++;
            continue;
        }

        if (existing[liturgicalKey]) {
            console.log(`  ⏭  ${date} [${liturgicalKey}] — already scraped, skipping`);
            skipped++;
            continue;
        }

        const celebrationLabel = calEntry.celebration ?? liturgicalKey.replace(/_/g,' ');
        console.log(`\n  📅 ${date} → 🔑 ${liturgicalKey} (${celebrationLabel}) [${calEntry.season}]`);
        const offices = {};

        for (const [internalKey] of Object.entries(HOURS)) {
            process.stdout.write(`     ↳ ${internalKey}... `);
            const result = await scrapeHour(date, internalKey);
            if (result) {
                // Use the actual celebration name scraped from Universalis if better
                if (result.celebration && result.celebration !== 'Ordinary Time') {
                    offices[internalKey] = result;
                } else {
                    offices[internalKey] = { ...result, celebration: celebrationLabel };
                }
                process.stdout.write(`✓\n`);
            } else {
                process.stdout.write(`✗\n`);
                failed++;
            }
            // Respectful delay between requests
            await new Promise(r => setTimeout(r, 600));
        }

        existing[liturgicalKey] = {
            key: liturgicalKey,
            celebration: celebrationLabel,
            season: calEntry.season,
            period: calEntry.period,
            day: calEntry.day,
            week: calEntry.week ?? null,
            liturgicalYear: calEntry.liturgicalYear ?? null,
            scrapedFromDate: date,
            offices,
        };

        scraped++;

        // Write after every date (safe checkpointing)
        const output = {
            __meta: {
                schemaVersion: 2,
                description: 'Divine Office content keyed by liturgical key. Covers the full liturgical cycle — any calendar date resolves to a key here.',
                generatedAt: new Date().toISOString(),
                totalKeys: Object.keys(existing).filter(k => k !== '__meta').length,
            },
            ...existing,
        };

        await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
        console.log(`  ✅ Saved [${liturgicalKey}]`);

        // Slightly longer pause between days
        await new Promise(r => setTimeout(r, 400));
    }

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  ✅ Scraped:  ${scraped} new liturgical keys`);
    console.log(`  ⏭  Skipped:  ${skipped} (already present or no calendar entry)`);
    console.log(`  ✗  Failed:   ${failed} individual office hours`);
    console.log(`  📦 Total keys in file: ${Object.keys(existing).filter(k => k !== '__meta').length}`);
    console.log(`${'─'.repeat(60)}\n`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exitCode = 1;
});
