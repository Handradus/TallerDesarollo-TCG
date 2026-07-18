const axios = require('axios');
const cheerio = require('cheerio');
const { HttpsProxyAgent } = require('https-proxy-agent');

const DATAIMPULSE_PROXY_ENABLED = String(process.env.DATAIMPULSE_PROXY_ENABLED || 'false').toLowerCase() === 'true';
const DATAIMPULSE_HOST = process.env.DATAIMPULSE_HOST || '';
const DATAIMPULSE_PORT = Number(process.env.DATAIMPULSE_PORT || 0);
const DATAIMPULSE_USERNAME = process.env.DATAIMPULSE_USERNAME || '';
const DATAIMPULSE_PASSWORD = process.env.DATAIMPULSE_PASSWORD || '';
const DATAIMPULSE_PROXY_PROTOCOL = (process.env.DATAIMPULSE_PROXY_PROTOCOL || 'http').toLowerCase();
const SCRAPING_HTTP_TIMEOUT_MS = Number(process.env.SCRAPING_HTTP_TIMEOUT_MS || 7000);
const SCRAPING_HTTP_MAX_REDIRECTS = Math.max(1, Number(process.env.SCRAPING_HTTP_MAX_REDIRECTS || 8));
const SCRAPING_PROXY_REDIRECT_FALLBACK = String(process.env.SCRAPING_PROXY_REDIRECT_FALLBACK || 'true').toLowerCase() === 'true';
const SCRAPING_PROXY_HTTP_FALLBACK = String(process.env.SCRAPING_PROXY_HTTP_FALLBACK || 'true').toLowerCase() === 'true';
const SCRAPING_MAX_SEARCH_TERMS = Math.max(1, Number(process.env.SCRAPING_MAX_SEARCH_TERMS || 4));
const SCRAPING_SHOPIFY_LIMIT = Math.max(1, Number(process.env.SCRAPING_SHOPIFY_LIMIT || 8));
const SCRAPING_LEVELUP_LIMIT = Math.max(1, Number(process.env.SCRAPING_LEVELUP_LIMIT || 10));

function getProxyTransport() {
  if (!DATAIMPULSE_PROXY_ENABLED || !DATAIMPULSE_HOST || !DATAIMPULSE_PORT) {
    return undefined;
  }

  const user = encodeURIComponent(DATAIMPULSE_USERNAME || '');
  const pass = encodeURIComponent(DATAIMPULSE_PASSWORD || '');
  const auth = user || pass ? `${user}:${pass}@` : '';
  const proxyUrl = `${DATAIMPULSE_PROXY_PROTOCOL}://${auth}${DATAIMPULSE_HOST}:${DATAIMPULSE_PORT}`;
  const proxyAgent = new HttpsProxyAgent(proxyUrl);

  return {
    proxy: false,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  };
}

async function httpGet(url, config = {}) {
  const defaultTransport = getProxyTransport();

  const doRequest = async (usarProxy) => {
    const mergedConfig = {
      timeout: SCRAPING_HTTP_TIMEOUT_MS,
      maxRedirects: SCRAPING_HTTP_MAX_REDIRECTS,
      decompress: true,
      ...config,
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        ...(config.headers || {}),
      },
    };

    if (usarProxy && defaultTransport && !config.httpAgent && !config.httpsAgent && typeof config.proxy === 'undefined') {
      console.log(`📡 [Proxy] Conectando a través de DataImpulse a: ${url}`);
      Object.assign(mergedConfig, defaultTransport);
    } else if (!usarProxy) {
      console.log(`🌐 [Direct IP] Conectando sin proxy a: ${url}`);
      mergedConfig.proxy = false;
    }

    return axios.get(url, mergedConfig);
  };

  try {
    return await doRequest(true);
  } catch (error) {
    const esLoopRedirect = error?.code === 'ERR_FR_TOO_MANY_REDIRECTS' ||
      String(error?.message || '').toLowerCase().includes('redirect');
    const status = Number(error?.response?.status || 0);
    const esErrorHttpProxyProbable = [400, 401, 403, 407, 429, 502, 503, 504].includes(status);
    const puedeFallbackSinProxy = defaultTransport && typeof config.proxy === 'undefined';

    if (SCRAPING_PROXY_REDIRECT_FALLBACK && puedeFallbackSinProxy && esLoopRedirect) {
      console.warn(`⚠️ Redirect loop con proxy para ${url}. Reintentando sin proxy...`);
      return doRequest(false);
    }

    if (SCRAPING_PROXY_HTTP_FALLBACK && puedeFallbackSinProxy && esErrorHttpProxyProbable) {
      console.warn(`⚠️ HTTP ${status} con proxy para ${url}. Reintentando sin proxy...`);
      return doRequest(false);
    }

    throw error;
  }
}

