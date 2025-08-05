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

// Función auxiliar para analizar coincidencias de carta en URLs y texto
function analizarCoincidenciasCarta(carta, href, textoElemento, tienda) {
  const nombreCarta = carta.nombre.toLowerCase();
  const numero = String(carta.numero).padStart(3, '0');
  const numeroSinCeros = String(carta.numero);
  const nombreNormalizado = carta.nombre.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Análisis del texto visible del enlace
  const incluyeNombreTexto = textoElemento.includes(nombreCarta);
  const incluyeNumeroTexto = textoElemento.includes(numeroSinCeros) || textoElemento.includes(numero);

  // Análisis de la URL del producto
  const hrefLower = href.toLowerCase();
  const incluyeNombreUrl = hrefLower.includes(nombreNormalizado);
  const incluyeNumeroUrl = hrefLower.includes(numeroSinCeros) || hrefLower.includes(numero);
  
  // Verificar el set en la URL si está disponible
  let incluyeSetUrl = true;
  if (carta.set) {
    const setNormalizado = carta.set.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '-'); // Reemplazar espacios con guiones
    incluyeSetUrl = hrefLower.includes(setNormalizado);
  }

  const coincideTexto = incluyeNombreTexto && incluyeNumeroTexto;
  const coincideUrl = incluyeNombreUrl && incluyeNumeroUrl && incluyeSetUrl;

  return {
    coincideTexto,
    coincideUrl,
    coincideAlguno: coincideTexto || coincideUrl,
    detalles: {
      nombreCarta,
      nombreNormalizado,
      numero,
      numeroSinCeros,
      incluyeNombreTexto,
      incluyeNumeroTexto,
      incluyeNombreUrl,
      incluyeNumeroUrl,
      incluyeSetUrl
    }
  };
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

      
      const analisis = analizarCoincidenciasCarta(carta, href, texto, tienda);

      console.log(`🔍 Comparando [${tienda.nombre}]:\n   ↪ texto = "${texto}"\n   ↪ href = "${href}"\n   ↪ coincideTexto = ${analisis.coincideTexto}\n   ↪ coincideUrl = ${analisis.coincideUrl}`);

      if (analisis.coincideAlguno) {
        const existe = await urlExiste(urlCompleta);
        console.log(`🔗 Verificando existencia: ${urlCompleta} → ${existe}`);
        if (href && existe) {
          
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

    console.log(`🔗 [${tienda.nombre}] Enlaces encontrados: ${enlaces.length}`);

    for (let i = 0; i < enlaces.length; i++) {
      const link = $(enlaces[i]);
      const href = link.attr('href') || "";
      const textoElemento = link.text().toLowerCase();
      const urlCompleta = href.startsWith("http") ? href : `${tienda.urlBase}${href}`;

      
      const analisis = analizarCoincidenciasCarta(carta, href, textoElemento, tienda);

      console.log(`🔍 Comparando [${tienda.nombre}]:\n   ↪ texto = "${textoElemento}"\n   ↪ href = "${href}"\n   ↪ coincideTexto = ${analisis.coincideTexto}\n   ↪ coincideUrl = ${analisis.coincideUrl}`);

      if (analisis.coincideAlguno) {
        const existe = await urlExiste(urlCompleta);
        console.log(`🔗 Verificando existencia: ${urlCompleta} → ${existe}`);
        if (existe) {
          
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


async function scrapearPrecioShopify(url, nombreTienda) {
  try {
    console.log(`💰 Scrapeando precio Shopify en: ${url}`);
    
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      },
      timeout: 4000 
    });

    const $ = cheerio.load(res.data);
    
    
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


async function scrapearPrecioLevelUp(url) {
  try {
    console.log(`💰 Scrapeando precio LevelUp en: ${url}`);
    
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      },
      timeout: 4000 
    });

    const $ = cheerio.load(res.data);
    
    
    const selectoresPrecio = [
      '.woocommerce-Price-amount',
      '.price .woocommerce-Price-amount',
      'ins .woocommerce-Price-amount', 
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


function limpiarPrecio(textoPrecio) {
  if (!textoPrecio) return null;
  
 
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
