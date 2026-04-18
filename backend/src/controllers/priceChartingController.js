const { AppDataSource } = require('../data-source');
const Carta = require('../entities/Carta');
const User = require('../entities/User');
const HistorialPrecioPriceCharting = require('../entities/HistorialPrecioPriceCharting');
const priceChartingService = require('../services/priceChartingService');

const enProcesoPriceCharting = new Set(); // Para evitar consultas simultáneas
const PRICECHARTING_CACHE_HOURS = Number(process.env.PRICECHARTING_CACHE_HOURS || 168);

function toIsoDay(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function guardarSnapshotPriceCharting(carta, resultado) {
  try {
    const historialRepo = AppDataSource.getRepository(HistorialPrecioPriceCharting);
    const precio = resultado && resultado.precio !== null ? Number(resultado.precio) : null;
    const url = resultado?.url || carta?.urlPriceCharting || null;
    const encontrado = precio !== null;

    const ultimo = await historialRepo
      .createQueryBuilder('historial')
      .where('historial.cartaId = :cartaId', { cartaId: carta.id })
      .orderBy('historial.fechaCaptura', 'DESC')
      .getOne();

    if (ultimo) {
      const ultimoPrecio = ultimo.precio === null || ultimo.precio === undefined ? null : Number(ultimo.precio);
      const mismaFoto = ultimoPrecio === precio && (ultimo.url || null) === url && Boolean(ultimo.encontrado) === encontrado;
      const ultimaFecha = new Date(ultimo.fechaCaptura || ultimo.createdAt || 0).getTime();
      const ahora = Date.now();
      const doceHorasMs = 12 * 60 * 60 * 1000;
      if (mismaFoto && Number.isFinite(ultimaFecha) && (ahora - ultimaFecha) < doceHorasMs) {
        return;
      }
    }

    const snapshot = historialRepo.create({
      carta,
      precio,
      url,
      encontrado,
    });

    await historialRepo.save(snapshot);
  } catch (error) {
    console.error('⚠️ Error guardando historial de PriceCharting:', error.message);
  }
}

async function obtenerHistorialPriceCharting(req, res) {
  const cartaId = parseInt(req.params.id, 10);
  const days = Math.max(7, Number(req.query.days || 365));

  if (Number.isNaN(cartaId) || cartaId <= 0) {
    return res.status(400).json({ error: 'ID de carta inválido' });
  }

  try {
    const cartaRepo = AppDataSource.getRepository(Carta);
    const historialRepo = AppDataSource.getRepository(HistorialPrecioPriceCharting);

    const carta = await cartaRepo.findOneBy({ id: cartaId });
    if (!carta) {
      return res.status(404).json({ error: 'Carta no encontrada' });
    }

    const desde = new Date();
    desde.setDate(desde.getDate() - days);

    const registros = await historialRepo
      .createQueryBuilder('historial')
      .where('historial.cartaId = :cartaId', { cartaId })
      .andWhere('historial.fechaCaptura >= :desde', { desde })
      .orderBy('historial.fechaCaptura', 'ASC')
      .getMany();

    const seriesPorDia = new Map();
    const snapshots = [];

    for (const registro of registros) {
      const fecha = registro.fechaCaptura;
      const dayKey = toIsoDay(fecha);
      const precio = toNumberOrNull(registro.precio);

      snapshots.push({
        fechaCaptura: fecha,
        fecha: dayKey,
        precio,
        url: registro.url || null,
        encontrado: Boolean(registro.encontrado),
      });

      if (precio !== null) {
        const bucket = seriesPorDia.get(dayKey) || { suma: 0, muestras: 0 };
        bucket.suma += precio;
        bucket.muestras += 1;
        seriesPorDia.set(dayKey, bucket);
      }
    }

    const serie = [...seriesPorDia.entries()]
      .map(([fecha, data]) => ({
        fecha,
        precioPromedio: Number((data.suma / data.muestras).toFixed(2)),
        muestras: data.muestras,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    res.json({
      cartaId,
      cartaNombre: carta.nombre,
      rangoDias: days,
      serie,
      snapshots,
    });
  } catch (error) {
    console.error('Error obteniendo historial de PriceCharting:', error);
    res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
}

async function obtenerPreciosPriceCharting(req, res) {
  const { id } = req.params;
  const { forzar } = req.query; 

  if (forzar === 'true') {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: "No autorizado para forzar actualización. Se requiere token." });
    }
    
    try {
      const jwt = require('jsonwebtoken');
      const user = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me');
      const userRepo = AppDataSource.getRepository(User);
      const currentUser = await userRepo.findOne({
        where: [{ id: user.userId }, { email: user.email }]
      });

      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ error: "Solo los administradores pueden forzar actualización de precios." });
      }
    } catch (err) {
      return res.status(403).json({ error: "Token inválido o expirado" });
    }
  }

  const cartaId = parseInt(id);
  if (isNaN(cartaId) || cartaId <= 0) {
    console.error(`❌ [obtenerPreciosPriceCharting] ID inválido recibido: "${id}"`);
    return res.status(400).json({ 
      error: "ID de carta inválido",
      detalles: `El ID "${id}" no es un número válido` 
    });
  }

  if (enProcesoPriceCharting.has(cartaId)) {
    return res.status(429).json({ error: "Consulta de precios en proceso para esta carta." });
  }

  enProcesoPriceCharting.add(cartaId);
  console.log(`🟢 [obtenerPreciosPriceCharting] Ejecutando para carta id=${cartaId}`);

  try {
    const cartaRepo = AppDataSource.getRepository(Carta);
    const carta = await cartaRepo.findOneBy({ id: cartaId });
    
    if (!carta) {
      return res.status(404).json({ error: "Carta no encontrada" });
    }

    
    const ahora = new Date();
    const cacheMs = Math.max(1, PRICECHARTING_CACHE_HOURS) * 60 * 60 * 1000;
    const haceUmbralCache = new Date(ahora.getTime() - cacheMs);
    const consultaReciente = carta.fechaActualizacionPrecios &&
      new Date(carta.fechaActualizacionPrecios) > haceUmbralCache;

    if (consultaReciente && !forzar) {
      console.log(`✅ Devolviendo precios existentes para carta id=${id}`);
      return res.json({
        actualizado: false,
        desde_cache: true,
        precioPriceCharting: carta.precioPriceCharting,
        fechaActualizacion: carta.fechaActualizacionPrecios,
        url: carta.urlPriceCharting, 
        mensaje: carta.precioPriceCharting
          ? `Precio obtenido desde caché (menos de ${PRICECHARTING_CACHE_HOURS} horas)`
          : `Sin precio en caché reciente (menos de ${PRICECHARTING_CACHE_HOURS} horas)`
      });
    }

    
    console.log(`🔍 Consultando precios en PriceCharting para: ${carta.nombre}`);
    const resultado = await priceChartingService.actualizarPreciosCarta(carta);
    
   
    if (resultado) {
      if (resultado.precio !== null) {
        carta.precioPriceCharting = resultado.precio;
      }
      if (resultado.url) {
        carta.urlPriceCharting = resultado.url;
      }
      carta.fechaActualizacionPrecios = new Date();
      
      await cartaRepo.save(carta);
      await guardarSnapshotPriceCharting(carta, resultado);
      console.log(`💾 Precio actualizado en BD para carta id=${id}`);
    }

    const respuesta = {
      actualizado: resultado && resultado.precio !== null,
      desde_cache: false,
      precioPriceCharting: resultado ? resultado.precio : null,
      fechaActualizacion: carta.fechaActualizacionPrecios,
      url: resultado ? resultado.url : null,
      mensaje: resultado ? "Precio encontrado en PriceCharting" : "No se encontró precio en PriceCharting"
    };

    console.log(`✅ [obtenerPreciosPriceCharting] Finalizado para carta id=${cartaId}`);
    res.json(respuesta);

  } catch (error) {
    console.error("❌ Error al obtener precios de PriceCharting:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      mensaje: error.message 
    });
  } finally {
    enProcesoPriceCharting.delete(cartaId);
  }
}

module.exports = {
  obtenerPreciosPriceCharting,
  obtenerHistorialPriceCharting
};
