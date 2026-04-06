import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, '../data');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getLocalDateStr(d) {
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const yy = String(d.getUTCFullYear()).slice(-2);
    return `${mm}${dd}${yy}`;
}

function processHtmlText(html) {
    if (!html) return null;
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00a0/g, ' ')
        .replace(/\n\s+\n/g, '\n\n')
        .replace(/^\s+|\s+$/g, '')
        .trim();
}

function extractReadingsFromDom($) {
    const readingsList = [];

    $('.b-verse').each((i, el) => {
        const nameBlock = $(el).find('.name');
        const addressBlock = $(el).find('.address');

        const label = nameBlock.text().trim();
        const reference = addressBlock.find('a').text().trim() || addressBlock.text().trim();

        // Clone to remove name and address before converting to HTML!
        const clone = $(el).clone();
        clone.find('.name').remove();
        clone.find('.address').remove();
        const text = processHtmlText(clone.html() || '');

        if (label || reference || text) {
            let type = 'reading';
            const lowerLabel = label.toLowerCase();
            if (lowerLabel.includes('first') || lowerLabel === 'reading i') type = 'first_reading';
            else if (lowerLabel.includes('second') || lowerLabel === 'reading ii') type = 'second_reading';
            else if (lowerLabel.includes('psalm')) type = 'psalm';
            else if (lowerLabel.includes('gospel') && !lowerLabel.includes('acclamation')) type = 'gospel';
            else if (lowerLabel.includes('verse') || lowerLabel.includes('acclamation') || lowerLabel.includes('alleluia')) type = 'gospel_acclamation';

            readingsList.push({ label, type, reference, text });
        }
    });

    return readingsList;
}

async function scrapeDate(date) {
    const dateStr = getLocalDateStr(date);
    const url = `https://bible.usccb.org/bible/readings/${dateStr}.cfm`;
    console.log(`Fetching: ${url}`);

    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const $ = cheerio.load(data);
        const dailyRecord = {
            date: date.toISOString().split('T')[0],
            url: url
        };

        const readingsList = extractReadingsFromDom($);

        if (readingsList.length > 0) {
            dailyRecord.readingsList = readingsList;
        } else {
            // Check for disambiguation links (Multiple Masses)
            const links = new Set();
            $('a').each((i, el) => {
                const href = $(el).attr('href');
                if (href && href.includes(`${dateStr}-`)) {
                    if (href.startsWith('http')) links.add(href);
                    else links.add(`https://bible.usccb.org${href}`);
                }
            });

            if (links.size > 0) {
                console.log(`  Found ${links.size} disambiguation masses for ${dateStr}. Fetching them...`);
                dailyRecord.masses = [];
                for (const link of links) {
                    try {
                        const mRes = await axios.get(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                        const m$ = cheerio.load(mRes.data);
                        const mReadings = extractReadingsFromDom(m$);

                        const suffixMatch = link.match(/-([a-zA-Z0-9]+)\.cfm/);
                        let massTitle = suffixMatch ? suffixMatch[1] : 'Mass';
                        massTitle = massTitle.charAt(0).toUpperCase() + massTitle.slice(1);
                        if (!massTitle.toLowerCase().includes('mass')) massTitle += ' Mass';

                        if (mReadings.length > 0) {
                            dailyRecord.masses.push({
                                title: massTitle,
                                url: link,
                                readingsList: mReadings
                            });
                        }
                    } catch (me) {
                        console.error(`  Failed to fetch mass link: ${link}`);
                    }
                    await delay(1000);
                }
            } else {
                dailyRecord.readingsList = [];
            }
        }

        return dailyRecord;
    } catch (e) {
        if (e.response?.status === 404) {
            console.log(`No reading found for ${dateStr} (404)`);
        } else {
            console.error(`Error fetching ${dateStr}:`, e.message);
        }
        return null;
    }
}

async function scrapeRange(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    const outPath = path.join(outputDir, 'usccb-readings-dataset.json');
    let results = {};
    if (await fs.stat(outPath).catch(() => null)) {
        try {
            results = JSON.parse(await fs.readFile(outPath, 'utf8'));
            console.log(`Loaded ${Object.keys(results).length} existing records from ${outPath}`);
        } catch (e) {
            console.log("Error loading existing dataset, creating new.");
        }
    }

    let current = new Date(start);
    while (current <= end) {
        const isoDate = current.toISOString().split('T')[0];

        const existing = results[isoDate];
        const mmdd = isoDate.slice(5, 10);
        const isBigFeast = ['12-24', '12-25', '06-24', '06-29', '08-15', '11-01'].includes(mmdd);

        const isLegacy = existing && (
            (existing.readings && !existing.readingsList) ||
            (existing.masses && existing.masses.some(m => !m.readingsList))
        );
        const isEmpty = existing && (!existing.readingsList || existing.readingsList.length === 0) && (!existing.masses || existing.masses.length === 0);

        if (!existing || isLegacy || isEmpty || isBigFeast) {
            const record = await scrapeDate(current);
            if (record) {
                results[isoDate] = record;
                await fs.writeFile(outPath, JSON.stringify(results, null, 2), 'utf8');
            }
            await delay(1200);
        } else {
            console.log(`Skipping ${isoDate}, already valid.`);
        }
        current.setUTCDate(current.getUTCDate() + 1);
    }

    console.log(`\nSuccess! Completed scraping range. Data safely stored at: ${outPath}`);
}

console.log("Starting Full 3-Year Lectionary Scrape (Years A, B, C)...");
// We scrape all of 2025, 2026, and 2027 to capture full cycles A, B, and C
scrapeRange('2025-01-01T00:00:00Z', '2027-12-31T00:00:00Z').catch(console.error);
