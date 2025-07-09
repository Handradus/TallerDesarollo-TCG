const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'CartaLink',
  tableName: 'carta_links',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    url: { type: 'varchar' },
    verificada: { type: 'boolean', default: true },
    idioma: { type: 'varchar', nullable: true }, // 'es', 'en', etc.
    tipoProducto: { type: 'varchar', nullable: true }, // holo, foil, normal, reverse, etc.
    precio: { type: 'decimal', nullable: true },
    fechaGuardado: { type: 'timestamp', createDate: true },
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
