const axios = require('axios');
const cheerio = require('cheerio');
const { HttpsProxyAgent } = require('https-proxy-agent');

const DATAIMPULSE_PROXY_ENABLED = String(process.env.DATAIMPULSE_PROXY_ENABLED || 'false').toLowerCase() === 'true';
const DATAIMPULSE_HOST = process.env.DATAIMPULSE_HOST || '';
const DATAIMPULSE_PORT = Number(process.env.DATAIMPULSE_PORT || 0);
const DATAIMPULSE_USERNAME = process.env.DATAIMPULSE_USERNAME || '';
const DATAIMPULSE_PASSWORD = process.env.DATAIMPULSE_PASSWORD || '';
const DATAIMPULSE_PROXY_PROTOCOL = (process.env.DATAIMPULSE_PROXY_PROTOCOL || 'http').toLowerCase();
const PRICECHARTING_HTTP_TIMEOUT_MS = Number(process.env.PRICECHARTING_HTTP_TIMEOUT_MS || 7000);
const PRICECHARTING_HTTP_MAX_REDIRECTS = Math.max(1, Number(process.env.PRICECHARTING_HTTP_MAX_REDIRECTS || 8));
const PRICECHARTING_PROXY_REDIRECT_FALLBACK = String(process.env.PRICECHARTING_PROXY_REDIRECT_FALLBACK || 'true').toLowerCase() === 'true';
const PRICECHARTING_PROXY_HTTP_FALLBACK = String(process.env.PRICECHARTING_PROXY_HTTP_FALLBACK || 'true').toLowerCase() === 'true';

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

class PriceChartingService {
  constructor() {
    this.baseURL = 'https://www.pricecharting.com';
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
    this.proxyTransport = getProxyTransport();
    this.maxSearchRows = Math.max(1, Number(process.env.PRICECHARTING_MAX_SEARCH_ROWS || 20));
  }

  async httpGet(url, extraConfig = {}) {
    const doRequest = async (usarProxy) => {
      const config = {
        headers: this.headers,
        timeout: PRICECHARTING_HTTP_TIMEOUT_MS,
        maxRedirects: PRICECHARTING_HTTP_MAX_REDIRECTS,
        decompress: true,
        maxContentLength: 1024 * 1024 * 2,
        ...extraConfig,
      };

      if (usarProxy && this.proxyTransport && !extraConfig.httpAgent && !extraConfig.httpsAgent && typeof extraConfig.proxy === 'undefined') {
        Object.assign(config, this.proxyTransport);
      } else if (!usarProxy) {
        config.proxy = false;
      }

      return axios.get(url, config);
    };

    try {
      return await doRequest();
    } catch (error) {
      const esLoopRedirect = error?.code === 'ERR_FR_TOO_MANY_REDIRECTS' ||
        String(error?.message || '').toLowerCase().includes('redirect');
      const status = Number(error?.response?.status || 0);
      const esErrorHttpProxyProbable = [400, 401, 403, 407, 429, 502, 503, 504].includes(status);
      const puedeFallbackSinProxy = this.proxyTransport && typeof extraConfig.proxy === 'undefined';

      if (PRICECHARTING_PROXY_REDIRECT_FALLBACK && puedeFallbackSinProxy && esLoopRedirect) {
        console.warn(`⚠️ Redirect loop con proxy en PriceCharting para ${url}. Reintentando sin proxy...`);
        return doRequest(false);
      }

      if (PRICECHARTING_PROXY_HTTP_FALLBACK && puedeFallbackSinProxy && esErrorHttpProxyProbable) {
        console.warn(`⚠️ HTTP ${status} con proxy en PriceCharting para ${url}. Reintentando sin proxy...`);
        return doRequest(false);
      }

      throw error;
    }
  }

  normalizarParaBusqueda(texto) {
    return texto
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s#\/\-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  construirURLBusqueda(carta) {
    const nombre = this.normalizarParaBusqueda(carta.nombre);
    const numero = carta.numero || '';
    let query = `${nombre}`;
    if (numero) {
      query += ` ${numero}`;
    }
    const encodedQuery = encodeURIComponent(query);
    return `${this.baseURL}/search-products?type=prices&q=${encodedQuery}&console=pokemon-cards`;
  }

