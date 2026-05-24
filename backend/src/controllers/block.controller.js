const { AppDataSource } = require('../data-source');
const BlockedUser = require('../entities/BlockedUser');
const User = require('../entities/User');

const blockUser = async (req, res) => {
    try {
        const blockerId = req.user.userId || req.user.id;
        const { blockedId } = req.body;

        if (!blockedId || blockerId === blockedId) {
            return res.status(400).json({ error: 'Usuario inválido para bloquear' });
        }

        const blockRepo = AppDataSource.getRepository(BlockedUser);

        const existingBlock = await blockRepo.findOne({
            where: { blockerId, blockedId }
        });

        if (existingBlock) {
            return res.status(400).json({ error: 'El usuario ya está bloqueado' });
        }

        const block = blockRepo.create({ blockerId, blockedId });
        await blockRepo.save(block);

        res.json({ success: true, message: 'Usuario bloqueado exitosamente' });
    } catch (error) {
        console.error('Error al bloquear usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const unblockUser = async (req, res) => {
    try {
        const blockerId = req.user.userId || req.user.id;
        const { blockedId } = req.params;

        const blockRepo = AppDataSource.getRepository(BlockedUser);

        const result = await blockRepo.delete({ blockerId, blockedId: parseInt(blockedId) });

        if (result.affected === 0) {
            return res.status(404).json({ error: 'El bloqueo no existe' });
        }

        res.json({ success: true, message: 'Usuario desbloqueado exitosamente' });
    } catch (error) {
        console.error('Error al desbloquear usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getBlockedUsers = async (req, res) => {
    try {
        const blockerId = req.user.userId || req.user.id;
        const blockRepo = AppDataSource.getRepository(BlockedUser);

        const blocks = await blockRepo.find({
            where: { blockerId },
            relations: ['blocked']
        });

        // Solo devolver id y nombre del bloqueado por privacidad
        const blockedUsers = blocks.map(b => ({
            id: b.blocked.id,
            name: b.blocked.name
        }));

        res.json(blockedUsers);
    } catch (error) {
        console.error('Error al obtener bloqueados:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const checkBlockStatus = async (req, res) => {
    try {
        const myId = req.user.userId || req.user.id;
        const { targetId } = req.params;

        const blockRepo = AppDataSource.getRepository(BlockedUser);
        
        const iBlocked = await blockRepo.findOne({ where: { blockerId: myId, blockedId: parseInt(targetId) } });
        const theyBlockedMe = await blockRepo.findOne({ where: { blockerId: parseInt(targetId), blockedId: myId } });

        res.json({
            blockedByMe: !!iBlocked,
            blockedByThem: !!theyBlockedMe,
            anyBlock: !!iBlocked || !!theyBlockedMe
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al verificar bloqueo' });
    }
};

module.exports = {
    blockUser,
    unblockUser,
    getBlockedUsers,
    checkBlockStatus
};
