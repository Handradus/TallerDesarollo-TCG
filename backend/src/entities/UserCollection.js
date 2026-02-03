const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'UserCollection',
    tableName: 'user_collections',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        quantity: {
            type: 'int',
            default: 1,
        },
        addedAt: {
            type: 'timestamp',
            createDate: true,
        },
        userId: {
            type: 'int',
            nullable: false
        },
        cartaId: {
            type: 'int',
            nullable: false
        }
    },
    relations: {
        user: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: { name: 'userId' },
            onDelete: 'CASCADE',
        },
        carta: {
            target: 'Carta',
            type: 'many-to-one',
            joinColumn: { name: 'cartaId' },
            onDelete: 'CASCADE',
        },
        customCollection: {
            target: 'CustomCollection',
            type: 'many-to-one',
            joinColumn: { name: 'customCollectionId' },
            nullable: true,
            onDelete: 'SET NULL',
        }
    },
});
