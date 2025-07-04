const { generarURLsValidas } = require('../helpers/verificarTiendas');
const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');



async function obtenerTiendasCarta(req, res) {
  const { id } = req.params;

  try {
    const carta = await AppDataSource.getRepository(Carta).findOneBy({ id: parseInt(id) });
    if (!carta) return res.status(404).json({ mensaje: "Carta no encontrada" });

    const tiendas = await generarURLsValidas(carta);
    res.json(tiendas);
  } catch (err) {
    console.error('❌ Error en obtenerTiendasCarta:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  obtenerTiendasCarta, // 👈 exportas este nuevo controlador
};
