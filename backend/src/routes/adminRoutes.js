const express = require('express');
const { buscarCartaAdmin } = require('../services/pokemonTCGService');
const { obtenerTiendasAdmin } = require('../controllers/verificarTiendas');
const router = express.Router();


router.post('/actualizarbd', async (req, res) => {
  try {
    const { termino } = req.body;
    
    if (!termino) {
      return res.status(400).json({ 
        error: 'Se requiere el parámetro "termino" para buscar' 
      });
    }

    console.log(`🔧 [ADMIN] Forzando actualización de BD para: "${termino}"`);
    
    const resultado = await buscarCartaAdmin(termino);
    
    res.json({
      mensaje: 'Actualización de BD completada',
      termino: termino,
      cartasEncontradas: resultado.length,
      cartasNuevas: resultado.filter(c => c.origen === 'API').length,
      cartasExistentes: resultado.filter(c => c.origen === 'BD').length,
      cartas: resultado
    });

  } catch (error) {
    console.error('❌ Error en ruta admin actualizarbd:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      detalle: error.message 
    });
  }
});

// Forzar actualización completa de precios de tiendas (sin cache)
router.post('/carta/:id/forzar-precios', obtenerTiendasAdmin);

module.exports = router;
