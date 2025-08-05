const express = require('express');
const router = express.Router();
const tiendaController = require('../controllers/tiendaController');


router.get('/', tiendaController.obtenerTiendas);


router.get('/admin', tiendaController.obtenerTiendasAdmin);


router.get('/tipos-busqueda', tiendaController.obtenerTiposBusqueda);


router.post('/validar', tiendaController.validarTienda);


router.post('/', tiendaController.crearTienda);


router.get('/:id', tiendaController.obtenerTiendaPorId);


router.put('/:id', tiendaController.actualizarTienda);


router.delete('/:id', tiendaController.eliminarTienda);

module.exports = router;
