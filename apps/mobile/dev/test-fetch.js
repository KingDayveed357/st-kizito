const axios = require('axios');
const cheerio = require('cheerio');
(async () => {
    const html = (await axios.get('https://divineoffice.org/0412-ep/?date=20260412', {headers: {'User-Agent': 'Mozilla/5.0'}})).data;
    const $ = cheerio.load(html);
    $('script, style, noscript, iframe, form, nav, header, footer').remove();
    $('audio, source, .modal, .popup, .sidebar, .widget').remove();
    $('[class*=\"comment\"], [class*=\"discussion\"], [class*=\"prayer-request\"]').remove();
    $('[class*=\"contribute\"], [class*=\"donate\"], [class*=\"blog\"]').remove();
    $('[class*=\"app-container\"], [class*=\"recommended\"], [class*=\"radio\"]').remove();
    const textParts = [];
    $('body').find('p,h1,h2,h3,h4,h5,h6,li,td,th,blockquote,pre').each((_, el) => {
        const t = $(el).text().trim();
        if (t.length > 2) textParts.push(t);
    });
    console.log(textParts.join('\n'));
})();
