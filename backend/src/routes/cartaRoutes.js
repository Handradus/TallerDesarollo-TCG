const express = require('express');
const router = express.Router();
const { AppDataSource } = require('../data-source');
const jwt = require('jsonwebtoken');
const User = require('../entities/User');
const { buscarCarta, buscarCartaAdmin } = require('../services/pokemonTCGService');
const { guardarCartasDesdeAPI } = require('../services/actualizacionBDService');
const { obtenerCartaDetalle } = require('../controllers/cartas.controller');
const { obtenerTiendas, refrescarTiendas, obtenerTiendasAdmin } = require('../controllers/verificarTiendas');
const { obtenerPreciosPriceCharting, obtenerHistorialPriceCharting } = require('../controllers/priceChartingController');
const { obtenerHistorialPreciosCarta } = require('../controllers/historialPreciosController');



router.get('/', async (req, res) => {
  let nombreRaw = req.query.nombre;
  const tipoBusqueda = req.query.tipo || 'carta'; // 'carta' por defecto
  
  if (nombreRaw) {
    // Normalizar separadores de fracciones: si hay dos números separados por espacio(s) o guion(es), convertirlos en fracción con barra "/"
    // Ej: "060 072" o "060-072" -> "060/072"
    nombreRaw = nombreRaw.trim().replace(/\b(\d{1,4})[\s-]+(\d{1,4})\b/g, '$1/$2');
  }

  console.log(`🟢 Llegó una búsqueda a /api/cartas con input normalizado: "${nombreRaw}" tipo: "${tipoBusqueda}"`);

  if (!AppDataSource.isInitialized) {
    console.error('La conexión a la base de datos no está inicializada');
    return res.status(500).json({ error: 'Base de datos no disponible' });
  }

  if (!nombreRaw) {
    return res.status(400).json({ error: 'Falta el parámetro ?nombre=' });
  }

  try {
    const resultadoFinal = await buscarCarta(nombreRaw, tipoBusqueda);

    console.log('Resultado final:', resultadoFinal.length);
    if (resultadoFinal.length === 0) {
      console.log('⚠️ No se encontraron cartas ni en la BD ni en la API');
    }

    res.json(resultadoFinal);
  } catch (err) {
    console.error('❌ Error al procesar /api/cartas:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/admin', async (req, res) => {
  let nombreRaw = req.query.nombre;
  const tipoBusqueda = req.query.tipo || 'carta'; // 'carta' por defecto
  const supertipo = req.query.supertipo;
  const origenBusqueda = req.query.origen || 'api'; // 'api' por defecto, 'bd' o 'ambos'

  if (nombreRaw) {
    // Normalizar separadores de fracciones: si hay dos números separados por espacio(s) o guion(es), convertirlos en fracción con barra "/"
    // Ej: "060 072" o "060-072" -> "060/072"
    nombreRaw = nombreRaw.trim().replace(/\b(\d{1,4})[\s-]+(\d{1,4})\b/g, '$1/$2');
  }

  console.log(`🔧 Llegó una búsqueda ADMIN a /api/cartas/admin con input normalizado: "${nombreRaw}" tipo: "${tipoBusqueda}" supertipo: "${supertipo}" origen: "${origenBusqueda}"`);

  if (!AppDataSource.isInitialized) {
    console.error('La conexión a la base de datos no está inicializada');
    return res.status(500).json({ error: 'Base de datos no disponible' });
  }

  if (!nombreRaw && !supertipo) {
    return res.status(400).json({ error: 'Falta el parámetro ?nombre= o ?supertipo=' });
  }

  try {
    const resultadoFinal = await buscarCartaAdmin(nombreRaw || '', tipoBusqueda, supertipo, origenBusqueda);

    console.log(`✅ Admin Search - Resultado final: ${resultadoFinal.length} cartas`);
    if (resultadoFinal.length === 0) {
      console.log('⚠️ No se encontraron cartas en la API de Pokémon TCG');
    }

    res.json(resultadoFinal);
  } catch (err) {
    console.error('❌ Error al procesar /api/cartas/admin:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Nueva ruta para actualizar BD con cartas de API
router.post('/actualizar-bd', async (req, res) => {
  console.log('💾 Recibida petición para actualizar BD con cartas de API');
  
  if (!AppDataSource.isInitialized) {
    console.error('La conexión a la base de datos no está inicializada');
    return res.status(500).json({ error: 'Base de datos no disponible' });
  }

  const { cartas } = req.body;

  if (!cartas || !Array.isArray(cartas)) {
    return res.status(400).json({ 
      error: 'Se requiere un array de cartas en el cuerpo de la petición',
      formato: { cartas: [{ nombre, numero, set, rareza, imagen, precio }] }
    });
  }

  if (cartas.length === 0) {
    return res.status(400).json({ error: 'El array de cartas está vacío' });
  }

  try {
    console.log(`📥 Procesando ${cartas.length} cartas para actualizar BD...`);
    const resultado = await guardarCartasDesdeAPI(cartas);
    
    console.log(`✅ Actualización completada:`);
    console.log(`   • Nuevas: ${resultado.resumen.totalNuevas}`);
    console.log(`   • Actualizadas: ${resultado.resumen.totalActualizadas}`);
    console.log(`   • Errores: ${resultado.resumen.totalErrores}`);

    res.status(200).json({
      mensaje: 'Actualización de BD completada',
      ...resultado
    });

  } catch (error) {
    console.error('❌ Error al actualizar BD:', error.message);
    res.status(500).json({ 
      error: 'Error interno al actualizar la base de datos',
      detalle: error.message 
    });
  }
});

router.get('/:id', obtenerCartaDetalle);
router.get('/:id/tiendas', obtenerTiendas);
router.get('/:id/precios-historial', obtenerHistorialPreciosCarta);
router.post('/:id/tiendas/refresh', refrescarTiendas); 
router.post('/:id/tiendas/admin-force-update', obtenerTiendasAdmin); // Nueva ruta para admin
router.get('/:id/precios-pricecharting/historial', obtenerHistorialPriceCharting);
router.get('/:id/precios-pricecharting', obtenerPreciosPriceCharting);

// Borrar caché de precios de tiendas para una carta (solo admin)
router.delete('/:id/tiendas/cache', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log(`🔍 [DELETE cache] Token present: ${!!token}`);
  if (!token) return res.status(401).json({ message: 'No token provided' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me');
    console.log(`✅ [DELETE cache] Token válido, userId: ${decoded.userId}, email: ${decoded.email}`);
  } catch (err) {
    console.error(`❌ [DELETE cache] Token inválido:`, err.message);
    return res.status(403).json({ message: 'Token inválido' });
  }

  try {
    const userRepo = AppDataSource.getRepository(User);
    const currentUser = await userRepo.findOne({
      where: [{ id: decoded.userId }, { email: decoded.email }]
    });

    console.log(`👤 [DELETE cache] User found: ${currentUser?.email}, role: ${currentUser?.role}`);
    
    if (!currentUser || currentUser.role !== 'admin') {
      console.warn(`❌ [DELETE cache] User is not admin. Role: ${currentUser?.role}`);
      return res.status(403).json({ message: 'Solo para admins' });
    }
    console.log(`👑 [DELETE cache] Admin confirmed: ${currentUser.email}`);
  } catch (error) {
    console.error('Error validando rol de admin:', error);
    return res.status(500).json({ error: 'Error validando permisos', detalle: error.message });
  }

  const { id } = req.params;
  try {
    const CartaLink = require('../entities/CartaLink');
    const linkRepo = AppDataSource.getRepository(CartaLink);
    const cartaId = parseInt(id);
    const links = await linkRepo.find({
      where: { carta: { id: cartaId } },
      relations: ['carta', 'tienda']
    });

    if (links.length === 0) {
      return res.json({ mensaje: 'No había caché de tiendas para borrar', affected: 0 });
    }

    await linkRepo.remove(links);
    
    // Eliminar también el marcador diario para permitir volver a scrapear hoy
    const DailyCardScraping = require('../entities/DailyCardScraping');
    const markerRepo = AppDataSource.getRepository(DailyCardScraping);
    await markerRepo.delete({ cartaId: cartaId });

    console.log(`🗑️ [Admin] Caché borrada para carta ID ${id}: ${links.length} links eliminados y marcador diario reseteado.`);
    res.json({ mensaje: `Caché borrada: ${links.length} registros eliminados`, affected: links.length });
  } catch (error) {
    console.error('Error borrando caché:', error);
    res.status(500).json({ error: 'Error al borrar caché', detalle: error.message });
  }
});

// Expirar caché de precios forzadamente (solo admin)
router.put('/:id/tiendas/expire-cache', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me');
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' });
  }

  try {
    const userRepo = AppDataSource.getRepository(User);
    const currentUser = await userRepo.findOne({
      where: [{ id: decoded.userId }, { email: decoded.email }]
    });
    
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Solo para admins' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error validando permisos', detalle: error.message });
  }

  const { id } = req.params;
  try {
    const CartaLink = require('../entities/CartaLink');
    const linkRepo = AppDataSource.getRepository(CartaLink);
    const cartaId = parseInt(id);
    const links = await linkRepo.find({
      where: { carta: { id: cartaId } }
    });

    if (links.length === 0) {
      return res.json({ mensaje: 'No hay caché para expirar', affected: 0 });
    }

    // Setear fechaGuardado a 30 días en el pasado
    const fechaPasada = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    links.forEach(l => {
      l.fechaGuardado = fechaPasada;
    });

    await linkRepo.save(links);
    
    // Eliminar el marcador diario
    const DailyCardScraping = require('../entities/DailyCardScraping');
    const markerRepo = AppDataSource.getRepository(DailyCardScraping);
    await markerRepo.delete({ cartaId: cartaId });

    console.log(`⏳ [Admin] Caché expirada para carta ID ${id}: ${links.length} links caducados y marcador reseteado.`);
    res.json({ mensaje: `Caché expirada: ${links.length} registros caducados`, affected: links.length });
  } catch (error) {
    console.error('Error expirando caché:', error);
    res.status(500).json({ error: 'Error al expirar caché', detalle: error.message });
  }
});

module.exports = router;
