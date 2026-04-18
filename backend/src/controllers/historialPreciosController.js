const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');
const HistorialPrecioTienda = require('../entities/HistorialPrecioTienda');

function toIsoDay(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function obtenerHistorialPreciosCarta(req, res) {
  const cartaId = Number(req.params.id);
  const days = Math.max(7, Number(req.query.days || 90));

  if (!Number.isFinite(cartaId) || cartaId <= 0) {
    return res.status(400).json({ error: 'ID de carta inválido' });
  }

  try {
    const cartaRepo = AppDataSource.getRepository(Carta);
    const historialRepo = AppDataSource.getRepository(HistorialPrecioTienda);

    const carta = await cartaRepo.findOneBy({ id: cartaId });
    if (!carta) {
      return res.status(404).json({ error: 'Carta no encontrada' });
    }

    const desde = new Date();
    desde.setDate(desde.getDate() - days);

    const registros = await historialRepo
      .createQueryBuilder('historial')
      .leftJoinAndSelect('historial.tienda', 'tienda')
      .where('historial.cartaId = :cartaId', { cartaId })
      .andWhere('historial.fechaCaptura >= :desde', { desde })
      .orderBy('historial.fechaCaptura', 'ASC')
      .getMany();

    const overallByDay = new Map();
    const storesById = new Map();

    for (const registro of registros) {
      const fecha = registro.fechaCaptura || registro.createdAt || registro.fechaGuardado;
      const dayKey = toIsoDay(fecha);
      const precio = toNumberOrNull(registro.precio);
      const tiendaId = registro.tienda?.id;
      const tiendaNombre = registro.tienda?.nombre || `Tienda ${tiendaId}`;

      if (!storesById.has(tiendaId)) {
        storesById.set(tiendaId, {
          id: tiendaId,
          nombre: tiendaNombre,
          byDay: new Map(),
        });
      }

      if (precio !== null) {
        const currentOverall = overallByDay.get(dayKey) || { suma: 0, muestras: 0 };
        currentOverall.suma += precio;
        currentOverall.muestras += 1;
        overallByDay.set(dayKey, currentOverall);

        const storeBucket = storesById.get(tiendaId);
        const currentStoreDay = storeBucket.byDay.get(dayKey) || { suma: 0, muestras: 0 };
        currentStoreDay.suma += precio;
        currentStoreDay.muestras += 1;
        storeBucket.byDay.set(dayKey, currentStoreDay);
      }
    }

    const overallSeries = [...overallByDay.entries()].map(([fecha, data]) => ({
      fecha,
      precioPromedio: Number((data.suma / data.muestras).toFixed(2)),
      muestras: data.muestras,
    }));

    const tiendas = [...storesById.values()]
      .map((tienda) => ({
        id: tienda.id,
        nombre: tienda.nombre,
        serie: [...tienda.byDay.entries()]
          .map(([fecha, data]) => ({
            fecha,
            precio: Number((data.suma / data.muestras).toFixed(2)),
            muestras: data.muestras,
          }))
          .sort((a, b) => a.fecha.localeCompare(b.fecha)),
      }))
      .filter((tienda) => tienda.serie.length > 0)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    res.json({
      cartaId,
      cartaNombre: carta.nombre,
      rangoDias: days,
      overallSeries,
      tiendas,
    });
  } catch (error) {
    console.error('Error obteniendo historial de precios:', error);
    res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
}

module.exports = {
  obtenerHistorialPreciosCarta,
};