  canonicalizarUrlPriceCharting(url) {
    if (!url) return null;
    try {
      const urlObj = new URL(url, this.baseURL);
      // Forzar host/base canónico
      urlObj.protocol = 'https:';
      urlObj.host = 'www.pricecharting.com';
      // Eliminar query/hash para persistir URL estable
      urlObj.search = '';
      urlObj.hash = '';

      // Normalizar prefijos de idioma en la ruta: /es/game/... -> /game/...
      urlObj.pathname = (urlObj.pathname || '')
        .replace(/^\/(de|es|fr|nl|pt|ru|it|ja)(?=\/)/i, '')
        .replace(/\/+/g, '/');

      return `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      // Fallback defensivo cuando URL viene mal formada
      return String(url)
        .replace(/^https?:\/\/[^/]+/i, this.baseURL)
        .replace(/^https:\/\/www\.pricechartting\.com/i, this.baseURL)
        .replace(/\?.*$/, '')
        .replace(/#.*$/, '')
        .replace(/^https:\/\/www\.pricecharting\.com\/(de|es|fr|nl|pt|ru|it|ja)(?=\/)/i, this.baseURL);
    }
  }

  verificarCoincidenciaCarta(resultadoHTML, carta) {
    const $ = cheerio.load(resultadoHTML);
    const textoCompleto = $(resultadoHTML).text().toLowerCase();

    const nombreCarta = this.normalizarParaBusqueda(carta.nombre).toLowerCase();
    const numeroCarta = carta.numero ? carta.numero.toString() : '';
    const setCarta = carta.set ? this.normalizarParaBusqueda(carta.set).toLowerCase() : '';
    const serieCarta = carta.serie ? this.normalizarParaBusqueda(carta.serie).toLowerCase() : '';

    const tieneNombre = textoCompleto.includes(nombreCarta);
    if (!tieneNombre) return false;

    let tieneNumero = true;
    if (numeroCarta) {
      tieneNumero = textoCompleto.includes(`#${numeroCarta}`) || 
                    textoCompleto.includes(`${numeroCarta}/`) ||
                    textoCompleto.includes(` ${numeroCarta} `) ||
                    textoCompleto.includes(`-${numeroCarta}`) ||
                    textoCompleto.endsWith(numeroCarta);
      if (!tieneNumero) return false;
    }

    let tieneSet = true;
    if (setCarta) {
      const palabrasSet = setCarta.split(' ');
      tieneSet = palabrasSet.every(p => p.length > 2 ? textoCompleto.includes(p) : true);
      if (!tieneSet) return false;
    }

    let tieneSerie = true;
    if (serieCarta) {
      const palabrasSerie = serieCarta.split(' ');
      tieneSerie = palabrasSerie.every(p => p.length > 2 ? textoCompleto.includes(p) : true);
      if (!tieneSerie) return false;
    }

    return true;
  }

