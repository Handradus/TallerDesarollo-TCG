const { AppDataSource } = require('../data-source');
const Tienda = require('../entities/Tienda');

class TiendaPublicaService {

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
      const tiendaRepository = AppDataSource.getRepository(Tienda);

      // Convertir el nombre de URL de vuelta a nombre normal
      const nombreDecodificado = nombreTienda
        .replace(/-/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Separar camelCase
        .toLowerCase();

      const tienda = await tiendaRepository
        .createQueryBuilder('tienda')
        .where('LOWER(tienda.nombre) = :nombre', { nombre: nombreDecodificado })
        .andWhere('tienda.activo = :activo', { activo: true })
        .getOne();

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
}

module.exports = new TiendaPublicaService();
