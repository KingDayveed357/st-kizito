const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://divineoffice.org/easter-w02-sun-or/?date=20260412', {headers: {'User-Agent': 'Mozilla/5.0'}}).then(res => {
  const $ = cheerio.load(res.data);
  let text = '';
  // divineoffice.org usually puts its text inside .entry-content or similar, let's grab words.
  // Actually, I can use the logic from scrape-divineoffice-org.mjs extractPrayerContent
  
    $('script, style, noscript, iframe, form, nav, header, footer').remove();
    $('audio, source, .modal, .popup, .sidebar, .widget').remove();
    $('[class*="comment"], [class*="discussion"], [class*="prayer-request"]').remove();
    $('[class*="contribute"], [class*="donate"], [class*="blog"]').remove();
    $('[class*="app-container"], [class*="recommended"], [class*="radio"]').remove();

    const blockTags = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'td', 'th', 'blockquote', 'pre']);
    const textParts = [];
    const seen = new Set(); 

    $('body').find('*').each((_, el) => {
        const tag = el.name?.toLowerCase();
        if (!tag || !blockTags.has(tag)) return;
        
        const $el = $(el);
        const t = $el.text().trim();
        if (!t || t.length < 2) return;
        
        if (seen.has(t)) return;

        if (/^(Join Free|Log in|Today|Community|Blog|About|Go to Prayers|Support us|Donate|Share|More|Login|Register|Sign In)$/i.test(t)) return;
        if (/prayer light/i.test(t) && t.length < 50) return;
        if (/^(Accept and Continue|Not Now)/i.test(t)) return;
        
        seen.add(t);
        textParts.push(t);
    });

  const fs = require('fs');
  fs.writeFileSync('office_test.txt', textParts.join('\n'));
});
