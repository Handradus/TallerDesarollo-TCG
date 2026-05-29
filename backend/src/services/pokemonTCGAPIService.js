const axios = require('axios');
const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');
const ConsultaAPI = require('../entities/ConsultaAPI');
require('dotenv').config();

// Service dedicado SOLO para consultas a la API de Pokémon TCG
async function consultarAPI(input, tipoBusqueda = 'carta', supertipo) {
  console.log(`🔧 === CONSULTA API POKÉMON TCG === Input: "${input}" Tipo: "${tipoBusqueda}" Supertipo: "${supertipo}"`);
  
  const headers = {
    'X-Api-Key': process.env.POKEMONTCG_API_KEY,
  };

  // Helper: fetch all pages for /v2/cards queries
  async function fetchAllCards(params) {
    const pageSize = Math.max(1, Number(params.pageSize || 250));
    let page = 1;
    let acumulado = [];
    while (true) {
      const resp = await axios.get('https://api.pokemontcg.io/v2/cards', {
        headers,
        params: { ...params, page, pageSize }
      });
      const data = resp.data?.data || [];
      acumulado = acumulado.concat(data);
      if (data.length < pageSize) break;
      page += 1;
      // pequeña pausa para no golpear la API rápidamente
      await new Promise(r => setTimeout(r, 150));
    }
    return acumulado;
  }

  try {
    const cartaRepo = AppDataSource.getRepository(Carta);
    const consultaRepo = AppDataSource.getRepository('ConsultaAPI');
    const inputOriginal = input.trim();
    
    // Si el usuario especificó que busca un SET, seguir flujo: name -> /v2/sets -> id -> /v2/cards
    if (tipoBusqueda === 'set') {
      console.log(`🎮 [API] BÚSQUEDA DIRECTA POR SET (name -> sets -> id -> cards): "${inputOriginal}"`);

      try {
        // 1) Obtener lista de sets
        console.log('📡 [API] Solicitando lista de sets (/v2/sets)');
        const setsResp = await axios.get('https://api.pokemontcg.io/v2/sets', { headers, params: { pageSize: 250 } });
        const setsList = setsResp.data?.data || [];

        // 2) Buscar coincidencias por nombre (preferir coincidencia exacta)
        const inputLower = inputOriginal.toLowerCase();
        const exactMatches = setsList.filter(s => s.name && s.name.toLowerCase() === inputLower);
        const partialMatches = setsList.filter(s => s.name && s.name.toLowerCase().includes(inputLower) && !exactMatches.includes(s));
        const matches = exactMatches.length > 0 ? exactMatches : partialMatches;

        console.log(`📦 Sets encontrados que coinciden: ${matches.length}`);

        if (matches.length === 0) {
          console.log(`⚠️ [API] No se encontraron sets que coincidan con: ${inputOriginal}`);
          return [];
        }

        // 3) Para cada set encontrado, pedir sus cartas por set.id
        let acumuladoCartas = [];
        for (const setInfo of matches) {
          try {
            console.log(`📡 [API] Solicitando cartas del set id=${setInfo.id} name="${setInfo.name}" supertipo: "${supertipo}"`);
            let query = `set.id:"${setInfo.id}"`;
            if (supertipo) {
              query += ` supertype:${supertipo}`;
            }
            const cards = await fetchAllCards({ q: query, pageSize: 250 });

            console.log(`   • Cartas retornadas para ${setInfo.id}: ${cards.length}`);
            acumuladoCartas = acumuladoCartas.concat(cards);
          } catch (errCards) {
            console.warn(`⚠️ [API] Error obteniendo cartas para set ${setInfo.id}: ${errCards.message}`);
          }
        }

        if (acumuladoCartas.length === 0) {
          console.log(`⚠️ [API] No se obtuvieron cartas para los sets encontrados.`);
          return [];
        }

        // Eliminar duplicados por id
        const unique = Array.from(new Map(acumuladoCartas.map(c => [c.id, c])).values());
        return await procesarRespuestaSetAPI(unique, cartaRepo, consultaRepo, inputOriginal);

      } catch (err) {
        console.error('💥 [API] Error durante búsqueda por set (name->sets->id->cards):', err.message);
        return [];
      }
    }
    
    // Para tipo 'carta', continuar con la lógica existente
    const palabras = inputOriginal.split(/\s+/);
    const posiblesNumeros = palabras.filter(p => /^\d{1,3}(\/\d{1,3})?$/.test(p));
    const posiblesNombre = palabras.filter(p => !/^\d{1,3}(\/\d{1,3})?$/.test(p)).join(' ');

    // **DETECCIÓN ESPECIAL PARA SETS CONOCIDOS**
    const setsEspecialesBiPalabra = [
      'detective pikachu', 'black bolt', 'crown zenith', 'silver tempest', 
      'paradox rift', 'paldea evolved', 'obsidian flames', 'battle styles',
      'brilliant stars', 'fusion strike', 'astral radiance', 'hidden fates',
      'cosmic eclipse', 'unified minds', 'unbroken bonds', 'team up',
      'lost thunder', 'celestial storm', 'forbidden light', 'ultra prism',
      'crimson invasion', 'burning shadows', 'guardians rising'
    ];
    
    const inputLower = inputOriginal.toLowerCase();
    const esSetEspecial = setsEspecialesBiPalabra.some(set => 
      inputLower.includes(set) || set.includes(inputLower)
    );
    
    if (esSetEspecial && tipoBusqueda === 'carta') {
      console.log(`🎯 [API] DETECTADO SET ESPECIAL en búsqueda de carta: "${inputOriginal}"`);
      console.log(`📡 [API] Cambiando a búsqueda por set automáticamente`);
      let queryAPI = `set.name:"*${inputOriginal}*"`;
      if (supertipo) {
        queryAPI += ` supertype:${supertipo}`;
      }
      console.log(`📡 [API] Query construido para set especial: ${queryAPI}`);
      
      const cards = await fetchAllCards({ q: queryAPI, pageSize: 250 });
      return await procesarRespuestaSetAPI(cards, cartaRepo, consultaRepo, inputOriginal);
    }

    // Construir query para la API
    let queryAPI = "";
    if (posiblesNombre) {
      const nombreEscapado = posiblesNombre.replace(/"/g, '').trim();
      
      // Detectar si es una búsqueda nombre + set
      const palabrasNombre = posiblesNombre.split(/\s+/);
      if (palabrasNombre.length === 2) {
        const cartasConocidas = obtenerCartasConocidas();
        
        // Si es carta conocida, buscar como nombre completo
        if (cartasConocidas.includes(posiblesNombre.toLowerCase())) {
          console.log(`📝 [API] Es carta conocida! Buscando: "${nombreEscapado}"`);
          queryAPI = `name:"${nombreEscapado}"`;
        } else {
          // Aplicar lógica nombre + set
          const setsConocidos = obtenerSetsConocidos();
          let nombrePokemon = '';
          let setName = '';
          
          if (setsConocidos.some(set => palabrasNombre[1].toLowerCase().includes(set) || set.includes(palabrasNombre[1].toLowerCase()))) {
            nombrePokemon = palabrasNombre[0];
            setName = palabrasNombre[1];
          } else if (setsConocidos.some(set => palabrasNombre[0].toLowerCase().includes(set) || set.includes(palabrasNombre[0].toLowerCase()))) {
            nombrePokemon = palabrasNombre[1];
            setName = palabrasNombre[0];
          }

          if (nombrePokemon && setName) {
            console.log(`📝 [API] Detectado nombre + set: "${nombrePokemon}" en "${setName}"`);
            queryAPI = `name:"${nombrePokemon}" set.name:"*${setName}*"`;
          } else {
            console.log(`📝 [API] No es nombre + set, buscando: "${nombreEscapado}"`);
            queryAPI = `name:"${nombreEscapado}"`;
          }
        }
      } else {
        queryAPI = `name:"${nombreEscapado}"`;
      }
    } else {
      queryAPI = inputOriginal;
    }

    if (supertipo) {
      if (queryAPI) {
        queryAPI += ` supertype:${supertipo}`;
      } else {
        queryAPI = `supertype:${supertipo}`;
      }
    }

    console.log(`📡 [API] Query construida: ${queryAPI}`);

    // Hacer petición a la API
    const cartasAPI = await fetchAllCards({ q: queryAPI, pageSize: 250 });
    console.log(`📡 [API] Respuesta recibida: ${cartasAPI.length} cartas`);

    let resultadosAPI = [];
    let cartasNuevas = 0;
    let cartasExistentes = 0;

    // Procesar cada carta de la API
    for (const cartaAPI of cartasAPI) {
      const numero = cartaAPI.number?.toUpperCase();
      const set = cartaAPI.set?.name || null;
      const printedTotal = cartaAPI.set?.printedTotal || null;

      // Verificar si ya existe en BD
      const existe = await cartaRepo.findOne({ where: { numero, set } });

      if (!existe) {
        // Crear nueva carta
        const nuevaCarta = cartaRepo.create({
          nombre: cartaAPI.name,
          numero,
          set,
          setId: cartaAPI.set?.id || null,
          serie: cartaAPI.set?.series || null,
          fechaLanzamiento: cartaAPI.set?.releaseDate ? new Date(cartaAPI.set?.releaseDate) : null,
          supertipo: cartaAPI.supertype || null,
          subtipos: cartaAPI.subtypes || null,
          nivel: cartaAPI.level || null,
          hp: cartaAPI.hp || null,
          tipos: cartaAPI.types || null,
          evolucionaA: cartaAPI.evolvesTo || null,
          retreatCost: cartaAPI.retreatCost || null,
          debilidades: cartaAPI.weaknesses || null,
          ataques: cartaAPI.attacks || null,
          reglas: cartaAPI.rules || null,
          rareza: cartaAPI.rarity || null,
          ilustrador: cartaAPI.artist || null,
          flavorText: cartaAPI.flavorText || null,
          pokedexIds: cartaAPI.nationalPokedexNumbers || null,
          imagenPequena: cartaAPI.images?.small || null,
          imagenGrande: cartaAPI.images?.large || null,
          precioNormal: cartaAPI.tcgplayer?.prices?.normal?.market || null,
          precioHolofoil: cartaAPI.tcgplayer?.prices?.holofoil?.market || null,
          printedTotal,
        });

        const cartaGuardada = await cartaRepo.save(nuevaCarta);
        resultadosAPI.push({ ...cartaGuardada, origen: "API" });
        cartasNuevas++;
        
        console.log(`✨ [API] Nueva carta guardada: ${cartaAPI.name} (${set})`);
      } else {
        // Carta ya existe, marcarla como existente
        resultadosAPI.push({ ...existe, origen: "BD" });
        cartasExistentes++;
      }
    }

    // **NOTA: YA NO REGISTRAMOS CONSULTAS PARA PERMITIR BÚSQUEDAS REPETIDAS**
    // El usuario controla cuándo hacer las búsquedas, no necesitamos caché
    console.log(`� [API] Búsqueda sin restricciones de caché completada`);

    // Estadísticas finales
    console.log(`✅ [API] Proceso completado:`);
    console.log(`   • Cartas nuevas agregadas: ${cartasNuevas}`);
    console.log(`   • Cartas existentes: ${cartasExistentes}`);
    console.log(`   • Total resultados: ${resultadosAPI.length}`);

    return resultadosAPI;

  } catch (error) {
    console.error('💥 [API] Error en consulta:', error.message);
    
    // Errores específicos
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ [API] Timeout - La API tardó demasiado en responder');
    } else if (error.response?.status === 429) {
      console.error('🚫 [API] Rate limit alcanzado');
    } else if (error.response?.status === 401) {
      console.error('🔑 [API] API Key inválida o expirada');
    } else if (!error.response) {
      console.error('🌐 [API] Error de conectividad');
    }
    
    return [];
  }
}

