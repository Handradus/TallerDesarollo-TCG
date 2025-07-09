const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');
const CartaLink = require('../entities/CartaLink');
const Tienda = require('../entities/Tienda');
const { verificarYBuscarLink } = require('../helpers/verificarYBuscarLink');

const enProceso = new Set(); // <- Asegúrate de tener esto arriba

async function obtenerTiendas(req, res) {
  const { id } = req.params;

  if (enProceso.has(id)) {
    return res.status(429).json({ error: "Scraping en proceso para esta carta." });
  }

  enProceso.add(id);
  console.log(`🟢 [obtenerTiendas] Ejecutando para carta id=${id}`);

  try {
    const cartaRepo = AppDataSource.getRepository(Carta);
    const linkRepo = AppDataSource.getRepository(CartaLink);
    const tiendaRepo = AppDataSource.getRepository(Tienda);

    const carta = await cartaRepo.findOneBy({ id: parseInt(id) });
    if (!carta) return res.status(404).json({ error: "Carta no encontrada" });

    let links = await linkRepo.find({
      where: { carta: { id: carta.id } },
      relations: ['tienda']
    });

    const tiendas = await tiendaRepo.findBy({ activo: true });

    // Si no hay links en BD, correr el scraper
    if (links.length === 0) {
      console.log(`🔍 Ejecutando verificación con cheerio para carta "${carta.nombre}"`);

      for (const tienda of tiendas) {
        console.log(`📦 Procesando tienda: ${tienda.nombre} (${tienda.tipoBusqueda})`);
        try {
          await verificarYBuscarLink(carta, tienda);
        } catch (err) {
          console.warn(`⚠️ Falló verificación en ${tienda.nombre}:`, err.message);
        }
      }

      // Volver a consultar los links luego del scraping
      links = await linkRepo.find({
        where: { carta: { id: carta.id } },
        relations: ['tienda']
      });
    }

    // Armar respuesta por tienda
    const resultado = {};
    for (const tienda of tiendas) {
      const link = links.find(l => l.tienda.id === tienda.id);
      resultado[tienda.nombre] = link
        ? {
            url: link.url,
            verificada: link.verificada,
            precio: link.precio || null,
            tipo: link.tipoProducto || null
          }
        : {
            url: null,
            verificada: false
          };
    }

    console.log(`✅ [obtenerTiendas] Finalizado para carta id=${id}`);
    res.json(resultado);

  } catch (error) {
    console.error("❌ Error al obtener links de tiendas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    enProceso.delete(id);
  }
}

module.exports = {
  obtenerTiendas
};
