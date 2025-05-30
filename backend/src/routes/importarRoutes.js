const express = require('express');
const router = express.Router();
const { buscarCartasPorNombre } = require('../services/pokemonTCGService');
const { AppDataSource } = require('../data-source');

const cartaRepo = AppDataSource.getRepository('Carta');

// GET /api/importar?nombre=Pikachu
router.get('/', async (req, res) => {
  const nombre = req.query.nombre;

  if (!nombre) {
    return res.status(400).json({ error: 'Debes proporcionar un nombre de carta' });
  }

  const cartasAPI = await buscarCartasPorNombre(nombre);

  const cartasGuardadas = [];

  for (const carta of cartasAPI) {
    const yaExiste = await cartaRepo.findOneBy({ numero: carta.number });

    if (!yaExiste) {
      const nueva = cartaRepo.create({
        nombre: carta.name,
        numero: carta.number,
        set: carta.set.name,
        imagenUrl: carta.images?.small || null,
        tipo: carta.types ? carta.types[0] : null,
        rareza: carta.rarity || null,
      });

      const resultado = await cartaRepo.save(nueva);
      cartasGuardadas.push(resultado);
    }
  }

  res.json({
    mensaje: `${cartasGuardadas.length} carta(s) nueva(s) guardada(s) en la base de datos.`,
    resultados: cartasGuardadas,
  });
});

module.exports = router;
