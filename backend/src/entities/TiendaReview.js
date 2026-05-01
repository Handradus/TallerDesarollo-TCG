const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'TiendaReview',
  tableName: 'tienda_reviews',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    tiendaId: { type: 'int' },
    userId: { type: 'int' },
    content: { type: 'text' },
    rating: { type: 'int', default: 5 },
    createdAt: { type: 'timestamp', createDate: true },
    updatedAt: { type: 'timestamp', updateDate: true },
  },
  relations: {
    tienda: {
      target: 'Tienda',
      type: 'many-to-one',
      joinColumn: { name: 'tiendaId' },
      onDelete: 'CASCADE',
    },
    user: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'userId' },
      onDelete: 'CASCADE',
    },
  },
});
