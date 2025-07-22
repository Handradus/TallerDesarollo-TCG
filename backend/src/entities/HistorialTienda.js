const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'HistorialTienda',
  tableName: 'historial_tiendas',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    tiendaId: { 
      type: 'int',
      name: 'tienda_id'
    },
    fechaVisita: { 
      type: 'timestamp',
      name: 'fecha_visita',
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
    tienda: {
      type: 'many-to-one',
      target: 'Tienda',
      joinColumn: { name: 'tienda_id' }
    }
  }
});