function normalizarParaUrl(texto) {
  return texto
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function removerAcentos(str = "") {
  return String(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Función auxiliar para analizar coincidencias de carta en URLs y texto
function analizarCoincidenciasCarta(carta, href, textoElemento, tienda) {
  const nombreCarta = carta.nombre.toLowerCase();
  
  // NÚMEROS ESTRICTOS: número de carta y total del set
  const numeroCarta = String(carta.numero);
  const totalSet = carta.printedTotal ? String(carta.printedTotal) : null;
  const numeroFormateado = numeroCarta.padStart(3, '0'); // Para comparaciones con formato 001, 025, etc.
  
  console.log(`🔍 [${tienda.nombre}] Analizando carta: "${carta.nombre}"`);
  console.log(`   🔢 Número carta: "${numeroCarta}" (formateado: "${numeroFormateado}")`);
  console.log(`   📊 Total set: ${totalSet ? `"${totalSet}"` : 'N/A'}`);

  // Múltiples variaciones del nombre para mayor flexibilidad
  const nombreSinAcentos = removerAcentos(carta.nombre.toLowerCase());
  const nombreNormalizado = nombreSinAcentos.replace(/[^a-z0-9]/g, '');
  const nombreConGuiones = nombreSinAcentos.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
  const nombreSinApostrofes = nombreSinAcentos.replace(/'/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
  
  // Análisis del texto visible del enlace (más estricto con número)
  const textoLower = removerAcentos(textoElemento.toLowerCase());
  const incluyeNombreTexto = textoLower.includes(nombreSinAcentos) || 
                             textoLower.includes(nombreSinAcentos.replace(/'/g, ''));
  
  // NÚMERO ESTRICTO: buscar patrones con MÚLTIPLES SEPARADORES
  let incluyeNumeroTexto = false;
  
  if (totalSet) {
    // Buscar patrones con diferentes separadores: /, -, _, espacio
    const separadores = ['/', '-', '_', ' '];
    const patronesCompletos = [];
    const totalSetFormateado = totalSet.padStart(3, '0'); // 94 → 094
    
    separadores.forEach(sep => {
      patronesCompletos.push(
        `${numeroCarta}${sep}${totalSet}`,
        `${numeroFormateado}${sep}${totalSet}`,
        `${numeroCarta}${sep}${totalSetFormateado}`,        // con cero: 109/094
        `${numeroFormateado}${sep}${totalSetFormateado}`   // con cero: 109/094
      );
    });
    
    incluyeNumeroTexto = patronesCompletos.some(patron => textoElemento.includes(patron));
    
    console.log(`   🔍 Buscando patrones (${patronesCompletos.length}): ${patronesCompletos.slice(0, 4).join(', ')}...`);
  } else {
    // Si no hay total del set, buscar solo el número
    incluyeNumeroTexto = textoElemento.includes(numeroCarta) || 
                        textoElemento.includes(numeroFormateado);
    
    console.log(`   🔍 Buscando números: "${numeroCarta}", "${numeroFormateado}"`);
  }
  
  console.log(`   📊 Texto: "${textoElemento}"`);
  console.log(`   ✅ Incluye nombre: ${incluyeNombreTexto}`);
  console.log(`   ✅ Incluye número: ${incluyeNumeroTexto}`);

  // Análisis de la URL del producto (más variaciones pero estricto con número)
  const hrefLower = removerAcentos(href.toLowerCase());
  const incluyeNombreUrl = hrefLower.includes(nombreNormalizado) || 
                           hrefLower.includes(nombreConGuiones) ||
                           hrefLower.includes(nombreSinApostrofes);
  
  // NÚMERO ESTRICTO EN URL: buscar patrones completos con múltiples separadores
  let incluyeNumeroUrl = false;
  
  if (totalSet) {
    // Las URLs pueden usar diferentes separadores
    const separadoresUrl = ['-', '_', '/', '%2F']; // %2F es / codificado en URL
    const patronesUrl = [];
    
    separadoresUrl.forEach(sep => {
      patronesUrl.push(
        `${numeroCarta}${sep}${totalSet}`,
        `${numeroFormateado}${sep}${totalSet}`
      );
    });
    
    incluyeNumeroUrl = patronesUrl.some(patron => hrefLower.includes(patron));
    
    console.log(`   🔗 Buscando en URL (${patronesUrl.length}): ${patronesUrl.slice(0, 4).join(', ')}...`);
  } else {
    // Si no hay total del set, buscar solo el número
    incluyeNumeroUrl = hrefLower.includes(numeroCarta) || 
                      hrefLower.includes(numeroFormateado);
    
    console.log(`   🔗 Buscando en URL: "${numeroCarta}", "${numeroFormateado}"`);
  }
  
  console.log(`   🔗 URL: "${href}"`);
  console.log(`   ✅ URL incluye nombre: ${incluyeNombreUrl}`);
  console.log(`   ✅ URL incluye número: ${incluyeNumeroUrl}`);
  
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
      nombreConGuiones,
      nombreSinApostrofes,
      numeroCarta,
      totalSet,
      numeroFormateado,
      incluyeNombreTexto,
      incluyeNumeroTexto,
      incluyeNombreUrl,
      incluyeNumeroUrl,
      incluyeSetUrl
    }
  };
}

function extraerJSONLD($, tienda, carta) {
  let resultado = null;
  try {
    const jsonScripts = $('script[type="application/ld+json"]');
    jsonScripts.each((i, el) => {
      if (resultado) return false;
      try {
        const jsonText = $(el).html();
        if (jsonText) {
          const data = JSON.parse(jsonText);
          const items = Array.isArray(data) ? data : (data['@graph'] || (data.itemListElement ? data.itemListElement.map(item => item.item) : [data]));
          
          for (const item of items) {
            if (!item) continue;
            if (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))) {
              const nombreProducto = item.name || '';
              const urlProducto = item.url || item['@id'] || '';
              if (!nombreProducto) continue;

              const analisis = analizarCoincidenciasCarta(carta, urlProducto, nombreProducto, tienda);
              if (analisis.coincideAlguno) {
                let precio = null;
                let disponible = false;
                if (item.offers) {
                  const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
                  for (const offer of offers) {
                    if (offer.price) {
                      precio = Math.round(Number(offer.price)).toString();
                      disponible = offer.availability && (offer.availability.includes('InStock') || offer.availability === 'http://schema.org/InStock');
                      break;
                    }
                  }
                }
                
                console.log(`✅ [${tienda.nombre}] JSON-LD ENCONTRADO: "${nombreProducto}" | $${precio} | disponible: ${disponible}`);
                resultado = {
                  url: urlProducto,
                  verificada: true,
                  tipoProducto: 'json-ld',
                  precio,
                  disponible
                };
                return false; // break .each loop
              }
            }
          }
        }
      } catch (e) {
        // Ignorar error de parseo en un script particular
      }
    });
  } catch (e) {
    console.warn(`⚠️ [${tienda.nombre}] Error analizando JSON-LD: ${e.message}`);
  }
  return resultado;
}

async function buscarEnTiendaShopify(tienda, carta) {
  // Usar la API JSON nativa de Shopify: más confiable que parsear HTML
  const urlBase = tienda.urlBase;
  const numeroCarta = String(carta.numero);
  const numeroFormateado = numeroCarta.padStart(3, '0');
  const totalSet = carta.printedTotal ? String(carta.printedTotal) : null;
  const totalSetPad = totalSet ? totalSet.padStart(3, '0') : null;
  const terminosBusqueda = [carta.nombre];

  if (totalSet) {
    terminosBusqueda.push(
      `${numeroCarta}/${totalSet}`,
      `${numeroFormateado}/${totalSet}`,
      `${numeroCarta}-${totalSet}`,
      `${numeroFormateado}-${totalSet}`,
      `${numeroCarta}/${totalSetPad}`,
      `${numeroFormateado}/${totalSetPad}`
    );
  } else {
    terminosBusqueda.push(numeroCarta, numeroFormateado);
  }

  const terminosBusquedaUnicos = [...new Set(terminosBusqueda)].slice(0, SCRAPING_MAX_SEARCH_TERMS);

  console.log(`🛒 [${tienda.nombre}] Shopify JSON API - términos: ${terminosBusquedaUnicos.join(' | ')}`);

  try {
    const productosMap = new Map();

    for (const termino of terminosBusquedaUnicos) {
      const apiUrl = `${urlBase}/search/suggest.json?q=${encodeURIComponent(termino)}&resources[type]=product&resources[limit]=${SCRAPING_SHOPIFY_LIMIT}`;
      console.log(`🛒 [${tienda.nombre}] Shopify JSON API: ${apiUrl}`);

      const res = await httpGet(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
      });

      const productos = res.data?.resources?.results?.products || [];
      console.log(`📦 [${tienda.nombre}] Productos encontrados por API para "${termino}": ${productos.length}`);

      for (const producto of productos) {
        const llave = producto?.url || producto?.handle || producto?.title;
        if (!productosMap.has(llave)) {
          productosMap.set(llave, producto);
        }
      }
    }

    const productosUnicos = [...productosMap.values()];
    console.log(`📦 [${tienda.nombre}] Productos únicos acumulados: ${productosUnicos.length}`);

    const nombreLower = removerAcentos(carta.nombre.toLowerCase());
    const nombreCompacto = nombreLower.replace(/[^a-z0-9]/g, '');
    const setLower = removerAcentos((carta.set || '').toLowerCase());
    const setNormalizado = setLower ? normalizarParaUrl(setLower) : '';

    for (const producto of productosUnicos) {
      const titulo = removerAcentos((producto.title || '').toLowerCase());
      const urlProducto = producto.url || '';
      const tituloNormalizado = normalizarParaUrl(titulo);
      const urlProductoLower = removerAcentos(urlProducto.toLowerCase());
      const incluyeSet = !setNormalizado ||
        tituloNormalizado.includes(setNormalizado) ||
        urlProductoLower.includes(setNormalizado);
      const tituloCompacto = titulo.replace(/[^a-z0-9]/g, '');
      const incluyeNombre =
        titulo.includes(nombreLower) ||
        titulo.includes(nombreLower.replace(/-/g, ' ')) ||
        tituloCompacto.includes(nombreCompacto);

      // 1. El título debe contener el nombre de la carta
      if (!incluyeNombre) continue;

      // 2. Debe contener el número de carta con su total
      let tieneNumero = false;
      if (totalSet) {
        const separadores = ['/', '-', '_', ' '];
        const candidatos = [];
        separadores.forEach(sep => {
          candidatos.push(
            `${numeroCarta}${sep}${totalSet}`,
            `${numeroFormateado}${sep}${totalSet}`,
            `${numeroCarta}${sep}${totalSetPad}`,
            `${numeroFormateado}${sep}${totalSetPad}`
          );
        });
        tieneNumero = candidatos.some(p => titulo.includes(p) || urlProducto.includes(p));

        // Caso especial: cartas con numeración alfanumérica (ej: RC30/RC32)
        // donde printedTotal puede venir como total del set principal (ej: 83).
        if (!tieneNumero && /[a-z]/i.test(numeroCarta)) {
          const numeroEscapado = numeroCarta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const patronAlfanumerico = new RegExp(`${numeroEscapado}[\\/\\-\\_\\s][a-z]*\\d{1,3}`, 'i');
          tieneNumero = patronAlfanumerico.test(titulo) || patronAlfanumerico.test(urlProducto);
        }
      } else {
        // Sin total: el número aparece como dígito suelto
        const nums = titulo.match(/\d+/g) || [];
        tieneNumero = nums.includes(numeroCarta) || nums.includes(numeroFormateado);
      }

      if (!tieneNumero) continue;

      // Algunas tiendas no incluyen el nombre del set en el título/slug.
      // Si ya tenemos coincidencia exacta por nombre + número/total, permitimos continuar.
      if (!incluyeSet && !totalSet) continue;
      if (!incluyeSet && totalSet) {
        console.log(`⚠️ [${tienda.nombre}] Coincidencia válida sin set explícito: "${producto.title}"`);
      }

      // 3. No deben aparecer variantes prohibidas si la carta no las tiene
      const variantesEspeciales = [/\bv\b/i, /\bex\b/i, /\bgx\b/i, /\bvmax\b/i, /\bvstar\b/i, /\bmega\b/i, /\bbreak\b/i, /\bprime\b/i];
      const cartaTieneVariante = variantesEspeciales.some(r => r.test(nombreLower));
      if (!cartaTieneVariante) {
        const tieneVarianteIndeseada = variantesEspeciales.some(r => r.test(titulo));
        if (tieneVarianteIndeseada) {
          console.log(`⛔ [${tienda.nombre}] Variante no deseada en: "${producto.title}"`);
          continue;
        }
      }

      // ¡Coincidencia válida!
      const urlCompleta = urlProducto.startsWith('http') ? urlProducto : `${urlBase}${urlProducto}`;
      // Limpiar parámetros de tracking de Shopify (_pos, _sid, _ss)
      const urlLimpia = urlCompleta.split('?')[0];

      // 4. Obtener precio y disponibilidad real desde product JSON
      const handle = urlLimpia.split('/products/')[1];
      let precio = null;
      let disponible = false;

      try {
        // Shopify .json no siempre incluye "available" por variante.
        // El endpoint .js sí trae disponibilidad real, por eso lo priorizamos.
        let variants = [];
        const productoJsUrl = `${urlBase}/products/${handle}.js`;
        try {
          const pJsRes = await httpGet(productoJsUrl, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          });
          variants = pJsRes.data?.variants || [];
        } catch (eJs) {
          const productoJsonUrl = `${urlBase}/products/${handle}.json`;
          const pRes = await httpGet(productoJsonUrl, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          });
          variants = pRes.data?.product?.variants || [];
        }

        const normalizarPrecioVariant = (rawPrice) => {
          if (typeof rawPrice === 'number') {
            // En endpoint .js Shopify suele venir en centavos
            return Math.round(rawPrice / 100).toString();
          }

          const parsed = Number(rawPrice);
          if (Number.isFinite(parsed)) {
            return Math.round(parsed).toString();
          }

          return null;
        };

        // Tomar variante más barata disponible
        const disponibles = variants.filter(v => v.available === true);
        if (disponibles.length > 0) {
          disponible = true;
          precio = normalizarPrecioVariant(disponibles[0].price);
        } else if (variants.length > 0) {
          disponible = false;
          precio = normalizarPrecioVariant(variants[0].price);
        }
      } catch (e) {
        console.warn(`⚠️ [${tienda.nombre}] No se pudo obtener detalle de producto Shopify: ${e.message}`);
      }

      console.log(`✅ [${tienda.nombre}] ENCONTRADO: "${producto.title}" | $${precio} | disponible: ${disponible}`);
      return {
        url: urlLimpia,
        verificada: true,
        tipoProducto: 'json-shopify',
        precio,
        disponible
      };
    }

    console.log(`⛔ [${tienda.nombre}] No se encontró coincidencia exacta`);
    return null;
  } catch (error) {
    console.error(`❌ [${tienda.nombre}] Error API JSON: ${error.message}`);
    return { temporalError: true, motivo: error.message };
  }
}

