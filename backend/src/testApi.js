const axios = require('axios');
require('dotenv').config();

async function buscarCarta(nombre) {
  try {
    const respuesta = await axios.get(`https://api.pokemontcg.io/v2/cards?q=name:${nombre}`, {
      headers: {
        'X-Api-Key': process.env.POKEMONTCG_API_KEY,
      },
    });

    const cartas = respuesta.data.data;
    console.log(`🔍 Resultados para "${nombre}":`);
    cartas.forEach(carta => {
      console.log(`- ${carta.name} (${carta.set.name}) [${carta.number}]`);
    });
  } catch (err) {
    console.error('❌ Error al consultar la API:', err.message);
  }
}

buscarCarta('Charizard');
