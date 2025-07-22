const axios = require('axios');
const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');
const ConsultaAPI = require('../entities/ConsultaAPI');
const { ILike, Brackets } = require('typeorm');
const { esBusquedaPromocional } = require('../helpers/promoKeywords');
require('dotenv').config();

async function buscarCarta(input) {
  console.log(`🚀 === INICIO DE BÚSQUEDA === Input recibido: "${input}"`);
  
  const headers = {
    'X-Api-Key': process.env.POKEMONTCG_API_KEY,
  };

  try {
    const cartaRepo = AppDataSource.getRepository(Carta);
    const consultaRepo = AppDataSource.getRepository('ConsultaAPI');
    const inputOriginal = input.trim();
    
    const palabras = inputOriginal.split(/\s+/);
    const posiblesNumeros = palabras.filter(p => /^\d{1,3}(\/\d{1,3})?$/.test(p));
    const posiblesNombre = palabras.filter(p => !/^\d{1,3}(\/\d{1,3})?$/.test(p)).join(' ');

    let cartasBD = [];
    console.log(`🔍 Buscando por: "${inputOriginal}"`);

    const hoy = new Date().toISOString().split('T')[0];
    const matchFraccion = inputOriginal.match(/^(\d{1,3})\/(\d{1,3})$/);

    // Fracción exacta
    if (matchFraccion) {
      const numero = matchFraccion[1].replace(/^0+/, '');
      const printedTotal = parseInt(matchFraccion[2]);

      let cartasFraccion = await cartaRepo
        .createQueryBuilder("carta")
        .where("carta.numero = :numero", { numero })
        .andWhere("carta.printedTotal = :printedTotal", { printedTotal })
        .getMany();

      if (posiblesNombre) {
        const nombreLower = posiblesNombre.toLowerCase();
        cartasBD = cartasFraccion.filter(c =>
          c.nombre.toLowerCase().includes(nombreLower)
        );
      } else {
        cartasBD = cartasFraccion;
      }
    }

    // Código promocional
    else if (/^([a-z]{2,6})(\d{2,6})$/i.test(inputOriginal)) {
      const fullNumber = inputOriginal.toUpperCase();
      cartasBD = await cartaRepo.find({ where: { numero: ILike(fullNumber) } });
    }

    // Nombre + número
    else if (palabras.length >= 2 && posiblesNumeros.length === 1) {
      const numero = posiblesNumeros[0];
      const nombre = palabras.filter(p => p !== numero).join(' ');
      const nombreGuiones = nombre.replace(/ /g, '-');
      const isFraccion = /^\d{1,3}\/\d{1,3}$/.test(numero);

      const qb = cartaRepo.createQueryBuilder("carta")
        .where(new Brackets(qb => {
          qb.where("LOWER(carta.nombre) LIKE LOWER(:nombre1)", { nombre1: `%${nombre}%` })
            .orWhere("LOWER(carta.nombre) LIKE LOWER(:nombre2)", { nombre2: `%${nombreGuiones}%` });
        }));

      if (isFraccion) {
        const [num, printedTotal] = numero.split('/');
        qb.andWhere("carta.numero = :numero", { numero: num.replace(/^0+/, '') })
          .andWhere("carta.printedTotal = :printedTotal", { printedTotal: parseInt(printedTotal) });
      } else {
        qb.andWhere("carta.numero = :numero", { numero: numero.replace(/^0+/, '') });
      }

      cartasBD = await qb.getMany();
    }

    // Solo número
    else if (/^\d{1,3}$/.test(inputOriginal)) {
      const numeroNormalizado = inputOriginal.replace(/^0+/, '');
      cartasBD = await cartaRepo.find({
        where: [
          { numero: inputOriginal },
          { numero: numeroNormalizado }
        ]
      });
    }

    // Nombre + código promocional
    else if (
      palabras.length === 2 &&
      /^[a-z]+$/i.test(palabras[0]) &&
      /^([a-z]{2,6})(\d{2,6})$/i.test(palabras[1])
    ) {
      const nombre = palabras[0];
      const numeroPromo = palabras[1].toUpperCase();
      const nombreGuiones = nombre.replace(/ /g, '-');

      cartasBD = await cartaRepo
        .createQueryBuilder("carta")
        .where(new Brackets(qb => {
          qb.where("LOWER(carta.nombre) LIKE LOWER(:nombre1)", { nombre1: `%${nombre}%` })
            .orWhere("LOWER(carta.nombre) LIKE LOWER(:nombre2)", { nombre2: `%${nombreGuiones}%` });
        }))
        .andWhere("carta.numero = :numero", { numero: numeroPromo })
        .getMany();
    }

    // NUEVO: Nombre + Set (ejemplo: "pikachu emerald", "charizard base")
    // PERO: Excluir nombres conocidos de cartas y cartas especiales
    else if (palabras.length === 2 && posiblesNumeros.length === 0) {
      const cartasConocidas = [
        'poké ball', 'ultra ball', 'great ball', 'master ball', 'quick ball', 'timer ball',
        'dusk ball', 'nest ball', 'dive ball', 'repeat ball', 'luxury ball', 'premier ball',
        'heal ball', 'level ball', 'love ball', 'lure ball', 'moon ball', 'heavy ball',
        'friend ball', 'fast ball', 'park ball', 'net ball', 'cherish ball'
      ];

      // Cartas especiales que deben buscarse como nombre completo
      const tiposCartasEspeciales = ['ex', 'gx', 'v', 'vmax', 'vstar', 'tag', 'break', 'prime', 'legend', 'mega'];
      
      console.log(`🎯 Entrada en lógica Nombre+Set. Verificando "${posiblesNombre.toLowerCase()}"`);
      
      // Verificar si alguna palabra es un tipo de carta especial
      const esCartaEspecial = palabras.some(palabra => 
        tiposCartasEspeciales.includes(palabra.toLowerCase())
      );
      
      console.log(`🎯 ¿Es carta especial (EX/GX/V/etc.)?: ${esCartaEspecial}`);
      console.log(`🎯 ¿Es carta conocida?: ${cartasConocidas.includes(posiblesNombre.toLowerCase())}`);
      
      // Si es una carta conocida O una carta especial, buscar como nombre simple INMEDIATAMENTE
      if (cartasConocidas.includes(posiblesNombre.toLowerCase()) || esCartaEspecial) {
        console.log(`📝 Es carta conocida o especial! Ejecutando búsqueda de nombre simple con: "${posiblesNombre}"`);
        const nombreConGuiones = posiblesNombre.replace(/ /g, '-');
        console.log(`📝 También buscando variante con guiones: "${nombreConGuiones}"`);

        cartasBD = await cartaRepo
          .createQueryBuilder('carta')
          .where(new Brackets(qb => {
            qb.where('LOWER(carta.nombre) LIKE LOWER(:nombre1)', { nombre1: `%${posiblesNombre}%` })
              .orWhere('LOWER(carta.nombre) LIKE LOWER(:nombre2)', { nombre2: `%${nombreConGuiones}%` });
          }))
          .getMany();
          
        console.log(`📊 Resultados de BD para carta conocida/especial: ${cartasBD.length} cartas encontradas`);
      } else {
        // Si NO es una carta conocida, aplicar lógica de Nombre + Set
        const setsConocidos = [
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
          'evolved', 'scarlet', 'violet', '151', 'obsidian', 'flames', 'crown', 'zenith', 'silver', 'tempest', 'paradox', 'rift'
        ];

        // Detectar cuál palabra es el nombre y cuál es el set
        let nombrePokemon = '';
        let setName = '';
        
        // Verificar si alguna de las palabras coincide con un set conocido
        if (setsConocidos.some(set => palabras[1].toLowerCase().includes(set) || set.includes(palabras[1].toLowerCase()))) {
          nombrePokemon = palabras[0];
          setName = palabras[1];
        } else if (setsConocidos.some(set => palabras[0].toLowerCase().includes(set) || set.includes(palabras[0].toLowerCase()))) {
          nombrePokemon = palabras[1];
          setName = palabras[0];
        }

        if (nombrePokemon && setName) {
          console.log(`🎮 Búsqueda nombre + set: "${nombrePokemon}" en set "${setName}"`);
          
          const nombreGuiones = nombrePokemon.replace(/ /g, '-');
          
          cartasBD = await cartaRepo
            .createQueryBuilder("carta")
            .where(new Brackets(qb => {
              qb.where("LOWER(carta.nombre) LIKE LOWER(:nombre1)", { nombre1: `%${nombrePokemon}%` })
                .orWhere("LOWER(carta.nombre) LIKE LOWER(:nombre2)", { nombre2: `%${nombreGuiones}%` });
            }))
            .andWhere("LOWER(carta.set) LIKE LOWER(:setName)", { setName: `%${setName}%` })
            .getMany();

          console.log(`✅ Encontradas ${cartasBD.length} cartas de "${nombrePokemon}" en sets que contienen "${setName}"`);
        }
      }
    }

    // Nombre simple
    else if (posiblesNombre) {
      console.log(`📝 Ejecutando búsqueda de nombre simple con: "${posiblesNombre}"`);
      const nombreConGuiones = posiblesNombre.replace(/ /g, '-');
      console.log(`📝 También buscando variante con guiones: "${nombreConGuiones}"`);

      cartasBD = await cartaRepo
        .createQueryBuilder('carta')
        .where(new Brackets(qb => {
          qb.where('LOWER(carta.nombre) LIKE LOWER(:nombre1)', { nombre1: `%${posiblesNombre}%` })
            .orWhere('LOWER(carta.nombre) LIKE LOWER(:nombre2)', { nombre2: `%${nombreConGuiones}%` });
        }))
        .getMany();
        
      console.log(`📊 Resultados de BD para nombre simple: ${cartasBD.length} cartas encontradas`);
    }

    if (cartasBD.length === 0 && posiblesNombre) {
      cartasBD = await cartaRepo.find({ where: { set: ILike(`%${posiblesNombre}%`) } });
    }

    // Verificar si ya se consultó la API hoy para evitar consultas innecesarias
    let saltarConsultaAPI = false;
    if (
      cartasBD.length > 0 &&
      (palabras.length === 1 || (palabras.length === 2 && posiblesNumeros.length === 0)) &&
      posiblesNombre.length > 0
    ) {
      const yaConsultada = await consultaRepo.findOne({
        where: {
          termino: posiblesNombre.toLowerCase(),
          fechaConsulta: hoy
        }
      });

      if (yaConsultada) {
        console.log(`⛔ Consulta a API omitida: Ya se consultó "${posiblesNombre}" hoy`);
        saltarConsultaAPI = true;
      }
    }

   
    let queryAPI = "";
    if (matchFraccion) {
      queryAPI = `number:${matchFraccion[1]}`;
    } else if (/^([a-z]{2,6})(\d{2,6})$/i.test(inputOriginal)) {
      queryAPI = `number:${inputOriginal.toUpperCase()}`;
    } else if (/^\d{1,3}$/.test(inputOriginal)) {
      queryAPI = `number:${inputOriginal}`;
    } else if (posiblesNombre && posiblesNumeros.length > 0) {
      const nombreEscapado = posiblesNombre.replace(/"/g, '').trim();
      const numeroInput = posiblesNumeros[0];
      if (/^\d{1,3}\/\d{1,3}$/.test(numeroInput)) {
        const numeroSolo = numeroInput.split('/')[0].replace(/^0+/, '');
        queryAPI = `name:"${nombreEscapado}" number:${numeroSolo}`;
      } else {
        const numeroLimpio = numeroInput.replace(/^0+/, '');
        queryAPI = `name:"${nombreEscapado}" number:${numeroLimpio}`;
      }
    } else if (posiblesNombre) {
      const nombreEscapado = posiblesNombre.replace(/"/g, '').trim();
      
      // Detectar si es una búsqueda nombre + set
      const palabrasNombre = posiblesNombre.split(/\s+/);
      if (palabrasNombre.length === 2) {
        const setsConocidos = [
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
          'evolved', 'scarlet', 'violet', '151', 'obsidian', 'flames', 'crown', 'zenith', 'silver', 'tempest', 'paradox', 'rift'
        ];

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
          queryAPI = `name:"${nombrePokemon}" set.name:"*${setName}*"`;
        } else {
          queryAPI = `name:"${nombreEscapado}"`;
        }
      } else {
        queryAPI = `name:"${nombreEscapado}"`;
      }
    } else {
      queryAPI = inputOriginal;
    }

    console.log(`📡 Consultando API con query: ${queryAPI}`);

    let resultadosAPI = [];
    
    // Solo consultar API si no se saltó la consulta
    if (!saltarConsultaAPI) {
      const resFull = await axios.get(
        `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(queryAPI)}&pageSize=250`,
        { headers }
      );

      const cartasAPI = resFull.data.data || [];

      for (const cartaAPI of cartasAPI) {
      const numero = cartaAPI.number?.toUpperCase();
      const set = cartaAPI.set?.name || null;
      const printedTotal = cartaAPI.set?.printedTotal || null;

      if (matchFraccion) {
        const esperadoNumero = matchFraccion[1].replace(/^0+/, '');
        const esperadoTotal = parseInt(matchFraccion[2]);

        if ((numero !== esperadoNumero && numero !== matchFraccion[1]) || parseInt(printedTotal) !== esperadoTotal) {
          continue;
        }

        if (posiblesNombre && !cartaAPI.name.toLowerCase().includes(posiblesNombre.toLowerCase())) {
          continue;
        }
      }

      const existe = await cartaRepo.findOne({ where: { numero, set } });

      if (!existe) {
        const nueva = cartaRepo.create({
          nombre: cartaAPI.name,
          numero,
          set,
          setId: cartaAPI.set?.id || null,
          serie: cartaAPI.set?.series || null,
          fechaLanzamiento: cartaAPI.set?.releaseDate || null,
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

        const guardada = await cartaRepo.save(nueva);
        resultadosAPI.push({ ...guardada, origen: "API" });
      }
    }

    if (resultadosAPI.length > 0 && posiblesNombre.length > 0) {
      await consultaRepo.save({
        termino: posiblesNombre.toLowerCase(),
        fechaConsulta: hoy
      });
    }
    } // Cerrar el bloque if (!saltarConsultaAPI)

    const resultadosTotales = [...cartasBD.map(c => ({ ...c, origen: "BD" })), ...resultadosAPI];
    
    if (resultadosTotales.length > 0) {
      console.log(`✅ Se devolvieron ${resultadosTotales.length} resultados (BD + API).`);
      console.log(`📊 Desglose: ${cartasBD.length} de BD, ${resultadosAPI.length} de API`);
      
      // Logging detallado de qué se buscó
      console.log(`📋 RESUMEN DE BÚSQUEDA:`);
      console.log(`   🔍 Input recibido: "${inputOriginal}"`);
      console.log(`   💾 BD - Búsqueda en campo 'nombre' con término: "${posiblesNombre}"`);
      console.log(`   🌐 API - Query utilizada: ${queryAPI}`);
      
      return resultadosTotales;
    }

    // ⚠️ Si aún no hay resultados y la búsqueda parece promocional
    if (esBusquedaPromocional(inputOriginal)) {
      const urlSugerida = `https://pokumon.com/cards?search=${encodeURIComponent(inputOriginal)}`;
      console.log(`🔔 Sugerencia: Redirigir a Pokumon: ${urlSugerida}`);
      return [{
        mensaje: 'Tu búsqueda parece ser una carta promocional exclusiva o de evento. Te recomendamos visitar Pokumon:',
        sugerenciaUrl: urlSugerida,
        origen: 'sugerencia-pokumon'
      }];
    }

    console.log('❌ No se encontró ninguna carta.');
    return [];

  } catch (error) {
    console.error('❌ Error al buscar carta:', error.message);
    return [];
  }
}

module.exports = { buscarCarta };
