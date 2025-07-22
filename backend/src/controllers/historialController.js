const { AppDataSource } = require('../data-source');

class HistorialController {
  
  // Registrar que una carta fue accedida
  static async registrarAccesoCarta(req, res) {
    try {
      const { cartaId } = req.params;
      const ipUsuario = req.ip || req.connection.remoteAddress;
      
      const historialRepo = AppDataSource.getRepository('HistorialCarta');
      
      // Crear nuevo registro de acceso
      const nuevoRegistro = historialRepo.create({
        cartaId: parseInt(cartaId),
        ipUsuario: ipUsuario
      });
      
      await historialRepo.save(nuevoRegistro);
      
      res.status(201).json({ message: 'Acceso registrado exitosamente' });
    } catch (error) {
      console.error('Error al registrar acceso a carta:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Registrar que una tienda fue visitada
  static async registrarVisitaTienda(req, res) {
    try {
      const { tiendaId } = req.params;
      const ipUsuario = req.ip || req.connection.remoteAddress;
      
      const historialRepo = AppDataSource.getRepository('HistorialTienda');
      
      // Crear nuevo registro de visita
      const nuevoRegistro = historialRepo.create({
        tiendaId: parseInt(tiendaId),
        ipUsuario: ipUsuario
      });
      
      await historialRepo.save(nuevoRegistro);
      
      res.status(201).json({ message: 'Visita registrada exitosamente' });
    } catch (error) {
      console.error('Error al registrar visita a tienda:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener las últimas cartas accedidas
  static async obtenerUltimasCartas(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      const historialRepo = AppDataSource.getRepository('HistorialCarta');
      
      // Obtener las últimas cartas accedidas con datos de la carta
      // Usamos un subquery para obtener solo las entradas más recientes por carta
      const ultimasCartas = await historialRepo
        .createQueryBuilder('historial')
        .leftJoinAndSelect('historial.carta', 'carta')
        .where('historial.id IN (SELECT MAX(h2.id) FROM historial_cartas h2 GROUP BY h2.carta_id)')
        .orderBy('historial.fechaAcceso', 'DESC')
        .limit(limit)
        .getMany();

      // Formatear respuesta para incluir solo datos necesarios
      const cartasFormateadas = ultimasCartas.map(registro => ({
        id: registro.carta.id,
        nombre: registro.carta.nombre,
        imagenPequena: registro.carta.imagenPequena,
        imagenGrande: registro.carta.imagenGrande,
        fechaAcceso: registro.fechaAcceso
      }));

      res.json(cartasFormateadas);
    } catch (error) {
      console.error('Error al obtener últimas cartas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener las últimas tiendas visitadas
  static async obtenerUltimasTiendas(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      const historialRepo = AppDataSource.getRepository('HistorialTienda');
      
      // Obtener las últimas tiendas visitadas con datos de la tienda
      // Usamos un subquery para obtener solo las entradas más recientes por tienda
      const ultimasTiendas = await historialRepo
        .createQueryBuilder('historial')
        .leftJoinAndSelect('historial.tienda', 'tienda')
        .where('historial.id IN (SELECT MAX(h2.id) FROM historial_tiendas h2 GROUP BY h2.tienda_id)')
        .orderBy('historial.fechaVisita', 'DESC')
        .limit(limit)
        .getMany();

      // Formatear respuesta para incluir solo datos necesarios
      const tiendasFormateadas = ultimasTiendas.map(registro => ({
        id: registro.tienda.id,
        nombre: registro.tienda.nombre,
        logo: registro.tienda.logo,
        urlBase: registro.tienda.urlBase,
        fechaVisita: registro.fechaVisita
      }));

      res.json(tiendasFormateadas);
    } catch (error) {
      console.error('Error al obtener últimas tiendas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Limpiar historial antiguo (para mantenimiento)
  static async limpiarHistorialAntiguo(req, res) {
    try {
      const diasAtras = parseInt(req.query.dias) || 30;
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasAtras);

      const historialCartasRepo = AppDataSource.getRepository('HistorialCarta');
      const historialTiendasRepo = AppDataSource.getRepository('HistorialTienda');

      // Eliminar registros antiguos
      const cartasEliminadas = await historialCartasRepo
        .createQueryBuilder()
        .delete()
        .where('fecha_acceso < :fecha', { fecha: fechaLimite })
        .execute();

      const tiendasEliminadas = await historialTiendasRepo
        .createQueryBuilder()
        .delete()
        .where('fecha_visita < :fecha', { fecha: fechaLimite })
        .execute();

      res.json({
        message: 'Limpieza completada',
        cartasEliminadas: cartasEliminadas.affected,
        tiendasEliminadas: tiendasEliminadas.affected
      });
    } catch (error) {
      console.error('Error al limpiar historial:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = HistorialController;