  calcularPuntuacionCoincidencia(textoResultado, carta) {
    let puntuacion = 0;
    const textoLower = textoResultado.toLowerCase();

    const nombreCarta = this.normalizarParaBusqueda(carta.nombre).toLowerCase();
    const numeroCarta = carta.numero ? carta.numero.toString() : '';
    const setCarta = carta.set ? this.normalizarParaBusqueda(carta.set).toLowerCase() : '';
    const serieCarta = carta.serie ? this.normalizarParaBusqueda(carta.serie).toLowerCase() : '';

    if (textoLower.includes(nombreCarta)) puntuacion += 100;

    if (numeroCarta) {
      if (textoLower.includes(`#${numeroCarta}`)) puntuacion += 60;
      else if (textoLower.includes(`${numeroCarta}/`)) puntuacion += 50;
      else if (textoLower.includes(`-${numeroCarta}`)) puntuacion += 45;
      else if (textoLower.includes(` ${numeroCarta} `)) puntuacion += 40;
      else if (textoLower.includes(numeroCarta)) puntuacion += 20;
    }

    if (setCarta) {
      const palabrasSet = setCarta.split(' ');
      const coincidenciasSet = palabrasSet.filter(p => p.length > 2 && textoLower.includes(p)).length;
      puntuacion += Math.round((coincidenciasSet / palabrasSet.length) * 40);
    }

    if (serieCarta) {
      const palabrasSerie = serieCarta.split(' ');
      const coincidenciasSerie = palabrasSerie.filter(p => p.length > 2 && textoLower.includes(p)).length;
      puntuacion += Math.round((coincidenciasSerie / palabrasSerie.length) * 30);
    }

    if (textoLower.includes(nombreCarta) && numeroCarta && setCarta && textoLower.includes(setCarta)) {
      puntuacion += 75;
    }

    const penalizaciones = ['german', 'spanish', 'italian', 'french', 'portuguese'];
    penalizaciones.forEach(p => {
      if (textoLower.includes(p)) puntuacion -= 20;
    });

    if (textoLower.match(/\b(19|20)\d{2}\b/)) {
      puntuacion -= 10;
    }

    return puntuacion;
  }

  async buscarCarta(carta) {
  try {
    const searchURL = this.construirURLBusqueda(carta);
    const response = await this.httpGet(searchURL);
    const $ = cheerio.load(response.data);
    const finalURL = response?.request?.res?.responseUrl || searchURL;
    const pageTitle = $('title').first().text().trim();

    // PriceCharting puede redirigir directamente al detalle de la carta.
    if (finalURL.includes('/game/') || /prices\s*\|/i.test(pageTitle)) {
      const urlCanonica = this.canonicalizarUrlPriceCharting(finalURL);
      console.log(`↪️ Redirección directa a ficha de carta en PriceCharting: ${urlCanonica}`);
      return await this.obtenerPreciosDetallados(urlCanonica, carta);
    }

    let mejorCoincidencia = null;
    let mejorPuntuacion = 0;

    console.log(`🔍 Buscando coincidencias para: ${carta.nombre} #${carta.numero} (${carta.set})`);

    let filas = $('#games_table tbody tr');
    // Fallback para layouts donde ya no existe #games_table
    if (!filas || filas.length === 0) {
      filas = $('table tbody tr').filter((_, tr) => {
        const href = $(tr).find('a[href*="/game/"]').first().attr('href');
        return !!href;
      });
    }

    filas.slice(0, this.maxSearchRows).each((i, fila) => {
      const $fila = $(fila);
      const enlaceCarta =
        $fila.find('td:first-child a[href*="/game/"]').attr('href') ||
        $fila.find('a[href*="/game/"]').first().attr('href');
      if (!enlaceCarta) return;

      const textoFila = $fila.text().trim();
      const htmlFila = $fila.html();

      // Mostrar información útil para debug
      console.log(`🧪 Fila ${i + 1}:`);
      console.log(`   📄 Texto fila: ${textoFila}`);
      console.log(`   🔗 Enlace: ${enlaceCarta}`);

      // CALCULA PUNTUACIÓN INDEPENDIENTE DE VERIFICACIÓN
      const puntuacion = this.calcularPuntuacionCoincidencia(textoFila, carta);
      console.log(`   📊 Puntuación: ${puntuacion}`);

      if (puntuacion > mejorPuntuacion) {
        mejorPuntuacion = puntuacion;
        mejorCoincidencia = enlaceCarta;
      }
    });

    if (!mejorCoincidencia) {
      console.log(`❌ No se encontró coincidencia razonable para ${carta.nombre}`);
      return null;
    }

    const urlCompleta = mejorCoincidencia.startsWith('http') ? mejorCoincidencia : `${this.baseURL}${mejorCoincidencia}`;
    const urlCanonica = this.canonicalizarUrlPriceCharting(urlCompleta);
    return await this.obtenerPreciosDetallados(urlCanonica, carta);

  } catch (error) {
    console.error(`❌ Error al buscar en PriceCharting para ${carta.nombre}:`, error.message);
    return null;
  }
}


