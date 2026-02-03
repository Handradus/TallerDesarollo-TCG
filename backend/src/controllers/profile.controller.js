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

        const comments = await commentRepository.find({
            where: { receiverId: userId },
            relations: ['sender'],
            order: { createdAt: 'DESC' },
            select: {
                sender: { id: true, name: true, picture: true }
            }
        });

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

    if (parseInt(receiverId) === parseInt(senderId)) {
        return res.status(400).json({ message: 'No puedes comentarte a ti mismo' });
    }

    try {
        const comment = commentRepository.create({
            senderId,
            receiverId,
            content,
            rating: rating || 5
        });
        await commentRepository.save(comment);

        // Return full comment with sender info for UI update
        const fullComment = await commentRepository.findOne({
            where: { id: comment.id },
            relations: ['sender'],
            select: { sender: { id: true, name: true, picture: true } }
        });

        res.json(fullComment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding comment' });
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
