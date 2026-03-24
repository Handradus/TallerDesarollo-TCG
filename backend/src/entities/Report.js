const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Report',
    tableName: 'reports',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        reason: {
            type: 'varchar',
            length: 255,
        },
        status: {
            type: 'varchar',
            default: 'pending', // pending, resolved
        },
        createdAt: {
            type: 'timestamp',
            createDate: true,
        },
        reporterId: {
            type: 'int',
            nullable: false,
        },
        marketItemId: {
            type: 'int',
            nullable: false,
        }
    },
    relations: {
        reporter: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: { name: 'reporterId' },
            onDelete: 'CASCADE',
        },
        marketItem: {
            target: 'MarketItem',
            type: 'many-to-one',
            joinColumn: { name: 'marketItemId' },
            onDelete: 'CASCADE',
        },
    },
    uniques: [
        {
            name: 'UNIQUE_REPORTER_MARKET_ITEM',
            columns: ['reporterId', 'marketItemId']
        }
    ]
});
