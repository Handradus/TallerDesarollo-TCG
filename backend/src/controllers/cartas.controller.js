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

    return res.json(carta); 
  } catch (err) {
    console.error('❌ Error en obtenerCartaDetalle:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  obtenerCartaDetalle
};
