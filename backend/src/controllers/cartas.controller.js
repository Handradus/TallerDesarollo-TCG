const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta'); // 👈 agrega esta línea

async function obtenerCartaDetalle(req, res) {
  const { id } = req.params;

  if (!AppDataSource.isInitialized) {
    return res.status(500).json({ error: 'Base de datos no disponible' });
  }

  try {
    const carta = await AppDataSource.getRepository(Carta).findOneBy({ id: parseInt(id) }); // ✅

    if (!carta) {
      return res.status(404).json({ mensaje: "Carta no encontrada" });
    }

    // Registrar el acceso automáticamente
    try {
      const historialRepo = AppDataSource.getRepository('HistorialCarta');
      const ipUsuario = req.ip || req.connection.remoteAddress;
      
      const nuevoRegistro = historialRepo.create({
        cartaId: parseInt(id),
        ipUsuario: ipUsuario
      });
      
      await historialRepo.save(nuevoRegistro);
      console.log(`📊 Acceso registrado para carta ${id} desde IP ${ipUsuario}`);
    } catch (historialError) {
      console.error('⚠️ Error al registrar acceso a carta:', historialError.message);
      // No fallar la respuesta si falla el registro del historial
    }

    return res.json(carta); 
  } catch (err) {
    console.error('❌ Error en obtenerCartaDetalle:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  obtenerCartaDetalle
};
