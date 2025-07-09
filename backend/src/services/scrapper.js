const axios = require('axios');

function normalizarParaUrl(texto) {
  return texto
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function urlExiste(url) {
  try {
    const res = await axios.head(url);
    return res.status === 200;
  } catch {
    return false;
  }
}

async function generarURLsValidas(carta) {
  const nombre = normalizarParaUrl(carta.nombre);
  const numero = carta.numero;
  const total = carta.printedTotal || "000";
  const set = normalizarParaUrl(carta.set || "");
  const rarezas = [
    normalizarParaUrl(carta.rareza || ""),
    "common", "uncommon", "rare", "holo",
    "reverse-holo", "rare-holo",
    "uncommon-reverse-holo", "ultra-rare", "secret-rare"
  ];

  const urlsValidas = {};

  // LevelUp
  const urlLevelUp = `https://www.tiendaslevelup.cl/producto/${nombre}-${numero}-${total}/`;
  if (await urlExiste(urlLevelUp)) urlsValidas.levelup = urlLevelUp;

  // Game of Magic
  const urlMagic = `https://gameofmagicsingles.cl/products/${nombre}-${numero}-${total}-${set}`;
  if (await urlExiste(urlMagic)) urlsValidas.gameofmagic = urlMagic;

  // HunterCard (probar rarezas)
  for (let rareza of rarezas) {
    if (!rareza) continue;
    const urlHunter = `https://www.huntercardtcg.com/producto/${nombre}-${numero}-${total}-${rareza}/`;
    if (await urlExiste(urlHunter)) {
      urlsValidas.huntercard = urlHunter;
      break; // solo necesitas una válida
    }
  }

  return urlsValidas;
}
