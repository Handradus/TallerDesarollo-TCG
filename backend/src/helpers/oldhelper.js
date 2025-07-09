const axios = require('axios');
const cheerio = require('cheerio');
const { AppDataSource } = require('../data-source');
const Tienda = require('../entities/Tienda');
const CartaLink = require('../entities/CartaLink');

const cartaLinkRepo = AppDataSource.getRepository(CartaLink);

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
    const res = await axios.head(url);
    return res.status === 200;
  } catch {
    return false;
  }
}

async function buscarEnTiendaShopify(tienda, carta) {
  const nombre = normalizarParaUrl(carta.nombre);
  const numero = String(carta.numero).padStart(3, '0');
  const total = carta.printedTotal ? String(carta.printedTotal).padStart(3, '0') : "000";

  // Solo búsqueda directa
  const termino = `${carta.nombre} ${carta.numero}`;
  const urlBusqueda = tienda.urlBusqueda.replace('BUSQUEDA', encodeURIComponent(termino));
  console.log(`🔍 [${tienda.nombre}] URL de búsqueda: ${urlBusqueda}`);

  try {
    const res = await axios.get(urlBusqueda);
    const $ = cheerio.load(res.data);
    const enlaces = $('a[href^="/products/"]');

    console.log(`🔗 [${tienda.nombre}] Enlaces encontrados: ${enlaces.length}`);

    const numeroFraccion = `${numero}/${total}`;
    const nombreCarta = carta.nombre.toLowerCase();

    for (let i = 0; i < enlaces.length; i++) {
      const link = $(enlaces[i]);
      const texto = link.text().toLowerCase();

      const incluyeNombre = texto.includes(nombreCarta);
      const incluyeFraccion = texto.includes(numeroFraccion);

      if (incluyeNombre && incluyeFraccion) {
        const href = link.attr('href');
        if (href && await urlExiste(`${tienda.urlBase}${href}`)) {
          return { url: `${tienda.urlBase}${href}`, verificada: true };
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
    const numeroExacto = String(carta.numero).replace(/^0+/, '');
    const printedTotal = String(carta.printedTotal).replace(/^0+/, '');

    const regexNumero = new RegExp(`\\b0*${numeroExacto}[-/]?0*${printedTotal}(\\b|[-])`, 'i');

    for (let i = 0; i < enlaces.length; i++) {
      const link = $(enlaces[i]);
      const href = link.attr('href') || "";
      const textoHref = href.toLowerCase();

      console.log(`🔎 Evaluando href="${href}"`);

      const nombreCoincide = textoHref.includes(nombreNormalizado);
      const numeroCoincide = regexNumero.test(textoHref);

      if (nombreCoincide && numeroCoincide) {
        const urlCompleta = href.startsWith("http") ? href : `${tienda.urlBase}${href}`;
        if (await urlExiste(urlCompleta)) {
          console.log(`✅ Coincidencia encontrada: ${urlCompleta}`);
          return { url: urlCompleta, verificada: true };
        }
      }
    }

    console.log(`⛔ No se encontró coincidencia exacta en ${tienda.nombre}`);
  } catch (error) {
    console.error(`❌ Error buscando en tienda ${tienda.nombre}:`, error.message);
  }

  return null;
}


async function generarURLsValidas(carta) {
  const urlsValidas = {};

  const tiendaRepo = AppDataSource.getRepository(Tienda);
  const tiendas = await tiendaRepo.findBy({ activo: true });

  console.log(`🧾 Buscando carta: "${carta.nombre}" N°${carta.numero} en ${tiendas.length} tiendas...`);

  for (const tienda of tiendas) {
    console.log(`📦 Procesando tienda: ${tienda.nombre} (${tienda.tipoBusqueda})`);
    let resultado = null;

    switch (tienda.tipoBusqueda) {
      case 'shopify':
        resultado = await buscarEnTiendaShopify(tienda, carta);
        break;
      case 'levelup':
        resultado = await buscarEnTiendaLevelUp(tienda, carta);
        break;
      default:
        console.log(`❓ [${tienda.nombre}] Tipo de búsqueda no reconocido: ${tienda.tipoBusqueda}`);
        resultado = null;
        break;
    }

    urlsValidas[tienda.nombre] = resultado || {
      url: null,
      verificada: false,
    };
  }

  return urlsValidas;
}

module.exports = {
  generarURLsValidas,
};
