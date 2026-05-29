const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const res = await axios.get('https://artesanime.cl/search?q=pikachu', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html'
      }
    });
    const $ = cheerio.load(res.data);
    
    // Let's find links containing 'pikachu' and print their parent container outer HTML
    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      
      if (href.startsWith('/') && text.includes('Pikachu') && href.includes('pikachu')) {
        console.log('--- Matches Pikachu Product Link ---');
        console.log(`Href: ${href}`);
        console.log(`Text: ${text}`);
        // Let's print parent container
        const parent = $(el).closest('.product-block, .product, .col-sm-4, .product-card, div');
        console.log('Parent classes:', parent.attr('class'));
        console.log('Parent outer HTML (sample):', $.html(parent).slice(0, 300));
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
