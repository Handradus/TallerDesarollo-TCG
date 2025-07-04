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
  const numero = String(carta.numero).padStart(3, '0');
  const total = carta.printedTotal || "000";
  const setCompleto = normalizarParaUrl(`${carta.serie || ""}-${carta.set || ""}`);
  let setCompletoMagic = setCompleto;

if (
  carta.serie &&
  carta.set &&
  carta.serie.toLowerCase() === carta.set.toLowerCase()
) {
  // Reemplazar el segundo valor por 'base-set'
  const primeraParte = normalizarParaUrl(carta.serie);
  setCompletoMagic = `${primeraParte}-base-set`;
}

  const rarezas = [
    normalizarParaUrl(carta.rareza || ""),
    "common", "uncommon", "rare", "holo",
    "reverse-holo", "rare-holo",
    "uncommon-reverse-holo", "ultra-rare", "secret-rare"
  ];

  const urlsValidas = {}; // ✅ inicializar

  // Game of Magic
  const urlMagic = `https://gameofmagicsingles.cl/products/${nombre}-${numero}-${total}-${setCompletoMagic}`;
  const magicOk = await urlExiste(urlMagic);
  urlsValidas.gameofmagic = {
    url: urlMagic,
    verificada: magicOk
  };

  // Level Up (dos variantes)
  const urlLevelUp1 = `https://www.tiendaslevelup.cl/producto/tcg-${nombre}-${numero}-${total}/`;
  const urlLevelUp2 = `https://www.tiendaslevelup.cl/producto/tcg-${nombre}-${numero}${total}/`;

  let urlFinalLevelUp = null;
  if (await urlExiste(urlLevelUp1)) {
    urlFinalLevelUp = urlLevelUp1;
  } else if (await urlExiste(urlLevelUp2)) {
    urlFinalLevelUp = urlLevelUp2;
  }

  urlsValidas.levelup = {
    url: urlFinalLevelUp || urlLevelUp1,
    verificada: !!urlFinalLevelUp
  };

  // HunterCard con rarezas
  let hunterUrl = null;
  let hunterOk = false;
  for (let rareza of rarezas) {
    if (!rareza) continue;
    const url = `https://www.huntercardtcg.com/producto/${nombre}-${numero}-${total}-${rareza}/`;
    if (await urlExiste(url)) {
      hunterUrl = url;
      hunterOk = true;
      break;
    } else {
      hunterUrl = url; // última generada aunque no verificada
    }
  }

  urlsValidas.huntercard = {
    url: hunterUrl,
    verificada: hunterOk
  };

  return urlsValidas;
}

module.exports = {
  generarURLsValidas
};
