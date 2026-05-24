const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'BlockedUser',
    tableName: 'blocked_users',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        blockerId: {
            type: 'int',
            nullable: false,
        },
        blockedId: {
            type: 'int',
            nullable: false,
        },
        createdAt: {
            type: 'timestamp',
            createDate: true,
        },
    },
    relations: {
        blocker: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: { name: 'blockerId' },
            onDelete: 'CASCADE',
        },
        blocked: {
            target: 'User',
            type: 'many-to-one',
            joinColumn: { name: 'blockedId' },
            onDelete: 'CASCADE',
        },
    },
    uniques: [
        {
            name: 'UNIQUE_BLOCK',
            columns: ['blockerId', 'blockedId'],
        },
    ],
});
