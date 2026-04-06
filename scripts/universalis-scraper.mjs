import fs from 'fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * A highly precise scraper for Universalis Divine Office.
 * Handles the unique div.v and div.vi structure used by Universalis.
 */
async function scrapeHour(isoDate, hourKey) {
    // Format date string for URL (e.g. 20260404)
    const urlDate = isoDate.replace(/-/g, '');
    const url = `https://universalis.com/${urlDate}/${hourKey}.htm`;

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Remove unwanted UI elements and navigation
    $('#hourlinks, #calendar-heading, .Pages, .Dates, .smallprint').remove();

    const parts = {
        introduction: '',
        hymn: { text: '' },
        psalmody: [],
        reading: { text: '', reference: '' },
        responsory: { text: '' },
        gospelCanticle: { antiphon: '', text: '', heading: '' },
        intercessions: { text: '' },
        lordsPrayer: { text: '' },
        concludingPrayer: { text: '' }
    };

    let currentSection = null;
    let currentPsalm = null;

    const finalizePsalm = () => {
        if (currentPsalm) {
            parts.psalmody.push({ ...currentPsalm });
            currentPsalm = null;
        }
    };

    // The text nodes in Universalis are typically contained in specific classes
    // .v = verse, .vi = indented verse. They also use headers for sections.
    const nodes = $('h3, h4, th, div.v, div.vi, div.rubric, p');

    nodes.each((i, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (!text) return;

        const tag = el.name.toLowerCase();
        const cls = $(el).attr('class') || '';
        const lowerText = text.toLowerCase();

        // 1. Detect Section Headers
        if (tag === 'th' || tag.startsWith('h')) {
            if (lowerText.includes('introduction')) { currentSection = 'introduction'; return; }
            if (lowerText.includes('hymn')) { currentSection = 'hymn'; return; }
            if (lowerText.includes('psalm') || (lowerText.includes('canticle') && !['magnificat', 'benedictus', 'nunc dimittis'].some(m => lowerText.includes(m)))) {
                finalizePsalm();
                currentPsalm = { heading: text, text: '', antiphon: '' };
                currentSection = 'psalmody';
                return;
            }
            if (lowerText.includes('reading')) { currentSection = 'reading'; return; }
            if (lowerText.includes('responsory')) { currentSection = 'responsory'; return; }
            if (lowerText.includes('benedictus') || lowerText.includes('magnificat') || lowerText.includes('nunc dimittis')) {
                currentSection = 'gospelCanticle';
                parts.gospelCanticle.heading = text;
                return;
            }
            if (lowerText.includes('intercessions') || lowerText.includes('prayers')) { currentSection = 'intercessions'; return; }
            if (lowerText.includes('lord\'s prayer')) { currentSection = 'lordsPrayer'; return; }
            if (lowerText.includes('concluding prayer') || lowerText.includes('blessing')) { currentSection = 'concludingPrayer'; return; }
        }

        // 2. Classify text based on current section
        // Note: div.v and div.vi are actual text, div.rubric or i tags are instructions/antiphons
        const isInstruction = cls.includes('rubric') || $(el).find('i').length > 0;

        if (currentSection === 'introduction') {
            parts.introduction += (parts.introduction ? '\n' : '') + text;
        } else if (currentSection === 'hymn') {
            parts.hymn.text += (parts.hymn.text ? '\n' : '') + text;
        } else if (currentSection === 'psalmody' && currentPsalm) {
            if (isInstruction || lowerText.startsWith('antiphon')) {
                const cleaned = text.replace(/^Antiphon [123]:?\s*/i, '');
                if (!currentPsalm.antiphon) currentPsalm.antiphon = cleaned;
                else currentPsalm.antiphon2 = cleaned;
            } else {
                currentPsalm.text += (currentPsalm.text ? '\n' : '') + text;
            }
        } else if (currentSection === 'reading') {
            if (isInstruction && !parts.reading.reference) {
                parts.reading.reference = text;
            } else {
                parts.reading.text += (parts.reading.text ? '\n' : '') + text;
            }
        } else if (currentSection === 'responsory') {
            parts.responsory.text += (parts.responsory.text ? '\n' : '') + text;
        } else if (currentSection === 'gospelCanticle') {
            if (isInstruction || lowerText.startsWith('antiphon')) {
                const cleaned = text.replace(/^Antiphon [123]:?\s*/i, '');
                if (!parts.gospelCanticle.antiphon) parts.gospelCanticle.antiphon = cleaned;
                else parts.gospelCanticle.antiphon2 = cleaned;
            } else {
                parts.gospelCanticle.text += (parts.gospelCanticle.text ? '\n' : '') + text;
            }
        } else if (currentSection === 'intercessions') {
            parts.intercessions.text += (parts.intercessions.text ? '\n' : '') + text;
        } else if (currentSection === 'lordsPrayer') {
            parts.lordsPrayer.text += (parts.lordsPrayer.text ? '\n' : '') + text;
        } else if (currentSection === 'concludingPrayer') {
            parts.concludingPrayer.text += (parts.concludingPrayer.text ? '\n' : '') + text;
        }
    });

    finalizePsalm();

    return {
        date: isoDate,
        office: hourKey,
        celebration: $('#feastname').text().trim() || 'Ordinary Time',
        parts
    };
}

// Scrapes all offices for a given day
async function scrapeDay(isoDate) {
    console.log(`Scraping Universalis for ${isoDate}...`);
    const hours = ['readings', 'lauds', 'terce', 'sext', 'none', 'vespers', 'compline'];
    const payload = { date: isoDate, offices: {} };

    for (const h of hours) {
        try {
            payload.offices[h] = await scrapeHour(isoDate, h);
            await new Promise(r => setTimeout(r, 800)); // Respectful delay
        } catch(e) {
            console.error(`Failed to scrape ${h}:`, e.message);
        }
    }
    let existingData = {};
    try {
        const fileData = await fs.readFile('data/divine-office-dataset.json', 'utf8');
        existingData = JSON.parse(fileData);
    } catch(e) {
        // File doesn't exist or is invalid
    }

    existingData[isoDate] = payload;
    
    await fs.writeFile('data/divine-office-dataset.json', JSON.stringify(existingData, null, 2));
    console.log(`Saved scraped data for ${isoDate} to data/divine-office-dataset.json`);
}

// Example usage
scrapeDay('2026-04-05');
