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
  const nombreRaw = req.query.nombre;
  const tipoBusqueda = req.query.tipo || 'carta'; // 'carta' por defecto
  console.log(`🟢 Llegó una búsqueda a /api/cartas con input: "${nombreRaw}" tipo: "${tipoBusqueda}"`);

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
  const nombreRaw = req.query.nombre;
  const tipoBusqueda = req.query.tipo || 'carta'; // 'carta' por defecto
  console.log(`🔧 Llegó una búsqueda ADMIN a /api/cartas/admin con input: "${nombreRaw}" tipo: "${tipoBusqueda}"`);

  if (!AppDataSource.isInitialized) {
    console.error('La conexión a la base de datos no está inicializada');
    return res.status(500).json({ error: 'Base de datos no disponible' });
  }

  if (!nombreRaw) {
    return res.status(400).json({ error: 'Falta el parámetro ?nombre=' });
  }

  try {
    const resultadoFinal = await buscarCartaAdmin(nombreRaw, tipoBusqueda);

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
  if (!token) return res.status(401).json({ message: 'No token provided' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me');
  } catch {
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
    console.log(`🗑️ [Admin] Caché borrada para carta ID ${id}: ${links.length} links eliminados`);
    res.json({ mensaje: `Caché borrada: ${links.length} registros eliminados`, affected: links.length });
  } catch (error) {
    console.error('Error borrando caché:', error);
    res.status(500).json({ error: 'Error al borrar caché', detalle: error.message });
  }
});

module.exports = router;
