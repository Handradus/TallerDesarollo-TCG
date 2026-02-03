const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');
const CartaLink = require('../entities/CartaLink');
const Tienda = require('../entities/Tienda');
const { verificarYBuscarLink } = require('../helpers/verificarYBuscarLink');

const enProceso = new Set(); 

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

    const tiendas = await tiendaRepo.find({ 
      where: { activo: true }
    });
    console.log(`📊 Total de tiendas activas encontradas: ${tiendas.length}`);
    tiendas.forEach(t => console.log(`   - ${t.nombre} (${t.tipoBusqueda})`));

    
    const CACHE_PRECIOS_DURACION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    const ahora = new Date();
    const linksRecientes = links.filter(link => {
      const tiempoTranscurrido = ahora - new Date(link.fechaGuardado);
      return tiempoTranscurrido < CACHE_PRECIOS_DURACION;
    });

    
    if (linksRecientes.length === 0) {
      console.log(`🔍 Scraping de precios para carta "${carta.nombre}" (cache: ${links.length} links, recientes: ${linksRecientes.length})`);
      console.log(`🎯 Iniciando búsqueda en ${tiendas.length} tiendas activas...`);

      
      if (links.length > 0) {
        await linkRepo.remove(links);
        console.log(`🧹 Limpiados ${links.length} links de precios antiguos`);
      }

      
      const promesasVerificacion = tiendas.map(async (tienda) => {
        console.log(`📦 Procesando tienda: ${tienda.nombre} (${tienda.tipoBusqueda})`);
        try {
          return await verificarYBuscarLink(carta, tienda);
        } catch (err) {
          console.warn(`⚠️ Falló verificación en ${tienda.nombre}:`, err.message);
          return null;
        }
      });

      
      await Promise.allSettled(promesasVerificacion);

     
      links = await linkRepo.find({
        where: { carta: { id: carta.id } },
        relations: ['tienda']
      });

      console.log(`💾 Scraping de precios completado para carta "${carta.nombre}" - ${links.length} links guardados (válidos por 24 horas)`);
    } else {
      console.log(`⚡ Usando cache de precios para carta "${carta.nombre}" - ${linksRecientes.length} links recientes`);
      links = linksRecientes;
    }

    
    const resultado = {};
    for (const tienda of tiendas) {
      const link = links.find(l => l.tienda.id === tienda.id);
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

    console.log(`✅ [obtenerTiendas] Finalizado para carta id=${id}`);
    res.json(resultado);

  } catch (error) {
    console.error("❌ Error al obtener links de tiendas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    enProceso.delete(id);
  }
}


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

    
    const linksExistentes = await linkRepo.find({
      where: { carta: { id: carta.id } }
    });

    if (linksExistentes.length > 0) {
      await linkRepo.remove(linksExistentes);
      console.log(`🧹 Eliminados ${linksExistentes.length} links existentes para refresh`);
    }

    const tiendas = await tiendaRepo.find({ 
      where: { activo: true }
    });
    console.log(`📊 [REFRESH] Total de tiendas activas encontradas: ${tiendas.length}`);

    
    console.log(`🔍 Ejecutando nuevo scraping para carta "${carta.nombre}"`);
    console.log(`🎯 [REFRESH] Iniciando búsqueda en ${tiendas.length} tiendas activas...`);
    
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

    
    const nuevosLinks = await linkRepo.find({
      where: { carta: { id: carta.id } },
      relations: ['tienda']
    });

    
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

