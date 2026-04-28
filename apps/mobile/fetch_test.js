const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://divineoffice.org/?date=20260412', {headers: {'User-Agent': 'Mozilla/5.0'}}).then(res => {
  const $ = cheerio.load(res.data);
  let href = '';
  $('a').each((_, el) => {
    if($(el).text().trim().toLowerCase() === 'office of readings') href = $(el).attr('href');
  });
  console.log(href);
});
