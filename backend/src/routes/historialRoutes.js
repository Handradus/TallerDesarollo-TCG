const express = require('express');
const router = express.Router();
const HistorialController = require('../controllers/historialController');

// Registrar acceso a carta
router.post('/cartas/:cartaId/acceso', HistorialController.registrarAccesoCarta);

// Registrar visita a tienda
router.post('/tiendas/:tiendaId/visita', HistorialController.registrarVisitaTienda);

// Obtener últimas cartas accedidas (para carousel)
router.get('/cartas/ultimas', HistorialController.obtenerUltimasCartas);

// Obtener últimas tiendas visitadas (para carousel)
router.get('/tiendas/ultimas', HistorialController.obtenerUltimasTiendas);

// Limpiar historial antiguo (para mantenimiento)
router.delete('/limpiar', HistorialController.limpiarHistorialAntiguo);

module.exports = router;
