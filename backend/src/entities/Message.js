const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'Message',
    tableName: 'messages',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        content: {
            type: 'text',
        },
        read: {
            type: 'boolean',
            default: false,
        },
        createdAt: {
            type: 'timestamp',
            createDate: true,
        },
        senderId: {
            type: 'int',
            nullable: false
        },
        receiverId: {
            type: 'int',
            nullable: false
        },
        marketItemId: { // Optional: Link to specific item context
            type: 'int',
            nullable: true
        }
    },
    relations: {
        sender: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: { name: 'senderId' },
            onDelete: 'CASCADE',
        },
        receiver: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: { name: 'receiverId' },
            onDelete: 'CASCADE',
        },
        marketItem: {
            target: 'MarketItem',
            type: 'many-to-one',
            joinColumn: { name: 'marketItemId' },
            onDelete: 'SET NULL',
            nullable: true
        }
    },
});
