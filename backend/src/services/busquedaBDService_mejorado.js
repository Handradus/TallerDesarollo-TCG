// Service dedicado SOLO para búsquedas inteligentes en Base de Datos - VERSIÓN MEJORADA
const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');
const { ILike, Brackets } = require('typeorm');
const { esBusquedaPromocional } = require('../helpers/promoKeywords');

async function buscarEnBD(input, tipoBusqueda = 'carta') {
  console.log(`🧠 === BÚSQUEDA INTELIGENTE BD === Input: "${input}" Tipo: "${tipoBusqueda}"`);
  
  try {
    const cartaRepo = AppDataSource.getRepository(Carta);
    const inputOriginal = input.trim();
    
    // Si el usuario especificó que busca un SET, ir directamente a búsqueda por set
    if (tipoBusqueda === 'set') {
      console.log(`🎮 BÚSQUEDA DIRECTA POR SET: "${inputOriginal}"`);
      const cartasBD = await cartaRepo.find({ where: { set: ILike(`%${inputOriginal}%`) } });
      
      if (cartasBD.length > 0) {
        console.log(`✅ Búsqueda por set exitosa: ${cartasBD.length} resultados`);
        return cartasBD.map(c => ({ ...c, origen: "BD" }));
      } else {
        console.log(`❌ No se encontraron cartas en el set: "${inputOriginal}"`);
        return [];
      }
    }
    
    // **APLICAR LÓGICA INTELIGENTE MEJORADA PARA CARTAS**
    console.log(`🎯 APLICANDO LÓGICA INTELIGENTE PARA CARTAS`);
    
    // **CASO 1: BÚSQUEDAS ESPECÍFICAS** (fracciones, códigos, números solos)
    const resultadoEspecifico = await manejarBusquedaEspecifica(inputOriginal, cartaRepo);
    if (resultadoEspecifico) {
      return resultadoEspecifico;
    }

    const palabras = inputOriginal.split(/\s+/);
    const posiblesNumeros = palabras.filter(p => /^\d{1,3}(\/\d{1,3})?$/.test(p));
    const posiblesNombre = palabras.filter(p => !/^\d{1,3}(\/\d{1,3})?$/.test(p)).join(' ');
    
    console.log(`🔍 Análisis: ${palabras.length} palabras, ${posiblesNumeros.length} números`);

    // **CASO 2: NOMBRE + NÚMERO** ("pikachu 25", "25 pikachu")
    if (palabras.length === 2 && posiblesNumeros.length === 1) {
      return await manejarNombreYNumero(palabras, posiblesNumeros, cartaRepo);
    }

    // **CASO 3: UNA PALABRA** ("pikachu")
    if (palabras.length === 1) {
      return await manejarUnaPalabra(inputOriginal, cartaRepo);
    }

    // **CASO 4: VARIAS PALABRAS** - Lógica inteligente mejorada
    if (palabras.length >= 2) {
      return await manejarVariasPalabras(palabras, posiblesNombre, cartaRepo);
    }

    // **FALLBACK**: Búsqueda flexible
    console.log(`🔄 Aplicando búsqueda flexible`);
    const resultadoFlexible = await busquedaFlexible(posiblesNombre, cartaRepo);
    if (resultadoFlexible.length > 0) {
      return resultadoFlexible;
    }

    // **SUGERENCIA PROMOCIONAL**
    if (esBusquedaPromocional(inputOriginal)) {
      const inputSinPromo = inputOriginal.replace(/\bpromo\b/gi, '').replace(/\s+/g, ' ').trim();
      const urlSugerida = `https://pokumon.com/cards?search=${encodeURIComponent(inputSinPromo)}`;
      console.log(`🔔 Sugerencia promocional: ${urlSugerida}`);
      return [{
        mensaje: 'Tu búsqueda parece ser una carta promocional exclusiva o de evento. Te recomendamos visitar Pokumon:',
        sugerenciaUrl: urlSugerida,
        origen: 'sugerencia-pokumon'
      }];
    }

    console.log('❌ Sin resultados en BD');
    return [];

  } catch (err) {
    console.error(`❌ Error en búsqueda BD para "${input}":`, err.message);
    return [];
  }
}

// ========== FUNCIONES HELPER PARA LÓGICA INTELIGENTE ==========

