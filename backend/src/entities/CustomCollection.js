const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'CustomCollection',
    tableName: 'custom_collections',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        name: {
            type: 'varchar',
            length: 100
        },
        userId: {
            type: 'int',
            nullable: false
        },
        createdAt: {
            type: 'timestamp',
            createDate: true,
        },
    },
    relations: {
        user: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: { name: 'userId' },
            onDelete: 'CASCADE',
        },
        cards: {
            target: 'UserCollection',
            type: 'one-to-many',
            inverseSide: 'customCollection',
            cascade: true
        }
    },
});
