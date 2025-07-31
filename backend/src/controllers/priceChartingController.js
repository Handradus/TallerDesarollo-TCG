const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');
const priceChartingService = require('../services/priceChartingService');

const enProcesoPriceCharting = new Set(); // Para evitar consultas simultáneas

async function obtenerPreciosPriceCharting(req, res) {
  const { id } = req.params;
  const { forzar } = req.query; // ?forzar=true para forzar actualización

  // Validar que el ID sea un número válido
  const cartaId = parseInt(id);
  if (isNaN(cartaId) || cartaId <= 0) {
    console.error(`❌ [obtenerPreciosPriceCharting] ID inválido recibido: "${id}"`);
    return res.status(400).json({ 
      error: "ID de carta inválido",
      detalles: `El ID "${id}" no es un número válido` 
    });
  }

  if (enProcesoPriceCharting.has(cartaId)) {
    return res.status(429).json({ error: "Consulta de precios en proceso para esta carta." });
  }

  enProcesoPriceCharting.add(cartaId);
  console.log(`🟢 [obtenerPreciosPriceCharting] Ejecutando para carta id=${cartaId}`);

  try {
    const cartaRepo = AppDataSource.getRepository(Carta);
    const carta = await cartaRepo.findOneBy({ id: cartaId });
    
    if (!carta) {
      return res.status(404).json({ error: "Carta no encontrada" });
    }

    // Verificar si ya tenemos precios recientes (menos de 24 horas)
    const ahora = new Date();
    const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    
    const tienePrecios = carta.precioPriceCharting;
    const preciosRecientes = carta.fechaActualizacionPrecios && 
                           new Date(carta.fechaActualizacionPrecios) > hace24Horas;

    // Si tenemos precios recientes y no se fuerza la actualización, devolver los existentes
    if (tienePrecios && preciosRecientes && !forzar) {
      console.log(`✅ Devolviendo precios existentes para carta id=${id}`);
      return res.json({
        actualizado: false,
        desde_cache: true,
        precioPriceCharting: carta.precioPriceCharting,
        fechaActualizacion: carta.fechaActualizacionPrecios,
        mensaje: "Precio obtenido desde caché (menos de 24 horas)"
      });
    }

    // Consultar precios en PriceCharting
    console.log(`🔍 Consultando precios en PriceCharting para: ${carta.nombre}`);
    const resultado = await priceChartingService.actualizarPreciosCarta(carta);
    
    // Actualizar la carta en la base de datos si se encontraron precios
    if (resultado && resultado.precio !== null) {
      carta.precioPriceCharting = resultado.precio;
      carta.urlPriceCharting = resultado.url;
      carta.fechaActualizacionPrecios = new Date();
      
      await cartaRepo.save(carta);
      console.log(`💾 Precio actualizado en BD para carta id=${id}`);
    }

    const respuesta = {
      actualizado: resultado && resultado.precio !== null,
      desde_cache: false,
      precioPriceCharting: resultado ? resultado.precio : null,
      fechaActualizacion: carta.fechaActualizacionPrecios,
      url: resultado ? resultado.url : null,
      mensaje: resultado ? "Precio encontrado en PriceCharting" : "No se encontró precio en PriceCharting"
    };

    console.log(`✅ [obtenerPreciosPriceCharting] Finalizado para carta id=${cartaId}`);
    res.json(respuesta);

  } catch (error) {
    console.error("❌ Error al obtener precios de PriceCharting:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      mensaje: error.message 
    });
  } finally {
    enProcesoPriceCharting.delete(cartaId);
  }
}

module.exports = {
  obtenerPreciosPriceCharting
};
