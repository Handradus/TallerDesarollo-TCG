const axios = require('axios');
const cheerio = require('cheerio');

function normalizarParaUrl(texto) {
  return texto
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function urlExiste(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html',
      },
      timeout: 3000, // Reducir de 5000 a 3000ms
      maxRedirects: 3, // Reducir de 5 a 3
      validateStatus: () => true
    });

    console.log(`📡 urlExiste respuesta: ${url} → ${res.status}`);
    return [200, 301, 302].includes(res.status);
  } catch (err) {
    console.warn(`⚠️ urlExiste falló con ${url} → ${err.response?.status || err.message}`);
    return false;
  }
}

async function buscarEnTiendaShopify(tienda, carta) {
  const nombreCarta = carta.nombre.toLowerCase();
  const numero = String(carta.numero).padStart(3, '0');
  const total = carta.printedTotal ? String(carta.printedTotal).padStart(3, '0') : "000";
  const numeroFraccion = `${numero}/${total}`;
  const numeroFraccionAlt = `${numero}-${total}`;

  const termino = `${carta.nombre} ${carta.numero}`;
  const urlBusqueda = tienda.urlBusqueda.replace('BUSQUEDA', encodeURIComponent(termino));
  console.log(`🔍 [${tienda.nombre}] URL de búsqueda: ${urlBusqueda}`);

  try {
    const res = await axios.get(urlBusqueda);
    const $ = cheerio.load(res.data);
    const enlaces = $('a[href^="/products/"]');

    console.log(`🔗 [${tienda.nombre}] Enlaces encontrados: ${enlaces.length}`);

    for (let i = 0; i < enlaces.length; i++) {
      const link = $(enlaces[i]);
      const texto = link.text().toLowerCase();
      const href = link.attr('href');
      const urlCompleta = `${tienda.urlBase}${href}`;

      const incluyeNombre = texto.includes(nombreCarta);
      const incluyeFraccion =
        texto.includes(numero.toLowerCase()) ||
        texto.includes(numeroFraccion.toLowerCase()) ||
        texto.includes(numeroFraccionAlt.toLowerCase());

      console.log(`🔍 Comparando:\n   ↪ texto = "${texto}"\n   ↪ nombreCarta = "${nombreCarta}"\n   ↪ incluyeNombre = ${incluyeNombre}\n   ↪ incluyeFraccion = ${incluyeFraccion}`);

      if (incluyeNombre && incluyeFraccion) {
        const existe = await urlExiste(urlCompleta);
        console.log(`🔗 Verificando existencia: ${urlCompleta} → ${existe}`);
        if (href && existe) {
          // Scrapear el precio de la página del producto
          const precio = await scrapearPrecioShopify(urlCompleta, tienda.nombre);
          return { 
            url: urlCompleta, 
            verificada: true,
            precio: precio
          };
        }
      }
    }

    console.log(`⛔ [${tienda.nombre}] No coincidencia exacta encontrada`);
  } catch (error) {
    console.log(`❌ [${tienda.nombre}] Error en búsqueda: ${error.message}`);
  }

  return null;
}

async function buscarEnTiendaLevelUp(tienda, carta) {
  const termino = `${carta.nombre} ${carta.numero}`;
  const urlBusqueda = tienda.urlBusqueda.replace('BUSQUEDA', encodeURIComponent(termino));

  try {
    const res = await axios.get(urlBusqueda, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      }
    });

    const $ = cheerio.load(res.data);
    const enlaces = $('a.woocommerce-LoopProduct-link');

    const nombreNormalizado = normalizarParaUrl(carta.nombre);
    const numeroCartaRaw = String(carta.numero).toLowerCase(); // como "swsh020"
    const regexNumero = new RegExp(`${numeroCartaRaw}`, 'i');

    console.log(`🔗 [${tienda.nombre}] Enlaces encontrados: ${enlaces.length}`);

    for (let i = 0; i < enlaces.length; i++) {
      const link = $(enlaces[i]);
      const href = link.attr('href') || "";
      const textoHref = href.toLowerCase();
      const urlCompleta = href.startsWith("http") ? href : `${tienda.urlBase}${href}`;

      const nombreCoincide = textoHref.includes(nombreNormalizado);
      const numeroCoincide = regexNumero.test(textoHref);

      console.log(`🔍 Comparando:\n   ↪ href = "${textoHref}"\n   ↪ nombreNormalizado = "${nombreNormalizado}"\n   ↪ numeroRegex = ${regexNumero}\n   ↪ nombreCoincide = ${nombreCoincide}\n   ↪ numeroCoincide = ${numeroCoincide}`);

      if (nombreCoincide && numeroCoincide) {
        const existe = await urlExiste(urlCompleta);
        console.log(`🔗 Verificando existencia: ${urlCompleta} → ${existe}`);
        if (existe) {
          // Verificamos si el producto está agotado (solo log informativo)
          try {
            const detalle = await axios.get(urlCompleta, {
              headers: {
                'User-Agent': 'Mozilla/5.0'
              }
            });
            const $detalle = cheerio.load(detalle.data);
            const textoDetalle = $detalle('body').text().toLowerCase();

            if (textoDetalle.includes('agotado') || textoDetalle.includes('sin stock') || textoDetalle.includes('no disponible')) {
              console.log(`⚠️ Producto encontrado pero agotado: ${urlCompleta}`);
            }
          } catch (errorDetalle) {
            console.warn(`⚠️ No se pudo verificar si está agotado: ${urlCompleta} → ${errorDetalle.message}`);
          }

          console.log(`✅ Coincidencia encontrada: ${urlCompleta}`);
          
          // Scrapear el precio de la página del producto
          const precio = await scrapearPrecioLevelUp(urlCompleta);
          return { 
            url: urlCompleta, 
            verificada: true,
            precio: precio
          };
        }
      }
    }

    console.log(`⛔ No se encontró coincidencia exacta en ${tienda.nombre}`);
  } catch (error) {
    console.error(`❌ Error buscando en tienda ${tienda.nombre}:`, error.message);
  }

  return null;
}

