const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'UserComment',
    tableName: 'user_comments',
    columns: {
        id: { primary: true, type: 'int', generated: true },
        senderId: { type: 'int' },
        receiverId: { type: 'int' },
        content: { type: 'text' },
        rating: { type: 'int', default: 5 },
        isReported: { type: 'boolean', default: false },
        createdAt: { type: 'timestamp', createDate: true },
    },
    relations: {
        sender: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: { name: 'senderId' },
            onDelete: 'CASCADE'
        },
        receiver: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: { name: 'receiverId' },
            onDelete: 'CASCADE'
        }
    }
});
