const axios = require('axios');
require('dotenv').config();

async function buscarCarta(input) {
  const headers = {
    'X-Api-Key': process.env.POKEMONTCG_API_KEY,
  };

  try {
    // Formato "6/83"
    const matchFraccion = input.match(/^(\d{1,3})\/(\d{1,3})$/);
    if (matchFraccion) {
      const numero = matchFraccion[1];
      const printedTotal = parseInt(matchFraccion[2]);

      const query = `number:${numero}`;
      const res = await axios.get(
        `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}`,
        { headers }
      );
      return res.data.data.filter((c) => c.set?.printedTotal == printedTotal);
    }

    // 🔍 Detectar código tipo "swsh039", "smp115", etc. que coincide con campo "number"
    const matchCodigoPromo = input.match(/^([a-z]{2,4})(\d{3})$/i);
    if (matchCodigoPromo) {
      const fullNumber = `${matchCodigoPromo[1].toUpperCase()}${matchCodigoPromo[2]}`;
      const query = `number:${fullNumber}`;
      const res = await axios.get(
        `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}`,
        { headers }
      );
      return res.data.data;
    }

    // Solo número simple, como "44" o "020"
    if (/^\d{1,3}$/.test(input)) {
      const query = `number:${input}`; // NO parseInt para mantener ceros
      const res = await axios.get(
        `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}`,
        { headers }
      );

      // Si no se encuentra nada, buscar cartas cuyo number termine en ese número (para casos como SWSH020)
      if (res.data.data.length === 0) {
        const wideRes = await axios.get(
          `https://api.pokemontcg.io/v2/cards?q=`, { headers }
        );
        const matches = wideRes.data.data.filter(c => c.number?.endsWith(input));
        return matches;
      }

      return res.data.data;
    }

    // Por defecto: búsqueda por nombre
    const query = `name:${input}`;
    const res = await axios.get(
      `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}`,
      { headers }
    );
    return res.data.data;

  } catch (error) {
    console.error('❌ Error al buscar carta:', error.message);
    return [];
  }
}

module.exports = { buscarCarta };