// Helper: Obtener lista de sets conocidos (misma que busquedaBDService)
function obtenerSetsConocidos() {
  return [
    'base', 'jungle', 'fossil', 'rocket', 'gym', 'neo', 'genesis', 'discovery', 'destiny', 'revelation',
    'expedition', 'aquapolis', 'skyridge', 'ruby', 'sapphire', 'sandstorm', 'dragon', 'team', 'magma', 'aqua',
    'emerald', 'deoxys', 'crystal', 'guardians', 'holon', 'phantoms', 'delta', 'species', 'legend', 'maker',
    'diamond', 'pearl', 'mysterious', 'treasures', 'secret', 'wonders', 'great', 'encounters', 'majestic', 'dawn',
    'legends', 'awakened', 'stormfront', 'platinum', 'rising', 'rivals', 'supreme', 'victors', 'arceus',
    'heartgold', 'soulsilver', 'unleashed', 'undaunted', 'triumphant', 'black', 'white', 'emerging', 'powers',
    'noble', 'victories', 'next', 'destinies', 'dark', 'explorers', 'boundaries', 'crossed', 'plasma', 'storm',
    'freeze', 'blast', 'legendary', 'flashfire', 'furious', 'fists', 'phantom', 'forces', 'primal', 'clash',
    'roaring', 'skies', 'ancient', 'origins', 'breakthrough', 'breakpoint', 'fates', 'collide', 'steam', 'siege',
    'generations', 'evolutions', 'sun', 'moon', 'guardians', 'burning', 'shadows', 'shining', 'crimson', 'invasion',
    'ultra', 'prism', 'forbidden', 'light', 'celestial', 'lost', 'thunder', 'detective', 'pikachu', 'team',
    'unbroken', 'bonds', 'unified', 'minds', 'cosmic', 'eclipse', 'hidden', 'sword', 'shield', 'rebel', 'darkness',
    'astral', 'radiance', 'battle', 'styles', 'brilliant', 'stars', 'fusion', 'strike', 'go', 'origin', 'paldea',
    'evolved', 'scarlet', 'violet', '151', 'obsidian', 'flames', 'crown', 'zenith', 'silver', 'tempest', 'paradox', 'rift',
    // Nuevos sets identificados en BD
    'bolt'  // Para "black bolt"
  ];
}

