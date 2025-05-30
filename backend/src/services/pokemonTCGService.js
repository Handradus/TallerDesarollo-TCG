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

    function crearQueryAPI(input) {
      if (/^\d{1,3}\/\d{1,3}$/.test(input)) {
        const [num] = input.split('/');
        return `number:${num}`;
      }
      if (/^([a-z]{2,4})(\d{3})$/i.test(input)) {
        return `number:${input.toUpperCase()}`;
      }
      if (/^\d{1,3}$/.test(input)) {
        return `number:${input}`;
      }
      return `name:${input}`;
    }

    // Variables para BD y API resultados
    let cartasBD = [];
    const matchFraccion = input.match(/^(\d{1,3})\/(\d{1,3})$/);
    const matchCodigoPromo = input.match(/^([a-z]{2,4})(\d{3})$/i);

    if (matchFraccion) {
      // Si input es fracción, filtrar BD por número y printedTotal
      const numero = matchFraccion[1];
      const printedTotal = parseInt(matchFraccion[2]);

      cartasBD = await cartaRepo.find({ where: { numero, printedTotal } });

      // Buscar en API solo por número
      const queryAPI = `number:${numero}`;
      const resFull = await axios.get(
        `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(queryAPI)}&pageSize=250`,
        { headers }
      );

      let cartasAPI = resFull.data.data || [];

      // Filtrar API para que coincida printedTotal exacto
      cartasAPI = cartasAPI.filter(carta => carta.set?.printedTotal === printedTotal);

      // Crear mapas para comparación
      const mapaBD = new Map();
      cartasBD.forEach(carta => mapaBD.set(`${carta.numero.toUpperCase()}_${carta.setId || ''}`, carta));
      const mapaAPI = new Map();
      cartasAPI.forEach(carta => mapaAPI.set(`${carta.number.toUpperCase()}_${carta.set?.id || ''}`, carta));

      // Detectar cartas que están en API pero no en BD
      const nuevasCartas = [];
      for (const [key, cartaAPI] of mapaAPI.entries()) {
        if (!mapaBD.has(key)) {
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
          nuevasCartas.push(guardada);
          mapaBD.set(key, guardada);
        }
      }

      // Si hay cartas nuevas, devuelve unión; sino solo BD
      if (nuevasCartas.length > 0) {
        return [...mapaBD.values()];
      } else {
        return cartasBD;
      }

    } else if (matchCodigoPromo) {
      const fullNumber = input.toUpperCase();
      cartasBD = await cartaRepo.find({ where: { numero: fullNumber } });
    } else if (/^\d{1,3}$/.test(input)) {
      cartasBD = await cartaRepo.find({ where: { numero: input } });
    } else {
      cartasBD = await cartaRepo.find({ where: { nombre: ILike(`%${input}%`) } });
    }

    // Para los demás casos, sincroniza siempre la API con BD igual que antes
    const queryAPI = crearQueryAPI(input);
    const resFull = await axios.get(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(queryAPI)}&pageSize=250`,
      { headers }
    );
    const cartasAPI = resFull.data.data || [];

    // Mapa para cartas BD existentes
    const mapaBD = new Map();
    cartasBD.forEach(carta => {
      const key = `${carta.numero.toUpperCase()}_${carta.setId || ''}`;
      mapaBD.set(key, carta);
    });

    const nuevasCartas = [];

    for (const carta of cartasAPI) {
      const key = `${carta.number.toUpperCase()}_${carta.set?.id || ''}`;
      if (!mapaBD.has(key)) {
        const nueva = cartaRepo.create({
          nombre: carta.name,
          numero: carta.number.toUpperCase(),
          set: carta.set?.name || null,
          setId: carta.set?.id || null,
          serie: carta.set?.series || null,
          fechaLanzamiento: carta.set?.releaseDate || null,
          supertipo: carta.supertype || null,
          subtipos: carta.subtypes || null,
          nivel: carta.level || null,
          hp: carta.hp || null,
          tipos: carta.types || null,
          evolucionaA: carta.evolvesTo || null,
          retreatCost: carta.retreatCost || null,
          debilidades: carta.weaknesses || null,
          ataques: carta.attacks || null,
          reglas: carta.rules || null,
          rareza: carta.rarity || null,
          ilustrador: carta.artist || null,
          flavorText: carta.flavorText || null,
          pokedexIds: carta.nationalPokedexNumbers || null,
          imagenPequena: carta.images?.small || null,
          imagenGrande: carta.images?.large || null,
          precioNormal: carta.tcgplayer?.prices?.normal?.market || null,
          precioHolofoil: carta.tcgplayer?.prices?.holofoil?.market || null,
          printedTotal: carta.set?.printedTotal || null,
        });
        const guardada = await cartaRepo.save(nueva);
        nuevasCartas.push(guardada);
        mapaBD.set(key, guardada);
      }
    }

    return [...mapaBD.values()];

  } catch (error) {
    console.error('❌ Error al buscar carta:', error.message);
    return [];
  }
}

module.exports = { buscarCarta };
