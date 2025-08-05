const express = require('express');
const router = express.Router();
const tiendaPublicaController = require('../controllers/tiendaPublicaController');

// Rutas públicas para tiendas
router.get('/', tiendaPublicaController.obtenerTiendasPublicas);
router.get('/buscar/:termino', tiendaPublicaController.buscarTiendas);
router.get('/url/:nombre', tiendaPublicaController.generarUrlAmigable);
router.get('/:nombreTienda', tiendaPublicaController.obtenerTiendaPorNombre);

module.exports = router;
