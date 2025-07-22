// promoKeywords.js

const nombresPokemon = new Set([
  'pikachu', 'charizard', 'mew', 'mewtwo', 'lugia', 'celebi', 'rayquaza', 'lucario',
  'greninja', 'eevee', 'espeon', 'umbreon', 'sylveon', 'gengar', 'snorlax', 'arceus',
  'jirachi', 'darkrai', 'zacian', 'zamazenta', 'duraludon', 'dragapult', 'glaceon',
  // Agrega más si lo deseas o automatízalo con PokéAPI
]);

const palabrasPromoEspecial = new Set([
  'comicon', 'comic-con', 'worlds', 'championship', 'winner', 'champion', 'trainer', 'judge',
  'staff', 'prerelease', 'league', 'battle', 'cup', 'victory', 'sample', 'demo', 'present',
  'exclusive', 'limited', 'distribution', 'event', 'birthday', 'misprint', 'error', 'japan',
  'launch', 'special', 'delivery', 'promo', 'anime', 'expo', 'black', 'star', 'mail-in',
  'celebration', 'anniversary', 'gold', 'silver', 'crystal', 'winner', 'finalist', 'stamped',
  'holographic', 'foil', 'miscut', 'off-center', 'prototype', 'test', 'beta', 'alpha'
]);

function esBusquedaPromocional(input) {
  const palabras = input.toLowerCase().split(/[\s\-_,.]+/);
  const contienePokemon = palabras.some(p => nombresPokemon.has(p));
  const contienePromo = palabras.some(p => palabrasPromoEspecial.has(p));
  
  // Si contiene una palabra promocional específica, es promocional
  if (contienePromo) {
    console.log(`🎯 Detectada búsqueda promocional: "${input}" (palabra clave: ${palabras.find(p => palabrasPromoEspecial.has(p))})`);
    return true;
  }
  
  // Si contiene pokemon + algún término que podría ser promocional (pero no está en la lista)
  if (contienePokemon && palabras.length > 1) {
    console.log(`🤔 Posible búsqueda promocional: "${input}" (contiene pokémon: ${palabras.find(p => nombresPokemon.has(p))})`);
    return true;
  }
  
  return false;
}

module.exports = { esBusquedaPromocional };
