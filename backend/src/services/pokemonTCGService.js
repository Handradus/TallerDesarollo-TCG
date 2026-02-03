// Service Orquestador - Coordinador de búsquedas en BD y API
const { buscarEnBD } = require('./busquedaBDService');
const { consultarAPI } = require('./pokemonTCGAPIService');

// Función para búsqueda SOLAMENTE en BD (buscarCarta)
async function buscarCarta(input, tipoBusqueda = 'carta') {
  console.log(`🎯 === BÚSQUEDA SOLO BD === Input: "${input}" Tipo: "${tipoBusqueda}"`);
  return await buscarEnBD(input, tipoBusqueda);
}

// Función para búsqueda ADMIN (SOLO API para actualizar BD)
async function buscarCartaAdmin(input, tipoBusqueda = 'carta') {
  console.log(`🔧 === BÚSQUEDA ADMIN (SOLO API) === Input: "${input}" Tipo: "${tipoBusqueda}"`);
  console.log('🎯 [ADMIN] Modo: Solo API para actualizar BD');
  
  try {
    // PASO 1: Consultar SOLO API (sin restricciones de caché)
    console.log('📡 [ADMIN] Consultando API directamente...');
    const resultadosAPI = await consultarAPI(input, tipoBusqueda);
    
    // PASO 2: Marcar todas las cartas con origen API y estado de actualización
    const cartasConEstado = resultadosAPI.map(carta => ({
      ...carta,
      origen: "API",
      esNueva: true, // Para identificar que viene de API y se puede guardar
      fechaConsulta: new Date().toISOString(),
      // Agregar propiedad imagen para el frontend (usar la imagen grande si existe, si no la pequeña)
      imagen: carta.imagenGrande || carta.imagenPequena || null
    }));
    
    // PASO 3: Estadísticas finales
    console.log(`✅ [ADMIN] Búsqueda API completada:`);
    console.log(`   • Cartas desde API: ${cartasConEstado.length}`);
    console.log(`   • Todas marcadas para posible actualización`);

    return cartasConEstado;

  } catch (error) {
    console.error('💥 [ADMIN] Error en consulta API:', error.message);
    
    // En modo admin, si falla la API no hay fallback
    console.log('� [ADMIN] Sin fallback - solo API permitida');
    return [];
  }
}

module.exports = { buscarCarta, buscarCartaAdmin };