// Maneja búsquedas específicas (fracciones, códigos promocionales)
async function manejarBusquedaEspecifica(input, cartaRepo) {
  // FRACCIÓN EXACTA (25/102)
  const matchFraccion = input.match(/^(\d{1,3})\/(\d{1,3})$/);
  if (matchFraccion) {
    console.log(`🎯 FRACCIÓN EXACTA: "${input}"`);
    const numero = matchFraccion[1].replace(/^0+/, '');
    const printedTotal = parseInt(matchFraccion[2]);

    const cartasBD = await cartaRepo
      .createQueryBuilder("carta")
      .where("carta.numero = :numero", { numero })
      .andWhere("carta.printedTotal = :printedTotal", { printedTotal })
      .getMany();
    
    console.log(`📊 Fracción exacta: ${cartasBD.length} cartas encontradas`);
    return cartasBD.map(c => ({ ...c, origen: "BD" }));
  }

  // CÓDIGO PROMOCIONAL (SWSH001, SM25)
  if (/^([a-z]{2,6})(\d{2,6})$/i.test(input)) {
    console.log(`🎯 CÓDIGO PROMOCIONAL: "${input}"`);
    const fullNumber = input.toUpperCase();
    const cartasBD = await cartaRepo.find({ where: { numero: ILike(fullNumber) } });
    console.log(`📊 Código promocional: ${cartasBD.length} cartas encontradas`);
    return cartasBD.map(c => ({ ...c, origen: "BD" }));
  }

  // SOLO NÚMERO ("25")
  if (/^\d{1,3}$/.test(input)) {
    console.log(`🎯 SOLO NÚMERO: "${input}"`);
    const numeroNormalizado = input.replace(/^0+/, '');
    const cartasBD = await cartaRepo.find({
      where: [
        { numero: input },
        { numero: numeroNormalizado }
      ]
    });
    console.log(`📊 Solo número: ${cartasBD.length} cartas encontradas`);
    return cartasBD.map(c => ({ ...c, origen: "BD" }));
  }

  return null;
}

// Maneja nombre + número ("pikachu 25", "25 pikachu")
async function manejarNombreYNumero(palabras, posiblesNumeros, cartaRepo) {
  const numero = posiblesNumeros[0];
  const nombre = palabras.filter(p => p !== numero).join(' ');
  console.log(`🎯 NOMBRE + NÚMERO: "${nombre}" + "${numero}"`);
  
  const nombreGuiones = nombre.replace(/ /g, '-');
  const isFraccion = /^\d{1,3}\/\d{1,3}$/.test(numero);

  const qb = cartaRepo.createQueryBuilder("carta")
    .where(new Brackets(qb => {
      // Priorizar coincidencias exactas de nombre
      qb.where("LOWER(carta.nombre) = LOWER(:nombreExacto)", { nombreExacto: nombre })
        .orWhere("LOWER(carta.nombre) = LOWER(:nombreGuionesExacto)", { nombreGuionesExacto: nombreGuiones })
        // Luego coincidencias parciales
        .orWhere("LOWER(carta.nombre) LIKE LOWER(:nombre1)", { nombre1: `%${nombre}%` })
        .orWhere("LOWER(carta.nombre) LIKE LOWER(:nombre2)", { nombre2: `%${nombreGuiones}%` });
    }));

  if (isFraccion) {
    const [num, printedTotal] = numero.split('/');
    qb.andWhere("carta.numero = :numero", { numero: num.replace(/^0+/, '') })
      .andWhere("carta.printedTotal = :printedTotal", { printedTotal: parseInt(printedTotal) });
  } else {
    qb.andWhere("carta.numero = :numero", { numero: numero.replace(/^0+/, '') });
  }

  const cartasBD = await qb.getMany();
  
  // Ordenar por relevancia: exactos primero, parciales después
  if (cartasBD.length > 1) {
    const cartasExactas = cartasBD.filter(carta => 
      carta.nombre.toLowerCase() === nombre.toLowerCase() ||
      carta.nombre.toLowerCase() === nombreGuiones.toLowerCase()
    );
    const cartasParciales = cartasBD.filter(carta => 
      !(carta.nombre.toLowerCase() === nombre.toLowerCase() ||
        carta.nombre.toLowerCase() === nombreGuiones.toLowerCase())
    );
    const resultadosOrdenados = [...cartasExactas, ...cartasParciales];
    console.log(`📊 Nombre + Número: ${cartasExactas.length} exactas + ${cartasParciales.length} parciales`);
    return resultadosOrdenados.map(c => ({ ...c, origen: "BD" }));
  } else {
    console.log(`📊 Nombre + Número: ${cartasBD.length} cartas encontradas`);
    return cartasBD.map(c => ({ ...c, origen: "BD" }));
  }
}

