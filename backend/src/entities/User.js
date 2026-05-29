const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: 'User',
    tableName: 'users',
    columns: {
        id: {
            primary: true,
            type: 'int',
            generated: true,
        },
        googleId: {
            type: 'varchar',
            unique: true,
        },
        email: {
            type: 'varchar',
        },
        name: {
            type: 'varchar',
            nullable: true,
        },
        picture: {
            type: 'varchar',
            nullable: true,
        },
        socialLinks: {
            type: 'simple-json', // Or 'jsonb' in postgres, 'text' works too if manual JSON.
            nullable: true,
        },
        role: {
            type: 'varchar',
            default: 'user', // user, admin, tienda
        },
        approved: {
            type: 'boolean',
            default: false,
        },
        banned: {
            type: 'boolean',
            default: false,
        },
        acceptedTerms: {
            type: 'boolean',
            default: false,
        },
        termsAcceptedAt: {
            type: 'timestamp',
            nullable: true,
        },
        createdAt: {
            type: 'timestamp',
            createDate: true,
        },
    },
});
