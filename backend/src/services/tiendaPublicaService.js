const { AppDataSource } = require('../data-source');
const Tienda = require('../entities/Tienda');
const TiendaReview = require('../entities/TiendaReview');

class TiendaPublicaService {

  normalizarNombre(nombreTienda) {
    return nombreTienda
      .replace(/-/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase();
  }

  async buscarTiendaActivaPorNombre(nombreTienda) {
    const tiendaRepository = AppDataSource.getRepository(Tienda);
    const nombreDecodificado = this.normalizarNombre(nombreTienda);

    return tiendaRepository
      .createQueryBuilder('tienda')
      .where('LOWER(tienda.nombre) = :nombre', { nombre: nombreDecodificado })
      .andWhere('tienda.activo = :activo', { activo: true })
      .getOne();
  }

  // Obtener todas las tiendas activas para mostrar públicamente
  async obtenerTiendasPublicas(filtros = {}) {
    try {
      const tiendaRepository = AppDataSource.getRepository(Tienda);

      const whereClause = { activo: true };

      if (filtros.region) {
        whereClause.region = filtros.region;
      }

      if (filtros.tipo && filtros.tipo !== 'todos') {
        const { In } = require('typeorm');
        if (filtros.tipo === 'online') whereClause.tipo = In(['online', 'ambos']);
        else if (filtros.tipo === 'fisica') whereClause.tipo = In(['fisica', 'ambos']);
        else whereClause.tipo = filtros.tipo;
      }

      const tiendas = await tiendaRepository.find({
        where: whereClause,
        select: ['id', 'nombre', 'logo', 'valoracion', 'tipoBusqueda', 'region', 'tipo'],
        order: { nombre: 'ASC' }
      });

      return {
        success: true,
        tiendas: tiendas
      };
    } catch (error) {
      console.error('Error al obtener tiendas públicas:', error);
      return {
        success: false,
        error: 'Error al cargar las tiendas'
      };
    }
  }

  // Obtener una tienda específica por nombre (URL amigable)
  async obtenerTiendaPorNombre(nombreTienda) {
    try {
      const tienda = await this.buscarTiendaActivaPorNombre(nombreTienda);

      if (!tienda) {
        return {
          success: false,
          error: 'Tienda no encontrada'
        };
      }

      return {
        success: true,
        tienda: tienda
      };
    } catch (error) {
      console.error('Error al obtener tienda por nombre:', error);
      return {
        success: false,
        error: 'Error al cargar la tienda'
      };
    }
  }

  // Generar URL amigable para una tienda
  generarUrlAmigable(nombreTienda) {
    return nombreTienda
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Eliminar guiones múltiples
      .replace(/^-|-$/g, ''); // Eliminar guiones al inicio y final
  }

  // Buscar tiendas por término de búsqueda
  async buscarTiendas(termino) {
    try {
      const tiendaRepository = AppDataSource.getRepository(Tienda);

      const tiendas = await tiendaRepository
        .createQueryBuilder('tienda')
        .where('tienda.activo = :activo', { activo: true })
        .andWhere(
          '(LOWER(tienda.nombre) LIKE :termino OR LOWER(tienda.descripcion) LIKE :termino)',
          { termino: `%${termino.toLowerCase()}%` }
        )
        .select(['tienda.id', 'tienda.nombre', 'tienda.logo', 'tienda.valoracion', 'tienda.descripcion'])
        .orderBy('tienda.nombre', 'ASC')
        .getMany();

      return {
        success: true,
        tiendas: tiendas
      };
    } catch (error) {
      console.error('Error al buscar tiendas:', error);
      return {
        success: false,
        error: 'Error al buscar tiendas'
      };
    }
  }

  async obtenerResenasTienda(nombreTienda) {
    try {
      const tienda = await this.buscarTiendaActivaPorNombre(nombreTienda);

      if (!tienda) {
        return {
          success: false,
          error: 'Tienda no encontrada'
        };
      }

      const reviewRepository = AppDataSource.getRepository(TiendaReview);
      const reviewsRaw = await reviewRepository.find({
        where: { tiendaId: tienda.id },
        relations: ['user'],
        order: { createdAt: 'DESC' },
        select: {
          user: { id: true, name: true, picture: true }
        }
      });

      const latestByUser = new Map();
      for (const review of reviewsRaw) {
        if (!latestByUser.has(review.userId)) {
          latestByUser.set(review.userId, review);
        }
      }

      const reviews = Array.from(latestByUser.values());

      const cantidad = reviews.length;
      const promedio = cantidad > 0
        ? Number((reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / cantidad).toFixed(1))
        : Number(tienda.valoracion || 0);

      return {
        success: true,
        tiendaId: tienda.id,
        promedio,
        cantidad,
        reviews
      };
    } catch (error) {
      console.error('Error al obtener reseñas de tienda:', error);
      return {
        success: false,
        error: 'Error al cargar las reseñas de la tienda'
      };
    }
  }

  async agregarResenaTienda(nombreTienda, userId, content, rating) {
    try {
      const tienda = await this.buscarTiendaActivaPorNombre(nombreTienda);
      const cooldownDays = Math.max(1, parseInt(process.env.STORE_REVIEW_COOLDOWN_DAYS, 10) || 7);

      if (!tienda) {
        return {
          success: false,
          statusCode: 404,
          error: 'Tienda no encontrada'
        };
      }

      const reviewRepository = AppDataSource.getRepository(TiendaReview);
      const ratingNormalizado = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));

      let review = await reviewRepository.findOne({
        where: { tiendaId: tienda.id, userId }
      });

      if (review) {
        const ultimaActualizacion = review.updatedAt || review.createdAt;
        const elapsedMs = Date.now() - new Date(ultimaActualizacion).getTime();
        const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;

        if (elapsedMs < cooldownMs) {
          const disponibleDesde = new Date(new Date(ultimaActualizacion).getTime() + cooldownMs);
          return {
            success: false,
            statusCode: 429,
            error: `Ya dejaste una reseña para esta tienda. Podrás actualizarla nuevamente el ${disponibleDesde.toLocaleDateString('es-CL')}.`
          };
        }

        review.content = content;
        review.rating = ratingNormalizado;
      } else {
        review = reviewRepository.create({
          tiendaId: tienda.id,
          userId,
          content,
          rating: ratingNormalizado
        });
      }

      await reviewRepository.save(review);

      const fullReview = await reviewRepository.findOne({
        where: { id: review.id },
        relations: ['user'],
        select: { user: { id: true, name: true, picture: true } }
      });

      const stats = await this.obtenerResenasTienda(nombreTienda);

      return {
        success: true,
        review: fullReview,
        promedio: stats.success ? stats.promedio : null,
        cantidad: stats.success ? stats.cantidad : null
      };
    } catch (error) {
      console.error('Error al guardar reseña de tienda:', error);
      return {
        success: false,
        statusCode: 500,
        error: 'Error al guardar la reseña'
      };
    }
  }
}

module.exports = new TiendaPublicaService();
