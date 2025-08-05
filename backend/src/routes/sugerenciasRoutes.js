const express = require('express');
const router = express.Router();
const sugerenciasController = require('../controllers/sugerenciasController');

/**
 * @route   GET /api/sugerencias
 * @desc    Obtener sugerencias basadas en términos de búsqueda guardados
 * @access  Public
 * @query   q - Término parcial para buscar sugerencias
 * @example GET /api/sugerencias?q=pika
 */
router.get('/', sugerenciasController.obtenerSugerencias);

module.exports = router;
