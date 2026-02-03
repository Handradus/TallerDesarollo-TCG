const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'MarketItem',
    tableName: 'market_items',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        price: {
            type: 'decimal',
            precision: 10,
            scale: 2,
        },
        description: {
            type: 'text',
            nullable: true,
        },
        quantity: {
            type: 'int',
            default: 1,
        },
        realImage: {
            type: 'varchar',
            nullable: true,
        },
        active: {
            type: 'boolean',
            default: true,
        },
        createdAt: {
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
        },
        deliveryType: {
            type: 'varchar',
            default: 'ambos' // presencial, envio, ambos
        },
        region: {
            type: 'varchar',
            nullable: true
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
    },
});