// Helper: Obtener lista de cartas conocidas (misma que busquedaBDService)
function obtenerCartasConocidas() {
  return [
    // === POKÉMON BALLS ===
    'poké ball', 'ultra ball', 'great ball', 'master ball', 'quick ball', 'timer ball',
    'dusk ball', 'nest ball', 'dive ball', 'repeat ball', 'luxury ball', 'premier ball',
    'heal ball', 'level ball', 'love ball', 'lure ball', 'moon ball', 'heavy ball',
    'friend ball', 'fast ball', 'park ball', 'net ball', 'cherish ball',
    
    // === CARTAS TRAINER ===
    'professor oak', 'bill', 'energy removal', 'super energy removal', 'energy retrieval',
    'switch', 'gust of wind', 'computer search', 'item finder', 'pokédex', 'pluspower',
    'defender', 'potion', 'super potion', 'full heal', 'revive', 'maintenance',
    'pokemon trader', 'energy search', 'scoop up', 'recycle', 'gambler',
    "professor's research", "professor's letter", "marnie", "hop", "sonia",
    "leon", "raihan", "piers", "nessa", "bea", "allister", "gordie", "melony",
    "ordinary rod", "evolution incense", "twin energy", "capture energy",
    "professor elm", "professor birch", "cynthia", "lillie", "gladion", "guzma",
    "team rocket handiwork", "team flare grunt", "team plasma grunt",
    
    // === ENERGIAS ===
    'double colorless energy', 'rainbow energy', 'full heal energy', 'potion energy',
    'recycle energy', 'miracle energy', 'metal energy', 'darkness energy',
    'special metal energy', 'special darkness energy', 'double dragon energy',
    'strong energy', 'herbal energy', 'mystery energy', 'shield energy',
    'wonder energy', 'double turbo energy', 'twin energy', 'capture energy',
    'aurora energy', 'rapid strike energy', 'single strike energy',
    
    // === CARTAS CON PREFIJOS ===
    'dark charizard', 'dark blastoise', 'dark venomoth', 'dark gyarados', 'dark machamp',
    'light azumarill', 'light dragonite', 'light togetic', 'rocket mewtwo', 'rocket zapdos',
    'shining gyarados', 'shining magikarp', 'ancient mew', 'delta species',
    'crystal kingdra', 'shadow lugia', "arven's vitality", "team rocket's handiwork"
  ];
}

