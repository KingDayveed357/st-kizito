import axios from 'axios';
import * as cheerio from 'cheerio';

async function testFetch() {
    const url = 'https://universalis.com/20260401/lauds.htm';
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);

    // Log all text elements and their classes
    $('*').each((i, el) => {
        const cls = $(el).attr('class');
        const tag = el.tagName;
        const text = $(el).text().trim();
        if (text && (cls || tag === 'h1' || tag === 'h2')) {
            console.log(`[${tag}.${cls}] ${text.substring(0, 50)}...`);
        }
    });
}
testFetch();
