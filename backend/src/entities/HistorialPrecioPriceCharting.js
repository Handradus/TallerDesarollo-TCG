const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'HistorialPrecioPriceCharting',
  tableName: 'historial_precios_pricecharting',
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
    url: {
      type: 'varchar',
      nullable: true,
    },
    encontrado: {
      type: 'boolean',
      default: false,
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
  },
});
