// Diccionario de sugerencias para mejorar búsquedas
export const diccionarioSugerencias = {
  // === POKÉMON BALLS ===
  'ball': [
    'poké ball',
    'ultra ball', 
    'great ball',
    'master ball',
    'quick ball',
    'timer ball',
    'dusk ball',
    'nest ball',
    'dive ball',
    'repeat ball',
    'luxury ball',
    'premier ball'
  ],
  'poke': ['poké ball', 'pokémon', 'pokémon center'],
  'pokeball': ['poké ball'],
  'ultra': ['ultra ball', 'ultra necrozma', 'ultra prism'],
  'great': ['great ball', 'great encounters'],
  'master': ['master ball'],
  'quick': ['quick ball', 'quick search'],
  'timer': ['timer ball'],
  'dusk': ['dusk ball', 'dusk mane necrozma'],
  'nest': ['nest ball'],

  // === CARTAS CON APÓSTROFES ===
  'arven': ["arven's"],
  'professor': ["professor's research", "professor's letter"],
  'team': ["team rocket's handiwork", "team plasma grunt"],
  'rocket': ["rocket's"],
  'plasma': ["team plasma grunt", "plasma energy"],
  'aqua': ["team aqua's great ball", "team aqua's kyogre"],
  'magma': ["team magma's groudon", "team magma's great ball"],

  // === SWITCH VARIANTS ===
  'switch': [
    'switch',
    'switch cart',
    'escape rope',
    'bird keeper',
    'rope'
  ],
  'escape': ['escape rope'],

  // === BASIC VARIANTS ===
  'basic': [
    'basic energy',
    'basic grass energy',
    'basic fire energy',
    'basic water energy',
    'basic lightning energy',
    'basic psychic energy',
    'basic fighting energy',
    'basic darkness energy',
    'basic metal energy'
  ],

  // === DOUBLE VARIANTS ===
  'double': [
    'double colorless energy',
    'double turbo energy',
    'double dragon energy'
  ],
  'colorless': ['double colorless energy', 'colorless energy'],
  'turbo': ['double turbo energy', 'turbo patch'],

  // === ENERGY VARIANTS ===
  'energy': [
    'basic energy',
    'double colorless energy',
    'rainbow energy',
    'aurora energy',
    'twin energy',
    'capture energy',
    'rapid strike energy',
    'single strike energy'
  ],
  'rainbow': ['rainbow energy'],
  'aurora': ['aurora energy'],
  'twin': ['twin energy'],
  'capture': ['capture energy'],

  // === POKÉMON COMUNES ===
  'pika': ['pikachu', 'pikachu ex', 'pikachu vmax'],
  'char': ['charizard', 'charizard ex', 'charizard vmax'],
  'mewtwo': ['mewtwo', 'mewtwo ex', 'mewtwo vstar'],
  'necrozma': ['necrozma', 'ultra necrozma', 'dawn wings necrozma', 'dusk mane necrozma'],
  'calyrex': ['calyrex', 'calyrex vmax', 'shadow rider calyrex', 'ice rider calyrex'],

  // === TRAINER CARDS COMUNES ===
  'research': ["professor's research", 'research lab'],
  'vitality': ["arven's vitality"],
  'letter': ["professor's letter"],
  'search': ['quick search', 'ordinary rod', 'ultra ball'],
  'rod': ['ordinary rod', 'super rod'],
  'ordinary': ['ordinary rod'],
  'super': ['super rod', 'super ball'],

  // === TÉRMINOS ESPECÍFICOS ===
  'cart': ['switch cart'],
  'rope': ['escape rope'],
  'patch': ['turbo patch', 'energy patch'],
  'center': ['pokémon center', 'healing center']
};

// Función para normalizar texto (incluye normalizaciones automáticas)
export function normalizarTexto(texto) {
  return texto
    .replace(/\bpoke\b/gi, 'poké')
    .replace(/\bpokeball\b/gi, 'poké ball');
}

// Función para buscar sugerencias basadas en el input del usuario
export function obtenerSugerencias(input) {
  if (!input || input.length < 2) return [];
  
  const inputLower = input.toLowerCase().trim();
  const palabras = inputLower.split(/\s+/);
  const ultimaPalabra = palabras[palabras.length - 1];
  
  let sugerencias = new Set();
  
  // Buscar por coincidencia exacta de palabra
  if (diccionarioSugerencias[ultimaPalabra]) {
    diccionarioSugerencias[ultimaPalabra].forEach(sug => sugerencias.add(sug));
  }
  
  // Buscar por coincidencia parcial en las claves
  Object.keys(diccionarioSugerencias).forEach(clave => {
    if (clave.includes(ultimaPalabra) || ultimaPalabra.includes(clave)) {
      diccionarioSugerencias[clave].forEach(sug => sugerencias.add(sug));
    }
  });
  
  // Buscar en los valores de sugerencias (búsqueda inversa)
  Object.values(diccionarioSugerencias).forEach(listaSugerencias => {
    listaSugerencias.forEach(sugerencia => {
      if (sugerencia.toLowerCase().includes(inputLower)) {
        sugerencias.add(sugerencia);
      }
    });
  });
  
  // Convertir a array, ordenar por relevancia y limitar a 5 mejores resultados
  const sugerenciasArray = Array.from(sugerencias)
    .sort((a, b) => {
      // Priorizar coincidencias exactas al inicio
      const aStartsWith = a.toLowerCase().startsWith(inputLower);
      const bStartsWith = b.toLowerCase().startsWith(inputLower);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Verificar si el input normalizado coincide con la sugerencia
      const inputNormalizado = normalizarTexto(inputLower);
      const aStartsWithNormalized = a.toLowerCase().startsWith(inputNormalizado.toLowerCase());
      const bStartsWithNormalized = b.toLowerCase().startsWith(inputNormalizado.toLowerCase());
      
      if (aStartsWithNormalized && !bStartsWithNormalized) return -1;
      if (!aStartsWithNormalized && bStartsWithNormalized) return 1;
      
      // Si ambas empiezan igual, priorizar las más cortas
      return a.length - b.length;
    })
    .slice(0, 5); // Máximo 5 sugerencias
  
  return sugerenciasArray;
}
