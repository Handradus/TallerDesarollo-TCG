const { AppDataSource } = require('../data-source');
const User = require('../entities/User');
const UserComment = require('../entities/UserComment');

const userRepository = AppDataSource.getRepository(User);
const commentRepository = AppDataSource.getRepository(UserComment);

const getProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await userRepository.findOne({
            where: { id: userId },
            select: ['id', 'name', 'picture', 'socialLinks', 'createdAt'] // Don't send email/role
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const commentsRaw = await commentRepository.find({
            where: { receiverId: userId },
            relations: ['sender'],
            order: { createdAt: 'DESC' },
            select: {
                sender: { id: true, name: true, picture: true }
            }
        });

        const latestBySender = new Map();
        for (const comment of commentsRaw) {
            if (!latestBySender.has(comment.senderId)) {
                latestBySender.set(comment.senderId, comment);
            }
        }

        const comments = Array.from(latestBySender.values());

        res.json({ user, comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

const updateProfile = async (req, res) => {
    const userId = req.user.userId;
    const { socialLinks } = req.body;

    try {
        await userRepository.update(userId, { socialLinks });
        res.json({ message: 'Profile updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating profile' });
    }
};

const addComment = async (req, res) => {
    const { receiverId, content, rating } = req.body;
    const senderId = req.user.userId;
    const cooldownDays = Math.max(1, parseInt(process.env.PROFILE_COMMENT_COOLDOWN_DAYS, 10) || 7);

    if (!receiverId) {
        return res.status(400).json({ message: 'receiverId es requerido' });
    }

    if (!content || !content.trim()) {
        return res.status(400).json({ message: 'El comentario no puede estar vacío' });
    }

    const ratingNormalizado = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));

    if (parseInt(receiverId) === parseInt(senderId)) {
        return res.status(400).json({ message: 'No puedes comentarte a ti mismo' });
    }

    try {
        const receiver = await userRepository.findOneBy({ id: parseInt(receiverId, 10) });
        if (!receiver) {
            return res.status(404).json({ message: 'Usuario receptor no encontrado' });
        }

        const comentarioExistente = await commentRepository.findOne({
            where: { senderId, receiverId: parseInt(receiverId, 10) },
            order: { createdAt: 'DESC' }
        });

        let comment;
        if (comentarioExistente) {
            const ultimaActualizacion = comentarioExistente.updatedAt || comentarioExistente.createdAt;
            const elapsedMs = Date.now() - new Date(ultimaActualizacion).getTime();
            const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;

            if (elapsedMs < cooldownMs) {
                const disponibleDesde = new Date(new Date(ultimaActualizacion).getTime() + cooldownMs);
                return res.status(429).json({
                    message: `Ya dejaste una reseña para este usuario. Podrás actualizarla nuevamente el ${disponibleDesde.toLocaleDateString('es-CL')}.`
                });
            }

            comentarioExistente.content = content.trim();
            comentarioExistente.rating = ratingNormalizado;
            comment = await commentRepository.save(comentarioExistente);
        } else {
            comment = commentRepository.create({
                senderId,
                receiverId,
                content: content.trim(),
                rating: ratingNormalizado
            });
            comment = await commentRepository.save(comment);
        }

        const sender = await userRepository.findOne({
            where: { id: senderId },
            select: ['id', 'name', 'picture']
        });

        res.json({
            id: comment.id,
            senderId: comment.senderId,
            receiverId: comment.receiverId,
            content: comment.content,
            rating: comment.rating,
            createdAt: comment.createdAt,
            sender: sender || { id: senderId, name: 'Usuario', picture: null }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al guardar comentario' });
    }
};

const reportComment = async (req, res) => {
    const { commentId } = req.params;
    try {
        await commentRepository.update(commentId, { isReported: true });
        res.json({ message: 'Comment reported' });
    } catch (error) {
        res.status(500).json({ message: 'Error reporting comment' });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    addComment,
    reportComment
};
