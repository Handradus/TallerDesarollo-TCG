/**
 * Servicio para obtener sugerencias desde el backend
 * Basado en términos de búsqueda previamente guardados
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Obtener sugerencias desde el backend basadas en términos guardados
 * @param {string} termino - Término parcial para buscar sugerencias
 * @returns {Promise<string[]>} Array de sugerencias
 */
export async function obtenerSugerenciasBackend(termino) {
  try {
    if (!termino || termino.length < 2) {
      return [];
    }

    const response = await fetch(`${API_URL}/api/sugerencias?q=${encodeURIComponent(termino)}`);
    
    if (!response.ok) {
      console.warn('Error al obtener sugerencias del backend:', response.status);
      return [];
    }

    const data = await response.json();
    return data.sugerencias || [];
    
  } catch (error) {
    console.warn('Error de conexión al obtener sugerencias:', error);
    return [];
  }
}

/**
 * Función híbrida que combina sugerencias del backend con las estáticas como fallback
 * @param {string} termino - Término para buscar sugerencias
 * @returns {Promise<string[]>} Array de sugerencias combinadas
 */
export async function obtenerSugerenciasHibridas(termino) {
  try {
    // Intentar obtener sugerencias del backend primero
    const sugerenciasBackend = await obtenerSugerenciasBackend(termino);
    
    if (sugerenciasBackend.length > 0) {
      return sugerenciasBackend;
    }
    
    // Si no hay sugerencias del backend, usar las estáticas como fallback
    const { obtenerSugerencias } = await import('./sugerencias');
    return obtenerSugerencias(termino);
    
  } catch (error) {
    console.warn('Error en sugerencias híbridas, usando fallback estático:', error);
    
    // Fallback final a sugerencias estáticas
    try {
      const { obtenerSugerencias } = await import('./sugerencias');
      return obtenerSugerencias(termino);
    } catch (fallbackError) {
      console.error('Error en fallback estático:', fallbackError);
      return [];
    }
  }
}
