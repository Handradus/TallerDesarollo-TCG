const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    // Search for general cartas to find one that is IN STOCK
    const res = await axios.get('https://artesanime.cl/search?q=carta', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html'
      }
    });
    const $ = cheerio.load(res.data);
    
    const links = $('h4 a, .product-block a, .product a');
    console.log(`Found ${links.length} total product links on search page.`);
    
    // Let's inspect the first 10 products
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      const href = $(links[i]).attr('href') || '';
      if (!href.startsWith('/') || href.includes('/search') || href.includes('/contact')) continue;
      
      const urlCompleta = `https://artesanime.cl${href}`;
      console.log(`\n-----------------------------------------`);
      console.log(`Checking product ${i}: ${urlCompleta}`);
      
      const resProd = await axios.get(urlCompleta, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const $prod = cheerio.load(resProd.data);
      const title = $prod('title').text().trim();
      
      // Let's print form buttons or status
      const btn = $prod('input[type="submit"], button[type="submit"], #button-cart, .adc, .add-to-cart');
      console.log(`Title: "${title}"`);
      console.log(`Submit Buttons Found: ${btn.length}`);
      btn.each((idx, el) => {
        console.log(`  Button ${idx}: name="${$(el).attr('name')}" id="${$(el).attr('id')}" value="${$(el).attr('value')}" text="${$(el).text().trim()}" disabled="${$(el).attr('disabled')}" class="${$(el).attr('class')}"`);
      });
      
      // Let's print out-of-stock specific indicators
      const outOfStockEl = $prod('.out-of-stock, .agotado, .stock-status, .not-available');
      console.log(`  Out of Stock elements: ${outOfStockEl.length} (classes: ${outOfStockEl.map((idx, el) => $(el).attr('class')).get().join(', ')})`);
      
      // Check if button text contains "Agotado" or "Sin stock" or has disabled attribute
      let buttonSaysAgotado = false;
      btn.each((idx, el) => {
        const text = $(el).text().toLowerCase() || $(el).attr('value')?.toLowerCase() || '';
        if (text.includes('agotado') || text.includes('sin stock') || text.includes('sold out')) {
          buttonSaysAgotado = true;
        }
      });
      console.log(`  Button says out of stock: ${buttonSaysAgotado}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
