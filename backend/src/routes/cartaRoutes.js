const express = require('express');
const router = express.Router();
const { AppDataSource } = require('../data-source');
const { buscarCartasPorNombre } = require('../services/pokemonTCGService');
const { ILike } = require('typeorm');

const cartaRepo = AppDataSource.getRepository('Carta');

router.get('/', async (req, res) => {
  const nombre = req.query.nombre;

  if (!nombre) return res.status(400).json({ error: 'Falta el parámetro ?nombre=' });

  try {
    let cartas = await cartaRepo.find({
      where: { nombre: ILike(`%${nombre}%`) },
      order: { id: 'ASC' },
    });

    if (cartas.length === 0) {
      const cartasAPI = await buscarCartasPorNombre(nombre);
      const cartasGuardadas = [];

      for (const carta of cartasAPI) {
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
        });

        const guardada = await cartaRepo.save(nueva);
        cartasGuardadas.push(guardada);
      }

      cartas = cartasGuardadas;
    }

    res.json(cartas);
  } catch (err) {
    console.error('❌ Error al procesar /api/cartas:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


module.exports = router;
