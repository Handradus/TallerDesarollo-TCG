const { AppDataSource } = require('../data-source');


async function obtenerSugerencias(req, res) {
  try {
    const { q } = req.query; 
    
    if (!q || q.length < 2) {
      return res.json({ sugerencias: [] });
    }
    
    const consultaRepo = AppDataSource.getRepository('ConsultaAPI');
    
    
    const sugerencias = await consultaRepo
      .createQueryBuilder('consulta')
      .select('consulta.termino')
      .where('LOWER(consulta.termino) LIKE LOWER(:termino)', { 
        termino: `%${q}%` 
      })
      .orderBy('consulta.fechaConsulta', 'DESC') 
      .limit(8) 
      .getMany();
    
   
    const terminos = sugerencias.map(s => s.termino);
    
    
    const terminosOrdenados = terminos.sort((a, b) => {
      const aInicia = a.toLowerCase().startsWith(q.toLowerCase());
      const bInicia = b.toLowerCase().startsWith(q.toLowerCase());
      
      if (aInicia && !bInicia) return -1;
      if (!aInicia && bInicia) return 1;
      
      
      return a.length - b.length;
    });
    
    res.json({ 
      sugerencias: terminosOrdenados.slice(0, 5) 
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
