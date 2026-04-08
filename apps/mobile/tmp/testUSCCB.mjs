import axios from 'axios';
import * as cheerio from 'cheerio';

async function testFetch() {
    const url = 'https://bible.usccb.org/bible/readings/040226-chrism.cfm';
    const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(data);

    console.log("Count of .b-verse:", $('.b-verse').length);
    $('.b-verse').each((i, el) => {
        console.log(`Reading ${i} Label:`, $(el).find('.name').text().trim());
    });
}
testFetch();
