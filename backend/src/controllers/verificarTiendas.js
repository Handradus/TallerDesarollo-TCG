const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');
const CartaLink = require('../entities/CartaLink');
const Tienda = require('../entities/Tienda');
const { verificarYBuscarLink } = require('../helpers/verificarYBuscarLink');

const enProceso = new Set(); // <- Asegúrate de tener esto arriba

async function obtenerTiendas(req, res) {
  const { id } = req.params;

  if (enProceso.has(id)) {
    return res.status(429).json({ error: "Scraping en proceso para esta carta." });
  }

  enProceso.add(id);
  console.log(`🟢 [obtenerTiendas] Ejecutando para carta id=${id}`);

  try {
    const cartaRepo = AppDataSource.getRepository(Carta);
    const linkRepo = AppDataSource.getRepository(CartaLink);
    const tiendaRepo = AppDataSource.getRepository(Tienda);

    const carta = await cartaRepo.findOneBy({ id: parseInt(id) });
    if (!carta) return res.status(404).json({ error: "Carta no encontrada" });

    let links = await linkRepo.find({
      where: { carta: { id: carta.id } },
      relations: ['tienda']
    });

    const tiendas = await tiendaRepo.findBy({ activo: true });

    // Para PRECIOS: Verificar si los links son recientes (vencen en 2 horas)
    const CACHE_PRECIOS_DURACION = 2 * 60 * 60 * 1000; // 2 horas en milisegundos
    const ahora = new Date();
    const linksRecientes = links.filter(link => {
      const tiempoTranscurrido = ahora - new Date(link.fechaGuardado);
      return tiempoTranscurrido < CACHE_PRECIOS_DURACION;
    });

    // Si no hay links recientes (precios caducados), hacer scraping
    if (linksRecientes.length === 0) {
      console.log(`🔍 Scraping de precios para carta "${carta.nombre}" (cache: ${links.length} links, recientes: ${linksRecientes.length})`);

      // Limpiar links antiguos de precios
      if (links.length > 0) {
        await linkRepo.remove(links);
        console.log(`🧹 Limpiados ${links.length} links de precios antiguos`);
      }

      // Ejecutar verificaciones en paralelo
      const promesasVerificacion = tiendas.map(async (tienda) => {
        console.log(`📦 Procesando tienda: ${tienda.nombre} (${tienda.tipoBusqueda})`);
        try {
          return await verificarYBuscarLink(carta, tienda);
        } catch (err) {
          console.warn(`⚠️ Falló verificación en ${tienda.nombre}:`, err.message);
          return null;
        }
      });

      // Ejecutar todas las verificaciones en paralelo
      await Promise.allSettled(promesasVerificacion);

      // Volver a consultar los links luego del scraping
      links = await linkRepo.find({
        where: { carta: { id: carta.id } },
        relations: ['tienda']
      });

      console.log(`💾 Scraping de precios completado para carta "${carta.nombre}" - ${links.length} links guardados (válidos por 2 horas)`);
    } else {
      console.log(`⚡ Usando cache de precios para carta "${carta.nombre}" - ${linksRecientes.length} links recientes`);
      links = linksRecientes;
    }

    // Armar respuesta por tienda
    const resultado = {};
    for (const tienda of tiendas) {
      const link = links.find(l => l.tienda.id === tienda.id);
      resultado[tienda.nombre] = link
        ? {
            id: tienda.id, // ← Añadir ID de la tienda
            url: link.url,
            verificada: link.verificada,
            precio: link.precio || null,
            tipo: link.tipoProducto || null
          }
        : {
            id: tienda.id, // ← Añadir ID de la tienda
            url: null,
            verificada: false
          };
    }

    console.log(`✅ [obtenerTiendas] Finalizado para carta id=${id}`);
    res.json(resultado);

  } catch (error) {
    console.error("❌ Error al obtener links de tiendas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    enProceso.delete(id);
  }
}

// Función opcional para refrescar datos de una carta específica
async function refrescarTiendas(req, res) {
  const { id } = req.params;

  if (enProceso.has(id)) {
    return res.status(429).json({ error: "Scraping en proceso para esta carta." });
  }

  enProceso.add(id);
  console.log(`🔄 [refrescarTiendas] Ejecutando refresh para carta id=${id}`);

  try {
    const cartaRepo = AppDataSource.getRepository(Carta);
    const linkRepo = AppDataSource.getRepository(CartaLink);
    const tiendaRepo = AppDataSource.getRepository(Tienda);

    const carta = await cartaRepo.findOneBy({ id: parseInt(id) });
    if (!carta) return res.status(404).json({ error: "Carta no encontrada" });

    // Eliminar todos los links existentes para forzar nuevo scraping
    const linksExistentes = await linkRepo.find({
      where: { carta: { id: carta.id } }
    });

    if (linksExistentes.length > 0) {
      await linkRepo.remove(linksExistentes);
      console.log(`🧹 Eliminados ${linksExistentes.length} links existentes para refresh`);
    }

    const tiendas = await tiendaRepo.findBy({ activo: true });

    // Ejecutar nuevo scraping
    console.log(`🔍 Ejecutando nuevo scraping para carta "${carta.nombre}"`);
    
    const promesasVerificacion = tiendas.map(async (tienda) => {
      console.log(`📦 Refrescando tienda: ${tienda.nombre} (${tienda.tipoBusqueda})`);
      try {
        return await verificarYBuscarLink(carta, tienda);
      } catch (err) {
        console.warn(`⚠️ Falló refresh en ${tienda.nombre}:`, err.message);
        return null;
      }
    });

    await Promise.allSettled(promesasVerificacion);

    // Obtener los nuevos links
    const nuevosLinks = await linkRepo.find({
      where: { carta: { id: carta.id } },
      relations: ['tienda']
    });

    // Armar respuesta
    const resultado = {};
    for (const tienda of tiendas) {
      const link = nuevosLinks.find(l => l.tienda.id === tienda.id);
      resultado[tienda.nombre] = link
        ? {
            id: tienda.id,
            url: link.url,
            verificada: link.verificada,
            precio: link.precio || null,
            tipo: link.tipoProducto || null
          }
        : {
            id: tienda.id,
            url: null,
            verificada: false
          };
    }

    console.log(`✅ [refrescarTiendas] Refresh completado para carta id=${id}`);
    res.json({ message: "Datos refrescados exitosamente", tiendas: resultado });

  } catch (error) {
    console.error("❌ Error al refrescar links de tiendas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    enProceso.delete(id);
  }
}

module.exports = {
  obtenerTiendas,
  refrescarTiendas
};
