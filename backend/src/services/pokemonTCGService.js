// src/services/pokemonTCGService.js
const axios = require('axios');
require('dotenv').config();

async function buscarCartasPorNombre(nombre) {
  try {
    const response = await axios.get(`https://api.pokemontcg.io/v2/cards?q=name:${nombre}`, {
      headers: {
        'X-Api-Key': process.env.POKEMONTCG_API_KEY,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ Error al consultar la API de PokémonTCG:', error.message);
    return [];
  }
}

module.exports = { buscarCartasPorNombre };
