const express = require('express');
const router = express.Router();
const { AppDataSource } = require('../data-source');
const { buscarCarta } = require('../services/pokemonTCGService');
const { obtenerCartaDetalle } = require('../controllers/cartas.controller');
const { obtenerTiendas } = require('../controllers/verificarTiendas');
const { obtenerPreciosPriceCharting } = require('../controllers/priceChartingController');



router.get('/', async (req, res) => {
  const nombreRaw = req.query.nombre;
  console.log(`🟢 Llegó una búsqueda a /api/cartas con input: "${nombreRaw}"`);

  if (!AppDataSource.isInitialized) {
    console.error('La conexión a la base de datos no está inicializada');
    return res.status(500).json({ error: 'Base de datos no disponible' });
  }

  if (!nombreRaw) {
    return res.status(400).json({ error: 'Falta el parámetro ?nombre=' });
  }

  try {
    // Aquí solo llamamos a buscarCarta y devolvemos su resultado
    const resultadoFinal = await buscarCarta(nombreRaw);

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


router.get('/:id', obtenerCartaDetalle);
router.get('/:id/tiendas', obtenerTiendas);
router.get('/:id/precios-pricecharting', obtenerPreciosPriceCharting);


module.exports = router;
