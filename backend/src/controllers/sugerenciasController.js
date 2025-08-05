const { AppDataSource } = require('../data-source');

/**
 * Obtener sugerencias basadas en términos de búsqueda guardados
 */
async function obtenerSugerencias(req, res) {
  try {
    const { q } = req.query; // término parcial de búsqueda
    
    if (!q || q.length < 2) {
      return res.json({ sugerencias: [] });
    }
    
    const consultaRepo = AppDataSource.getRepository('ConsultaAPI');
    
    // Buscar términos que contengan el texto buscado (case-insensitive)
    const sugerencias = await consultaRepo
      .createQueryBuilder('consulta')
      .select('consulta.termino')
      .where('LOWER(consulta.termino) LIKE LOWER(:termino)', { 
        termino: `%${q}%` 
      })
      .orderBy('consulta.fechaConsulta', 'DESC') // Más recientes primero
      .limit(8) // Máximo 8 sugerencias
      .getMany();
    
    // Extraer solo los términos
    const terminos = sugerencias.map(s => s.termino);
    
    // Ordenar por relevancia: que empiecen con el término primero
    const terminosOrdenados = terminos.sort((a, b) => {
      const aInicia = a.toLowerCase().startsWith(q.toLowerCase());
      const bInicia = b.toLowerCase().startsWith(q.toLowerCase());
      
      if (aInicia && !bInicia) return -1;
      if (!aInicia && bInicia) return 1;
      
      // Si ambos empiezan igual, ordenar por longitud
      return a.length - b.length;
    });
    
    res.json({ 
      sugerencias: terminosOrdenados.slice(0, 5) // Máximo 5 finales
    });
    
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      sugerencias: [] 
    });
  }
}

module.exports = {
  obtenerSugerencias
};
