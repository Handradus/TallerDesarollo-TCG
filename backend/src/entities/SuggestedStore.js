const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'SuggestedStore',
    tableName: 'suggested_stores',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        nombre: { type: 'varchar' },
        descripcion: { type: 'text', nullable: true },
        urlBusqueda: { type: 'varchar' },
        tipoBusqueda: { type: 'varchar' },
        urlBase: { type: 'varchar' },
        direccion: { type: 'varchar', nullable: true },
        telefono: { type: 'varchar', nullable: true },
        logo: { type: 'varchar', nullable: true },
        region: { type: 'varchar', nullable: true },
        tipo: { type: 'varchar', default: 'ambos' }, // online, fisica, ambos
        status: {
            type: 'varchar',
            default: 'pending' // pending, approved, rejected
        },
        createdAt: { type: 'timestamp', createDate: true },
        userId: { type: 'int', nullable: true } // Who suggested it
    },
    relations: {
        user: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: { name: 'userId' },
            onDelete: 'SET NULL'
        }
    }
});
