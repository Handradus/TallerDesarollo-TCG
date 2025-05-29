const express = require('express');
const router = express.Router();
const { AppDataSource } = require('../data-source');
const { buscarCarta } = require('../services/pokemonTCGService');
const { ILike } = require('typeorm');

const cartaRepo = AppDataSource.getRepository('Carta');

router.get('/', async (req, res) => {
  const nombre = req.query.nombre;
  console.log(`🟢 Llegó una búsqueda a /api/cartas con input: "${nombre}"`);

  if (!nombre) return res.status(400).json({ error: 'Falta el parámetro ?nombre=' });

  try {
    // 1. Buscar en la BD
    const cartasBD = await cartaRepo.find({
      where: [
        { nombre: ILike(`%${nombre}%`) },
        { numero: nombre.toUpperCase() }
      ],
      order: { id: 'ASC' },
    });

    // 2. Buscar en la API siempre
    const cartasAPI = await buscarCarta(nombre);
    const nuevasCartas = [];

    for (const carta of cartasAPI) {
      const yaExiste = await cartaRepo.findOneBy({ numero: carta.number, setId: carta.set.id });
      if (!yaExiste) {
        const nueva = cartaRepo.create({
          nombre: carta.name,
          numero: carta.number,
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
      }
    }

    const resultadoFinal = [...cartasBD, ...nuevasCartas];

    if (cartasBD.length > 0) {
      console.log(`📦 Se encontraron ${cartasBD.length} cartas en la base de datos`);
    }

    if (nuevasCartas.length > 0) {
      console.log(`🌐 Se agregaron ${nuevasCartas.length} cartas nuevas desde la API`);
    }

    if (resultadoFinal.length === 0) {
      console.log('⚠️ No se encontraron cartas ni en la BD ni en la API');
    }

    res.json(resultadoFinal);
  } catch (err) {
    console.error('❌ Error al procesar /api/cartas:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
