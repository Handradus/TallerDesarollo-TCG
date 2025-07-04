const axios = require('axios');
const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');
const ConsultaAPI = require('../entities/ConsultaAPI');
const { ILike, Brackets } = require('typeorm');
require('dotenv').config();

async function buscarCarta(input) {
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

    // Nombre simple
    else if (posiblesNombre) {
      const nombreConGuiones = posiblesNombre.replace(/ /g, '-');

      cartasBD = await cartaRepo
        .createQueryBuilder('carta')
        .where(new Brackets(qb => {
          qb.where('LOWER(carta.nombre) LIKE LOWER(:nombre1)', { nombre1: `%${posiblesNombre}%` })
            .orWhere('LOWER(carta.nombre) LIKE LOWER(:nombre2)', { nombre2: `%${nombreConGuiones}%` });
        }))
        .getMany();
    }

    if (cartasBD.length === 0 && posiblesNombre) {
      cartasBD = await cartaRepo.find({ where: { set: ILike(`%${posiblesNombre}%`) } });
    }

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
        return cartasBD.map(c => ({ ...c, origen: "BD" }));
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
      queryAPI = `name:"${nombreEscapado}"`;
    } else {
      queryAPI = inputOriginal;
    }

    console.log(`📡 Consultando API con query: ${queryAPI}`);

    const resFull = await axios.get(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(queryAPI)}&pageSize=250`,
      { headers }
    );

    const cartasAPI = resFull.data.data || [];
    const resultadosAPI = [];

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

    const resultadosTotales = [...cartasBD.map(c => ({ ...c, origen: "BD" })), ...resultadosAPI];
    if (resultadosTotales.length > 0) {
      console.log(`✅ Se devolvieron ${resultadosTotales.length} resultados (BD + API).`);
      return resultadosTotales;
    }

    console.log('❌ No se encontró ninguna carta.');
    return [];

  } catch (error) {
    console.error('❌ Error al buscar carta:', error.message);
    return [];
  }
}

module.exports = { buscarCarta };
