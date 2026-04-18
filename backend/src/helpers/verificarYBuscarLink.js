const { AppDataSource } = require('../data-source');
const CartaLink = require('../entities/CartaLink');
const HistorialPrecioTienda = require('../entities/HistorialPrecioTienda');
const { buscarEnTiendaShopify, buscarEnTiendaLevelUp } = require('./buscadores');

async function verificarYBuscarLink(carta, tienda) {
  const linkRepo = AppDataSource.getRepository(CartaLink);
  const historialPrecioRepo = AppDataSource.getRepository(HistorialPrecioTienda);

  const registrarSnapshotPrecio = async ({ precio, disponible, url, tipoProducto, fuente }) => {
    const snapshot = historialPrecioRepo.create({
      precio: precio ?? null,
      disponible: disponible !== undefined ? disponible : true,
      url: url || null,
      tipoProducto: tipoProducto || null,
      fuente: fuente || 'scraping',
      carta: { id: carta.id },
      tienda: { id: tienda.id },
    });

    await historialPrecioRepo.save(snapshot);
  };
  
  console.log(`🔍 [ADMIN DEBUG] Iniciando búsqueda: "${carta.nombre}" en ${tienda.nombre}`);
  console.log(`🔍 [ADMIN DEBUG] Configuración tienda:`, {
    id: tienda.id,
    nombre: tienda.nombre,
    tipoBusqueda: tienda.tipoBusqueda,
    urlBase: tienda.urlBase,
    urlBusqueda: tienda.urlBusqueda
  });

  let resultado = null;
  const tiempoInicio = Date.now();

  if (tienda.tipoBusqueda === 'shopify') {
    console.log(`🛒 [ADMIN DEBUG] Llamando buscarEnTiendaShopify...`);
    resultado = await buscarEnTiendaShopify(tienda, carta);
  } else if (tienda.tipoBusqueda === 'levelup') {
    console.log(`🎮 [ADMIN DEBUG] Llamando buscarEnTiendaLevelUp...`);
    resultado = await buscarEnTiendaLevelUp(tienda, carta);
  } else {
    console.log(`❌ [${tienda.nombre}] Tipo de búsqueda desconocido: ${tienda.tipoBusqueda}`);
    return null;
  }

  const tiempoTotal = Date.now() - tiempoInicio;
  console.log(`⏱️ [ADMIN DEBUG] Búsqueda en ${tienda.nombre} tardó ${tiempoTotal}ms`);

  console.log(`📊 [ADMIN DEBUG] Resultado de búsqueda:`, resultado);

  // Log de resultado final con más detalle
  if (resultado && resultado.url) {
    console.log(`✅ [${tienda.nombre}] ENCONTRADO: "${carta.nombre}" → ${resultado.url}`);
    console.log(`💰 [${tienda.nombre}] Precio encontrado: ${resultado.precio}`);
    
    const nuevoLink = linkRepo.create({
      url: resultado.url,
      verificada: resultado.verificada,
      disponible: resultado.disponible !== undefined ? resultado.disponible : true,
      tipoProducto: resultado.tipoProducto || null,
      precio: resultado.precio || null,
      carta: { id: carta.id },
      tienda: { id: tienda.id }
    });

    console.log(`💾 [ADMIN DEBUG] Guardando link en base de datos...`);
    await linkRepo.save(nuevoLink);
    console.log(`💾 [ADMIN DEBUG] Link guardado exitosamente`);

    await registrarSnapshotPrecio({
      precio: resultado.precio || null,
      disponible: resultado.disponible !== undefined ? resultado.disponible : true,
      url: resultado.url,
      tipoProducto: resultado.tipoProducto || null,
      fuente: 'scraping-positivo',
    });
    console.log(`📈 [${tienda.nombre}] Snapshot de precio guardado`);
  } else if (resultado && resultado.temporalError) {
    console.warn(`⚠️ [${tienda.nombre}] Error temporal de transporte, no se guarda caché negativo: ${resultado.motivo || 'sin detalle'}`);
  } else {
    console.log(`❌ [${tienda.nombre}] NO ENCONTRADO: "${carta.nombre}"`);

    // Guardar cache negativo para evitar re-scraping en cada refresh
    // dentro de la ventana de 24h del controlador.
    const cacheNegativo = linkRepo.create({
      url: '',
      verificada: false,
      disponible: false,
      tipoProducto: resultado?.tipoProducto || 'no-encontrado',
      precio: null,
      carta: { id: carta.id },
      tienda: { id: tienda.id }
    });

    await linkRepo.save(cacheNegativo);
    console.log(`💾 [ADMIN DEBUG] Cache negativo guardado para ${tienda.nombre}`);

    await registrarSnapshotPrecio({
      precio: null,
      disponible: false,
      url: null,
      tipoProducto: resultado?.tipoProducto || 'no-encontrado',
      fuente: 'scraping-negativo',
    });
    console.log(`📉 [${tienda.nombre}] Snapshot negativo guardado`);
  }

  return resultado;
}

module.exports = { verificarYBuscarLink };
