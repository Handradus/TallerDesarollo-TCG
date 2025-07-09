const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Tienda',
  tableName: 'tiendas',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    nombre: { type: 'varchar' },
    descripcion: { type: 'text', nullable: true },
    valoracion: { type: 'decimal', precision: 2, scale: 1, nullable: true },
    urlBusqueda: { type: 'varchar' }, // e.g., con placeholder BUSQUEDA
    tipoBusqueda: { type: 'varchar' }, // e.g., "shopify", "levelup", etc.
    urlBase: { type: 'varchar' },
    direccion: { type: 'varchar', nullable: true },
    telefono: { type: 'varchar', nullable: true },
    logo: { type: 'varchar', nullable: true },
    ultimaActualizacion: { type: 'timestamp', nullable: true },
    activo: { type: 'boolean', default: true },
  },
});