// Función específica para admin: SIEMPRE actualiza precios (sin cache)
async function obtenerTiendasAdmin(req, res) {
  console.log('🚨 [DEBUG] obtenerTiendasAdmin fue llamada!');
  console.log('🚨 [DEBUG] req.params:', req.params);
  
  const { id } = req.params;
  const adminKey = `admin-${id}`;

  if (enProceso.has(adminKey)) {
    return res.status(429).json({ error: "Actualización admin en proceso para esta carta." });
  }

  enProceso.add(adminKey);
  console.log(`👑 [obtenerTiendasAdmin] FORZANDO actualización para carta id=${id}`);

  try {
    const cartaRepo = AppDataSource.getRepository(Carta);
    const linkRepo = AppDataSource.getRepository(CartaLink);
    const tiendaRepo = AppDataSource.getRepository(Tienda);

    console.log(`🔍 [ADMIN DEBUG] Buscando carta con ID: ${id} (tipo: ${typeof id})`);
    const idNumerico = parseInt(id);
    console.log(`🔍 [ADMIN DEBUG] ID parseado a número: ${idNumerico}`);
    
    const carta = await cartaRepo.findOneBy({ id: idNumerico });
    if (!carta) {
      console.log(`❌ [ADMIN DEBUG] Carta con ID ${id} NO ENCONTRADA en BD`);
      return res.status(404).json({ error: "Carta no encontrada" });
    }

    console.log(`✅ [ADMIN DEBUG] Carta encontrada:`, {
      id: carta.id,
      nombre: carta.nombre,
      numero: carta.numero,
      set: carta.set,
      expansion: carta.expansion
    });

    // Eliminar TODOS los links existentes (sin importar la fecha)
    const linksExistentes = await linkRepo.find({
      where: { carta: { id: carta.id } }
    });

    if (linksExistentes.length > 0) {
      await linkRepo.remove(linksExistentes);
      console.log(`🧹 [ADMIN] Eliminados ${linksExistentes.length} links existentes para forzar actualización`);
    }

    const tiendas = await tiendaRepo.find({ 
      where: { activo: true }
    });
    console.log(`📊 [ADMIN] Total de tiendas activas encontradas: ${tiendas.length}`);
    
    // Mostrar configuración de las primeras 3 tiendas para debug
    console.log(`🔧 [ADMIN DEBUG] Configuración de primeras tiendas:`);
    for (let i = 0; i < Math.min(3, tiendas.length); i++) {
      const t = tiendas[i];
      console.log(`   ${i+1}. ${t.nombre} (${t.tipoBusqueda}):`);
      console.log(`      urlBase: "${t.urlBase}"`);
      console.log(`      urlBusqueda: "${t.urlBusqueda}"`);
      console.log(`      activo: ${t.activo}`);
    }
    
    console.log(`🎯 [ADMIN] FORZANDO búsqueda en TODAS las ${tiendas.length} tiendas...`);

    // SIEMPRE hacer scraping completo en todas las tiendas
    const promesasVerificacion = tiendas.map(async (tienda) => {
      console.log(`📦 [ADMIN] Procesando tienda: ${tienda.nombre} (${tienda.tipoBusqueda})`);
      try {
        return await verificarYBuscarLink(carta, tienda);
      } catch (err) {
        console.warn(`⚠️ [ADMIN] Falló verificación en ${tienda.nombre}:`, err.message);
        return null;
      }
    });

    await Promise.allSettled(promesasVerificacion);

    // Obtener los nuevos links
    const nuevosLinks = await linkRepo.find({
      where: { carta: { id: carta.id } },
      relations: ['tienda']
    });

    console.log(`💾 [ADMIN] Scraping FORZADO completado para carta "${carta.nombre}" - ${nuevosLinks.length} links guardados`);

    // Preparar resultado
    const resultado = {};
    for (const tienda of tiendas) {
      const link = nuevosLinks.find(l => l.tienda.id === tienda.id);
      resultado[tienda.nombre] = link
        ? {
            id: tienda.id, 
            url: link.url,
            verificada: link.verificada,
            precio: link.precio || null,
            tipo: link.tipoProducto || null,
            fechaActualizacion: link.fechaGuardado
          }
        : {
            id: tienda.id, 
            url: null,
            verificada: false,
            fechaActualizacion: new Date()
          };
    }

    console.log(`✅ [obtenerTiendasAdmin] Actualización FORZADA finalizada para carta id=${id}`);
    res.json({ 
      message: "Precios actualizados forzadamente (admin)", 
      tiendas: resultado,
      timestamp: new Date(),
      totalTiendas: tiendas.length,
      linksEncontrados: nuevosLinks.length
    });

  } catch (error) {
    console.error("❌ Error en actualización admin de tiendas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    enProceso.delete(adminKey);
  }
}

module.exports = {
  obtenerTiendas,
  refrescarTiendas,
  obtenerTiendasAdmin
};
