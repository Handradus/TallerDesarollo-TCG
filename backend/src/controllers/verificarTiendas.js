const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');
const CartaLink = require('../entities/CartaLink');
const Tienda = require('../entities/Tienda');
const { verificarYBuscarLink } = require('../helpers/verificarYBuscarLink');
const { consumeQuota } = require('../services/scrapingQuotaService');

const enProceso = new Set(); 
const CACHE_PRECIOS_POSITIVO_DIAS = Number(process.env.TIENDAS_CACHE_POSITIVO_DIAS || 10);
const CACHE_PRECIOS_NEGATIVO_HORAS = Number(process.env.TIENDAS_CACHE_NEGATIVO_HORAS || 72);

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

    
    const CACHE_PRECIOS_POSITIVO_DURACION = Math.max(1, CACHE_PRECIOS_POSITIVO_DIAS) * 24 * 60 * 60 * 1000;
    const CACHE_PRECIOS_NEGATIVO_DURACION = Math.max(1, CACHE_PRECIOS_NEGATIVO_HORAS) * 60 * 60 * 1000;
    const ahora = new Date();

    const obtenerDuracionCacheLink = (link) => {
      const esPositivo = Boolean(link.url) && link.verificada === true && link.disponible !== false;
      return esPositivo ? CACHE_PRECIOS_POSITIVO_DURACION : CACHE_PRECIOS_NEGATIVO_DURACION;
    };

    const linksRecientes = links.filter(link => {
      const tiempoTranscurrido = ahora - new Date(link.fechaGuardado);
      const duracionCache = obtenerDuracionCacheLink(link);
      return tiempoTranscurrido < duracionCache;
    });

    const idsTiendasConCacheReciente = new Set(linksRecientes.map(l => l.tienda.id));
    const tiendasPendientes = tiendas.filter(t => !idsTiendasConCacheReciente.has(t.id));

    if (tiendasPendientes.length > 0) {
      // Cualquier scraping (nueva o stale) cuenta como 1 consulta de scraping
      // Cache válido NO cuenta
      const quotaResult = await consumeQuota(req, 'scraping', 1);
      if (!quotaResult.ok) {
        // Cuota agotada: devolver los datos en caché aunque estén vencidos, con flag de aviso
        // (antes retornaba 429 y el frontend mostraba 0 tiendas sin explicación)
        // Nota: Si es admin, nunca llega aquí porque adminBypass=true siempre
        console.warn(`⚠️ Cuota de scraping agotada para carta "${carta.nombre}". Devolviendo datos en caché (posiblemente desactualizados).`);
        const resultado = {};
        for (const tienda of tiendas) {
          const link = links.find(l => l.tienda.id === tienda.id);
          resultado[tienda.nombre] = link
            ? {
                id: tienda.id,
                url: link.url,
                verificada: link.verificada,
                precio: link.precio || null,
                tipo: link.tipoProducto || null,
                disponible: link.disponible !== undefined ? link.disponible : true,
                cache_expirado: true
              }
            : {
                id: tienda.id,
                url: null,
                verificada: false,
                cache_expirado: true
              };
        }
        enProceso.delete(id);
        return res.json(resultado);
      }

      console.log(`🔍 Scraping de precios para carta "${carta.nombre}" (cache total: ${links.length}, recientes: ${linksRecientes.length}, pendientes: ${tiendasPendientes.length})`);
      console.log(`🎯 Iniciando búsqueda SOLO en ${tiendasPendientes.length} tiendas pendientes...`);

      const linksStaleExistentes = links.filter(l => tiendasPendientes.some(t => t.id === l.tienda.id));
      if (linksStaleExistentes.length > 0) {
        await linkRepo.remove(linksStaleExistentes);
        console.log(`🧹 Limpiados ${linksStaleExistentes.length} links stale de tiendas pendientes`);
      }

      const promesasVerificacion = tiendasPendientes.map(async (tienda) => {
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

      console.log(`💾 Scraping de precios completado para carta "${carta.nombre}" - ${links.length} links guardados (positivos ${CACHE_PRECIOS_POSITIVO_DIAS} días, negativos ${CACHE_PRECIOS_NEGATIVO_HORAS} horas)`);
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
            tipo: link.tipoProducto || null,
            disponible: link.disponible !== undefined ? link.disponible : true
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

    const quotaResult = await consumeQuota(req, 'scraping', 1);
    if (!quotaResult.ok) {
      return res.status(quotaResult.status || 429).json({ error: quotaResult.message });
    }

    
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
            tipo: link.tipoProducto || null,
            disponible: link.disponible !== undefined ? link.disponible : true
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
            disponible: link.disponible !== undefined ? link.disponible : true,
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
