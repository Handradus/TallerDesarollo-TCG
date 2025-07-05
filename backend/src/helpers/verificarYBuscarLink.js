const { AppDataSource } = require('../data-source');
const CartaLink = require('../entities/CartaLink');
const { buscarEnTiendaShopify, buscarEnTiendaLevelUp } = require('./buscadores');

async function verificarYBuscarLink(carta, tienda) {
  console.log(`✅ Ejecutando verificación con cheerio para carta "${carta.nombre}" en tienda "${tienda.nombre}"`);

  const linkRepo = AppDataSource.getRepository(CartaLink);

  let resultado = null;

  if (tienda.tipoBusqueda === 'shopify') {
    resultado = await buscarEnTiendaShopify(tienda, carta);
  } else if (tienda.tipoBusqueda === 'levelup') {
    resultado = await buscarEnTiendaLevelUp(tienda, carta);
  } else {
    console.warn(`⚠️ Tipo de tienda desconocido: ${tienda.tipoBusqueda}`);
  }

  if (resultado && resultado.url) {
    const nuevoLink = linkRepo.create({
      url: resultado.url,
      verificada: resultado.verificada,
      carta: { id: carta.id },
      tienda: { id: tienda.id }
    });

    await linkRepo.save(nuevoLink);
  } else {
    console.warn(`⚠️ Falló verificación en ${tienda.nombre}: no se encontró URL`);
  }
}

module.exports = { verificarYBuscarLink };