// Función específica para procesar respuestas de API cuando buscamos por set
async function procesarRespuestaSetAPI(cartasAPI, cartaRepo, consultaRepo, terminoBuscado) {
  console.log(`🎯 [API-SET] Procesando ${cartasAPI.length} cartas del set "${terminoBuscado}"`);
  
  let resultadosAPI = [];
  let cartasNuevas = 0;
  let cartasExistentes = 0;

  // Procesar cada carta de la API
  for (const cartaAPI of cartasAPI) {
    const numero = cartaAPI.number?.toUpperCase();
    const set = cartaAPI.set?.name || null;

    if (!numero || !set) {
      console.warn(`⚠️ [API-SET] Carta sin número o set:`, cartaAPI.name);
      continue;
    }

    // Verificar si la carta ya existe en la BD
    const existe = await cartaRepo.findOne({
      where: { numero: numero, set: set }
    });

    if (!existe) {
      // Nueva carta, guardarla
      const printedTotal = cartaAPI.set?.printedTotal || null;
      
      const nuevaCarta = cartaRepo.create({
        nombre: cartaAPI.name,
        numero: numero,
        set: set,
        setId: cartaAPI.set?.id || null,
        serie: cartaAPI.set?.series || null,
        fechaLanzamiento: cartaAPI.set?.releaseDate ? new Date(cartaAPI.set?.releaseDate) : null,
        supertipo: cartaAPI.supertype || null,
        subtipos: cartaAPI.subtypes || null,
        nivel: cartaAPI.level || null,
        hp: cartaAPI.hp || null,
        tipos: cartaAPI.types || null,
        evolucionaA: cartaAPI.evolvesTo || null,
        retreatCost: cartaAPI.retreatCost || null,
        debilidades: cartaAPI.weaknesses || null,
        ataques: cartaAPI.attacks || null,
        reglas: cartaAPI.rules || null,
        rareza: cartaAPI.rarity || null,
        ilustrador: cartaAPI.artist || null,
        flavorText: cartaAPI.flavorText || null,
        pokedexIds: cartaAPI.nationalPokedexNumbers || null,
        imagenPequena: cartaAPI.images?.small || null,
        imagenGrande: cartaAPI.images?.large || null,
        precioNormal: cartaAPI.tcgplayer?.prices?.normal?.market || null,
        precioHolofoil: cartaAPI.tcgplayer?.prices?.holofoil?.market || null,
        printedTotal,
      });

      const cartaGuardada = await cartaRepo.save(nuevaCarta);
      resultadosAPI.push({ ...cartaGuardada, origen: "API" });
      cartasNuevas++;
      
      console.log(`✨ [API-SET] Nueva carta guardada: ${cartaAPI.name} (${set})`);
    } else {
      // Carta ya existe, marcarla como existente
      resultadosAPI.push({ ...existe, origen: "BD" });
      cartasExistentes++;
    }
  }

  // **NOTA: YA NO REGISTRAMOS CONSULTAS PARA PERMITIR BÚSQUEDAS REPETIDAS**
  // El usuario controla cuándo hacer las búsquedas, no necesitamos caché
  console.log(`� [API-SET] Búsqueda de set sin restricciones de caché completada`);

  // Estadísticas finales
  console.log(`✅ [API-SET] Set completado:`);
  console.log(`   • Cartas nuevas agregadas: ${cartasNuevas}`);
  console.log(`   • Cartas existentes: ${cartasExistentes}`);
  console.log(`   • Total resultados: ${resultadosAPI.length}`);

  return resultadosAPI;
}

module.exports = { consultarAPI };
