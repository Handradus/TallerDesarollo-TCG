const axios = require('axios');
const cheerio = require('cheerio');

async function debugGameOfMagic() {
  const busqueda = 'pikachu 25 165';
  const url = `https://gameofmagicsingles.cl/search?q=${encodeURIComponent(busqueda)}`;
  
  console.log(`🔍 DEBUG: Buscando en ${url}`);
  
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      }
    });

    const $ = cheerio.load(res.data);
    
    console.log(`📄 Página cargada, buscando enlaces...`);
    
    // Probar diferentes selectores
    const selectores = [
      'a[href^="/products/"]',  // Selector actual
      'a[href*="products"]',    // Cualquier enlace que contenga "products"
      'a.product-link',         // Clase típica de producto
      '.product-item a',        // Enlaces dentro de items de producto
      '.search-results a',      // Enlaces en resultados de búsqueda
      'a'                       // TODOS los enlaces para ver qué hay
    ];

    for (const selector of selectores) {
      const enlaces = $(selector);
      console.log(`\n🔍 Selector "${selector}": ${enlaces.length} enlaces encontrados`);
      
      if (enlaces.length > 0 && enlaces.length <= 10) {
        enlaces.each((i, el) => {
          const href = $(el).attr('href');
          const texto = $(el).text().trim();
          console.log(`   ${i + 1}. href: "${href}" | texto: "${texto.substring(0, 100)}..."`);
        });
      } else if (enlaces.length > 10) {
        console.log(`   Demasiados enlaces, mostrando primeros 5:`);
        enlaces.slice(0, 5).each((i, el) => {
          const href = $(el).attr('href');
          const texto = $(el).text().trim();
          console.log(`   ${i + 1}. href: "${href}" | texto: "${texto.substring(0, 100)}..."`);
        });
      }
    }

    // Buscar específicamente el texto "pikachu-025-165"
    console.log(`\n🎯 Buscando texto que contenga "pikachu" y "165":`);
    const todosLosEnlaces = $('a');
    let encontrados = 0;
    
    todosLosEnlaces.each((i, el) => {
      const href = $(el).attr('href') || '';
      const texto = $(el).text().toLowerCase();
      
      if ((href.includes('pikachu') || texto.includes('pikachu')) && 
          (href.includes('165') || texto.includes('165'))) {
        encontrados++;
        console.log(`   ✅ ${encontrados}. href: "${href}" | texto: "${texto.substring(0, 150)}"`);
      }
    });
    
    if (encontrados === 0) {
      console.log(`   ❌ No se encontraron enlaces relacionados con pikachu y 165`);
    }

    // Verificar si existe la URL específica en la página
    const urlEspecifica = '/products/pikachu-025-165-scarlet-violet-151';
    const contieneUrl = res.data.includes(urlEspecifica);
    console.log(`\n🎯 ¿La página contiene "${urlEspecifica}"? ${contieneUrl}`);
    
    if (!contieneUrl) {
      // Buscar variaciones
      const variaciones = [
        'pikachu-025-165',
        'pikachu-25-165', 
        'products/pikachu',
        '025-165',
        '25-165'
      ];
      
      console.log(`🔍 Buscando variaciones en el HTML:`);
      for (const variacion of variaciones) {
        const contiene = res.data.toLowerCase().includes(variacion.toLowerCase());
        console.log(`   "${variacion}": ${contiene}`);
      }
    }

  } catch (error) {
    console.error(`❌ Error en debug:`, error.message);
  }
}

// Ejecutar el debug
debugGameOfMagic();
