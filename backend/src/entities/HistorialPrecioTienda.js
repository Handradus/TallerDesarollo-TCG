const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'HistorialPrecioTienda',
  tableName: 'historial_precios_tienda',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    precio: {
      type: 'decimal',
      nullable: true,
    },
    disponible: {
      type: 'boolean',
      default: true,
    },
    url: {
      type: 'varchar',
      nullable: true,
    },
    tipoProducto: {
      type: 'varchar',
      nullable: true,
    },
    fuente: {
      type: 'varchar',
      nullable: true,
    },
    fechaCaptura: {
      type: 'timestamp',
      createDate: true,
    },
  },
  relations: {
    carta: {
      type: 'many-to-one',
      target: 'Carta',
      joinColumn: true,
      onDelete: 'CASCADE',
    },
    tienda: {
      type: 'many-to-one',
      target: 'Tienda',
      joinColumn: true,
      onDelete: 'CASCADE',
    },
  },
});
