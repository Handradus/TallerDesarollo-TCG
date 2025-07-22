const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Carta',
  tableName: 'cartas',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    nombre: { type: 'varchar' },
    numero: { type: 'varchar' },
    set: { type: 'varchar' },
    setId: { type: 'varchar', nullable: true },
    printedTotal: { type: 'int', nullable: true },
    serie: { type: 'varchar', nullable: true },
    fechaLanzamiento: { type: 'date', nullable: true },
    supertipo: { type: 'varchar', nullable: true },
    subtipos: { type: 'simple-array', nullable: true },
    nivel: { type: 'varchar', nullable: true },
    hp: { type: 'varchar', nullable: true },
    tipos: { type: 'simple-array', nullable: true },
    evolucionaA: { type: 'simple-array', nullable: true },
    retreatCost: { type: 'simple-array', nullable: true },
    debilidades: { type: 'jsonb', nullable: true },
    ataques: { type: 'jsonb', nullable: true },
    reglas: { type: 'simple-array', nullable: true },
    rareza: { type: 'varchar', nullable: true },
    ilustrador: { type: 'varchar', nullable: true },
    flavorText: { type: 'text', nullable: true },
    pokedexIds: { type: 'simple-array', nullable: true },
    imagenPequena: { type: 'varchar', nullable: true },
    imagenGrande: { type: 'varchar', nullable: true },
    precioNormal: { type: 'decimal', nullable: true },
    precioHolofoil: { type: 'decimal', nullable: true },
    precioPriceCharting: { type: 'decimal', nullable: true },
    precioGradedPriceCharting: { type: 'decimal', nullable: true },
    fechaActualizacionPrecios: { type: 'timestamp', nullable: true },
    fechaCreacion: { type: 'timestamp', createDate: true },
  },
  relations: {
  links: {
    type: 'one-to-many',
    target: 'CartaLink',
    inverseSide: 'carta',
  },
}

});
