const express = require('express');
const router = express.Router();
const tiendaController = require('../controllers/tiendaController');

// Rutas para gestión de tiendas

/**
 * @route   GET /api/tiendas
 * @desc    Obtener todas las tiendas
 * @query   activas=true para solo tiendas activas
 * @access  Public
 */
router.get('/', tiendaController.obtenerTiendas);

/**
 * @route   GET /api/tiendas/admin
 * @desc    Obtener todas las tiendas para administración (incluye inactivas)
 * @access  Admin
 */
router.get('/admin', tiendaController.obtenerTiendasAdmin);

/**
 * @route   GET /api/tiendas/tipos-busqueda
 * @desc    Obtener tipos de búsqueda disponibles
 * @access  Public
 */
router.get('/tipos-busqueda', tiendaController.obtenerTiposBusqueda);

/**
 * @route   POST /api/tiendas/validar
 * @desc    Validar datos de tienda sin crearla
 * @access  Public
 */
router.post('/validar', tiendaController.validarTienda);

/**
 * @route   POST /api/tiendas
 * @desc    Crear una nueva tienda
 * @access  Public (en producción debería ser Admin)
 */
router.post('/', tiendaController.crearTienda);

/**
 * @route   GET /api/tiendas/:id
 * @desc    Obtener una tienda por ID
 * @access  Public
 */
router.get('/:id', tiendaController.obtenerTiendaPorId);

/**
 * @route   PUT /api/tiendas/:id
 * @desc    Actualizar una tienda existente
 * @access  Public (en producción debería ser Admin)
 */
router.put('/:id', tiendaController.actualizarTienda);

/**
 * @route   DELETE /api/tiendas/:id
 * @desc    Eliminar (desactivar) una tienda
 * @access  Public (en producción debería ser Admin)
 */
router.delete('/:id', tiendaController.eliminarTienda);

module.exports = router;