// Función para scrapear precios en tiendas Shopify (optimizada)
async function scrapearPrecioShopify(url, nombreTienda) {
  try {
    console.log(`💰 Scrapeando precio Shopify en: ${url}`);
    
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      },
      timeout: 4000 // Timeout agresivo para velocidad
    });

    const $ = cheerio.load(res.data);
    
    // Selectores más específicos y ordenados por probabilidad
    const selectoresPrecio = [
      '.price .money',
      '.product-price .money', 
      '.price-current .money',
      '.product__price .money',
      '.money',
      '.price',
      '.product-price'
    ];

    for (const selector of selectoresPrecio) {
      const elementoPrecio = $(selector).first();
      if (elementoPrecio.length > 0) {
        let textoPrecio = elementoPrecio.text().trim();
        const precioLimpio = limpiarPrecio(textoPrecio);
        
        if (precioLimpio) {
          console.log(`💰 Precio encontrado en ${nombreTienda}: ${precioLimpio}`);
          return precioLimpio;
        }
      }
    }

    console.log(`⚠️ No se pudo encontrar precio en ${nombreTienda}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error scrapeando precio Shopify en ${nombreTienda}:`, error.message);
    return null;
  }
}

// Función para scrapear precios en LevelUp (optimizada)
async function scrapearPrecioLevelUp(url) {
  try {
    console.log(`💰 Scrapeando precio LevelUp en: ${url}`);
    
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      },
      timeout: 4000 // Timeout agresivo para velocidad
    });

    const $ = cheerio.load(res.data);
    
    // Selectores más específicos para LevelUp
    const selectoresPrecio = [
      '.woocommerce-Price-amount',
      '.price .woocommerce-Price-amount',
      'ins .woocommerce-Price-amount', // precio con descuento
      '.price',
      '.amount'
    ];

    for (const selector of selectoresPrecio) {
      const elementoPrecio = $(selector).first();
      if (elementoPrecio.length > 0) {
        let textoPrecio = elementoPrecio.text().trim();
        const precioLimpio = limpiarPrecio(textoPrecio);
        
        if (precioLimpio) {
          console.log(`💰 Precio encontrado en LevelUp: ${precioLimpio}`);
          return precioLimpio;
        }
      }
    }

    console.log(`⚠️ No se pudo encontrar precio en LevelUp`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error scrapeando precio LevelUp:`, error.message);
    return null;
  }
}

// Función auxiliar para limpiar precios (optimizada)
function limpiarPrecio(textoPrecio) {
  if (!textoPrecio) return null;
  
  // Buscar patrones de precio más específicos
  const patronesPrecio = [
    /\$\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/,  // $1,234.56
    /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*\$/,  // 1,234.56$
    /(\d+(?:[.,]\d{1,2})?)/,                       // 1234.56
  ];

  for (const patron of patronesPrecio) {
    const match = textoPrecio.match(patron);
    if (match) {
      return `$${match[1]}`;
    }
  }
  
  return null;
}


module.exports = {
  buscarEnTiendaShopify,
  buscarEnTiendaLevelUp,
  scrapearPrecioShopify,
  scrapearPrecioLevelUp,
  limpiarPrecio
};
