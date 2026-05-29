const { AppDataSource } = require('../data-source');
const User = require('../entities/User');
const { hashPassword } = require('../helpers/crypto.helper');

const DITTO_AVATAR = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/132.png';

async function seedUsers() {
    const userRepository = AppDataSource.getRepository(User);

    // 1. Seed Admin
    const adminEmail = 'admin@admin.com';
    let adminUser = await userRepository.findOneBy({ email: adminEmail });
    if (!adminUser) {
        adminUser = userRepository.create({
            email: adminEmail,
            name: 'Administrador TCG',
            password: hashPassword('admin123'),
            role: 'admin',
            approved: true,
            picture: DITTO_AVATAR,
            themeColor: '#10b981'
        });
        await userRepository.save(adminUser);
        console.log('✅ [SeedUsers] Administrador insertado con éxito');
    } else {
        console.log('⏩ [SeedUsers] Administrador ya existe');
    }

    // 2. Seed Standard User
    const userEmail = 'user@user.com';
    let standardUser = await userRepository.findOneBy({ email: userEmail });
    if (!standardUser) {
        standardUser = userRepository.create({
            email: userEmail,
            name: 'Usuario TCG',
            password: hashPassword('user123'),
            role: 'user',
            approved: true,
            picture: DITTO_AVATAR,
            themeColor: '#10b981'
        });
        await userRepository.save(standardUser);
        console.log('✅ [SeedUsers] Usuario estándar insertado con éxito');
    } else {
        console.log('⏩ [SeedUsers] Usuario estándar ya existe');
    }
}

module.exports = { seedUsers };
