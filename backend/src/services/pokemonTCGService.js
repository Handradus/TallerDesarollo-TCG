// Service Orquestador - Coordinador de búsquedas en BD y API
const { buscarEnBD } = require('./busquedaBDService');
const { consultarAPI } = require('./pokemonTCGAPIService');

// Función para búsqueda SOLAMENTE en BD (buscarCarta)
async function buscarCarta(input, tipoBusqueda = 'carta') {
  console.log(`🎯 === BÚSQUEDA SOLO BD === Input: "${input}" Tipo: "${tipoBusqueda}"`);
  return await buscarEnBD(input, tipoBusqueda);
}

// Función para búsqueda ADMIN (BD, API o Ambos para sincronizar y poblar BD)
async function buscarCartaAdmin(input, tipoBusqueda = 'carta', supertipo, origenBusqueda = 'api') {
  console.log(`🔧 === BÚSQUEDA ADMIN === Input: "${input}" Tipo: "${tipoBusqueda}" Supertipo: "${supertipo}" Origen: "${origenBusqueda}"`);
  
  let resultadosBD = [];
  let resultadosAPI = [];

  const buscarBDLocal = origenBusqueda === 'bd' || origenBusqueda === 'ambos';
  const buscarAPIExterna = origenBusqueda === 'api' || origenBusqueda === 'ambos';

  // 1) Búsqueda en Base de Datos Local
  if (buscarBDLocal) {
    try {
      if (input && input.trim()) {
        resultadosBD = await buscarEnBD(input, tipoBusqueda);
        if (supertipo) {
          resultadosBD = resultadosBD.filter(c => c.supertipo && c.supertipo.toLowerCase() === supertipo.toLowerCase());
        }
      } else if (supertipo) {
        // Búsqueda por supertipo si el término de búsqueda está vacío
        const { AppDataSource } = require('../data-source');
        const Carta = require('../entities/Carta');
        const { ILike } = require('typeorm');
        const cartaRepo = AppDataSource.getRepository(Carta);
        resultadosBD = await cartaRepo.find({
          where: { supertipo: ILike(supertipo) }
        });
      }
      console.log(`🏠 [ADMIN] Resultados encontrados en BD local: ${resultadosBD.length}`);
    } catch (err) {
      console.warn(`⚠️ [ADMIN] Error buscando en BD local:`, err.message);
    }
  }

  // 2) Búsqueda en API de Pokémon TCG
  if (buscarAPIExterna) {
    try {
      console.log('📡 [ADMIN] Consultando API directamente...');
      resultadosAPI = await consultarAPI(input, tipoBusqueda, supertipo);
      console.log(`📡 [ADMIN] Resultados devueltos por API: ${resultadosAPI.length}`);
    } catch (error) {
      console.error('💥 [ADMIN] Error en consulta API:', error.message);
    }
  }

  // 3) Combinar y deduplicar resultados
  const mapaCartas = new Map();

  // Agregar primero las locales
  for (const carta of resultadosBD) {
    const clave = `${carta.numero}-${carta.set}`.toLowerCase();
    mapaCartas.set(clave, {
      ...carta,
      origen: "BD",
      esNueva: false,
      imagen: carta.imagenGrande || carta.imagenPequena || null
    });
  }

  // Agregar/Actualizar con las de la API
  for (const carta of resultadosAPI) {
    const clave = `${carta.numero}-${carta.set}`.toLowerCase();
    const existeEnBD = mapaCartas.has(clave) || carta.origen === "BD";
    
    mapaCartas.set(clave, {
      ...carta,
      origen: existeEnBD ? "BD" : "API",
      esNueva: !existeEnBD,
      imagen: carta.imagenGrande || carta.imagenPequena || null
    });
  }

  const cartasConEstado = Array.from(mapaCartas.values()).map(carta => ({
    ...carta,
    fechaConsulta: new Date().toISOString()
  }));

  console.log(`✅ [ADMIN] Búsqueda finalizada. Total resultados devueltos: ${cartasConEstado.length}`);
  return cartasConEstado;
}

module.exports = { buscarCarta, buscarCartaAdmin };
