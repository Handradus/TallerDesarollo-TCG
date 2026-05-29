import { POKEMON_NAMES } from './pokemonDictionary';

/**
 * Calcula la distancia de Levenshtein entre dos cadenas de texto.
 * Mide el número mínimo de operaciones (inserciones, eliminaciones, sustituciones)
 * necesarias para transformar una cadena en la otra.
 */
export function getLevenshteinDistance(a, b) {
  const matrix = [];

  // Limpiar y normalizar entradas
  const strA = a.toLowerCase().trim();
  const strB = b.toLowerCase().trim();

  if (strA.length === 0) return strB.length;
  if (strB.length === 0) return strA.length;

  // Inicializar matriz
  for (let i = 0; i <= strB.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= strA.length; j++) {
    matrix[0][j] = j;
  }

  // Rellenar matriz
  for (let i = 1; i <= strB.length; i++) {
    for (let j = 1; j <= strA.length; j++) {
      if (strB.charAt(i - 1) === strA.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Sustitución
          Math.min(
            matrix[i][j - 1] + 1, // Inserción
            matrix[i - 1][j] + 1  // Eliminación
          )
        );
      }
    }
  }

  return matrix[strB.length][strA.length];
}

/**
 * Busca y retorna la sugerencia más cercana para un término de búsqueda.
 * Si no hay una palabra suficientemente cercana, retorna null.
 */
export function getSpellingSuggestion(input) {
  if (!input || typeof input !== 'string') return null;
  
  const cleanInput = input.trim().toLowerCase();
  if (cleanInput.length < 3) return null; // Ignorar términos muy cortos

  let bestMatch = null;
  let minDistance = Infinity;

  // Recorrer el diccionario
  for (const name of POKEMON_NAMES) {
    const cleanName = name.toLowerCase();
    
    // Si ya coincide de forma exacta (ignorando mayúsculas), no necesitamos sugerencia
    if (cleanName === cleanInput) {
      return null;
    }

    const distance = getLevenshteinDistance(cleanInput, cleanName);

    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = name;
    }
  }

  // Definir tolerancia inteligente según longitud de la palabra
  const tolerance = cleanInput.length <= 4 ? 1 : (cleanInput.length <= 7 ? 2 : 3);

  // Retornar coincidencia si está dentro de la tolerancia
  if (minDistance <= tolerance) {
    console.log(`🔮 [Levenshtein] Sugerencia encontrada: "${input}" -> "${bestMatch}" (distancia: ${minDistance})`);
    return bestMatch;
  }

  return null;
}