// Maneja búsqueda de una sola palabra
async function manejarUnaPalabra(input, cartaRepo) {
  console.log(`🎯 UNA PALABRA: "${input}" - Priorizando nombre sobre set`);
  
  const nombreConGuiones = input.replace(/ /g, '-');
  
  // PRIMERA PRIORIDAD: Buscar por nombre (exacto y parcial)
  const cartasNombre = await cartaRepo
    .createQueryBuilder('carta')
    .where(new Brackets(qb => {
      // Coincidencia exacta tiene máxima prioridad
      qb.where('LOWER(carta.nombre) = LOWER(:nombreExacto)', { nombreExacto: input })
        .orWhere('LOWER(carta.nombre) = LOWER(:nombreGuiones)', { nombreGuiones: nombreConGuiones })
        // Luego coincidencias parciales
        .orWhere('LOWER(carta.nombre) LIKE LOWER(:nombre1)', { nombre1: `%${input}%` })
        .orWhere('LOWER(carta.nombre) LIKE LOWER(:nombre2)', { nombre2: `%${nombreConGuiones}%` });
    }))
    .getMany();
  
  console.log(`📊 Búsqueda por nombre: ${cartasNombre.length} cartas encontradas`);
  
  if (cartasNombre.length > 0) {
    // Ordenar por relevancia: exactos primero, parciales después
    const cartasExactas = cartasNombre.filter(carta => 
      carta.nombre.toLowerCase() === input.toLowerCase() ||
      carta.nombre.toLowerCase() === nombreConGuiones.toLowerCase()
    );
    const cartasParciales = cartasNombre.filter(carta => 
      !(carta.nombre.toLowerCase() === input.toLowerCase() ||
        carta.nombre.toLowerCase() === nombreConGuiones.toLowerCase())
    );
    
    const resultados = [...cartasExactas, ...cartasParciales];
    console.log(`✅ Resultados ordenados: ${cartasExactas.length} exactas + ${cartasParciales.length} parciales`);
    return resultados.map(c => ({ ...c, origen: "BD" }));
  } else {
    // SEGUNDA PRIORIDAD: Solo si no hay resultados por nombre, buscar por set
    const setsConocidos = obtenerSetsConocidos();
    const esSet = setsConocidos.some(set => 
      input.toLowerCase().includes(set) || set.includes(input.toLowerCase())
    );
    
    if (esSet) {
      console.log(`🎮 Sin resultados por nombre, buscando por set "${input}"`);
      const cartasBD = await cartaRepo.find({ where: { set: ILike(`%${input}%`) } });
      console.log(`📊 Búsqueda por set: ${cartasBD.length} cartas encontradas`);
      return cartasBD.map(c => ({ ...c, origen: "BD" }));
    }
  }
  
  console.log(`❌ No se encontraron resultados para: "${input}"`);
  return [];
}

// Maneja búsqueda de varias palabras con lógica inteligente
async function manejarVariasPalabras(palabras, posiblesNombre, cartaRepo) {
  console.log(`🎯 VARIAS PALABRAS: Analizando "${posiblesNombre}"`);
  
  const tiposCartasEspeciales = ['ex', 'gx', 'v', 'vmax', 'vstar', 'tag', 'break', 'prime', 'legend', 'mega'];
  const setsConocidos = obtenerSetsConocidos();
  const cartasConocidas = obtenerCartasConocidas();
  
  // 1. Verificar si contiene sufijos de cartas especiales
  const tieneSufijo = palabras.some(palabra => 
    tiposCartasEspeciales.includes(palabra.toLowerCase())
  );
  
  // 2. Verificar si es nombre conocido completo
  const esNombreConocido = cartasConocidas.includes(posiblesNombre.toLowerCase());
  
  console.log(`🔍 Tiene sufijo especial: ${tieneSufijo}`);
  console.log(`🔍 Es nombre conocido: ${esNombreConocido}`);
  
  // SI TIENE SUFIJO O ES NOMBRE CONOCIDO → Buscar como nombre completo
  if (tieneSufijo || esNombreConocido) {
    console.log(`🃏 TRATANDO COMO NOMBRE COMPUESTO: "${posiblesNombre}"`);
    return await buscarPorNombreCompleto(posiblesNombre, cartaRepo);
  }
  
  // SI NO → Analizar como posible NOMBRE + SET
  console.log(`🔍 Analizando posible NOMBRE + SET`);
  let nombrePokemon = '';
  let setName = '';
  
  // Buscar qué palabra podría ser el set
  for (let i = 0; i < palabras.length; i++) {
    const palabra = palabras[i];
    const esParteDSet = setsConocidos.some(set => 
      palabra.toLowerCase().includes(set) || set.includes(palabra.toLowerCase())
    );
    
    if (esParteDSet) {
      setName = palabra;
      nombrePokemon = palabras.filter((p, index) => index !== i).join(' ');
      break;
    }
  }
  
  if (nombrePokemon && setName) {
    console.log(`🎮 NOMBRE + SET: "${nombrePokemon}" en "${setName}"`);
    return await buscarNombreEnSet(nombrePokemon, setName, cartaRepo);
  } else {
    console.log(`🤔 No se detectó patrón específico, tratando como nombre completo`);
    return await buscarPorNombreCompleto(posiblesNombre, cartaRepo);
  }
}