async function buscarEnTiendaLevelUp(tienda, carta) {
  const resultadoJson = await buscarEnTiendaLevelUpJson(tienda, carta);
  if (resultadoJson) {
    return resultadoJson;
  }

  console.log(`↩️ [${tienda.nombre}] Fallback a scraping HTML con Cheerio`);

  // TÉRMINO DE BÚSQUEDA MEJORADO: usar espacios en lugar de caracteres especiales
  let termino;
  if (carta.printedTotal) {
    // Usar espacios para la búsqueda, no caracteres especiales
    termino = `${carta.nombre} ${carta.numero} ${carta.printedTotal}`;
    console.log(`🔍 Término de búsqueda optimizado: "${termino}"`);
    console.log(`🔍 Patrones que se buscarán: ${carta.numero}/${carta.printedTotal}, ${carta.numero}-${carta.printedTotal}, etc.`);
  } else {
    termino = `${carta.nombre} ${carta.numero}`;
    console.log(`🔍 Término de búsqueda: "${termino}" (sin total del set)`);
  }
  
  const urlBusqueda = tienda.urlBusqueda.replace('BUSQUEDA', encodeURIComponent(termino));
  console.log(`🎮 [LevelUp] Iniciando búsqueda LevelUp para carta: "${carta.nombre}"`);
  console.log(`🔍 [LevelUp] URL de búsqueda: ${urlBusqueda}`);

  try {
    const res = await httpGet(urlBusqueda, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      }
    });

    const $ = cheerio.load(res.data);
    
    // Intento intermedio: extraer JSON-LD oculto
    const jsonLdResult = extraerJSONLD($, tienda, carta);
    if (jsonLdResult) {
      return jsonLdResult;
    }

    const enlaces = $('a.woocommerce-LoopProduct-link, .product a.preview, .product-element-top > a, .product a[href*="/producto/"], .product a[href*="/product/"]');

    console.log(`🔗 [${tienda.nombre}] Enlaces encontrados: ${enlaces.length}`);

    for (let i = 0; i < enlaces.length; i++) {
      const link = $(enlaces[i]);
      const contenedor = link.closest('.product, .type-product, .entry-summary, [class*="product"]');
      const textoElemento = (contenedor.length > 0 ? contenedor.text() : link.text()).toLowerCase();
      const href = link.attr('href') || "";
      const urlCompleta = href.startsWith("http") ? href : `${tienda.urlBase}${href}`;

      const analisis = analizarCoincidenciasCarta(carta, href, textoElemento, tienda);

      console.log(`🔍 Comparando [${tienda.nombre}]: "${textoElemento}" → coincide: ${analisis.coincideAlguno}`);

      if (analisis.coincideAlguno) {
        // Aplicar las mismas validaciones que Shopify
        const textoCompleto = `${textoElemento} ${href}`.toLowerCase();
        const nombreCartaLower = carta.nombre.toLowerCase();
        
        // Filtros de validación (mismos que Shopify)
        const terminosNoCartas = ['protector', 'sleeve', 'binder', 'portfolio', 'deck box', 'playmat', 'mat'];
        if (terminosNoCartas.some(term => textoCompleto.includes(term))) {
          console.log(`❌ [${tienda.nombre}] RECHAZADO: No es una carta`);
          continue;
        }
        
        if (carta.set) {
          const setEsperado = carta.set.toLowerCase();
          const setsComunes = ['sv', 'swsh', 'sm', 'xy', 'bw', 'dp', 'ex', 'neo', 'base', 'sw', 'celebrations'];
          
          // Mapeo de sets abreviados a nombres completos
          const mapeosSet = {
            'sv': ['sv', 'scarlet-violet', 'scarlet', 'violet'],
            'swsh': ['swsh', 'sword-shield', 'sword', 'shield'], 
            'sm': ['sm', 'sun-moon', 'sun', 'moon'],
            'xy': ['xy'],
            'bw': ['bw', 'black-white', 'black', 'white'],
            'sw': ['sw', 'sword-shield'] // alias para swsh
          };
          
          const setEncontrado = setsComunes.find(s => new RegExp(`\\b${s}\\b`, 'i').test(textoCompleto));
          
          if (setEncontrado && setEncontrado !== setEsperado) {
            // Verificar si es un mapeo válido
            const variacionesValidas = mapeosSet[setEsperado] || [setEsperado];
            const esVariacionValida = variacionesValidas.some(variacion => 
              textoCompleto.includes(variacion) || setEncontrado === variacion
            );
            
            if (!esVariacionValida) {
              console.log(`❌ [${tienda.nombre}] RECHAZADO: Set incorrecto`);
              continue;
            }
          }
        }
        
        // Validación de número exacto CON MÚLTIPLES SEPARADORES (MEJORADA)
        const numeroCartaValidacion = String(carta.numero);
        const totalSetValidacion = carta.printedTotal ? String(carta.printedTotal) : null;
        let tieneNumeroExacto = false;
        
        if (totalSetValidacion) {
          // PATRÓN MEJORADO: Usar regex para mayor precisión
          const separadores = ['/', '-', '_', ' ', '.', '|'];
          const patronesCompletos = [];
          
          separadores.forEach(sep => {
            const sepEscaped = sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            patronesCompletos.push({
              patron: `${numeroCartaValidacion}${sep}${totalSetValidacion}`,
              regex: new RegExp(`\\(?${numeroCartaValidacion}${sepEscaped}${totalSetValidacion}\\)?`, 'i')
            });
            patronesCompletos.push({
              patron: `${numeroCartaValidacion.padStart(3, '0')}${sep}${totalSetValidacion}`,
              regex: new RegExp(`\\(?${numeroCartaValidacion.padStart(3, '0')}${sepEscaped}${totalSetValidacion}\\)?`, 'i')
            });
          });
          
          // Buscar usando regex
          for (const item of patronesCompletos) {
            if (item.regex.test(textoCompleto)) {
              tieneNumeroExacto = true;
              console.log(`✅ [${tienda.nombre}] PATRÓN REGEX ENCONTRADO: "${item.patron}"`);
              break;
            }
          }
          
          if (!tieneNumeroExacto) {
            // Fallback: búsqueda simple y análisis por proximidad
            const patronesSimples = [];
            separadores.forEach(sep => {
              patronesSimples.push(
                `${numeroCartaValidacion}${sep}${totalSetValidacion}`,
                `${numeroCartaValidacion.padStart(3, '0')}${sep}${totalSetValidacion}`
              );
            });
            
            tieneNumeroExacto = patronesSimples.some(patron => textoCompleto.includes(patron));
            
            if (!tieneNumeroExacto) {
              // Análisis de proximidad: si están los números individuales, aceptar
              const numerosEnTexto = textoCompleto.match(/\d+/g) || [];
              const tieneNumeroIndividual = numerosEnTexto.includes(numeroCartaValidacion) || 
                                          numerosEnTexto.includes(numeroCartaValidacion.padStart(3, '0'));
              const tieneTotalIndividual = numerosEnTexto.includes(totalSetValidacion);
              
              if (tieneNumeroIndividual && tieneTotalIndividual) {
                console.log(`⚠️ [${tienda.nombre}] NÚMEROS INDIVIDUALES PRESENTES - ACEPTANDO`);
                tieneNumeroExacto = true;
              } else {
                console.log(`❌ [${tienda.nombre}] PATRÓN NO ENCONTRADO (${patronesCompletos.length} patrones probados)`);
              }
            }
          }
        } else {
          const numerosEncontrados = textoCompleto.match(/\b\d{1,3}\b/g) || [];
          tieneNumeroExacto = numerosEncontrados.includes(numeroCartaValidacion);
          
          if (!tieneNumeroExacto) {
            console.log(`❌ [${tienda.nombre}] NÚMERO NO ENCONTRADO: esperaba "${numeroCartaValidacion}", encontró: [${numerosEncontrados.join(', ')}]`);
          }
        }
        
        if (!tieneNumeroExacto) {
          console.log(`❌ [${tienda.nombre}] NÚMERO NO EXACTO - RECHAZADO`);
          continue;
        }
        
        console.log(`✅ [${tienda.nombre}] VALIDACIÓN APROBADA`);
        
        console.log(`🎮 [LevelUp] Iniciando scraping de precio...`);
        const infoCosto = await scrapearPrecioLevelUp(urlCompleta);

        if (!infoCosto) {
          console.log(`❌ [LevelUp] No se pudo obtener el precio.`);
          continue;
        }

        console.log(`🎮 [LevelUp] Scraping completado, precio: ${infoCosto.precio}, disponible: ${infoCosto.disponible}`);
        return {
          url: urlCompleta,
          verificada: true,
          tipoProducto: 'html-levelup',
          precio: infoCosto.precio,
          disponible: infoCosto.disponible
        };
      }
    }

    console.log(`⛔ No se encontró coincidencia exacta en ${tienda.nombre}`);
  } catch (error) {
    console.error(`❌ Error buscando en tienda ${tienda.nombre}:`, error.message);
    return { temporalError: true, motivo: error.message };
  }

  return null;
}

