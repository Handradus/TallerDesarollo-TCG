const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const res = await axios.get('https://artesanime.cl/049-195-pikachu', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html'
      }
    });
    const $ = cheerio.load(res.data);
    
    console.log('Title:', $('title').text());
    
    // Search for price elements in Jumpseller
    const priceElements = $('.product-price, .price, .current-price, [class*="price"], [id*="price"]');
    priceElements.each((i, el) => {
      console.log(`Price Element ${i} (${$(el).attr('class')}): "${$(el).text().trim()}"`);
    });
    
    // Check stock status
    const htmlText = $.html().toLowerCase();
    const isOutOfStock = htmlText.includes('agotado') || htmlText.includes('sin stock') || htmlText.includes('out of stock');
    console.log('Is out of stock (simple text check):', isOutOfStock);
    
  } catch (error) {
    console.error('Error fetching product:', error.message);
  }
}

test();