  async obtenerPreciosDetallados(url, carta) {
    try {
      const urlCanonica = this.canonicalizarUrlPriceCharting(url);
      console.log(`📊 Obteniendo precio de: ${urlCanonica}`);
      
      const response = await this.httpGet(urlCanonica);
      const $ = cheerio.load(response.data);

      // Buscar "Ungraded" en cualquier celda TD
      let precioEncontrado = null;
      
      $('td').each((i, celda) => {
        const textoCelda = $(celda).text().trim();
        
        if (textoCelda.toLowerCase().includes('ungraded')) {
          console.log(`✅ Encontrado Ungraded: "${textoCelda}"`);
          
          // Buscar el precio en la misma fila o celdas cercanas
          const $fila = $(celda).parent('tr');
          $fila.find('td').each((j, celdaPrecio) => {
            const textoPrecio = $(celdaPrecio).text().trim();
            const precio = this.extraerPrecio(textoPrecio);
            
            if (precio && precio > 0) {
              console.log(`💰 Precio encontrado: $${precio}`);
              precioEncontrado = precio;
              return false; // Salir del loop interno
            }
          });
          
          if (precioEncontrado) return false; // Salir del loop externo
        }
      });

      return { ungraded: precioEncontrado, url: urlCanonica };

    } catch (error) {
      console.error(`❌ Error al obtener precio:`, error.message);
      return { ungraded: null, url: this.canonicalizarUrlPriceCharting(url) };
    }
  }

  extraerPrecio(texto) {
    if (!texto) return null;
    
    // Buscar cualquier número que parezca un precio
    const patrones = [
      /\$(\d+\.?\d*)/,    // $12.34
      /(\d+\.\d{2})/,     // 12.34
      /(\d+)/             // 12
    ];
    
    for (const patron of patrones) {
      const match = texto.match(patron);
      if (match) {
        const precio = parseFloat(match[1]);
        if (!isNaN(precio) && precio > 0 && precio < 10000) {
          return precio;
        }
      }
    }
    
    return null;
  }

  async actualizarPreciosCartaDesdeURL(carta) {
    if (!carta || !carta.urlPriceCharting) return null;
    return await this.obtenerPreciosDetallados(carta.urlPriceCharting, carta);
  }

  async actualizarPreciosCarta(carta) {
    try {
      console.log(`🚀 [DEBUG] Iniciando actualización de precios para: ${carta.nombre} (#${carta.numero}, ${carta.set})`);
      
      // Si la carta ya tiene una URL de PriceCharting, usar esa
      if (carta.urlPriceCharting) {
        console.log(`🔗 [DEBUG] Usando URL existente: ${carta.urlPriceCharting}`);
        const precios = await this.obtenerPreciosDetallados(carta.urlPriceCharting, carta);
        
        if (precios && precios.ungraded !== null) {
          console.log(`✅ [SUCCESS] Precio encontrado: $${precios.ungraded}`);
          return {
            precio: precios.ungraded,
            url: precios.url,
            fechaActualizacion: new Date()
          };
        }
      }
      
      // Si no tiene URL o no se encontró precio, buscar en PriceCharting
      console.log(`🔍 [DEBUG] Buscando carta en PriceCharting...`);
      const precios = await this.buscarCarta(carta);
      
      if (precios && precios.ungraded !== null) {
        console.log(`✅ [SUCCESS] Precio encontrado: $${precios.ungraded}`);
        return {
          precio: precios.ungraded,
          url: precios.url,
          fechaActualizacion: new Date()
        };
      } else {
        console.log(`❌ [DEBUG] No se pudo obtener precio para ${carta.nombre}`);
        return {
          precio: null,
          url: carta.urlPriceCharting || null,
          fechaActualizacion: new Date(),
          noEncontrado: true
        };
      }
      
    } catch (error) {
      console.error(`❌ Error al actualizar precios:`, error.message);
      return null;
    }
  }
}

module.exports = new PriceChartingService();