async function buscarEnTiendaLevelUpJson(tienda, carta) {
  const termino = carta.nombre;
  const endpoints = [
    `${tienda.urlBase}/wp-json/wc/store/v1/products?search=${encodeURIComponent(termino)}&per_page=${SCRAPING_LEVELUP_LIMIT}`,
    `${tienda.urlBase}/wp-json/wp/v2/product?search=${encodeURIComponent(termino)}&per_page=${SCRAPING_LEVELUP_LIMIT}`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🧩 [${tienda.nombre}] Probando endpoint JSON: ${endpoint}`);
      const res = await httpGet(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json'
        },
        validateStatus: () => true
      });

      if (res.status < 200 || res.status >= 300) {
        console.log(`⚠️ [${tienda.nombre}] Endpoint JSON no disponible (${res.status})`);
        continue;
      }

      const productos = Array.isArray(res.data) ? res.data : [];
      console.log(`📦 [${tienda.nombre}] Productos JSON encontrados: ${productos.length}`);

      for (const producto of productos) {
        const tituloRaw = producto?.name || producto?.title?.rendered || '';
        const titulo = removerAcentos(String(tituloRaw).toLowerCase());
        const slug = String(producto?.slug || '').toLowerCase();
        const permalink = String(producto?.permalink || producto?.link || '').trim();
        const hrefComparacion = `${slug} ${permalink}`.trim();

        const analisis = analizarCoincidenciasCarta(carta, hrefComparacion, titulo, tienda);
        if (!analisis.coincideAlguno) continue;

        const terminosNoCartas = ['protector', 'sleeve', 'binder', 'portfolio', 'deck box', 'playmat', 'mat'];
        const textoCompleto = `${titulo} ${hrefComparacion}`;
        if (terminosNoCartas.some(term => textoCompleto.includes(term))) continue;

        const urlCompleta = permalink || (slug ? `${tienda.urlBase}/producto/${slug}` : '');
        if (!urlCompleta) continue;

        const infoCosto = await scrapearPrecioLevelUp(urlCompleta);
        if (!infoCosto) continue;

        console.log(`✅ [${tienda.nombre}] Coincidencia vía JSON: "${tituloRaw}" | $${infoCosto.precio}`);
        return {
          url: urlCompleta,
          verificada: true,
          tipoProducto: 'json-levelup',
          precio: infoCosto.precio,
          disponible: infoCosto.disponible
        };
      }
    } catch (error) {
      console.warn(`⚠️ [${tienda.nombre}] Error en endpoint JSON ${endpoint}: ${error.message}`);
    }
  }

  return null;
}

async function scrapearPrecioShopify(url, nombreTienda) {
  try {
    console.log(`💰 Scrapeando precio Shopify en: ${url}`);
    
    const res = await httpGet(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      },
    });

    const $ = cheerio.load(res.data);
    
    // IGNORAR elementos en secciones de productos relacionados/sugeridos
    const sectoresIgnorar = [
      '.product-recommendations',
      '.related-products', 
      '.related',
      '.suggestions',
      '.you-may-also-like',
      '.recommended',
      '.similar-products',
      '.cross-sell',
      '.upsell',
      '[class*="related"]',
      '[class*="recommend"]',
      '[class*="suggest"]',
      '[id*="related"]',
      '[id*="recommend"]',
      '.shopify-section-recommended-products'
    ];
    
    // Remover todas las secciones de productos relacionados del DOM
    sectoresIgnorar.forEach(selector => {
      $(selector).remove();
    });
    
    console.log(`🚫 Elementos de productos relacionados removidos de ${nombreTienda}`);
    
    const selectoresPrecio = [
      '.price .money',
      '.product-price .money', 
      '.price-current .money',
      '.product__price .money',
      '.product-form .money',
      '.product-info .money',
      '.product-details .money',
      '.money',
      '.price',
      '.product-price'
    ];

    for (const selector of selectoresPrecio) {
      const elementos = $(selector);
      
      // Filtrar elementos que NO estén en secciones relacionadas
      let elementosValidos = elementos.filter((i, el) => {
        const elemento = $(el);
        const textoCompleto = elemento.closest('div').text().toLowerCase();
        
        // Verificar si el elemento está en una sección relacionada por texto
        const terminosRelacionados = [
          'related', 'recommend', 'suggest', 'similar', 'you may also like', 
          'customers also viewed', 'otros productos', 'productos relacionados',
          'te puede interesar', 'sugerencias', 'más productos'
        ];
        
        const estaEnSeccionRelacionada = terminosRelacionados.some(termino => 
          textoCompleto.includes(termino)
        );
        
        return !estaEnSeccionRelacionada;
      });
      for (const el of elementosValidos.toArray()) {
        const elementoPrecio = $(el);
        const textoPrecio = elementoPrecio.text().trim();
        const precioLimpio = limpiarPrecio(textoPrecio);

        if (!precioLimpio) continue;

        const precioNumerico = Number(precioLimpio);
        if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
          console.log(`⚠️ Precio descartado en ${nombreTienda} por ser inválido o 0: "${textoPrecio}"`);
          continue;
        }

        console.log(`💰 Precio encontrado en ${nombreTienda}: ${precioLimpio} (selector: ${selector})`);
        
        let disponible = true;
        const htmlText = $.html().toLowerCase();
        if (
          htmlText.includes('agotado') || 
          htmlText.includes('sold out') || 
          htmlText.includes('out of stock') || 
          htmlText.includes('sin stock') ||
          $('button[name="add"]').attr('disabled') ||
          $('button.add-to-cart').attr('disabled') ||
          $('[aria-disabled="true"]').length > 0
        ) {
          disponible = false;
          console.log(`❌ El producto en ${nombreTienda} está AGOTADO.`);
        }

        return { precio: precioLimpio, disponible };
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
    
    const res = await httpGet(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      },
    });

    const $ = cheerio.load(res.data);
    
    // IGNORAR elementos en secciones de productos relacionados/sugeridos
    const sectoresIgnorar = [
      '.related-products',
      '.cross-sells',
      '.upsells', 
      '.related',
      '.suggestions',
      '.recommended-products',
      '.you-may-also-like',
      '.similar-products',
      '.product-recommendations',
      '[class*="related"]',
      '[class*="cross-sell"]',
      '[class*="upsell"]',
      '[class*="recommend"]',
      '[class*="suggest"]',
      '.woocommerce-output-related-products'
    ];
    
    // Remover todas las secciones de productos relacionados del DOM
    sectoresIgnorar.forEach(selector => {
      $(selector).remove();
    });
    
    console.log(`🚫 Elementos de productos relacionados removidos de LevelUp`);
    
    const selectoresPrecio = [
      '.woocommerce-Price-amount',
      '.price .woocommerce-Price-amount',
      'ins .woocommerce-Price-amount',
      '.product-price .woocommerce-Price-amount',
      '.single-product .woocommerce-Price-amount',
      '.entry-summary .woocommerce-Price-amount',
      '.price',
      '.amount'
    ];

    for (const selector of selectoresPrecio) {
      const elementos = $(selector);
      
      // Filtrar elementos que NO estén en secciones relacionadas
      let elementosValidos = elementos.filter((i, el) => {
        const elemento = $(el);
        const contenedorPadre = elemento.closest('.product, .entry-summary, .single-product');
        const textoContenedor = contenedorPadre.text().toLowerCase();
        
        // Verificar si el elemento está en una sección relacionada por texto
        const terminosRelacionados = [
          'related', 'recommend', 'suggest', 'similar', 'you may also like', 
          'customers also viewed', 'cross-sell', 'upsell', 'otros productos', 
          'productos relacionados', 'te puede interesar', 'sugerencias', 'más productos'
        ];
        
        const estaEnSeccionRelacionada = terminosRelacionados.some(termino => 
          textoContenedor.includes(termino)
        );
        
        return !estaEnSeccionRelacionada;
      });
      for (const el of elementosValidos.toArray()) {
        const elementoPrecio = $(el);
        const textoPrecio = elementoPrecio.text().trim();
        const precioLimpio = limpiarPrecio(textoPrecio);

        if (!precioLimpio) continue;

        const precioNumerico = Number(precioLimpio);
        if (!Number.isFinite(precioNumerico) || precioNumerico <= 0) {
          console.log(`⚠️ Precio descartado en LevelUp por ser inválido o 0: "${textoPrecio}"`);
          continue;
        }

        console.log(`💰 Precio encontrado en LevelUp: ${precioLimpio} (selector: ${selector})`);
        
        let disponible = true;
        const htmlText = $.html().toLowerCase();
        if (
          htmlText.includes('agotado') || 
          htmlText.includes('sold out') || 
          htmlText.includes('out of stock') || 
          htmlText.includes('sin stock') ||
          $('.outofstock').length > 0 ||
          $('p.stock.out-of-stock').length > 0
        ) {
          disponible = false;
          console.log(`❌ El producto en LevelUp está AGOTADO.`);
        }

        return { precio: precioLimpio, disponible };
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
  
  textoPrecio = textoPrecio.replace(/\s+/g, ' ').trim();
  
  const patronesPrecio = [
    /\$\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/,  // $1,234.56
    /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*\$/,  // 1,234.56$
    /(\d+(?:[.,]\d{1,2})?)/,                       // 1234.56
  ];

  for (const patron of patronesPrecio) {
    const match = textoPrecio.match(patron);
    if (match) {
      let numeroLimpio = match[1]
        .replace(/\./g, '')  // Remover puntos de miles
        .replace(/,/g, '.'); // Convertir comas decimales a puntos
      
      const numeroValidado = parseFloat(numeroLimpio);
      if (!isNaN(numeroValidado)) {
        return numeroValidado.toString();
      }
    }
  }
  
  return null;
}

async function buscarEnTiendaJumpseller(tienda, carta) {
  const urlBase = tienda.urlBase;
  
  // TÉRMINO DE BÚSQUEDA: usar nombre y número/total
  let termino;
  if (carta.printedTotal) {
    termino = `${carta.nombre} ${carta.numero} ${carta.printedTotal}`;
  } else {
    termino = `${carta.nombre} ${carta.numero}`;
  }

  const urlBusqueda = `${urlBase}/search?q=${encodeURIComponent(termino)}`;
  console.log(`🛍️ [Jumpseller] Iniciando búsqueda Jumpseller en: ${urlBusqueda}`);

  try {
    const res = await httpGet(urlBusqueda, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      }
    });

    const $ = cheerio.load(res.data);
    
    // Intento intermedio: extraer JSON-LD oculto
    const jsonLdResult = extraerJSONLD($, tienda, carta);
    if (jsonLdResult) {
      return jsonLdResult;
    }

    // En Jumpseller, los títulos de productos de búsqueda están dentro de <h4><a href="...">
    // O también pueden estar dentro de .product-block a o .product a
    const enlaces = $('h4 a, .product-block a, .product a');
    console.log(`🔗 [${tienda.nombre}] Enlaces de búsqueda Jumpseller encontrados: ${enlaces.length}`);

    for (let i = 0; i < enlaces.length; i++) {
      const link = $(enlaces[i]);
      const href = link.attr('href') || "";
      
      // Asegurarse de que el enlace de Jumpseller es una ruta relativa a un producto
      if (!href.startsWith('/') || href.includes('/customer/') || href.includes('/cart') || href.includes('/blog') || href.includes('/search') || href.includes('/contact')) {
        continue;
      }

      const textoElemento = link.text().trim();
      const urlCompleta = `${urlBase}${href}`;
      
      const analisis = analizarCoincidenciasCarta(carta, href, textoElemento, tienda);
      console.log(`🔍 Comparando Jumpseller [${tienda.nombre}]: "${textoElemento}" → coincide: ${analisis.coincideAlguno}`);

      if (analisis.coincideAlguno) {
        // Encontrado! Vamos a scrapear su precio y disponibilidad de la página del producto
        console.log(`🛍️ [Jumpseller] Coincidencia encontrada! Scrapeando producto en: ${urlCompleta}`);
        
        const resProd = await httpGet(urlCompleta, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'text/html',
          }
        });
        
        const $prod = cheerio.load(resProd.data);
        
        // Selectores de precio típicos de Jumpseller
        const selectoresPrecio = [
          '.product-form-price',
          '.form-price',
          '.current-price',
          '.product-price',
          '.price',
          '#product-price'
        ];
        
        let precio = null;
        for (const selector of selectoresPrecio) {
          const elPrecio = $prod(selector).first();
          if (elPrecio.length > 0) {
            const textoPrecio = elPrecio.text().trim();
            // Si el selector devolvió múltiples precios (por ejemplo, original y descuento), limpiarPrecio los limpiará
            const precioLimpio = limpiarPrecio(textoPrecio);
            if (precioLimpio) {
              precio = precioLimpio;
              break;
            }
          }
        }
        
        // Si no se encontró mediante selectores específicos, buscar en todo el HTML
        if (!precio) {
          console.log(`⚠️ Jumpseller no encontró precio con selectores específicos, buscando genérico`);
          // Buscar cualquier texto que parezca precio en la zona del formulario
          const textoForm = $prod('form[action*="/cart/add"]').text();
          if (textoForm) {
            precio = limpiarPrecio(textoForm);
          }
        }
        
        // Verificar stock de Jumpseller de forma precisa
        let disponible = false;
        
        // Buscar el botón principal de añadir al carro del producto actual
        const btnAdd = $prod('form[action*="/cart/add"] input[type="submit"], form[action*="/cart/add"] button[type="submit"], .adc, #button-cart');
        
        if (btnAdd.length > 0) {
          const btnText = btnAdd.first().text().toLowerCase() || btnAdd.first().attr('value')?.toLowerCase() || '';
          const isDisabled = btnAdd.first().attr('disabled') !== undefined;
          
          if (!isDisabled && !btnText.includes('agotado') && !btnText.includes('sin stock') && !btnText.includes('sold out') && !btnText.includes('no disponible')) {
            disponible = true;
          }
        } else {
          // Fallback seguro si no se encuentra el botón
          const mainInfoText = $prod('.product-form, #product-actions, .product-form-price').text().toLowerCase();
          if (!mainInfoText.includes('agotado') && !mainInfoText.includes('sin stock')) {
            disponible = true;
          }
        }
        
        console.log(`✅ [${tienda.nombre}] ENCONTRADO JUMPSELLER: "${textoElemento}" | $${precio} | disponible: ${disponible}`);
        
        return {
          url: urlCompleta,
          verificada: true,
          tipoProducto: 'html-jumpseller',
          precio,
          disponible
        };
      }
    }
    
    console.log(`⛔ No se encontró coincidencia exacta en ${tienda.nombre}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error buscando en tienda Jumpseller ${tienda.nombre}:`, error.message);
    return { temporalError: true, motivo: error.message };
  }
}

async function scrapearPrecioJumpseller(urlCompleta, nombreTienda) {
  try {
    const resProd = await httpGet(urlCompleta, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'text/html',
      }
    });
    
    const $prod = cheerio.load(resProd.data);
    
    // Selectores de precio típicos de Jumpseller
    const selectoresPrecio = [
      '.product-form-price',
      '.form-price',
      '.current-price',
      '.product-price',
      '.price',
      '#product-price'
    ];
    
    let precio = null;
    for (const selector of selectoresPrecio) {
      const elPrecio = $prod(selector).first();
      if (elPrecio.length > 0) {
        const textoPrecio = elPrecio.text().trim();
        // Si el selector devolvió múltiples precios (por ejemplo, original y descuento), limpiarPrecio los limpiará
        const precioLimpio = limpiarPrecio(textoPrecio);
        if (precioLimpio) {
          precio = precioLimpio;
          break;
        }
      }
    }
    
    // Si no se encontró mediante selectores específicos, buscar en todo el HTML
    if (!precio) {
      console.log(`⚠️ Jumpseller no encontró precio con selectores específicos en ${nombreTienda}, buscando genérico`);
      // Buscar cualquier texto que parezca precio en la zona del formulario
      const textoForm = $prod('form[action*="/cart/add"]').text();
      if (textoForm) {
        precio = limpiarPrecio(textoForm);
      }
    }
    
    // Verificar stock de Jumpseller de forma precisa
    let disponible = false;
    
    // Buscar el botón principal de añadir al carro del producto actual
    const btnAdd = $prod('form[action*="/cart/add"] input[type="submit"], form[action*="/cart/add"] button[type="submit"], .adc, #button-cart');
    
    if (btnAdd.length > 0) {
      const btnText = btnAdd.first().text().toLowerCase() || btnAdd.first().attr('value')?.toLowerCase() || '';
      const isDisabled = btnAdd.first().attr('disabled') !== undefined;
      
      if (!isDisabled && !btnText.includes('agotado') && !btnText.includes('sin stock') && !btnText.includes('sold out') && !btnText.includes('no disponible')) {
        disponible = true;
      }
    } else {
      // Fallback seguro si no se encuentra el botón
      const mainInfoText = $prod('.product-form, #product-actions, .product-form-price').text().toLowerCase();
      if (!mainInfoText.includes('agotado') && !mainInfoText.includes('sin stock')) {
        disponible = true;
      }
    }
    
    return {
      precio,
      disponible
    };
  } catch(error) {
    console.error(`❌ Error scrapeando precio Jumpseller en ${nombreTienda}:`, error.message);
    return null;
  }
}

module.exports = {
  buscarEnTiendaShopify,
  buscarEnTiendaLevelUp,
  buscarEnTiendaJumpseller,
  scrapearPrecioShopify,
  scrapearPrecioLevelUp,
  scrapearPrecioJumpseller,
  limpiarPrecio
};
