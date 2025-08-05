const tiendaService = require('../services/tiendaService');

/**
 * Crear una nueva tienda
 */
async function crearTienda(req, res) {
  try {
    console.log('🏪 [crearTienda] Datos recibidos:', req.body);
    
    const nuevaTienda = await tiendaService.crearTienda(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Tienda creada exitosamente',
      tienda: nuevaTienda
    });
    
  } catch (error) {
    console.error('❌ [crearTienda] Error:', error.message);
    
    if (error.message.includes('Ya existe una tienda') || 
        error.message.includes('Errores de validación')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al crear tienda'
    });
  }
}

/**
 * Obtener todas las tiendas
 */
async function obtenerTiendas(req, res) {
  try {
    const { activas } = req.query; // ?activas=true para solo activas
    const soloActivas = activas === 'true';
    
    console.log(`📋 [obtenerTiendas] Consultando tiendas${soloActivas ? ' activas' : ''}`);
    
    const tiendas = await tiendaService.obtenerTiendas(soloActivas);
    
    res.json({
      success: true,
      count: tiendas.length,
      tiendas: tiendas
    });
    
  } catch (error) {
    console.error('❌ [obtenerTiendas] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener tiendas'
    });
  }
}

/**
 * Obtener una tienda por ID
 */
async function obtenerTiendaPorId(req, res) {
  try {
    const { id } = req.params;
    
    console.log(`🔍 [obtenerTiendaPorId] Buscando tienda ID: ${id}`);
    
    const tienda = await tiendaService.obtenerTiendaPorId(id);
    
    res.json({
      success: true,
      tienda: tienda
    });
    
  } catch (error) {
    console.error('❌ [obtenerTiendaPorId] Error:', error.message);
    
    if (error.message.includes('No se encontró tienda')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener tienda'
    });
  }
}

/**
 * Actualizar una tienda existente
 */
async function actualizarTienda(req, res) {
  try {
    const { id } = req.params;
    
    console.log(`✏️ [actualizarTienda] Actualizando tienda ID: ${id}`, req.body);
    
    const tiendaActualizada = await tiendaService.actualizarTienda(id, req.body);
    
    res.json({
      success: true,
      message: 'Tienda actualizada exitosamente',
      tienda: tiendaActualizada
    });
    
  } catch (error) {
    console.error('❌ [actualizarTienda] Error:', error.message);
    
    if (error.message.includes('No se encontró tienda') || 
        error.message.includes('Errores de validación')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al actualizar tienda'
    });
  }
}

/**
 * Eliminar (desactivar) una tienda
 */
async function eliminarTienda(req, res) {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ [eliminarTienda] Desactivando tienda ID: ${id}`);
    
    const resultado = await tiendaService.eliminarTienda(id);
    
    res.json({
      success: true,
      message: resultado.message,
      tienda: resultado.tienda
    });
    
  } catch (error) {
    console.error('❌ [eliminarTienda] Error:', error.message);
    
    if (error.message.includes('No se encontró tienda')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al eliminar tienda'
    });
  }
}

/**
 * Obtener tipos de búsqueda disponibles
 */
async function obtenerTiposBusqueda(req, res) {
  try {
    console.log('📝 [obtenerTiposBusqueda] Consultando tipos disponibles');
    
    const tipos = tiendaService.obtenerTiposBusqueda();
    
    res.json({
      success: true,
      tipos: tipos
    });
    
  } catch (error) {
    console.error('❌ [obtenerTiposBusqueda] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener tiendas para administración (incluye inactivas)
 */
async function obtenerTiendasAdmin(req, res) {
  try {
    console.log('👑 [obtenerTiendasAdmin] Consultando tiendas para administración');
    
    const tiendas = await tiendaService.obtenerTiendasParaAdmin();
    
    res.json({
      success: true,
      count: tiendas.length,
      tiendas: tiendas
    });
    
  } catch (error) {
    console.error('❌ [obtenerTiendasAdmin] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener tiendas para administración'
    });
  }
}

/**
 * Validar datos de tienda sin crearla (para formularios)
 */
async function validarTienda(req, res) {
  try {
    console.log('✅ [validarTienda] Validando datos:', req.body);
    
    // Usar el método de validación del servicio
    tiendaService.validarDatosTienda(req.body);
    
    res.json({
      success: true,
      message: 'Datos válidos',
      valido: true
    });
    
  } catch (error) {
    console.log('⚠️ [validarTienda] Errores encontrados:', error.message);
    
    res.json({
      success: true,
      message: 'Datos inválidos',
      valido: false,
      errores: error.message
    });
  }
}

module.exports = {
  crearTienda,
  obtenerTiendas,
  obtenerTiendasAdmin,
  obtenerTiendaPorId,
  actualizarTienda,
  eliminarTienda,
  obtenerTiposBusqueda,
  validarTienda
};
