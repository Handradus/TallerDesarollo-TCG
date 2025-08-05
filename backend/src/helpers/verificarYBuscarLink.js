const { AppDataSource } = require('../data-source');
const CartaLink = require('../entities/CartaLink');
const { buscarEnTiendaShopify, buscarEnTiendaLevelUp } = require('./buscadores');

async function verificarYBuscarLink(carta, tienda) {
  console.log(`✅ Ejecutando verificación con cheerio para carta "${carta.nombre}" en tienda "${tienda.nombre}"`);

  const linkRepo = AppDataSource.getRepository(CartaLink);

  let resultado = null;

  console.log(`🔍 Tipo de búsqueda: ${tienda.tipoBusqueda}`);

  if (tienda.tipoBusqueda === 'shopify') {
    console.log(`🛒 Ejecutando buscarEnTiendaShopify...`);
    resultado = await buscarEnTiendaShopify(tienda, carta);
    console.log(`🛒 Resultado de Shopify:`, resultado);
  } else if (tienda.tipoBusqueda === 'levelup') {
    console.log(`🎮 Ejecutando buscarEnTiendaLevelUp...`);
    resultado = await buscarEnTiendaLevelUp(tienda, carta);
    console.log(`🎮 Resultado de LevelUp:`, resultado);
  } else {
    console.warn(`⚠️ Tipo de tienda desconocido: ${tienda.tipoBusqueda}`);
    return null;
  }

  if (resultado && resultado.url) {
    console.log(`✅ URL encontrada, guardando en BD...`);
    const nuevoLink = linkRepo.create({
      url: resultado.url,
      verificada: resultado.verificada,
      precio: resultado.precio || null, // ← Agregar el precio aquí
      carta: { id: carta.id },
      tienda: { id: tienda.id }
    });

    await linkRepo.save(nuevoLink);
    console.log(`💾 Link guardado con precio: ${resultado.precio || 'sin precio'} para "${carta.nombre}" en "${tienda.nombre}"`);
  } else {
    console.warn(`⚠️ Falló verificación en ${tienda.nombre}: no se encontró URL o resultado es null`);
    console.log(`🐛 Detalle del resultado:`, resultado);
  }
}

module.exports = { verificarYBuscarLink };

module.exports = { verificarYBuscarLink };