// Buscar por nombre completo (con variaciones)
async function buscarPorNombreCompleto(nombre, cartaRepo) {
  const nombreConGuiones = nombre.replace(/ /g, '-');
  
  const cartasBD = await cartaRepo
    .createQueryBuilder('carta')
    .where(new Brackets(qb => {
      // Priorizar coincidencias exactas
      qb.where('LOWER(carta.nombre) = LOWER(:nombreExacto)', { nombreExacto: nombre })
        .orWhere('LOWER(carta.nombre) = LOWER(:nombreGuiones)', { nombreGuiones: nombreConGuiones })
        // Luego coincidencias parciales
        .orWhere('LOWER(carta.nombre) LIKE LOWER(:nombre1)', { nombre1: `%${nombre}%` })
        .orWhere('LOWER(carta.nombre) LIKE LOWER(:nombre2)', { nombre2: `%${nombreConGuiones}%` });
    }))
    .getMany();
    
  console.log(`📊 Búsqueda por nombre completo: ${cartasBD.length} cartas encontradas`);
  return cartasBD.map(c => ({ ...c, origen: "BD" }));
}

// Buscar nombre específico en set específico
async function buscarNombreEnSet(nombrePokemon, setName, cartaRepo) {
  const nombreGuiones = nombrePokemon.replace(/ /g, '-');
  
  const cartasBD = await cartaRepo
    .createQueryBuilder("carta")
    .where(new Brackets(qb => {
      qb.where("LOWER(carta.nombre) LIKE LOWER(:nombre1)", { nombre1: `%${nombrePokemon}%` })
        .orWhere("LOWER(carta.nombre) LIKE LOWER(:nombre2)", { nombre2: `%${nombreGuiones}%` });
    }))
    .andWhere("LOWER(carta.set) LIKE LOWER(:setName)", { setName: `%${setName}%` })
    .getMany();
    
  console.log(`📊 Nombre en set: ${cartasBD.length} cartas encontradas`);
  return cartasBD.map(c => ({ ...c, origen: "BD" }));
}

// Búsqueda flexible como fallback
async function busquedaFlexible(nombre, cartaRepo) {
  console.log(`🔄 BÚSQUEDA FLEXIBLE para: "${nombre}"`);
  
  if (!nombre) return [];
  
  // Intentar búsqueda por set
  const cartasBD = await cartaRepo.find({ where: { set: ILike(`%${nombre}%`) } });
  console.log(`📊 Búsqueda flexible por set: ${cartasBD.length} cartas encontradas`);
  
  return cartasBD.map(c => ({ ...c, origen: "BD" }));
}

