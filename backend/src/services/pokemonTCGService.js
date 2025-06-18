const axios = require('axios');
const { AppDataSource } = require('../data-source'); 
const Carta = require('../entities/Carta'); 
const { ILike } = require('typeorm');
require('dotenv').config();

async function buscarCarta(input) {
  const headers = {
    'X-Api-Key': process.env.POKEMONTCG_API_KEY,
  };

  try {
    const cartaRepo = AppDataSource.getRepository(Carta);

    // Variables para BD y API resultados
    let cartasBD = [];
    
    // 1. Primero busca en la base de datos según el tipo de input
    console.log(`Buscando por: ${input}`);  // Muestra el parámetro que se está buscando

    // Si el input es una fracción
    const matchFraccion = input.match(/^(\d{1,3})\/(\d{1,3})$/);
    if (matchFraccion) {
      const numero = matchFraccion[1];
      const printedTotal = parseInt(matchFraccion[2]);

      console.log('Buscando fracción:', numero, 'con printedTotal:', printedTotal);

      cartasBD = await cartaRepo.find({ where: { numero, printedTotal } });

      if (cartasBD.length > 0) {
        console.log('Fracción encontrada en BD.');
      } else {
        console.log('No encontrado en BD, buscando en API...');
      }

    } 
    // Si el input es un código promocional
    else if (/^([a-z]{2,6})(\d{2,6})$/i.test(input)) {
      const fullNumber = input.toUpperCase().trim();
      console.log('Buscando código promocional:', fullNumber);

      cartasBD = await cartaRepo.find({ where: { numero: ILike(fullNumber) } });

      if (cartasBD.length > 0) {
        console.log('Código promocional encontrado en BD.');
      } else {
        console.log('No encontrado en BD, buscando en API...');
      }
    } 
    // Si el input es un número puro
    else if (/^\d{1,3}$/.test(input)) {
      console.log('Buscando número puro:', input);
      cartasBD = await cartaRepo.find({ where: { numero: input } });

      if (cartasBD.length > 0) {
        console.log('Número encontrado en BD.');
      } else {
        console.log('No encontrado en BD, buscando en API...');
      }
    } 
    // Si el input no es fracción ni código promocional ni número, se busca por nombre
    else {
      console.log('Buscando por nombre:', input);
      cartasBD = await cartaRepo.find({ where: { nombre: ILike(`%${input}%`) } });

      if (cartasBD.length > 0) {
        console.log('Nombre encontrado en BD.');
      } else {
        console.log('No encontrado en BD, buscando en API...');
      }
    }

    // 2. Si no se encontró en la base de datos, buscar en la API
    if (cartasBD.length === 0) {
      const queryAPI = input.match(/^(\d{1,3})\/(\d{1,3})$/) ? `number:${matchFraccion[1]}` :
                        /([a-z]{2,6})(\d{2,6})/i.test(input) ? `number:${input.toUpperCase()}` :
                        /^\d{1,3}$/.test(input) ? `number:${input}` :
                        `name:${input}`;

      const resFull = await axios.get(
        `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(queryAPI)}&pageSize=250`,
        { headers }
      );

      const cartasAPI = resFull.data.data || [];
      
      // 3. Si la carta se encuentra en la API pero no está en la base de datos, se agrega a la base de datos
      if (cartasAPI.length > 0) {
        const cartaAPI = cartasAPI[0]; // Tomamos el primer resultado de la API

        const nueva = cartaRepo.create({
          nombre: cartaAPI.name,
          numero: cartaAPI.number.toUpperCase(),
          set: cartaAPI.set?.name || null,
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
          printedTotal: cartaAPI.set?.printedTotal || null,
        });
        
        const guardada = await cartaRepo.save(nueva);
        cartasBD.push(guardada); // Agregar la nueva carta a las cartas encontradas
        console.log('Carta agregada a la base de datos.');
      }
    }

    // Mensaje final indicando si se encontraron cartas en BD o si fueron agregadas desde la API
    if (cartasBD.length === 0) {
      console.log('No se encontró ninguna carta en BD ni en la API.');
    } else {
      console.log(`Se encontraron ${cartasBD.length} cartas en total.`);
    }

    return cartasBD;  // Devuelve las cartas encontradas (ya sea de la BD o de la API)

  } catch (error) {
    console.error('❌ Error al buscar carta:', error.message);
    return [];
  }
}

module.exports = { buscarCarta };
