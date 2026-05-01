const tiendaPublicaService = require('../services/tiendaPublicaService');

class TiendaPublicaController {

  async obtenerTiendasPublicas(req, res) {
    try {
      const { region, tipo } = req.query;
      const resultado = await tiendaPublicaService.obtenerTiendasPublicas({ region, tipo });

      if (resultado.success) {
        res.status(200).json(resultado);
      } else {
        res.status(500).json(resultado);
      }
    } catch (error) {
      console.error('Error en obtenerTiendasPublicas:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }


  async obtenerTiendaPorNombre(req, res) {
    try {
      const { nombreTienda } = req.params;

      if (!nombreTienda) {
        return res.status(400).json({
          success: false,
          error: 'Nombre de tienda requerido'
        });
      }

      const resultado = await tiendaPublicaService.obtenerTiendaPorNombre(nombreTienda);

      if (resultado.success) {
        res.status(200).json(resultado);
      } else {
        res.status(404).json(resultado);
      }
    } catch (error) {
      console.error('Error en obtenerTiendaPorNombre:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }


  async buscarTiendas(req, res) {
    try {
      const { termino } = req.params;

      if (!termino || termino.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'El término de búsqueda debe tener al menos 2 caracteres'
        });
      }

      const resultado = await tiendaPublicaService.buscarTiendas(termino.trim());

      if (resultado.success) {
        res.status(200).json(resultado);
      } else {
        res.status(500).json(resultado);
      }
    } catch (error) {
      console.error('Error en buscarTiendas:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }


  async generarUrlAmigable(req, res) {
    try {
      const { nombre } = req.params;

      if (!nombre) {
        return res.status(400).json({
          success: false,
          error: 'Nombre requerido'
        });
      }

      const urlAmigable = tiendaPublicaService.generarUrlAmigable(nombre);

      res.status(200).json({
        success: true,
        urlAmigable: urlAmigable
      });
    } catch (error) {
      console.error('Error en generarUrlAmigable:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  async obtenerResenasTienda(req, res) {
    try {
      const { nombreTienda } = req.params;

      if (!nombreTienda) {
        return res.status(400).json({
          success: false,
          error: 'Nombre de tienda requerido'
        });
      }

      const resultado = await tiendaPublicaService.obtenerResenasTienda(nombreTienda);

      if (resultado.success) {
        res.status(200).json(resultado);
      } else {
        res.status(404).json(resultado);
      }
    } catch (error) {
      console.error('Error en obtenerResenasTienda:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  async agregarResenaTienda(req, res) {
    try {
      const { nombreTienda } = req.params;
      const { content, rating } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'No autenticado'
        });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          error: 'El comentario no puede estar vacío'
        });
      }

      const resultado = await tiendaPublicaService.agregarResenaTienda(
        nombreTienda,
        userId,
        content.trim(),
        rating
      );

      if (resultado.success) {
        res.status(200).json(resultado);
      } else {
        res.status(resultado.statusCode || 500).json(resultado);
      }
    } catch (error) {
      console.error('Error en agregarResenaTienda:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}

module.exports = new TiendaPublicaController();