// Helper: Obtener lista de sets conocidos
function obtenerSetsConocidos() {
  return [
    'base', 'jungle', 'fossil', 'rocket', 'gym', 'neo', 'discovery', 'destiny', 'revelation',
    'expedition', 'aquapolis', 'skyridge', 'ruby', 'sapphire', 'dragon', 'team magma', 'team aqua',
    'hidden legends', 'firered', 'leafgreen', 'team rocket returns', 'deoxys', 'emerald', 'unseen forces',
    'delta species', 'legend maker', 'holon phantoms', 'crystal guardians', 'dragon frontiers',
    'power keepers', 'diamond', 'pearl', 'mysterious treasures', 'secret wonders', 'great encounters',
    'majestic dawn', 'legends awakened', 'stormfront', 'platinum', 'rising rivals', 'supreme victors',
    'arceus', 'heartgold', 'soulsilver', 'unleashed', 'undaunted', 'triumphant', 'call of legends',
    'black', 'white', 'emerging powers', 'noble victories', 'next destinies', 'dark explorers',
    'dragons exalted', 'boundaries crossed', 'plasma storm', 'plasma freeze', 'plasma blast',
    'legendary treasures', 'xy', 'flashfire', 'furious fists', 'phantom forces', 'primal clash',
    'roaring skies', 'ancient origins', 'breakthrough', 'breakpoint', 'generations', 'fates collide',
    'steam siege', 'evolutions', 'sun', 'moon', 'guardians rising', 'burning shadows', 'shining legends',
    'crimson invasion', 'ultra prism', 'forbidden light', 'celestial storm', 'dragon majesty',
    'lost thunder', 'team up', 'detective pikachu', 'unbroken bonds', 'unified minds', 'hidden fates',
    'cosmic eclipse', 'sword', 'shield', 'rebel clash', 'darkness ablaze', 'champions path',
    'vivid voltage', 'shining fates', 'battle styles', 'chilling reign', 'evolving skies',
    'celebrations', 'fusion strike', 'brilliant stars', 'astral radiance', 'pokemon go',
    'lost origin', 'silver tempest', 'crown zenith', 'scarlet', 'violet', 'paldea evolved',
    'obsidian flames', 'paradox rift', 'paldean fates', 'temporal forces', 'twilight masquerade',
    'shrouded fable', 'stellar crown', 'surging sparks',
    // Añadir variaciones de sets
    'detective', 'pikachu', 'bolt', 'classic', 'collection', 'promo', 'black star'
  ];
}

// Helper: Obtener lista de cartas conocidas
function obtenerCartasConocidas() {
  return [
    // === POKÉMON BÁSICOS POPULARES ===
    'pikachu', 'charizard', 'blastoise', 'venusaur', 'mewtwo', 'mew', 'lugia', 'ho-oh',
    'rayquaza', 'kyogre', 'groudon', 'dialga', 'palkia', 'giratina', 'arceus', 'reshiram',
    'zekrom', 'kyurem', 'xerneas', 'yveltal', 'zygarde', 'solgaleo', 'lunala', 'necrozma',
    'zacian', 'zamazenta', 'eternatus', 'koraidon', 'miraidon',
    
    // === CARTAS ESPECIALES (CON SUFIJOS) ===
    'pikachu ex', 'charizard ex', 'mewtwo ex', 'lugia ex', 'rayquaza ex',
    'pikachu gx', 'charizard gx', 'mewtwo gx', 'lugia gx', 'reshiram gx',
    'pikachu v', 'charizard v', 'mewtwo v', 'lugia v', 'rayquaza v',
    'charizard vmax', 'pikachu vmax', 'mewtwo vmax', 'lugia vmax',
    'charizard vstar', 'pikachu vstar', 'mewtwo vstar', 'lugia vstar',
    'mega charizard', 'mega blastoise', 'mega venusaur', 'mega mewtwo',
    'mega rayquaza', 'mega lucario', 'mega gardevoir',
    'charizard tag team', 'pikachu tag team', 'mewtwo tag team',
    'charizard break', 'zoroark break', 'trevenant break',
    'mewtwo prime', 'lugia prime', 'celebi prime', 'yanmega prime',
    'ho-oh legend', 'lugia legend', 'rayquaza legend', 'kyogre legend',
    
    // === ENTRENADORES POPULARES ===
    'professor oak', 'bill', 'computer search', 'item finder', 'energy removal',
    'professor elm', 'professor birch', 'professor rowan', 'professor juniper',
    'professor sycamore', 'marnie', 'leon', 'hop',
    'ultra ball', 'master ball', 'quick ball', 'level ball', 'timer ball',
    'rare candy', 'pokemon catcher', 'switch', 'energy switch',
    'pokemon center', 'full heal', 'potion', 'super potion', 'hyper potion',
    
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
    'crystal kingdra', 'shadow lugia', "team rocket's handiwork"
  ];
}

module.exports = { buscarEnBD };
