const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'HistorialCarta',
  tableName: 'historial_cartas',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    cartaId: { 
      type: 'int',
      name: 'carta_id'
    },
    fechaAcceso: { 
      type: 'timestamp',
      name: 'fecha_acceso',
      createDate: true 
    },
    ipUsuario: { 
      type: 'varchar',
      name: 'ip_usuario',
      length: 45,
      nullable: true 
    }
  },
  relations: {
    carta: {
      type: 'many-to-one',
      target: 'Carta',
      joinColumn: { name: 'carta_id' }
    }
  }
});
