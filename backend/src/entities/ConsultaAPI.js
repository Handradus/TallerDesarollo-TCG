const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'ConsultaAPI',
  tableName: 'consultas_api',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: true,
    },
    termino: {
      type: 'varchar',
      unique: true,
    },
    fechaConsulta: {
      name: 'fecha_consulta',
      type: 'date',
      default: () => 'CURRENT_DATE',
    },
  },
});
